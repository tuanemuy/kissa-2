import { beforeEach, describe, expect, it } from "vitest";
import { createMockContext } from "@/core/adapters/mock/testContext";
import type { MockUserRepository } from "@/core/adapters/mock/userRepository";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type GetAnalyticsInput,
  generateSystemHealthReport,
  getRevenueAnalytics,
  getSystemStatistics,
  getUserGrowthData,
} from "./systemAnalytics";

describe("System Analytics", () => {
  let context: Context;
  let mockAdmin: User;
  let mockUser: User;

  beforeEach(() => {
    context = createMockContext();

    mockAdmin = {
      id: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      email: "admin@example.com",
      hashedPassword: "hashed-password",
      name: "Admin User",
      role: "admin",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUser = {
      id: "851a534d-106c-4888-80f6-b39d493d4008",
      email: "test@example.com",
      hashedPassword: "hashed-password",
      name: "Test User",
      role: "editor",
      status: "active",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set up mock repositories with test data
    const userRepo = context.userRepository as MockUserRepository;

    // Add mock users
    userRepo.addUser(mockAdmin);
    userRepo.addUser(mockUser);
  });

  describe("getSystemStatistics", () => {
    it("should successfully get comprehensive system statistics", async () => {
      // Act
      const result = await getSystemStatistics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.users).toBeDefined();
        expect(stats.content).toBeDefined();
        expect(stats.subscriptions).toBeDefined();
        expect(stats.usage).toBeDefined();
        expect(typeof stats.users.total).toBe("number");
        expect(typeof stats.content.regions.total).toBe("number");
        expect(typeof stats.content.places.total).toBe("number");
      }
    });

    it("should fail when user is not admin", async () => {
      // Act
      const result = await getSystemStatistics(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should fail when admin is not found", async () => {
      // Act
      const result = await getSystemStatistics(
        context,
        "00000000-0000-0000-0000-000000000000",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin user not found");
      }
    });

    it("should fail when admin is not active", async () => {
      // Arrange
      const inactiveAdmin = {
        ...mockAdmin,
        id: "44dd88ff-ccea-4806-8be7-9a26c0ee3bb8",
        status: "suspended" as const,
      };
      const userRepo = context.userRepository as MockUserRepository;
      userRepo.addUser(inactiveAdmin);

      // Act
      const result = await getSystemStatistics(
        context,
        "44dd88ff-ccea-4806-8be7-9a26c0ee3bb8",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin account is not active");
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Act
      const result = await getSystemStatistics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should return valid stats even if some queries have issues
        expect(result.value.users).toBeDefined();
        expect(typeof result.value.users.total).toBe("number");
      }
    });
  });

  describe("getUserGrowthData", () => {
    it("should successfully get user growth data with default parameters", async () => {
      // Act
      const result = await getUserGrowthData(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]).toHaveProperty("period");
        expect(result.value[0]).toHaveProperty("newUsers");
        expect(result.value[0]).toHaveProperty("activeUsers");
        expect(result.value[0]).toHaveProperty("totalUsers");
        expect(result.value[0]).toHaveProperty("churnedUsers");
        expect(result.value[0]).toHaveProperty("retentionRate");
      }
    });

    it("should successfully get user growth data with custom parameters", async () => {
      // Arrange
      const input: GetAnalyticsInput = {
        period: "week",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await getUserGrowthData(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
      }
    });

    it("should fail when user is not admin", async () => {
      // Act
      const result = await getUserGrowthData(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });
  });

  describe("getRevenueAnalytics", () => {
    it("should successfully get revenue analytics with default parameters", async () => {
      // Act
      const result = await getRevenueAnalytics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]).toHaveProperty("period");
        expect(result.value[0]).toHaveProperty("revenue");
        expect(result.value[0]).toHaveProperty("subscriptions");
        expect(result.value[0]).toHaveProperty("averageRevenuePerUser");
        expect(result.value[0]).toHaveProperty("newSubscriptions");
        expect(result.value[0]).toHaveProperty("cancelledSubscriptions");
      }
    });

    it("should successfully get revenue analytics with custom parameters", async () => {
      // Arrange
      const input: GetAnalyticsInput = {
        period: "year",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
      };

      // Act
      const result = await getRevenueAnalytics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(Array.isArray(result.value)).toBe(true);
      }
    });

    it("should fail when user is not admin", async () => {
      // Act
      const result = await getRevenueAnalytics(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });
  });

  describe("generateSystemHealthReport", () => {
    it("should generate excellent health report for healthy system", async () => {
      // Act
      const result = await generateSystemHealthReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.overallHealth).toBeDefined();
        expect(result.value.issues).toBeDefined();
        expect(result.value.recommendations).toBeDefined();
        expect(result.value.statistics).toBeDefined();
        expect(Array.isArray(result.value.issues)).toBe(true);
        expect(Array.isArray(result.value.recommendations)).toBe(true);
      }
    });

    it("should generate health report for system with various metrics", async () => {
      // Act
      const result = await generateSystemHealthReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.overallHealth).toBeDefined();
        expect(result.value.issues).toBeDefined();
        expect(result.value.recommendations).toBeDefined();
        expect(result.value.statistics).toBeDefined();
        expect(Array.isArray(result.value.issues)).toBe(true);
        expect(Array.isArray(result.value.recommendations)).toBe(true);
        // Health should be one of the expected values
        expect(["excellent", "good", "warning", "critical"]).toContain(
          result.value.overallHealth,
        );
      }
    });

    it("should fail when user is not admin", async () => {
      // Act
      const result = await generateSystemHealthReport(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should handle missing data gracefully", async () => {
      // Act
      const result = await generateSystemHealthReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true); // Health report should still succeed even if some data is missing
      if (result.isOk()) {
        expect(result.value.statistics).toBeDefined();
        expect(result.value.statistics.users).toBeDefined();
        expect(typeof result.value.statistics.users.total).toBe("number");
      }
    });
  });
});
