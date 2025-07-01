import { err } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";
import type { MockReportRepository } from "@/core/adapters/mock/reportRepository";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreateReportInput, createReport } from "./createReport";

describe("createReport", () => {
  let context: Context;
  let reporterUser: User;
  let inactiveUser: User;
  let ownerUser: User;
  let testRegion: Region;
  let testPlace: Place;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create reporter user (active)
    const reporterResult = await context.userRepository.create({
      email: "reporter@example.com",
      password: hashedPassword.value,
      name: "Reporter User",
    });
    if (reporterResult.isErr()) {
      throw new Error("Failed to create reporter user");
    }
    reporterUser = reporterResult.value;

    // Create inactive user
    const inactiveResult = await context.userRepository.create({
      email: "inactive@example.com",
      password: hashedPassword.value,
      name: "Inactive User",
    });
    if (inactiveResult.isErr()) {
      throw new Error("Failed to create inactive user");
    }
    inactiveUser = inactiveResult.value;
    await context.userRepository.updateStatus(inactiveUser.id, "suspended");

    // Create owner user (for content creation)
    const ownerResult = await context.userRepository.create({
      email: "owner@example.com",
      password: hashedPassword.value,
      name: "Owner User",
    });
    if (ownerResult.isErr()) {
      throw new Error("Failed to create owner user");
    }
    ownerUser = ownerResult.value;
    await context.userRepository.updateRole(ownerUser.id, "editor");

    // Create test region
    const regionResult = await context.regionRepository.create(ownerUser.id, {
      name: "Test Region",
      description: "A test region for reporting",
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

    // Create test place
    const placeResult = await context.placeRepository.create(ownerUser.id, {
      name: "Test Place",
      description: "A test place for reporting",
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
  });

  describe("successful report creation", () => {
    it("should create a spam report for a user", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content repeatedly.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reporterUserId).toBe(reporterUser.id);
        expect(report.entityType).toBe("user");
        expect(report.entityId).toBe(ownerUser.id);
        expect(report.type).toBe("spam");
        expect(report.reason).toBe(
          "This user is posting spam content repeatedly.",
        );
        expect(report.status).toBe("pending");
        expect(report.id).toBeDefined();
        expect(report.createdAt).toBeDefined();
        expect(report.updatedAt).toBeDefined();
      }
    });

    it("should create an inappropriate content report for a place", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason: "This place contains inappropriate images and descriptions.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.entityType).toBe("place");
        expect(report.entityId).toBe(testPlace.id);
        expect(report.type).toBe("inappropriate_content");
        expect(report.reason).toBe(
          "This place contains inappropriate images and descriptions.",
        );
      }
    });

    it("should create a harassment report for a region", async () => {
      const input: CreateReportInput = {
        entityType: "region",
        entityId: testRegion.id,
        type: "harassment",
        reason: "Inappropriate content",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.entityType).toBe("region");
        expect(report.entityId).toBe(testRegion.id);
        expect(report.type).toBe("harassment");
      }
    });

    it("should create a false information report", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "false_information",
        reason: "False information found in this place",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.type).toBe("false_information");
      }
    });

    it("should create a copyright violation report", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "copyright_violation",
        reason: "Copyright violation detected in this content",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.type).toBe("copyright_violation");
      }
    });

    it("should create an other type report with detailed reason", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "other",
        reason:
          "This user is violating community guidelines and needs attention",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.type).toBe("other");
        expect(report.reason).toContain("violating community guidelines");
      }
    });

    it("should handle minimum valid reason length", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "Spam user.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reason).toBe("Spam user.");
      }
    });

    it("should handle maximum valid reason length", async () => {
      const longReason = "A".repeat(1000);
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: longReason,
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reason).toBe(longReason);
        expect(report.reason.length).toBe(1000);
      }
    });
  });

  describe("user validation failures", () => {
    it("should fail when reporter user does not exist", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, "non-existent-user-id", input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when reporter user is inactive", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, inactiveUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail when reporter user is suspended", async () => {
      await context.userRepository.updateStatus(reporterUser.id, "suspended");

      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });
  });

  describe("entity validation failures", () => {
    it("should fail when reporting non-existent user", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: "non-existent-user-id",
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });

    it("should fail when reporting non-existent place", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: "non-existent-place-id",
        type: "inappropriate_content",
        reason: "This place has inappropriate content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });

    it("should fail when reporting non-existent region", async () => {
      const input: CreateReportInput = {
        entityType: "region",
        entityId: "non-existent-region-id",
        type: "false_information",
        reason: "This region has false information.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });

    it("should fail when reporting non-existent checkin", async () => {
      const input: CreateReportInput = {
        entityType: "checkin",
        entityId: "non-existent-checkin-id",
        type: "inappropriate_content",
        reason: "This checkin has inappropriate content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });
  });

  describe("own content validation", () => {
    it("should fail when user tries to report themselves", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: reporterUser.id,
        type: "spam",
        reason: "Reporting myself for testing purposes.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CANNOT_REPORT_OWN_CONTENT);
      }
    });

    it("should fail when user tries to report their own place", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason: "This place has issues.",
      };

      const result = await createReport(context, ownerUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CANNOT_REPORT_OWN_CONTENT);
      }
    });

    it("should fail when user tries to report their own region", async () => {
      const input: CreateReportInput = {
        entityType: "region",
        entityId: testRegion.id,
        type: "false_information",
        reason: "This region has false information.",
      };

      const result = await createReport(context, ownerUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CANNOT_REPORT_OWN_CONTENT);
      }
    });
  });

  describe("duplicate report validation", () => {
    it("should fail when user tries to report the same entity twice", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      // First report should succeed
      const firstResult = await createReport(context, reporterUser.id, input);
      expect(firstResult.isOk()).toBe(true);

      // Second report should fail
      const secondResult = await createReport(context, reporterUser.id, input);
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.code).toBe(ERROR_CODES.REPORT_ALREADY_EXISTS);
      }
    });

    it("should fail when user tries to report same entity with different reason", async () => {
      const firstInput: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "spam",
        reason: "This place is spam.",
      };

      const secondInput: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason: "This place has inappropriate content.",
      };

      // First report
      const firstResult = await createReport(
        context,
        reporterUser.id,
        firstInput,
      );
      expect(firstResult.isOk()).toBe(true);

      // Second report with different type/reason should still fail
      const secondResult = await createReport(
        context,
        reporterUser.id,
        secondInput,
      );
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.code).toBe(ERROR_CODES.REPORT_ALREADY_EXISTS);
      }
    });

    it("should allow different users to report the same entity", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      // Create another reporter user
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const anotherReporterResult = await context.userRepository.create({
        email: "reporter2@example.com",
        password: hashedPassword.value,
        name: "Another Reporter",
      });
      expect(anotherReporterResult.isOk()).toBe(true);

      if (anotherReporterResult.isOk()) {
        const anotherReporter = anotherReporterResult.value;

        // Both reports should succeed
        const firstResult = await createReport(context, reporterUser.id, input);
        expect(firstResult.isOk()).toBe(true);

        const secondResult = await createReport(
          context,
          anotherReporter.id,
          input,
        );
        expect(secondResult.isOk()).toBe(true);
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle reports with special characters in reason", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "other",
        reason: "Special chars: éñü@#$%^&*(){}[]|\\:;\"'<>?/.,`~±§!",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reason).toContain("Special chars:");
      }
    });

    it("should handle reports with unicode characters in reason", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "harassment",
        reason: "この ユーザーは 不適切な コンテンツを 投稿しています。🚫📱💻",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reason).toContain("ユーザーは");
      }
    });

    it("should handle reports with line breaks in reason", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason:
          "This place has multiple issues:\n1. Inappropriate content in images\n2. Misleading description\n3. False location information",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reason).toContain("multiple issues:");
        expect(report.reason).toContain("1. Inappropriate");
      }
    });

    it("should handle invalid UUID format for entity ID", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: "invalid-uuid-format",
        type: "spam",
        reason: "This user is posting spam content.",
      };

      // This should be caught by input validation before reaching the service
      // But testing how the service handles it
      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });

    it("should handle very long entity IDs", async () => {
      const longEntityId = "a".repeat(100);
      const input: CreateReportInput = {
        entityType: "user",
        entityId: longEntityId,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.NOT_FOUND);
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent reports by same user to different entities", async () => {
      const input1: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const input2: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "inappropriate_content",
        reason: "This place has inappropriate content.",
      };

      const [result1, result2] = await Promise.all([
        createReport(context, reporterUser.id, input1),
        createReport(context, reporterUser.id, input2),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.entityId).toBe(ownerUser.id);
        expect(result2.value.entityId).toBe(testPlace.id);
      }
    });

    it("should handle concurrent reports by different users to same entity", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      // Create another reporter
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const anotherReporterResult = await context.userRepository.create({
        email: "reporter3@example.com",
        password: hashedPassword.value,
        name: "Third Reporter",
      });
      expect(anotherReporterResult.isOk()).toBe(true);

      if (anotherReporterResult.isOk()) {
        const anotherReporter = anotherReporterResult.value;

        const [result1, result2] = await Promise.all([
          createReport(context, reporterUser.id, input),
          createReport(context, anotherReporter.id, input),
        ]);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        if (result1.isOk() && result2.isOk()) {
          expect(result1.value.reporterUserId).toBe(reporterUser.id);
          expect(result2.value.reporterUserId).toBe(anotherReporter.id);
          expect(result1.value.entityId).toBe(result2.value.entityId);
        }
      }
    });

    it("should handle concurrent duplicate reports by same user", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const [result1, result2] = await Promise.all([
        createReport(context, reporterUser.id, input),
        createReport(context, reporterUser.id, input),
      ]);

      // One should succeed, one should fail with duplicate error
      const successCount = [result1, result2].filter((r) => r.isOk()).length;
      const errorResults = [result1, result2].filter((r) => r.isErr());

      expect(successCount).toBe(1);
      expect(errorResults).toHaveLength(1);

      if (errorResults.length > 0 && errorResults[0].isErr()) {
        expect(errorResults[0].error.code).toBe(
          ERROR_CODES.REPORT_ALREADY_EXISTS,
        );
      }
    });
  });

  describe("data integrity", () => {
    it("should set correct default values", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.status).toBe("pending");
        expect(report.reviewedBy).toBeUndefined();
        expect(report.reviewedAt).toBeUndefined();
        expect(report.reviewNotes).toBeUndefined();
        expect(report.createdAt).toBeInstanceOf(Date);
        expect(report.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should generate unique report IDs", async () => {
      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      // Create multiple reports by different users
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const reporter2Result = await context.userRepository.create({
        email: "reporter2@example.com",
        password: hashedPassword.value,
        name: "Reporter 2",
      });
      expect(reporter2Result.isOk()).toBe(true);

      if (reporter2Result.isOk()) {
        const reporter2 = reporter2Result.value;

        const result1 = await createReport(context, reporterUser.id, input);
        const result2 = await createReport(context, reporter2.id, input);

        expect(result1.isOk()).toBe(true);
        expect(result2.isOk()).toBe(true);

        if (result1.isOk() && result2.isOk()) {
          expect(result1.value.id).not.toBe(result2.value.id);
          expect(result1.value.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );
          expect(result2.value.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          );
        }
      }
    });

    it("should preserve exact input data", async () => {
      const input: CreateReportInput = {
        entityType: "place",
        entityId: testPlace.id,
        type: "copyright_violation",
        reason: "Exact input data preservation test with copyright violation",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const report = result.value;
        expect(report.reporterUserId).toBe(reporterUser.id);
        expect(report.entityType).toBe(input.entityType);
        expect(report.entityId).toBe(input.entityId);
        expect(report.type).toBe(input.type);
        expect(report.reason).toBe(input.reason);
      }
    });

    it("should handle repository errors gracefully", async () => {
      // This test would require mocking repository failures
      // For now, we'll test with a known failure condition
      const mockRepo = context.reportRepository as MockReportRepository;

      // Override the create method to simulate failure
      const originalCreate = mockRepo.create.bind(mockRepo);
      mockRepo.create = async () => {
        return err(
          new (
            await import("@/core/domain/report/ports/reportRepository")
          ).ReportRepositoryError("Database error", "DB_ERROR"),
        );
      };

      const input: CreateReportInput = {
        entityType: "user",
        entityId: ownerUser.id,
        type: "spam",
        reason: "This user is posting spam content.",
      };

      const result = await createReport(context, reporterUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }

      // Restore original method
      mockRepo.create = originalCreate;
    });
  });

  describe("all entity types", () => {
    it("should support all valid entity types", async () => {
      const entityTypes = ["user", "place", "region", "checkin"] as const;
      const reportTypes = [
        "spam",
        "inappropriate_content",
        "harassment",
        "false_information",
        "copyright_violation",
        "other",
      ] as const;

      let iterationCount = 0;
      for (const entityType of entityTypes) {
        for (const reportType of reportTypes) {
          if (entityType === "checkin") {
            // Skip checkin tests as we don't have a test checkin created
            continue;
          }

          // Reset for iteration (except first one)
          if (iterationCount > 0) {
            resetMockContext(context);
          }

          // Recreate test data for iteration with unique emails to avoid conflicts
          iterationCount++;

          // Create reporter user
          const reporterResult = await context.userRepository.create({
            email: `reporter${iterationCount}@example.com`,
            password: "hashedPassword123",
            name: "Reporter User",
          });
          if (reporterResult.isOk()) {
            reporterUser = reporterResult.value;
          }

          // Create owner user
          const ownerResult = await context.userRepository.create({
            email: `owner${iterationCount}@example.com`,
            password: "hashedPassword123",
            name: "Owner User",
          });
          if (ownerResult.isOk()) {
            ownerUser = ownerResult.value;
            await context.userRepository.updateRole(ownerUser.id, "editor");
          }

          // Create region and place if needed
          if (entityType === "place" || entityType === "region") {
            const regionResult = await context.regionRepository.create(
              ownerUser.id,
              {
                name: "Test Region",
                description: "A test region",
                coordinates: { latitude: 35.6762, longitude: 139.6503 },
                images: [],
                tags: ["test"],
              },
            );
            if (regionResult.isOk()) {
              testRegion = regionResult.value;
              await context.regionRepository.updateStatus(
                testRegion.id,
                "published",
              );
            }

            if (entityType === "place") {
              const placeResult = await context.placeRepository.create(
                ownerUser.id,
                {
                  name: "Test Place",
                  description: "A test place",
                  shortDescription: "Test place",
                  category: "restaurant",
                  regionId: testRegion.id,
                  coordinates: { latitude: 35.6795, longitude: 139.6516 },
                  address: "1-1-1 Test",
                  images: [],
                  tags: ["test"],
                  businessHours: [],
                },
              );
              if (placeResult.isOk()) {
                testPlace = placeResult.value;
                await context.placeRepository.updateStatus(
                  testPlace.id,
                  "published",
                );
              }
            }
          }

          // Determine entity ID based on type
          let entityId: string;
          switch (entityType) {
            case "user":
              entityId = ownerUser.id;
              break;
            case "place":
              entityId = testPlace.id;
              break;
            case "region":
              entityId = testRegion.id;
              break;
            default:
              continue;
          }

          const input: CreateReportInput = {
            entityType,
            entityId,
            type: reportType,
            reason: `Testing ${reportType} report for ${entityType}`,
          };

          const result = await createReport(context, reporterUser.id, input);

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            const report = result.value;
            expect(report.entityType).toBe(entityType);
            expect(report.type).toBe(reportType);
          }
        }
      }
    });
  });
});
