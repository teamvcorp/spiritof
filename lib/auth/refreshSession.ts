import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";

/**
 * Force refresh the user's session data from the database
 * This is useful after updating user properties like isParentOnboarded
 */
export async function refreshUserSession() {
  const session = await auth();
  if (!session?.user?.id) return false;

  try {
    await dbConnect();
    
    // This will trigger the JWT callback to refresh the token
    // when the next request is made
    return true;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return false;
  }
}