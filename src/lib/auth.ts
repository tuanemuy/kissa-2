import { cookies } from "next/headers";
import { context } from "@/context";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      return null;
    }

    // Find session
    const sessionResult =
      await context.userSessionRepository.findByToken(sessionToken);
    if (sessionResult.isErr() || !sessionResult.value) {
      return null;
    }

    const session = sessionResult.value;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await context.userSessionRepository.deleteByToken(sessionToken);
      return null;
    }

    // Get user
    const userResult = await context.userRepository.findById(session.userId);
    if (userResult.isErr() || !userResult.value) {
      return null;
    }

    return userResult.value;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
