// /types/models/user.ts
import type { ObjectId } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser {
  _id: ObjectId;

  name?: string;
  email: string;
  image?: string;

  role: UserRole;

  // Onboarding for Parent flow
  isParentOnboarded: boolean;
  parentId?: ObjectId | null; // ref: Parent

  createdAt?: Date;
  updatedAt?: Date;
}
