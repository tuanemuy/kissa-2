"use server";

import { getFeaturedRegions } from "@/core/application/region/listRegions";
import { getUserFavoriteRegions } from "@/core/application/region/manageFavorites";
import { getUserPinnedRegions } from "@/core/application/region/managePins";
import { context } from "./context";

// Get user's pinned regions for dashboard
export async function getUserPinnedRegionsAction(userId: string) {
  const result = await getUserPinnedRegions(context, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get user's favorite regions for dashboard
export async function getUserFavoriteRegionsAction(userId: string, limit = 5) {
  const result = await getUserFavoriteRegions(context, userId, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get recommended regions for dashboard
export async function getRecommendedRegionsAction(userId: string, limit = 5) {
  // For now, use featured regions as recommendations
  // This could be enhanced with personalized recommendations later
  const result = await getFeaturedRegions(context, limit, userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get user's recent checkins
export async function getUserRecentCheckinsAction(userId: string, limit = 5) {
  const result = await context.checkinRepository.getRecentByUser(userId, limit);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get user's checkin stats
export async function getUserCheckinStatsAction(userId: string) {
  const result = await context.checkinRepository.getUserStats(userId);

  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Get dashboard summary data
export async function getDashboardSummaryAction(userId: string) {
  try {
    const [
      pinnedRegions,
      favoriteRegions,
      recentCheckins,
      checkinStats,
      recommendations,
    ] = await Promise.all([
      getUserPinnedRegionsAction(userId),
      getUserFavoriteRegionsAction(userId, 3),
      getUserRecentCheckinsAction(userId, 3),
      getUserCheckinStatsAction(userId),
      getRecommendedRegionsAction(userId, 3),
    ]);

    return {
      pinnedRegions,
      favoriteRegions,
      recentCheckins,
      checkinStats,
      recommendations,
    };
  } catch (_error) {
    throw new Error("Failed to load dashboard data");
  }
}
