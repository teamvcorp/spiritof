import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICorporateDonation extends Document {
  companyName: string;
  companyEmail: string;
  amount: number; // in cents
  paymentMethod: 'card' | 'check' | 'wire';
  status: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  receiptUrl?: string;
  logoUrl?: string; // Company logo for sponsor recognition
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

const CorporateDonationSchema = new Schema<ICorporateDonation>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 10000, // $100 minimum
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'check', 'wire'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    stripeSessionId: {
      type: String,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    receiptUrl: {
      type: String,
    },
    logoUrl: {
      type: String,
    },
    notes: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CorporateDonationSchema.index({ companyEmail: 1, createdAt: -1 });
CorporateDonationSchema.index({ status: 1, createdAt: -1 });
CorporateDonationSchema.index({ stripeSessionId: 1 }, { sparse: true });

export const CorporateDonation: Model<ICorporateDonation> =
  mongoose.models.CorporateDonation ||
  mongoose.model<ICorporateDonation>("CorporateDonation", CorporateDonationSchema);
