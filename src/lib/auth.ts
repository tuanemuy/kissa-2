import { cookies } from "next/headers";
import { cache } from "react";
import { context } from "@/context";
import type { User } from "@/core/domain/user/types";

/**
 * Get the current authenticated user from session cookie
 * This function is cached to avoid multiple database calls during a single request
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token");

    if (!sessionToken?.value) {
      return null;
    }

    // Find session by token
    const sessionResult = await context.userSessionRepository.findByToken(
      sessionToken.value,
    );

    if (sessionResult.isErr()) {
      return null;
    }

    const session = sessionResult.value;
    if (!session) {
      return null;
    }

    // Check if session is expired
    const now = new Date();
    if (session.expiresAt < now) {
      // Clean up expired session
      await context.userSessionRepository.deleteByToken(sessionToken.value);
      return null;
    }

    // Get user by ID
    const userResult = await context.userRepository.findById(session.userId);

    if (userResult.isErr()) {
      return null;
    }

    const user = userResult.value;
    if (!user || user.status !== "active") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
});

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: "visitor" | "editor" | "admin"): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === "admin") return true;
  
  // Editor has editor and visitor permissions
  if (user.role === "editor" && (role === "editor" || role === "visitor")) return true;
  
  // Visitor has only visitor permissions
  if (user.role === "visitor" && role === "visitor") return true;
  
  return false;
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  user: User | null,
  minimumRole: "visitor" | "editor" | "admin",
): boolean {
  if (!user) return false;

  const roleHierarchy = { visitor: 1, editor: 2, admin: 3 };
  const userRoleLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole] || 0;

  return userRoleLevel >= requiredLevel;
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest";
  return user.name || user.email.split("@")[0];
}