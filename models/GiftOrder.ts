import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import type { 
  GiftOrder as IGiftOrder, 
  GiftOrderStatus, 
  GiftApprovalSettings as IGiftApprovalSettings 
} from "@/types/giftFulfillment";

type Q = Record<string, never>;
type NoVirtuals = Record<string, never>;

// Gift Order Schema
interface GiftOrderMethods {
  canBeApproved(): boolean;
  isInChristmasWindow(): boolean;
  calculateDeliveryEstimate(): Date;
  updateStatus(newStatus: GiftOrderStatus, note?: string): Promise<void>;
}

export type GiftOrderModel = Model<IGiftOrder, Q, GiftOrderMethods, NoVirtuals>;
export type GiftOrderDoc = HydratedDocument<IGiftOrder, GiftOrderMethods>;

const ShippingAddressSchema = new Schema({
  recipientName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, default: "US" },
}, { _id: false });

const GiftOrderSchema = new Schema<IGiftOrder, GiftOrderModel, GiftOrderMethods>({
  childId: { type: Schema.Types.ObjectId, ref: "Child", required: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
  catalogItemId: { type: Schema.Types.ObjectId, ref: "CatalogItem", required: true },
  
  // Order details
  orderType: { 
    type: String, 
    enum: ["CHRISTMAS", "REWARD", "SPECIAL_OCCASION"], 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: [
      "PENDING_APPROVAL", "APPROVED", "ORDERED", 
      "SHIPPED", "DELIVERED", "CANCELLED", "FAILED"
    ], 
    default: "PENDING_APPROVAL",
    index: true 
  },
  magicPointsCost: { type: Number, required: true, min: 0 },
  
  // Gift details
  giftTitle: { type: String, required: true },
  giftBrand: String,
  giftPrice: { type: Number, required: true, min: 0 },
  giftImageUrl: String,
  retailerProductUrl: String,
  retailer: String,
  
  // Shipping details
  recipientName: { type: String, required: true },
  shippingAddress: { type: ShippingAddressSchema, required: true },
  
  // Fulfillment tracking
  externalOrderId: String,
  trackingNumber: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Approval workflow
  requestedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  approvedBy: { type: String, enum: ["SYSTEM", "PARENT"] },
  parentApprovalNote: String,
  
  // Christmas-specific
  christmasYear: Number,
  isChristmasEligible: { type: Boolean, default: false },
  
  // Behavior reward specific
  behaviorReason: String,
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
GiftOrderSchema.index({ status: 1, orderType: 1 });
GiftOrderSchema.index({ christmasYear: 1, isChristmasEligible: 1 });
GiftOrderSchema.index({ requestedAt: 1 });
GiftOrderSchema.index({ childId: 1, orderType: 1, createdAt: -1 });

// Instance Methods
GiftOrderSchema.methods.canBeApproved = function(): boolean {
  if (this.status !== "PENDING_APPROVAL") return false;
  
  if (this.orderType === "CHRISTMAS") {
    return this.isInChristmasWindow();
  }
  
  return true; // Reward gifts can be approved year-round by parents
};

GiftOrderSchema.methods.isInChristmasWindow = function(): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Christmas window: December 11-25 each year
  const christmasStart = new Date(currentYear, 11, 11); // Dec 11
  const christmasEnd = new Date(currentYear, 11, 25, 23, 59, 59); // Dec 25
  
  return now >= christmasStart && now <= christmasEnd;
};

GiftOrderSchema.methods.calculateDeliveryEstimate = function(): Date {
  const now = new Date();
  const deliveryDays = this.orderType === "CHRISTMAS" ? 3 : 7; // Faster for Christmas
  
  const estimate = new Date(now);
  estimate.setDate(estimate.getDate() + deliveryDays);
  
  return estimate;
};

GiftOrderSchema.methods.updateStatus = async function(newStatus: GiftOrderStatus, note?: string) {
  this.status = newStatus;
  
  if (newStatus === "APPROVED") {
    this.approvedAt = new Date();
    this.parentApprovalNote = note;
  }
  
  if (newStatus === "ORDERED") {
    this.estimatedDeliveryDate = this.calculateDeliveryEstimate();
  }
  
  if (newStatus === "DELIVERED") {
    this.actualDeliveryDate = new Date();
  }
  
  await this.save();
};

// Static methods for business logic
GiftOrderSchema.statics.getCurrentChristmasWindow = function() {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  return {
    year: currentYear,
    startDate: new Date(currentYear, 11, 11), // Dec 11
    endDate: new Date(currentYear, 11, 25, 23, 59, 59), // Dec 25
    isActive: this.prototype.isInChristmasWindow.call({ orderType: "CHRISTMAS" })
  };
};

export const GiftOrder: GiftOrderModel =
  (mongoose.models.GiftOrder as GiftOrderModel) ??
  mongoose.model<IGiftOrder, GiftOrderModel>("GiftOrder", GiftOrderSchema);

// Gift Approval Settings Schema
interface GiftApprovalMethods {
  isRewardGiftAllowed(childId: string, year: number): Promise<boolean>;
  getUsedRewardGifts(childId: string, year: number): Promise<number>;
}

export type GiftApprovalModel = Model<IGiftApprovalSettings, Q, GiftApprovalMethods, NoVirtuals>;
export type GiftApprovalDoc = HydratedDocument<IGiftApprovalSettings, GiftApprovalMethods>;

const GiftApprovalSchema = new Schema<IGiftApprovalSettings, GiftApprovalModel, GiftApprovalMethods>({
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true, unique: true },
  
  // Reward gift settings
  maxRewardGiftsPerYear: { type: Number, default: 2, min: 0, max: 5 },
  maxRewardGiftPrice: { type: Number, default: 50, min: 0 },
  requireApprovalOver: { type: Number, default: 25, min: 0 },
  
  // Auto-approval settings
  autoApproveRewards: { type: Boolean, default: false },
  autoApproveChristmas: { type: Boolean, default: true },
  
  // Notification preferences
  emailOnGiftRequest: { type: Boolean, default: true },
  emailOnGiftShipped: { type: Boolean, default: true },
  emailOnGiftDelivered: { type: Boolean, default: true },
}, { 
  timestamps: { createdAt: false, updatedAt: true }
});

GiftApprovalSchema.methods.isRewardGiftAllowed = async function(childId: string, year: number): Promise<boolean> {
  const usedGifts = await this.getUsedRewardGifts(childId, year);
  return usedGifts < this.maxRewardGiftsPerYear;
};

GiftApprovalSchema.methods.getUsedRewardGifts = async function(childId: string, year: number): Promise<number> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);
  
  const count = await GiftOrder.countDocuments({
    childId,
    orderType: "REWARD",
    status: { $in: ["APPROVED", "ORDERED", "SHIPPED", "DELIVERED"] },
    createdAt: { $gte: startOfYear, $lte: endOfYear }
  });
  
  return count;
};

export const GiftApprovalSettings: GiftApprovalModel =
  (mongoose.models.GiftApprovalSettings as GiftApprovalModel) ??
  mongoose.model<IGiftApprovalSettings, GiftApprovalModel>("GiftApprovalSettings", GiftApprovalSchema);