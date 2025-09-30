// models/User.ts (minimal fields shown)
import { Schema, model, models, Types, type HydratedDocument, type Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser {
  _id: Types.ObjectId;
  name?: string;
  email: string;
  image?: string;
  password?: string;
  authProvider: "google" | "credentials";
  parentId?: Types.ObjectId;
  isParentOnboarded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: String,
  email: { type: String, unique: true, index: true, required: true },
  image: String,
  password: { type: String }, // Optional - for email/password auth
  authProvider: { type: String, enum: ["google", "credentials"], default: "google" },
  parentId: { type: Types.ObjectId, ref: "Parent" },
  isParentOnboarded: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export type UserDoc = HydratedDocument<IUser> & UserMethods;
export type UserModel = Model<IUser, object, UserMethods>;

export const User = (models.User as UserModel) || model<IUser, UserModel>("User", UserSchema);
