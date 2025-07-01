import { beforeEach, describe, expect, it } from "vitest";
import type {
  MockBillingHistoryRepository,
  MockUsageMetricsRepository,
} from "@/core/adapters/mock/paymentRepository";
import type {
  MockCheckinRepository,
  MockPlaceRepository,
} from "@/core/adapters/mock/placeRepository";
import type { MockRegionRepository } from "@/core/adapters/mock/regionRepository";
import { createMockContext } from "@/core/adapters/mock/testContext";
import type {
  MockUserRepository,
  MockUserSubscriptionRepository,
} from "@/core/adapters/mock/userRepository";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  type ChurnAlertData,
  type ActivityAlertData,
  type ContentPerformanceReportData,
  type GenerateReportInput,
  generatePredictiveAnalytics,
  generateReport,
  generateSystemAlerts,
  type PdfReportData,
  type RevenueReportData,
  type ScheduleReportInput,
  scheduleReport,
  type UsageReportData,
} from "./advancedReporting";

describe("Advanced Reporting", () => {
  let context: Context;
  let mockAdmin: User;
  let mockUser: User;

  beforeEach(() => {
    context = createMockContext();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    mockAdmin = {
      id: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      email: "admin@example.com",
      hashedPassword: "hashed-password",
      name: "Admin User",
      role: "admin",
      status: "active",
      emailVerified: true,
      lastLoginAt: startOfMonth, // Active user (logged in this month)
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
      lastLoginAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Inactive user
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Set up mock repositories with test data
    const userRepo = context.userRepository as MockUserRepository;
    const subscriptionRepo =
      context.userSubscriptionRepository as MockUserSubscriptionRepository;
    const _billingRepo =
      context.billingHistoryRepository as MockBillingHistoryRepository;
    const _regionRepo = context.regionRepository as MockRegionRepository;
    const _placeRepo = context.placeRepository as MockPlaceRepository;
    const _checkinRepo = context.checkinRepository as MockCheckinRepository;
    const usageRepo =
      context.usageMetricsRepository as MockUsageMetricsRepository;

    // Add mock users
    userRepo.addUser(mockAdmin);
    userRepo.addUser(mockUser);

    // Add additional users for activity rate testing (to get 20% activity rate)
    // 1 active user out of 5 total = 20%
    for (let i = 0; i < 3; i++) {
      userRepo.addUser({
        id: `01234567-89ab-4def-8${i}23-456789abcde${i}`,
        email: `inactive${i}@example.com`,
        hashedPassword: "hashed-password",
        name: `Inactive User ${i}`,
        role: "visitor",
        status: "active",
        emailVerified: true,
        lastLoginAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago (inactive)
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Set up subscription analytics data
    subscriptionRepo.setMockStatusCounts({
      active: 80,
      trial: 10,
      expired: 5,
      cancelled: 5,
      none: 900,
    });
    subscriptionRepo.setMockPlanCounts({
      free: 900,
      standard: 80,
      premium: 20,
    });

    // Set up usage metrics data
    usageRepo.addUsageMetrics({
      id: "usage-1",
      userId: "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      regionsCreated: 10,
      placesCreated: 50,
      checkinsCount: 100,
      imagesUploaded: 25,
      storageUsedMB: 500,
      apiCallsCount: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("generateReport", () => {
    it("should successfully generate a usage report", async () => {
      // Arrange
      const input: GenerateReportInput = {
        reportType: "usage",
        format: "json",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
        filters: {
          includeInactive: false,
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      if (result.isErr()) {
        console.error(
          "Test failed with error:",
          result.error.message,
          result.error,
        );
      }
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("usage");
        expect(result.value.format).toBe("json");
        expect(result.value.metadata.dateRange).toEqual(input.dateRange);
        const usageData = result.value.data as UsageReportData;
        expect(usageData.reportType).toBe("usage");
        expect(usageData.metrics).toBeDefined();
      }
    });

    it("should successfully generate a revenue report", async () => {
      // Arrange
      const input: GenerateReportInput = {
        reportType: "revenue",
        format: "json",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("revenue");
        const revenueData = result.value.data as RevenueReportData;
        expect(revenueData.reportType).toBe("revenue");
        expect(revenueData.transactions).toBeDefined();
        expect(revenueData.summary).toBeDefined();
      }
    });

    it("should successfully generate a user activity report", async () => {
      // Arrange
      const input: GenerateReportInput = {
        reportType: "user_activity",
        format: "csv",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("user_activity");
        expect(result.value.format).toBe("csv");
        expect(typeof result.value.data).toBe("string"); // CSV format
      }
    });

    it("should successfully generate a content performance report", async () => {
      // Arrange

      const input: GenerateReportInput = {
        reportType: "content_performance",
        format: "json",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("content_performance");
        const contentData = result.value.data as ContentPerformanceReportData;
        expect(contentData.reportType).toBe("content_performance");
        expect(contentData.content).toBeDefined();
        expect(contentData.summary).toBeDefined();
      }
    });

    it("should successfully generate a comprehensive report", async () => {
      // Arrange

      const input: GenerateReportInput = {
        reportType: "comprehensive",
        format: "json",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe("comprehensive");
        // Comprehensive reports return analytics data
        const comprehensiveData = result.value.data as Record<string, unknown>;
        expect(comprehensiveData.subscription).toBeDefined();
        expect(comprehensiveData.userActivity).toBeDefined();
        expect(comprehensiveData.content).toBeDefined();
      }
    });

    it("should generate report in PDF format", async () => {
      // Arrange

      const input: GenerateReportInput = {
        reportType: "usage",
        format: "pdf",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.format).toBe("pdf");
        const pdfData = result.value.data as PdfReportData;
        expect(pdfData.type).toBe("pdf");
        expect(pdfData.metadata).toBeDefined();
      }
    });

    it("should fail when user is not admin", async () => {
      // Arrange

      const input: GenerateReportInput = {
        reportType: "usage",
        format: "json",
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
        input,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should fail with invalid report type", async () => {
      // Arrange

      const input = {
        reportType: "invalid_type" as const,
        format: "json" as const,
        dateRange: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-31"),
        },
      };

      // Act
      const result = await generateReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input as unknown as GenerateReportInput,
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Invalid report type");
      }
    });
  });

  describe("scheduleReport", () => {
    it("should successfully schedule a daily report", async () => {
      // Arrange

      const input: ScheduleReportInput = {
        reportType: "usage",
        format: "json",
        frequency: "daily",
        recipients: ["admin@example.com", "manager@example.com"],
        filters: {
          includeInactive: false,
        },
      };

      // Act
      const result = await scheduleReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.reportType).toBe("usage");
        expect(result.value.frequency).toBe("daily");
        expect(result.value.recipients).toEqual([
          "admin@example.com",
          "manager@example.com",
        ]);
        expect(result.value.isActive).toBe(true);
        expect(result.value.createdBy).toBe(
          "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        );
        expect(result.value.nextRun).toBeInstanceOf(Date);
      }
    });

    it("should successfully schedule a weekly report", async () => {
      // Arrange

      const input: ScheduleReportInput = {
        reportType: "revenue",
        format: "csv",
        frequency: "weekly",
        recipients: ["finance@example.com"],
      };

      // Act
      const result = await scheduleReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.frequency).toBe("weekly");
        expect(result.value.recipients).toEqual(["finance@example.com"]);
        // Check that next run is approximately 7 days from now
        const now = new Date();
        const nextRun = result.value.nextRun;
        const daysDiff = Math.round(
          (nextRun.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBe(7);
      }
    });

    it("should successfully schedule a monthly report", async () => {
      // Arrange

      const input: ScheduleReportInput = {
        reportType: "comprehensive",
        format: "pdf",
        frequency: "monthly",
        recipients: ["ceo@example.com"],
      };

      // Act
      const result = await scheduleReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.frequency).toBe("monthly");
        expect(result.value.format).toBe("pdf");
      }
    });

    it("should successfully schedule a quarterly report", async () => {
      // Arrange

      const input: ScheduleReportInput = {
        reportType: "user_activity",
        format: "json",
        frequency: "quarterly",
        recipients: ["board@example.com"],
      };

      // Act
      const result = await scheduleReport(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
        input,
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.frequency).toBe("quarterly");
        // Check that next run is approximately 3 months from now
        const now = new Date();
        const nextRun = result.value.nextRun;
        const monthsDiff =
          (nextRun.getFullYear() - now.getFullYear()) * 12 +
          (nextRun.getMonth() - now.getMonth());
        expect(monthsDiff).toBe(3);
      }
    });

    it("should fail when user is not admin", async () => {
      // Arrange

      const input: ScheduleReportInput = {
        reportType: "usage",
        format: "json",
        frequency: "daily",
        recipients: ["admin@example.com"],
      };

      // Act
      const result = await scheduleReport(
        context,
        "851a534d-106c-4888-80f6-b39d493d4008",
        input,
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

  describe("generatePredictiveAnalytics", () => {
    it("should successfully generate predictive analytics", async () => {
      // Arrange

      // Act
      const result = await generatePredictiveAnalytics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const analytics = result.value;
        expect(analytics.userGrowthPrediction).toBeDefined();
        expect(analytics.userGrowthPrediction.nextMonth).toBeGreaterThan(0);
        expect(analytics.userGrowthPrediction.confidence).toBeGreaterThan(0);
        expect(analytics.userGrowthPrediction.confidence).toBeLessThanOrEqual(
          1,
        );

        expect(analytics.revenueForecast).toBeDefined();
        expect(analytics.revenueForecast.nextMonth).toBeGreaterThan(0);
        expect(analytics.revenueForecast.confidence).toBeGreaterThan(0);

        expect(analytics.churnRiskUsers).toBeDefined();
        expect(Array.isArray(analytics.churnRiskUsers)).toBe(true);

        expect(analytics.contentTrends).toBeDefined();
        expect(Array.isArray(analytics.contentTrends.trendingRegions)).toBe(
          true,
        );
        expect(Array.isArray(analytics.contentTrends.growingCategories)).toBe(
          true,
        );
        expect(Array.isArray(analytics.contentTrends.decliningSectors)).toBe(
          true,
        );
      }
    });

    it("should include churn risk users with proper structure", async () => {
      // Arrange

      // Act
      const result = await generatePredictiveAnalytics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const churnRiskUsers = result.value.churnRiskUsers;
        expect(churnRiskUsers.length).toBeGreaterThan(0);

        churnRiskUsers.forEach((user) => {
          expect(user.userId).toBeDefined();
          expect(user.userName).toBeDefined();
          expect(user.riskScore).toBeGreaterThan(0);
          expect(user.riskScore).toBeLessThanOrEqual(1);
          expect(Array.isArray(user.riskFactors)).toBe(true);
        });
      }
    });

    it("should fail when user is not admin", async () => {
      // Arrange

      // Act
      const result = await generatePredictiveAnalytics(
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

    it("should fail when analytics data is unavailable", async () => {
      // Arrange
      // Set up mock to fail analytics retrieval
      const subscriptionRepo =
        context.userSubscriptionRepository as MockUserSubscriptionRepository;
      subscriptionRepo.setShouldFailCountByStatus(true);

      // Act
      const result = await generatePredictiveAnalytics(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Failed to get analytics for prediction",
        );
      }
    });
  });

  describe("generateSystemAlerts", () => {
    it("should generate alerts for high churn rate", async () => {
      // Arrange
      // Set up mock data to trigger high churn rate alert
      const subscriptionRepo =
        context.userSubscriptionRepository as MockUserSubscriptionRepository;
      subscriptionRepo.setMockStatusCounts({
        active: 70, // 70% active
        trial: 10, // 10% trial
        expired: 5, // 5% expired
        cancelled: 15, // 15% cancelled (high churn)
        none: 900,
      });

      // Act
      const result = await generateSystemAlerts(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const alerts = result.value;
        expect(Array.isArray(alerts)).toBe(true);

        const churnAlert = alerts.find((alert) =>
          alert.title.includes("High Churn Rate"),
        );
        expect(churnAlert).toBeDefined();
        expect(churnAlert?.type).toBe("warning");
        const churnData = churnAlert?.data as ChurnAlertData;
        expect(churnData?.churnRate).toBe(15);
      }
    });

    it("should generate alerts for low user activity", async () => {
      // Arrange
      // Set up mock data for low user activity alert - this will be handled by the analytics functions

      // Act
      const result = await generateSystemAlerts(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const alerts = result.value;

        const activityAlert = alerts.find((alert) =>
          alert.title.includes("Low User Activity"),
        );
        expect(activityAlert).toBeDefined();
        expect(activityAlert?.type).toBe("critical");
        const activityData = activityAlert?.data as ActivityAlertData;
        expect(activityData?.activityRate).toBe(20);
      }
    });

    it("should generate alerts for low content engagement", async () => {
      // Arrange
      // Set up mock data for low content engagement alert - this will be handled by the analytics functions

      // Act
      const result = await generateSystemAlerts(
        context,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const alerts = result.value;

        const engagementAlert = alerts.find((alert) =>
          alert.title.includes("Low Content Engagement"),
        );
        expect(engagementAlert).toBeDefined();
        expect(engagementAlert?.type).toBe("info");
      }
    });

    it("should generate no alerts for healthy system", async () => {
      // Arrange
      // Set up mock data for healthy system (no alerts)
      const healthyContext = createMockContext();

      // Set up healthy subscription data
      const healthySubscriptionRepo =
        healthyContext.userSubscriptionRepository as MockUserSubscriptionRepository;
      healthySubscriptionRepo.setMockStatusCounts({
        active: 85, // 85% active
        trial: 10, // 10% trial
        expired: 2, // 2% expired
        cancelled: 3, // 3% cancelled (low churn)
        none: 900,
      });

      // Set up healthy user activity data (80% active users)
      const healthyUserRepo =
        healthyContext.userRepository as MockUserRepository;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Add healthy users (4 active out of 5 = 80% activity rate)
      for (let i = 0; i < 4; i++) {
        healthyUserRepo.addUser({
          id: `01234567-89ab-4def-9${i}23-456789abcde${i}`,
          email: `active${i}@example.com`,
          hashedPassword: "hashed-password",
          name: `Active User ${i}`,
          role: "visitor",
          status: "active",
          emailVerified: true,
          lastLoginAt: startOfMonth, // Active user (logged in this month)
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      healthyUserRepo.addUser({
        id: "01234567-89ab-4def-a123-456789abcdef",
        email: "inactive@example.com",
        hashedPassword: "hashed-password",
        name: "Inactive User",
        role: "visitor",
        status: "active",
        emailVerified: true,
        lastLoginAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Inactive user
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      healthyUserRepo.addUser(mockAdmin);

      // Set up healthy content engagement data (>= 20% engagement rate)
      const healthyCheckinRepo =
        healthyContext.checkinRepository as MockCheckinRepository;
      // Add 100 total checkins, 25 with photos = 25% engagement rate
      for (let i = 0; i < 25; i++) {
        healthyCheckinRepo.addTestCheckin({
          id: `checkin-with-photo-${i}`,
          userId: mockAdmin.id,
          placeId: "01234567-89ab-4def-1234-456789abcdef",
          comment: "Great place with photo!",
          rating: 5,
          photos: [
            {
              id: `photo-${i}`,
              checkinId: `checkin-with-photo-${i}`,
              url: `photo-${i}.jpg`,
              displayOrder: 0,
              createdAt: new Date(),
            },
          ],
          userName: "Admin User",
          placeName: "Test Place",
          placeRegionName: "Test Region",
          placeAddress: "Test Address",
          placeCoordinates: { latitude: 0, longitude: 0 },
          userLocation: { latitude: 0, longitude: 0 },
          status: "active",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      for (let i = 0; i < 75; i++) {
        healthyCheckinRepo.addTestCheckin({
          id: `checkin-no-photo-${i}`,
          userId: mockAdmin.id,
          placeId: "01234567-89ab-4def-1234-456789abcdef",
          comment: "Good place",
          rating: 4,
          photos: [],
          userName: "Admin User",
          placeName: "Test Place",
          placeRegionName: "Test Region",
          placeAddress: "Test Address",
          placeCoordinates: { latitude: 0, longitude: 0 },
          userLocation: { latitude: 0, longitude: 0 },
          status: "active",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Act
      const result = await generateSystemAlerts(
        healthyContext,
        "fd93fe9a-8178-4fff-a66c-59146ca00b69",
      );

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const alerts = result.value;
        expect(alerts.length).toBe(0);
      }
    });

    it("should fail when user is not admin", async () => {
      // Arrange

      // Act
      const result = await generateSystemAlerts(
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
});
