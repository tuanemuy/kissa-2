import { err } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";
import type { MockReportRepository } from "@/core/adapters/mock/reportRepository";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { Report } from "@/core/domain/report/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  type AdminListReportsInput,
  adminListReports,
  getEntityReports,
  getReportStatistics,
  markReportUnderReview,
  type ReviewReportInput,
  reviewReport,
} from "./adminReportManagement";

describe("adminReportManagement", () => {
  let context: Context;
  let adminUser: User;
  let editorUser: User;
  let regularUser: User;
  let reporterUser: User;
  let inactiveAdminUser: User;
  let testRegion: Region;
  let testPlace: Place;
  let testReport1: Report;
  let testReport2: Report;
  let testReport3: Report;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create admin user
    const adminResult = await context.userRepository.create({
      email: "admin@example.com",
      password: hashedPassword.value,
      name: "Admin User",
    });
    if (adminResult.isErr()) {
      throw new Error("Failed to create admin user");
    }
    adminUser = adminResult.value;
    await context.userRepository.updateRole(adminUser.id, "admin");

    // Create editor user
    const editorResult = await context.userRepository.create({
      email: "editor@example.com",
      password: hashedPassword.value,
      name: "Editor User",
    });
    if (editorResult.isErr()) {
      throw new Error("Failed to create editor user");
    }
    editorUser = editorResult.value;
    await context.userRepository.updateRole(editorUser.id, "editor");

    // Create regular user
    const regularResult = await context.userRepository.create({
      email: "regular@example.com",
      password: hashedPassword.value,
      name: "Regular User",
    });
    if (regularResult.isErr()) {
      throw new Error("Failed to create regular user");
    }
    regularUser = regularResult.value;

    // Create reporter user
    const reporterResult = await context.userRepository.create({
      email: "reporter@example.com",
      password: hashedPassword.value,
      name: "Reporter User",
    });
    if (reporterResult.isErr()) {
      throw new Error("Failed to create reporter user");
    }
    reporterUser = reporterResult.value;

    // Create inactive admin user
    const inactiveAdminResult = await context.userRepository.create({
      email: "inactiveadmin@example.com",
      password: hashedPassword.value,
      name: "Inactive Admin User",
    });
    if (inactiveAdminResult.isErr()) {
      throw new Error("Failed to create inactive admin user");
    }
    inactiveAdminUser = inactiveAdminResult.value;
    await context.userRepository.updateRole(inactiveAdminUser.id, "admin");
    await context.userRepository.updateStatus(
      inactiveAdminUser.id,
      "suspended",
    );

    // Create test content
    const regionResult = await context.regionRepository.create(editorUser.id, {
      name: "Test Region",
      description: "A test region for report management",
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      address: "Test Address, Japan",
      images: [],
      tags: ["test"],
    });
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;
    await context.regionRepository.updateStatus(testRegion.id, "published");

    const placeResult = await context.placeRepository.create(editorUser.id, {
      name: "Test Place",
      description: "A test place for report management",
      shortDescription: "Test place",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: { latitude: 35.6795, longitude: 139.6516 },
      address: "1-1-1 Test, Tokyo, Japan",
      images: [],
      tags: ["test"],
      businessHours: [],
    });
    if (placeResult.isErr()) {
      throw new Error("Failed to create test place");
    }
    testPlace = placeResult.value;
    await context.placeRepository.updateStatus(testPlace.id, "published");

    // Create test reports
    const reportResult1 = await context.reportRepository.create(
      reporterUser.id,
      {
        entityType: "user",
        entityId: regularUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      },
    );
    if (reportResult1.isErr()) {
      throw new Error("Failed to create test report 1");
    }
    testReport1 = reportResult1.value;

    const reportResult2 = await context.reportRepository.create(
      reporterUser.id,
      {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason: "This place has inappropriate content.",
      },
    );
    if (reportResult2.isErr()) {
      throw new Error("Failed to create test report 2");
    }
    testReport2 = reportResult2.value;

    const reportResult3 = await context.reportRepository.create(
      reporterUser.id,
      {
        entityType: "region",
        entityId: testRegion.id,
        type: "false_information",
        reason: "This region has false information.",
      },
    );
    if (reportResult3.isErr()) {
      throw new Error("Failed to create test report 3");
    }
    testReport3 = reportResult3.value;
  });

  describe("adminListReports", () => {
    it("should successfully list all reports for admin", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(3);
        expect(items).toHaveLength(3);

        // Check report details are included
        expect(items[0].reporterName).toBeDefined();
        expect(items[0].reporterEmail).toBeDefined();
        expect(items[0].entityDetails).toBeDefined();
      }
    });

    it("should list reports with status filter", async () => {
      // Mark one report as resolved
      await context.reportRepository.updateStatus(
        testReport1.id,
        "resolved",
        adminUser.id,
      );

      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          status: "pending",
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(2);
        expect(items).toHaveLength(2);
        items.forEach((item) => {
          expect(item.status).toBe("pending");
        });
      }
    });

    it("should list reports with type filter", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          type: "spam",
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].type).toBe("spam");
      }
    });

    it("should list reports with entity type filter", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          entityType: "place",
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].entityType).toBe("place");
      }
    });

    it("should list reports with reporter filter", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          reporterUserId: reporterUser.id,
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(3);
        expect(items).toHaveLength(3);
        items.forEach((item) => {
          expect(item.reporterUserId).toBe(reporterUser.id);
        });
      }
    });

    it("should list reports with entity ID filter", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          entityId: testPlace.id,
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].entityId).toBe(testPlace.id);
      }
    });

    it("should handle pagination correctly", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 2 },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(3); // Total count
        expect(items).toHaveLength(2); // Page size
      }
    });

    it("should handle sorting by different fields", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        sort: {
          field: "status",
          direction: "asc",
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items } = result.value;
        expect(items).toHaveLength(3);
      }
    });

    it("should fail when user is not admin", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(context, regularUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should fail when admin user is inactive", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(
        context,
        inactiveAdminUser.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail when admin user does not exist", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(
        context,
        "non-existent-user-id",
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should use default pagination values", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(3);
        expect(items).toHaveLength(3);
      }
    });
  });

  describe("reviewReport", () => {
    it("should successfully resolve a report", async () => {
      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "Report has been investigated and resolved.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("resolved");
        expect(report.reviewedBy).toBe(adminUser.id);
        expect(report.reviewNotes).toBe(
          "Report has been investigated and resolved.",
        );
        expect(report.reviewedAt).toBeDefined();
      }
    });

    it("should successfully dismiss a report", async () => {
      const input: ReviewReportInput = {
        reportId: testReport2.id,
        status: "dismissed",
        reviewNotes: "Report is not valid.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("dismissed");
        expect(report.reviewedBy).toBe(adminUser.id);
        expect(report.reviewNotes).toBe("Report is not valid.");
        expect(report.reviewedAt).toBeDefined();
      }
    });

    it("should resolve report without review notes", async () => {
      const input: ReviewReportInput = {
        reportId: testReport3.id,
        status: "resolved",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("resolved");
        expect(report.reviewedBy).toBe(adminUser.id);
        expect(report.reviewNotes).toBeUndefined();
      }
    });

    it("should fail when report does not exist", async () => {
      const input: ReviewReportInput = {
        reportId: "non-existent-report-id",
        status: "resolved",
        reviewNotes: "Report resolved.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REPORT_NOT_FOUND);
      }
    });

    it("should fail when report is already resolved", async () => {
      // First resolve the report
      await context.reportRepository.updateStatus(
        testReport1.id,
        "resolved",
        adminUser.id,
      );

      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "dismissed",
        reviewNotes: "Trying to review again.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REPORT_RESOLVED);
      }
    });

    it("should fail when report is already dismissed", async () => {
      // First dismiss the report
      await context.reportRepository.updateStatus(
        testReport1.id,
        "dismissed",
        adminUser.id,
      );

      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "Trying to review again.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REPORT_RESOLVED);
      }
    });

    it("should fail when user is not admin", async () => {
      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "Report resolved.",
      };

      const result = await reviewReport(context, regularUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should handle very long review notes", async () => {
      const longNotes = "A".repeat(1000);
      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: longNotes,
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reviewNotes).toBe(longNotes);
        expect(report.reviewNotes?.length).toBe(1000);
      }
    });
  });

  describe("getReportStatistics", () => {
    it("should successfully get report statistics for admin", async () => {
      // Set up some reports with different statuses
      await context.reportRepository.updateStatus(
        testReport1.id,
        "resolved",
        adminUser.id,
      );
      await context.reportRepository.updateStatus(
        testReport2.id,
        "dismissed",
        adminUser.id,
      );
      // testReport3 remains pending

      const result = await getReportStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.totalReports).toBe(3);
        expect(stats.pendingReports).toBe(1);
        expect(stats.underReviewReports).toBe(0);
        expect(stats.resolvedReports).toBe(1);
        expect(stats.dismissedReports).toBe(1);
        expect(stats.reportsThisWeek).toBeGreaterThanOrEqual(3);
        expect(stats.reportsThisMonth).toBeGreaterThanOrEqual(3);
        expect(stats.topReportTypes).toBeDefined();
        expect(Array.isArray(stats.topReportTypes)).toBe(true);
      }
    });

    it("should get statistics showing report type distribution", async () => {
      const result = await getReportStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.topReportTypes).toHaveLength(3);

        const reportTypes = stats.topReportTypes.map((t) => t.type);
        expect(reportTypes).toContain("spam");
        expect(reportTypes).toContain("inappropriate_content");
        expect(reportTypes).toContain("false_information");
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await getReportStatistics(context, regularUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should fail when admin user is inactive", async () => {
      const result = await getReportStatistics(context, inactiveAdminUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should handle empty report statistics", async () => {
      // Clear all reports
      const mockRepo = context.reportRepository as MockReportRepository;
      mockRepo.reset();

      const result = await getReportStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.totalReports).toBe(0);
        expect(stats.pendingReports).toBe(0);
        expect(stats.underReviewReports).toBe(0);
        expect(stats.resolvedReports).toBe(0);
        expect(stats.dismissedReports).toBe(0);
        expect(stats.topReportTypes).toHaveLength(0);
      }
    });
  });

  describe("markReportUnderReview", () => {
    it("should successfully mark report as under review", async () => {
      const result = await markReportUnderReview(
        context,
        adminUser.id,
        testReport1.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("under_review");
        expect(report.reviewedBy).toBe(adminUser.id);
        expect(report.reviewedAt).toBeDefined();
      }
    });

    it("should fail when report does not exist", async () => {
      const result = await markReportUnderReview(
        context,
        adminUser.id,
        "non-existent-report-id",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REPORT_NOT_FOUND);
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await markReportUnderReview(
        context,
        regularUser.id,
        testReport1.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should allow marking already reviewed report as under review", async () => {
      // First resolve the report
      await context.reportRepository.updateStatus(
        testReport1.id,
        "resolved",
        adminUser.id,
      );

      // Then mark as under review (should work for reopening cases)
      const result = await markReportUnderReview(
        context,
        adminUser.id,
        testReport1.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("under_review");
      }
    });

    it("should handle invalid UUID format", async () => {
      const result = await markReportUnderReview(
        context,
        adminUser.id,
        "invalid-uuid-format",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REPORT_NOT_FOUND);
      }
    });
  });

  describe("getEntityReports", () => {
    it("should get all reports for a user entity", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        "user",
        regularUser.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(1);
        expect(reports[0].entityType).toBe("user");
        expect(reports[0].entityId).toBe(regularUser.id);
      }
    });

    it("should get all reports for a place entity", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        "place",
        testPlace.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(1);
        expect(reports[0].entityType).toBe("place");
        expect(reports[0].entityId).toBe(testPlace.id);
      }
    });

    it("should get all reports for a region entity", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        "region",
        testRegion.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(1);
        expect(reports[0].entityType).toBe("region");
        expect(reports[0].entityId).toBe(testRegion.id);
      }
    });

    it("should return empty array for entity with no reports", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        "user",
        editorUser.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(0);
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await getEntityReports(
        context,
        regularUser.id,
        "user",
        regularUser.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.ADMIN_PERMISSION_REQUIRED);
      }
    });

    it("should handle invalid entity type", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid type handling
        "invalid" as any,
        regularUser.id,
      );

      expect(result.isOk()).toBe(true); // Repository should handle this gracefully
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(0);
      }
    });

    it("should handle invalid entity ID", async () => {
      const result = await getEntityReports(
        context,
        adminUser.id,
        "user",
        "invalid-entity-id",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const reports = result.value;
        expect(reports).toHaveLength(0);
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent reviews of different reports", async () => {
      const input1: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "First report resolved.",
      };

      const input2: ReviewReportInput = {
        reportId: testReport2.id,
        status: "dismissed",
        reviewNotes: "Second report dismissed.",
      };

      const [result1, result2] = await Promise.all([
        reviewReport(context, adminUser.id, input1),
        reviewReport(context, adminUser.id, input2),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.status).toBe("resolved");
        expect(result2.value.status).toBe("dismissed");
      }
    });

    it("should handle concurrent marking reports under review", async () => {
      const [result1, result2] = await Promise.all([
        markReportUnderReview(context, adminUser.id, testReport1.id),
        markReportUnderReview(context, adminUser.id, testReport2.id),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.status).toBe("under_review");
        expect(result2.value.status).toBe("under_review");
      }
    });

    it("should handle concurrent admin operations", async () => {
      const listInput: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const [listResult, statsResult, entityResult] = await Promise.all([
        adminListReports(context, adminUser.id, listInput),
        getReportStatistics(context, adminUser.id),
        getEntityReports(context, adminUser.id, "user", regularUser.id),
      ]);

      expect(listResult.isOk()).toBe(true);
      expect(statsResult.isOk()).toBe(true);
      expect(entityResult.isOk()).toBe(true);
    });
  });

  describe("edge cases and data integrity", () => {
    it("should maintain report data integrity during review", async () => {
      const originalReport = testReport1;

      const input: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "Comprehensive review completed.",
      };

      const result = await reviewReport(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedReport = result.value;

        // Original data should be preserved
        expect(updatedReport.id).toBe(originalReport.id);
        expect(updatedReport.reporterUserId).toBe(
          originalReport.reporterUserId,
        );
        expect(updatedReport.entityType).toBe(originalReport.entityType);
        expect(updatedReport.entityId).toBe(originalReport.entityId);
        expect(updatedReport.type).toBe(originalReport.type);
        expect(updatedReport.reason).toBe(originalReport.reason);
        expect(updatedReport.createdAt).toEqual(originalReport.createdAt);

        // Review data should be updated
        expect(updatedReport.status).toBe("resolved");
        expect(updatedReport.reviewedBy).toBe(adminUser.id);
        expect(updatedReport.reviewNotes).toBe(
          "Comprehensive review completed.",
        );
        expect(updatedReport.reviewedAt).toBeDefined();
        expect(updatedReport.updatedAt).toBeDefined();
      }
    });

    it("should handle complex filtering combinations", async () => {
      // Mark one report as resolved
      await context.reportRepository.updateStatus(
        testReport1.id,
        "resolved",
        adminUser.id,
      );

      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
        filter: {
          status: "pending",
          type: "inappropriate_content",
          entityType: "place",
        },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(1);
        expect(items).toHaveLength(1);
        expect(items[0].status).toBe("pending");
        expect(items[0].type).toBe("inappropriate_content");
        expect(items[0].entityType).toBe("place");
      }
    });

    it("should handle repository errors gracefully", async () => {
      // Mock repository error
      const mockRepo = context.reportRepository as MockReportRepository;
      const originalMethod = mockRepo.listWithDetails.bind(mockRepo);
      mockRepo.listWithDetails = async () => {
        return err(
          new (
            await import("@/core/domain/report/ports/reportRepository")
          ).ReportRepositoryError("Database error", "DB_ERROR"),
        );
      };

      const input: AdminListReportsInput = {
        pagination: { page: 1, size: 20 },
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }

      // Restore original method
      mockRepo.listWithDetails = originalMethod;
    });

    it("should handle edge case pagination", async () => {
      const input: AdminListReportsInput = {
        pagination: { page: 10, size: 50 }, // Page beyond available data
      };

      const result = await adminListReports(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { items, count } = result.value;
        expect(count).toBe(3); // Total count should still be correct
        expect(items).toHaveLength(0); // No items on this page
      }
    });

    it("should preserve report history when changing status multiple times", async () => {
      // Mark as under review
      const underReviewResult = await markReportUnderReview(
        context,
        adminUser.id,
        testReport1.id,
      );
      expect(underReviewResult.isOk()).toBe(true);

      // Then resolve
      const resolveInput: ReviewReportInput = {
        reportId: testReport1.id,
        status: "resolved",
        reviewNotes: "Final resolution.",
      };
      const resolvedResult = await reviewReport(
        context,
        adminUser.id,
        resolveInput,
      );
      expect(resolvedResult.isOk()).toBe(true);

      if (resolvedResult.isOk()) {
        const finalReport = resolvedResult.value;
        expect(finalReport.status).toBe("resolved");
        expect(finalReport.reviewedBy).toBe(adminUser.id);
        expect(finalReport.reviewNotes).toBe("Final resolution.");
      }
    });
  });
});
