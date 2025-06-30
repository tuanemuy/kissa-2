/**
 * Utility functions for handling business hours formatting and validation
 */

import type { BusinessHours, DayOfWeek } from "@/core/domain/place/types";

/**
 * Map of day of week codes to their Japanese display names
 */
const dayOfWeekMap: Record<DayOfWeek, string> = {
  monday: "月",
  tuesday: "火",
  wednesday: "水",
  thursday: "木",
  friday: "金",
  saturday: "土",
  sunday: "日",
};

/**
 * Type guard to check if the value is a valid BusinessHours array
 */
export function isBusinessHoursArray(value: unknown): value is BusinessHours[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const businessHours = item as Record<string, unknown>;

    // Check required fields
    if (typeof businessHours.dayOfWeek !== "string") {
      return false;
    }

    if (typeof businessHours.isClosed !== "boolean") {
      return false;
    }

    // If not closed, openTime and closeTime should be valid time strings or undefined
    if (!businessHours.isClosed) {
      if (
        businessHours.openTime !== undefined &&
        typeof businessHours.openTime !== "string"
      ) {
        return false;
      }
      if (
        businessHours.closeTime !== undefined &&
        typeof businessHours.closeTime !== "string"
      ) {
        return false;
      }

      // Validate time format if present
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (
        businessHours.openTime &&
        !timeRegex.test(businessHours.openTime as string)
      ) {
        return false;
      }
      if (
        businessHours.closeTime &&
        !timeRegex.test(businessHours.closeTime as string)
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Format business hours array into a readable string
 * @param businessHours - The business hours data (unknown type for type safety)
 * @returns A formatted string representation of the business hours
 */
export function formatBusinessHours(businessHours: unknown): string {
  // Handle string input (legacy format)
  if (typeof businessHours === "string") {
    return businessHours;
  }

  // Handle null/undefined
  if (!businessHours) {
    return "営業時間要確認";
  }

  // Type guard for BusinessHours array
  if (!isBusinessHoursArray(businessHours)) {
    return "営業時間詳細はクリックして確認";
  }

  // If no business hours are defined
  if (businessHours.length === 0) {
    return "営業時間要確認";
  }

  // Group consecutive days with same hours
  const groupedHours = groupConsecutiveDays(businessHours);

  // Format grouped hours
  const formattedGroups = groupedHours.map((group) => {
    if (group.isClosed) {
      return `${group.daysRange}: 定休日`;
    }

    if (!group.openTime || !group.closeTime) {
      return `${group.daysRange}: 時間要確認`;
    }

    return `${group.daysRange}: ${group.openTime}-${group.closeTime}`;
  });

  // Return first group or summarized format
  if (formattedGroups.length <= 2) {
    return formattedGroups.join(", ");
  }

  // For complex schedules, show simplified version
  return "営業時間詳細はクリックして確認";
}

/**
 * Get a simple summary of business hours (for card displays)
 * @param businessHours - The business hours data
 * @returns A simple string summary
 */
export function getBusinessHoursSummary(businessHours: unknown): string {
  if (!isBusinessHoursArray(businessHours) || businessHours.length === 0) {
    return "営業時間要確認";
  }

  // Find today's hours
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames: DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const todayName = dayNames[today];

  const todayHours = businessHours.find((h) => h.dayOfWeek === todayName);

  if (todayHours) {
    if (todayHours.isClosed) {
      return "本日定休日";
    }
    if (todayHours.openTime && todayHours.closeTime) {
      return `本日 ${todayHours.openTime}-${todayHours.closeTime}`;
    }
  }

  return "営業時間詳細はクリックして確認";
}

/**
 * Group consecutive days with the same business hours
 */
function groupConsecutiveDays(businessHours: BusinessHours[]): Array<{
  daysRange: string;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}> {
  // Sort by day of week
  const dayOrder: Record<DayOfWeek, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  const sortedHours = [...businessHours].sort(
    (a, b) => dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek],
  );

  const groups: Array<{
    daysRange: string;
    openTime?: string;
    closeTime?: string;
    isClosed: boolean;
  }> = [];

  let currentGroup: BusinessHours[] = [];

  for (const hours of sortedHours) {
    if (currentGroup.length === 0) {
      currentGroup = [hours];
    } else {
      const lastHours = currentGroup[currentGroup.length - 1];

      // Check if hours are the same
      if (
        lastHours.isClosed === hours.isClosed &&
        lastHours.openTime === hours.openTime &&
        lastHours.closeTime === hours.closeTime
      ) {
        currentGroup.push(hours);
      } else {
        // Finalize current group
        groups.push(createGroupSummary(currentGroup));
        currentGroup = [hours];
      }
    }
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push(createGroupSummary(currentGroup));
  }

  return groups;
}

/**
 * Create a summary for a group of days with the same hours
 */
function createGroupSummary(group: BusinessHours[]): {
  daysRange: string;
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
} {
  const firstDay = group[0];
  const lastDay = group[group.length - 1];

  let daysRange: string;
  if (group.length === 1) {
    daysRange = dayOfWeekMap[firstDay.dayOfWeek];
  } else if (group.length === 7) {
    daysRange = "毎日";
  } else {
    daysRange = `${dayOfWeekMap[firstDay.dayOfWeek]}-${dayOfWeekMap[lastDay.dayOfWeek]}`;
  }

  return {
    daysRange,
    openTime: firstDay.openTime,
    closeTime: firstDay.closeTime,
    isClosed: firstDay.isClosed,
  };
}
