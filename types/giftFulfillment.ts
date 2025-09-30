import type { Types } from "mongoose";

export type GiftOrderStatus = 
  | "PENDING_APPROVAL"     // Waiting for Christmas window or parent approval
  | "APPROVED"             // Approved for fulfillment
  | "ORDERED"              // Order placed with retailer
  | "SHIPPED"              // Package shipped
  | "DELIVERED"            // Package delivered
  | "CANCELLED"            // Order cancelled
  | "FAILED"               // Order failed

export type OrderType = 
  | "CHRISTMAS"            // Christmas gifts (auto-approved 2 weeks before)
  | "REWARD"               // Good behavior reward (parent approval)
  | "SPECIAL_OCCASION"     // Birthday, achievement, etc.

export interface GiftOrder {
  _id: Types.ObjectId;
  childId: Types.ObjectId;
  parentId: Types.ObjectId;
  catalogItemId: Types.ObjectId;
  
  // Order details
  orderType: OrderType;
  status: GiftOrderStatus;
  magicPointsCost: number;     // Points deducted from child's score
  
  // Gift details
  giftTitle: string;
  giftBrand?: string;
  giftPrice: number;
  giftImageUrl?: string;
  retailerProductUrl?: string;
  retailer?: string;
  
  // Shipping details
  recipientName: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Fulfillment tracking
  externalOrderId?: string;    // ID from fulfillment service
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  
  // Approval workflow
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: "SYSTEM" | "PARENT";
  parentApprovalNote?: string;
  
  // Christmas-specific
  christmasYear?: number;      // Year for Christmas delivery
  isChristmasEligible: boolean;
  
  // Behavior reward specific
  behaviorReason?: string;     // Why child earned this reward
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ChristmasWindow {
  year: number;
  startDate: Date;  // 2 weeks before Christmas
  endDate: Date;    // Christmas Day
  isActive: boolean;
}

export interface YearlyGiftLimits {
  childId: Types.ObjectId;
  year: number;
  rewardGiftsUsed: number;    // How many reward gifts used this year
  maxRewardGifts: number;     // Max reward gifts per year (1-2)
  totalMagicPointsSpent: number;
}

// Parent settings for gift approval
export interface GiftApprovalSettings {
  parentId: Types.ObjectId;
  
  // Reward gift settings
  maxRewardGiftsPerYear: number;  // Default 2
  maxRewardGiftPrice: number;     // Max price for reward gifts
  requireApprovalOver: number;    // Require approval for gifts over this price
  
  // Auto-approval settings
  autoApproveRewards: boolean;    // Auto-approve reward gifts under limits
  autoApproveChristmas: boolean;  // Auto-approve Christmas gifts in window
  
  // Notification preferences
  emailOnGiftRequest: boolean;
  emailOnGiftShipped: boolean;
  emailOnGiftDelivered: boolean;
  
  updatedAt: Date;
}