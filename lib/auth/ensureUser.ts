// /lib/auth/ensureUser.ts
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";

export async function ensureUser(email: string, name?: string, image?: string) {
  await dbConnect();
  let u = await User.findOne({ email });
  if (!u) {
    u = await User.create({ email, name, image, isParentOnboarded: false });
  }
  return u;
}
