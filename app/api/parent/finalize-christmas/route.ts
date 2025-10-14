import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { stripe } from "@/lib/stripe";
import { Types } from "mongoose";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await dbConnect();

    const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    // Check if Christmas setup is completed
    if (!parent.christmasSettings?.setupCompleted) {
      return NextResponse.json({ 
        error: "Please complete Christmas setup before finalizing lists" 
      }, { status: 400 });
    }

    // Auto-migrate missing finalization fields for backward compatibility
    if (!parent.christmasSettings.hasOwnProperty('listsFinalized')) {
      console.log("🔧 Auto-migrating parent Christmas settings for finalization fields");
      parent.christmasSettings.listsFinalized = false;
      parent.christmasSettings.totalGiftCostCents = 0;
      parent.christmasSettings.finalizedChildrenData = [];
      parent.christmasSettings.shipmentApproved = false;
      parent.christmasSettings.shipped = false;
      // Save the migration
      await parent.save();
      console.log("✅ Auto-migration complete");
    }

    // Check if payment method is configured
    if (!parent.christmasSettings.hasPaymentMethod || !parent.stripeDefaultPaymentMethodId) {
      return NextResponse.json({ 
        error: "Please configure a payment method before finalizing lists" 
      }, { status: 400 });
    }

    // Check if already finalized
    if (parent.christmasSettings.listsFinalized) {
      return NextResponse.json({ 
        error: "Christmas lists have already been finalized",
        finalizedAt: parent.christmasSettings.listsFinalizedAt
      }, { status: 400 });
    }

    // Get all children for this parent
    const children = await Child.find({ parentId: parent._id }).lean();
    if (children.length === 0) {
      return NextResponse.json({ 
        error: "No children found. Please add children before finalizing lists." 
      }, { status: 400 });
    }

    // Calculate total cost for all children's gifts (MasterCatalog prices are in dollars)
    let totalGiftCostCents = 0;
    const childrenWithGifts = [];

    for (const child of children) {
      if (child.giftList && child.giftList.length > 0) {
        const gifts = await MasterCatalog.find({
          _id: { $in: child.giftList }
        }).lean();
        
        // Convert dollars to cents for internal calculations
        const childGiftCost = gifts.reduce((sum, gift) => sum + Math.round((gift.price || 0) * 100), 0);
        totalGiftCostCents += childGiftCost;
        
        childrenWithGifts.push({
          childId: child._id,
          childName: child.displayName,
          giftCount: gifts.length,
          giftCostCents: childGiftCost,
          gifts: gifts.map(g => ({ 
            id: g._id, 
            name: g.title || 'Unknown Gift', 
            price: Math.round((g.price || 0) * 100) // Store in cents
          }))
        });
      }
    }

    if (totalGiftCostCents === 0) {
      return NextResponse.json({ 
        error: "No gifts found in any child's list. Please add gifts before finalizing." 
      }, { status: 400 });
    }

    // Calculate current successful wallet balance (parent's wallet)
    const successfulEntries = parent.walletLedger.filter(entry => entry.status === "SUCCEEDED");
    const parentWalletBalanceCents = successfulEntries.reduce((sum, entry) => sum + entry.amountCents, 0);
    
    // Calculate total neighbor donations across all children
    const totalNeighborDonationsCents = children.reduce((sum, child) => {
      return sum + (child.neighborBalanceCents || 0);
    }, 0);
    
    // Calculate total available funds (parent wallet + all neighbor donations)
    const totalAvailableFundsCents = parentWalletBalanceCents + totalNeighborDonationsCents;
    
    // Check if additional payment is needed
    const shortfallCents = Math.max(0, totalGiftCostCents - totalAvailableFundsCents);
    
    let paymentResult = null;
    
    if (shortfallCents > 0) {
      // Create payment intent for the shortfall
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: shortfallCents,
          currency: 'usd',
          customer: parent.stripeCustomerId,
          payment_method: parent.stripeDefaultPaymentMethodId,
          confirmation_method: 'automatic',
          confirm: true,
          return_url: `${process.env.NEXTAUTH_URL}/parent/dashboard?finalization=complete`,
          metadata: {
            type: 'christmas_finalization',
            parentId: parent._id.toString(),
            totalGiftCostCents: totalGiftCostCents.toString(),
            shortfallCents: shortfallCents.toString(),
          }
        });

        // Add pending ledger entry for the finalization payment
        parent.addLedgerEntry({
          type: "TOP_UP",
          amountCents: shortfallCents,
          stripePaymentIntentId: paymentIntent.id,
          status: "PENDING"
        });

        paymentResult = {
          paymentIntentId: paymentIntent.id,
          amountCharged: shortfallCents,
          status: paymentIntent.status
        };

        // If payment succeeded immediately, update ledger
        if (paymentIntent.status === 'succeeded') {
          const pendingEntry = parent.walletLedger.find(entry => 
            entry.stripePaymentIntentId === paymentIntent.id && entry.status === 'PENDING'
          );
          if (pendingEntry) {
            pendingEntry.status = 'SUCCEEDED';
          }
        }

      } catch (stripeError) {
        console.error("Payment failed during finalization:", stripeError);
        return NextResponse.json({ 
          error: "Payment failed. Please check your payment method and try again.",
          details: stripeError instanceof Error ? stripeError.message : "Unknown payment error"
        }, { status: 400 });
      }
    }

    // Mark lists as finalized
    parent.christmasSettings.listsFinalized = true;
    parent.christmasSettings.listsFinalizedAt = new Date();
    parent.christmasSettings.totalGiftCostCents = totalGiftCostCents;
    parent.christmasSettings.finalizedChildrenData = childrenWithGifts as any; // Type workaround for complex ObjectId types

    // Recompute wallet balance to reflect any new payments
    parent.recomputeWalletBalance();
    
    // Deduct the amount covered by parent's wallet (NOT neighbor donations)
    // Neighbor donations stay with the children and are handled separately
    const amountFromWallet = Math.min(totalGiftCostCents - totalNeighborDonationsCents, parentWalletBalanceCents + shortfallCents);
    if (amountFromWallet > 0) {
      parent.addLedgerEntry({
        type: "ADJUSTMENT",
        amountCents: -amountFromWallet, // Negative to deduct
        status: "SUCCEEDED"
      });
      
      // Recompute to reflect the deduction
      parent.recomputeWalletBalance();
    }
    
    await parent.save();

    // Lock all children's gift lists (prevent further modifications)
    await Child.updateMany(
      { parentId: parent._id },
      { 
        $set: { 
          giftListLocked: true,
          giftListLockedAt: new Date()
        }
      }
    );

    // Send receipt email via Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Spirit of Santa <noreply@spiritofsanta.com>',
        to: parent.email,
        subject: '🎄 Christmas List Finalized - Order Confirmation',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #CC001E 0%, #8B0000 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .summary-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #CC001E; }
                .child-section { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; }
                .total-row { font-size: 18px; font-weight: bold; padding: 15px; background: #e8f5e9; border-radius: 6px; margin-top: 15px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .gift-item { padding: 8px 0; border-bottom: 1px solid #eee; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎅 Christmas List Finalized!</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your order has been confirmed</p>
                </div>
                
                <div class="content">
                  <p>Hi ${parent.name},</p>
                  
                  <p>Great news! Your Christmas lists have been successfully finalized and submitted for fulfillment.</p>
                  
                  <div class="summary-box">
                    <h2 style="margin-top: 0; color: #CC001E;">Order Summary</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">Total Gift Cost:</td>
                        <td style="text-align: right; font-weight: bold;">$${(totalGiftCostCents / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">Your Wallet Balance:</td>
                        <td style="text-align: right; color: #2e7d32;">$${(parentWalletBalanceCents / 100).toFixed(2)}</td>
                      </tr>
                      ${totalNeighborDonationsCents > 0 ? `
                      <tr>
                        <td style="padding: 8px 0;">Neighbor Donations:</td>
                        <td style="text-align: right; color: #2e7d32;">$${(totalNeighborDonationsCents / 100).toFixed(2)}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; padding-top: 15px; border-top: 2px solid #ddd;"><strong>Amount Charged:</strong></td>
                        <td style="text-align: right; font-size: 18px; font-weight: bold; color: #CC001E; padding-top: 15px; border-top: 2px solid #ddd;">
                          $${((paymentResult?.amountCharged || 0) / 100).toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <h3>Gift Details by Child:</h3>
                  ${childrenWithGifts.map(child => `
                    <div class="child-section">
                      <h4 style="margin-top: 0; color: #1976d2;">${child.childName}</h4>
                      <p style="margin: 5px 0;"><strong>${child.giftCount} gifts</strong> • Total: $${(child.giftCostCents / 100).toFixed(2)}</p>
                      ${child.gifts.map(gift => `
                        <div class="gift-item">
                          <div>${gift.name}</div>
                          <div style="color: #666; font-size: 14px;">$${(gift.price > 1000 ? gift.price / 100 : gift.price).toFixed(2)}</div>
                        </div>
                      `).join('')}
                    </div>
                  `).join('')}
                  
                  <div class="total-row">
                    <div style="display: flex; justify-content: space-between;">
                      <span>Total for All Children:</span>
                      <span>$${(totalGiftCostCents / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 6px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>🔒 Lists are now locked</strong></p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Gift lists can no longer be modified. Your order has been submitted to our logistics team for processing.</p>
                  </div>
                  
                  <h3>What's Next?</h3>
                  <ul>
                    <li>Your order is being reviewed by our logistics team</li>
                    <li>You'll receive shipment confirmation with tracking details</li>
                    <li>All gifts will arrive in time for Christmas! 🎁</li>
                  </ul>
                  
                  <p>If you have any questions, please contact our support team.</p>
                  
                  <p style="margin-top: 30px;">Merry Christmas! 🎄<br>
                  The Spirit of Santa Team</p>
                </div>
                
                <div class="footer">
                  <p>Order Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                  <p>This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
          </html>
        `
      });
      console.log(`✅ Receipt email sent to ${parent.email}`);
    } catch (emailError) {
      console.error("Failed to send receipt email:", emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Christmas lists finalized successfully!",
      summary: {
        totalChildren: children.length,
        childrenWithGifts: childrenWithGifts.length,
        totalGiftCostCents,
        parentWalletBalanceCents,
        totalNeighborDonationsCents,
        totalAvailableFundsCents,
        shortfallCents,
        finalBalanceCents: parent.walletBalanceCents,
        paymentCharged: paymentResult?.amountCharged || 0,
        childrenDetails: childrenWithGifts
      },
      paymentResult,
      finalizedAt: parent.christmasSettings.listsFinalizedAt
    });

  } catch (error) {
    console.error("Error finalizing Christmas lists:", error);
    return NextResponse.json({ 
      error: "Failed to finalize Christmas lists",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}