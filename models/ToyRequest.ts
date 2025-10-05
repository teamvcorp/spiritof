import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToyRequest extends Document {
  _id: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  childName: string;
  parentId: mongoose.Types.ObjectId;
  parentEmail?: string;
  itemTitle: string;
  itemDescription?: string;
  itemUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADDED_TO_CATALOG';
  magicPointsUsed: number;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // Admin user ID or email
  reviewNotes?: string;
  catalogItemId?: mongoose.Types.ObjectId; // If approved and added to catalog
}

const ToyRequestSchema = new Schema<IToyRequest>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  childName: {
    type: String,
    required: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Parent',
    required: true
  },
  parentEmail: {
    type: String
  },
  itemTitle: {
    type: String,
    required: true,
    trim: true
  },
  itemDescription: {
    type: String,
    trim: true
  },
  itemUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ADDED_TO_CATALOG'],
    default: 'PENDING'
  },
  magicPointsUsed: {
    type: Number,
    default: 5
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  catalogItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MasterCatalog'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ToyRequestSchema.index({ status: 1, requestedAt: -1 });
ToyRequestSchema.index({ childId: 1 });
ToyRequestSchema.index({ parentId: 1 });

// Create the model
const ToyRequest = (mongoose.models.ToyRequest as Model<IToyRequest>) || 
                   mongoose.model<IToyRequest>('ToyRequest', ToyRequestSchema);

export { ToyRequest };