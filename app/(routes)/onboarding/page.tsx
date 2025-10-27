import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";

function parseIntField(v: FormDataEntryValue | null, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : def;
}

function parseDollarToCents(v: FormDataEntryValue | null, def = 0) {
  const dollars = Number(v);
  return Number.isFinite(dollars) ? Math.max(0, Math.round(dollars * 100)) : def;
}

async function submitOnboarding(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/auth");

  // Check if they've completed Stripe verification
  const verifiedParam = formData.get("stripeVerified");
  if (!verifiedParam) {
    // Redirect to Stripe verification first
    redirect("/api/stripe/verify-adult");
    return;
  }

  // All users are parents in this platform
  const magicBudgetCents = parseDollarToCents(formData.get("magicBudget"));
  const minGifts = parseIntField(formData.get("minGifts"), 1);
  const maxGifts = parseIntField(formData.get("maxGifts"), 5);
  const perGiftCapCents = parseDollarToCents(formData.get("perGiftCap"));
  const phone = String(formData.get("phone") || "").trim();

  // If already has a parent, just mark onboarded
  if (user.parentId) {
    user.isParentOnboarded = true;
    await user.save();
    redirect("/children/list");
  }

  // Check if a parent with this email already exists
  let parent = await Parent.findOne({ email: user.email });
  
  if (parent) {
    // Parent already exists, update their info and link this user to it
    if (phone) {
      parent.phone = phone;
      await parent.save();
    }
    
    await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          parentId: new Types.ObjectId(parent._id.toString()),
          isParentOnboarded: true 
        }
      },
      { new: true, runValidators: true }
    );
    
    redirect("/children/list");
  }

  // Create new parent with Stripe customer ID from verification
  const stripeCustomerId = formData.get("stripeCustomerId")?.toString();
  if (!stripeCustomerId) {
    throw new Error("Stripe customer ID required for parent creation");
  }

  try {
    // Create new parent
    parent = new Parent({
      userId: user._id,
      name: user.name ?? "",
      email: user.email,
      phone: phone || undefined,
      magicBudgetCents,
      giftSettings: { minGifts, maxGifts, perGiftCapCents },
      stripeCustomerId,
    });

    await parent.save();

    // Link user to parent
    await User.findByIdAndUpdate(
      session.user.id,
      { 
        $set: { 
          parentId: new Types.ObjectId(parent._id.toString()),
          isParentOnboarded: true 
        }
      },
      { new: true, runValidators: true }
    );
    
  } catch (error) {
    console.error('Failed to create parent:', error);
    // Clean up parent if user update failed
    if (parent?._id) {
      try {
        await Parent.findByIdAndDelete(parent._id);
      } catch (cleanupError) {
        console.error('Failed to cleanup parent:', cleanupError);
      }
    }
    throw new Error(`Failed to complete onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Redirect through success page to ensure session refresh
  redirect("/onboarding/success");
}

export default async function OnboardingPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ verified?: string; customer_id?: string; error?: string }> 
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  
  if (user?.isParentOnboarded) {
    redirect("/children/list");
  }

  const { verified, customer_id, error } = await searchParams;
  const isVerified = verified === 'true' && customer_id;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-3xl font-paytone-one text-santa">Welcome to Spirit of Santa! 🎅</h1>
        <p className="text-lg text-muted-foreground">
          Let&apos;s set up your magical Christmas experience for your family
        </p>
        <div className="p-4 bg-gradient-to-r from-santa/10 to-evergreen/10 rounded-lg border border-santa/20">
          <p className="text-sm text-evergreen font-medium">
            ✨ Parent Platform: Adult verification required for family safety
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">
            {error === 'verification_cancelled' && 'Verification was cancelled. Please try again.'}
            {error === 'verification_failed' && 'Verification failed. Please try again.'}
            {error === 'missing_verification_data' && 'Missing verification data. Please restart the process.'}
          </p>
        </div>
      )}

      {!isVerified ? (
        // Step 1: Age Verification
        <div className="bg-white rounded-xl border-2 border-santa/20 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-santa text-white rounded-full flex items-center justify-center font-bold">1</div>
            <h2 className="text-xl font-paytone-one text-santa">Adult Verification Required</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To ensure the safety and security of our Christmas magic platform, we require verification that you are an adult parent or guardian through our secure payment partner, Stripe.
            </p>
            
            <div className="bg-gradient-to-br from-santa/5 to-evergreen/5 border rounded-lg p-4">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-santa/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-santa" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="font-medium text-santa mb-2">Secure Age Verification</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We&apos;ll verify your payment method to confirm you&apos;re an adult. No charges will be made during verification.
                  </p>
                </div>
                
                <a 
                  href="/api/stripe/verify-adult"
                  className="w-full py-3 px-6 bg-santa text-white rounded-lg font-medium hover:bg-santa/90 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Verify with Stripe
                </a>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <svg className="w-4 h-4 text-evergreen" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Bank-level security powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Step 2: Family Setup (shown after verification)
        <form action={submitOnboarding} className="space-y-6">
          <input type="hidden" name="stripeVerified" value="true" />
          <input type="hidden" name="stripeCustomerId" value={customer_id || ''} />
          
          <div className="bg-white rounded-xl border-2 border-evergreen/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-evergreen text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-paytone-one text-evergreen">Family Christmas Setup</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Age verification complete! Now let&apos;s set up your family&apos;s Christmas magic.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cell Phone Number</label>
                  <input 
                    name="phone" 
                    type="tel" 
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" 
                    placeholder="(555) 123-4567"
                    required
                  />
                  <p className="text-xs text-muted-foreground">We'll send you quick voting links to track your children's behavior throughout the day.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Magic Budget ($)</label>
                  <input 
                    name="magicBudget" 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    defaultValue={25} 
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" 
                    placeholder="25.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Amount you want to spend monthly on magic points and gifts.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Per-Gift Cap ($)</label>
                  <input 
                    name="perGiftCap" 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    defaultValue={50} 
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" 
                    placeholder="50.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Maximum amount per individual gift.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Gifts per Child</label>
                  <input 
                    name="minGifts" 
                    type="number" 
                    min={1} 
                    defaultValue={1} 
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Gifts per Child</label>
                  <input 
                    name="maxGifts" 
                    type="number" 
                    min={1} 
                    defaultValue={5} 
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                    required 
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-3 px-4 bg-evergreen text-white rounded-lg font-medium hover:bg-evergreen/90 transition-colors"
                >
                  Complete Christmas Setup 🎄
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </main>
  );
}