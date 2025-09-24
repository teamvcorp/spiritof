// models/User.ts (minimal fields shown)
import { Schema, model, models, Types } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true, required: true },
  image: String,
  parentId: { type: Types.ObjectId, ref: "Parent" },
  isParentOnboarded: { type: Boolean, default: false },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);
