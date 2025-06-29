import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  adminDeletePlace,
  adminDeleteRegion,
  adminUpdatePlaceStatus,
  adminUpdateRegionStatus,
  getContentStatistics,
  type UpdatePlaceStatusInput,
  type UpdateRegionStatusInput,
} from "./contentManagement";

describe("contentManagement", () => {
  let context: Context;
  let adminUser: User;
  let editorUser: User;
  let regularUser: User;
  let inactiveAdminUser: User;
  let testRegion1: Region;
  let testRegion2: Region;
  let emptyRegion: Region;
  let testPlace1: Place;
  let testPlace2: Place;
  let testPlace3: Place;

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

    // Create test regions
    const region1Result = await context.regionRepository.create(editorUser.id, {
      name: "Tokyo Region",
      description: "Metropolitan area of Tokyo",
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      address: "Tokyo, Japan",
      images: [],
      tags: ["urban"],
    });
    if (region1Result.isErr()) {
      throw new Error("Failed to create region 1");
    }
    testRegion1 = region1Result.value;
    await context.regionRepository.updateStatus(testRegion1.id, "published");

    const region2Result = await context.regionRepository.create(editorUser.id, {
      name: "Osaka Region",
      description: "Food capital of Japan",
      coordinates: { latitude: 34.6937, longitude: 135.5023 },
      address: "Osaka, Japan",
      images: [],
      tags: ["food"],
    });
    if (region2Result.isErr()) {
      throw new Error("Failed to create region 2");
    }
    testRegion2 = region2Result.value;
    // Leave as draft

    const emptyRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Empty Region",
        description: "Region with no places",
        coordinates: { latitude: 36.0, longitude: 140.0 },
        address: "Empty Region, Japan",
        images: [],
        tags: ["empty"],
      },
    );
    if (emptyRegionResult.isErr()) {
      throw new Error("Failed to create empty region");
    }
    emptyRegion = emptyRegionResult.value;

    // Create test places
    const place1Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Restaurant",
      description: "Fine dining in Tokyo",
      shortDescription: "Fine dining",
      category: "restaurant",
      regionId: testRegion1.id,
      coordinates: { latitude: 35.6795, longitude: 139.6516 },
      address: "1-1-1 Shibuya, Tokyo",
      images: [],
      tags: ["restaurant"],
      businessHours: [],
    });
    if (place1Result.isErr()) {
      throw new Error("Failed to create place 1");
    }
    testPlace1 = place1Result.value;
    await context.placeRepository.updateStatus(testPlace1.id, "published");

    const place2Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Cafe",
      description: "Cozy cafe in Tokyo",
      shortDescription: "Cozy cafe",
      category: "cafe",
      regionId: testRegion1.id,
      coordinates: { latitude: 35.68, longitude: 139.652 },
      address: "2-2-2 Harajuku, Tokyo",
      images: [],
      tags: ["cafe"],
      businessHours: [],
    });
    if (place2Result.isErr()) {
      throw new Error("Failed to create place 2");
    }
    testPlace2 = place2Result.value;
    // Leave as draft

    const place3Result = await context.placeRepository.create(editorUser.id, {
      name: "Osaka Restaurant",
      description: "Traditional restaurant in Osaka",
      shortDescription: "Traditional food",
      category: "restaurant",
      regionId: testRegion2.id,
      coordinates: { latitude: 34.695, longitude: 135.504 },
      address: "3-3-3 Namba, Osaka",
      images: [],
      tags: ["restaurant", "traditional"],
      businessHours: [],
    });
    if (place3Result.isErr()) {
      throw new Error("Failed to create place 3");
    }
    testPlace3 = place3Result.value;
    await context.placeRepository.updateStatus(testPlace3.id, "archived");
  });

  describe("adminUpdatePlaceStatus", () => {
    it("should successfully update place status to published", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace2.id,
        status: "published",
        reason: "Place meets publication standards",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("published");
        expect(updatedPlace.id).toBe(testPlace2.id);
      }
    });

    it("should successfully update place status to archived", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "archived",
        reason: "Place is no longer active",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("archived");
        expect(updatedPlace.id).toBe(testPlace1.id);
      }
    });

    it("should successfully update place status to draft", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace3.id,
        status: "draft",
        reason: "Place needs revision",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("draft");
      }
    });

    it("should successfully update place status without reason", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace2.id,
        status: "published",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("published");
      }
    });

    it("should fail when place does not exist", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: "non-existent-place-id",
        status: "published",
        reason: "Trying to update non-existent place",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Place not found");
      }
    });

    it("should fail when user is not admin", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: "Editor trying to update status",
      };

      const result = await adminUpdatePlaceStatus(
        context,
        editorUser.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should fail when admin user is inactive", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: "Inactive admin trying to update",
      };

      const result = await adminUpdatePlaceStatus(
        context,
        inactiveAdminUser.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin account is not active");
      }
    });

    it("should fail when admin user does not exist", async () => {
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: "Non-existent admin",
      };

      const result = await adminUpdatePlaceStatus(
        context,
        "non-existent-admin-id",
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin user not found");
      }
    });

    it("should handle all valid status transitions", async () => {
      const statuses = ["draft", "published", "archived"] as const;

      for (const status of statuses) {
        const input: UpdatePlaceStatusInput = {
          placeId: testPlace1.id,
          status,
          reason: `Setting status to ${status}`,
        };

        const result = await adminUpdatePlaceStatus(
          context,
          adminUser.id,
          input,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedPlace = result.value;
          expect(updatedPlace.status).toBe(status);
        }
      }
    });

    it("should handle status update with maximum reason length", async () => {
      const longReason = "A".repeat(500);
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: longReason,
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("published");
      }
    });
  });

  describe("adminUpdateRegionStatus", () => {
    it("should successfully update region status to published", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: testRegion2.id,
        status: "published",
        reason: "Region meets publication standards",
      };

      const result = await adminUpdateRegionStatus(
        context,
        adminUser.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedRegion = result.value;
        expect(updatedRegion.status).toBe("published");
        expect(updatedRegion.id).toBe(testRegion2.id);
      }
    });

    it("should successfully update region status to archived", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: testRegion1.id,
        status: "archived",
        reason: "Region is no longer active",
      };

      const result = await adminUpdateRegionStatus(
        context,
        adminUser.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedRegion = result.value;
        expect(updatedRegion.status).toBe("archived");
      }
    });

    it("should successfully update region status to draft", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: testRegion1.id,
        status: "draft",
        reason: "Region needs revision",
      };

      const result = await adminUpdateRegionStatus(
        context,
        adminUser.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedRegion = result.value;
        expect(updatedRegion.status).toBe("draft");
      }
    });

    it("should successfully update region status without reason", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: testRegion2.id,
        status: "published",
      };

      const result = await adminUpdateRegionStatus(
        context,
        adminUser.id,
        input,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedRegion = result.value;
        expect(updatedRegion.status).toBe("published");
      }
    });

    it("should fail when region does not exist", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: "non-existent-region-id",
        status: "published",
        reason: "Trying to update non-existent region",
      };

      const result = await adminUpdateRegionStatus(
        context,
        adminUser.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Region not found");
      }
    });

    it("should fail when user is not admin", async () => {
      const input: UpdateRegionStatusInput = {
        regionId: testRegion1.id,
        status: "published",
        reason: "Editor trying to update status",
      };

      const result = await adminUpdateRegionStatus(
        context,
        editorUser.id,
        input,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should handle all valid status transitions", async () => {
      const statuses = ["draft", "published", "archived"] as const;

      for (const status of statuses) {
        const input: UpdateRegionStatusInput = {
          regionId: testRegion1.id,
          status,
          reason: `Setting status to ${status}`,
        };

        const result = await adminUpdateRegionStatus(
          context,
          adminUser.id,
          input,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const updatedRegion = result.value;
          expect(updatedRegion.status).toBe(status);
        }
      }
    });
  });

  describe("adminDeletePlace", () => {
    it("should successfully delete a place", async () => {
      const result = await adminDeletePlace(
        context,
        adminUser.id,
        testPlace1.id,
        "Place is no longer relevant",
      );

      expect(result.isOk()).toBe(true);

      // Verify place is deleted
      const findResult = await context.placeRepository.findById(testPlace1.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should successfully delete place without reason", async () => {
      const result = await adminDeletePlace(
        context,
        adminUser.id,
        testPlace2.id,
      );

      expect(result.isOk()).toBe(true);

      // Verify place is deleted
      const findResult = await context.placeRepository.findById(testPlace2.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should fail when place does not exist", async () => {
      const result = await adminDeletePlace(
        context,
        adminUser.id,
        "non-existent-place-id",
        "Trying to delete non-existent place",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Place not found");
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await adminDeletePlace(
        context,
        editorUser.id,
        testPlace1.id,
        "Editor trying to delete",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should fail when admin user is inactive", async () => {
      const result = await adminDeletePlace(
        context,
        inactiveAdminUser.id,
        testPlace1.id,
        "Inactive admin trying to delete",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin account is not active");
      }
    });

    it("should handle deletion of places with different statuses", async () => {
      // Delete published place
      const publishedResult = await adminDeletePlace(
        context,
        adminUser.id,
        testPlace1.id,
        "Deleting published place",
      );
      expect(publishedResult.isOk()).toBe(true);

      // Delete draft place
      const draftResult = await adminDeletePlace(
        context,
        adminUser.id,
        testPlace2.id,
        "Deleting draft place",
      );
      expect(draftResult.isOk()).toBe(true);

      // Delete archived place
      const archivedResult = await adminDeletePlace(
        context,
        adminUser.id,
        testPlace3.id,
        "Deleting archived place",
      );
      expect(archivedResult.isOk()).toBe(true);
    });

    it("should handle invalid UUID format", async () => {
      const result = await adminDeletePlace(
        context,
        adminUser.id,
        "invalid-uuid-format",
        "Delete invalid UUID",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Place not found");
      }
    });
  });

  describe("adminDeleteRegion", () => {
    it("should successfully delete an empty region", async () => {
      const result = await adminDeleteRegion(
        context,
        adminUser.id,
        emptyRegion.id,
        "Region is no longer needed",
      );

      expect(result.isOk()).toBe(true);

      // Verify region is deleted
      const findResult = await context.regionRepository.findById(
        emptyRegion.id,
      );
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should successfully delete region without reason", async () => {
      const result = await adminDeleteRegion(
        context,
        adminUser.id,
        emptyRegion.id,
      );

      expect(result.isOk()).toBe(true);

      // Verify region is deleted
      const findResult = await context.regionRepository.findById(
        emptyRegion.id,
      );
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should fail when region has places", async () => {
      const result = await adminDeleteRegion(
        context,
        adminUser.id,
        testRegion1.id,
        "Trying to delete region with places",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Cannot delete region with existing places",
        );
      }

      // Verify region still exists
      const findResult = await context.regionRepository.findById(
        testRegion1.id,
      );
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull();
      }
    });

    it("should fail when region does not exist", async () => {
      const result = await adminDeleteRegion(
        context,
        adminUser.id,
        "non-existent-region-id",
        "Trying to delete non-existent region",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Region not found");
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await adminDeleteRegion(
        context,
        editorUser.id,
        emptyRegion.id,
        "Editor trying to delete",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should allow deletion after all places are removed", async () => {
      // First delete all places in the region
      await context.placeRepository.delete(testPlace1.id);
      await context.placeRepository.delete(testPlace2.id);

      // Now should be able to delete the region
      const result = await adminDeleteRegion(
        context,
        adminUser.id,
        testRegion1.id,
        "All places removed, safe to delete",
      );

      expect(result.isOk()).toBe(true);

      // Verify region is deleted
      const findResult = await context.regionRepository.findById(
        testRegion1.id,
      );
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should handle concurrent deletion attempts", async () => {
      const [result1, result2] = await Promise.all([
        adminDeleteRegion(
          context,
          adminUser.id,
          emptyRegion.id,
          "First deletion",
        ),
        adminDeleteRegion(
          context,
          adminUser.id,
          emptyRegion.id,
          "Second deletion",
        ),
      ]);

      // One should succeed, one should fail
      const successCount = [result1, result2].filter((r) => r.isOk()).length;
      const errorCount = [result1, result2].filter((r) => r.isErr()).length;

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);
    });
  });

  describe("getContentStatistics", () => {
    it("should successfully get content statistics for admin", async () => {
      const result = await getContentStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;

        // User statistics
        expect(stats.users.total).toBeGreaterThanOrEqual(4); // At least 4 users created
        expect(stats.users.active).toBeGreaterThanOrEqual(3);
        expect(stats.users.suspended).toBeGreaterThanOrEqual(1);

        // Region statistics
        expect(stats.regions.total).toBeGreaterThanOrEqual(3); // At least 3 regions created
        expect(stats.regions.published).toBeGreaterThanOrEqual(1);

        // Place statistics
        expect(stats.places.total).toBeGreaterThanOrEqual(3); // At least 3 places created
        expect(stats.places.published).toBeGreaterThanOrEqual(1);
      }
    });

    it("should show correct statistics after status updates", async () => {
      // Update some statuses
      await context.regionRepository.updateStatus(testRegion2.id, "published");
      await context.placeRepository.updateStatus(testPlace2.id, "published");

      const result = await getContentStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.regions.published).toBeGreaterThanOrEqual(2);
        expect(stats.places.published).toBeGreaterThanOrEqual(2);
      }
    });

    it("should show updated statistics after user status changes", async () => {
      // Suspend a user
      await context.userRepository.updateStatus(regularUser.id, "suspended");

      const result = await getContentStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;
        expect(stats.users.suspended).toBeGreaterThanOrEqual(1);
        expect(stats.users.active).toBeLessThan(stats.users.total);
      }
    });

    it("should fail when user is not admin", async () => {
      const result = await getContentStatistics(context, editorUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should fail when admin user is inactive", async () => {
      const result = await getContentStatistics(context, inactiveAdminUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Admin account is not active");
      }
    });

    it("should handle empty statistics gracefully", async () => {
      // Reset to empty state
      resetMockContext(context);

      // Create only admin user
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isErr()) {
        throw new Error("Failed to hash password");
      }

      const adminResult = await context.userRepository.create({
        email: "admin@example.com",
        password: hashedPassword.value,
        name: "Admin User",
      });
      expect(adminResult.isOk()).toBe(true);

      if (adminResult.isOk()) {
        const admin = adminResult.value;
        await context.userRepository.updateRole(admin.id, "admin");

        const result = await getContentStatistics(context, admin.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const stats = result.value;
          expect(stats.users.total).toBe(1); // Only admin
          expect(stats.regions.total).toBe(0);
          expect(stats.places.total).toBe(0);
        }
      }
    });

    it("should provide consistent statistics across multiple calls", async () => {
      const [result1, result2, result3] = await Promise.all([
        getContentStatistics(context, adminUser.id),
        getContentStatistics(context, adminUser.id),
        getContentStatistics(context, adminUser.id),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      expect(result3.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk() && result3.isOk()) {
        const stats1 = result1.value;
        const stats2 = result2.value;
        const stats3 = result3.value;

        // All calls should return the same statistics
        expect(stats1.users.total).toBe(stats2.users.total);
        expect(stats2.users.total).toBe(stats3.users.total);
        expect(stats1.regions.total).toBe(stats2.regions.total);
        expect(stats2.regions.total).toBe(stats3.regions.total);
        expect(stats1.places.total).toBe(stats2.places.total);
        expect(stats2.places.total).toBe(stats3.places.total);
      }
    });
  });

  describe("concurrent operations and edge cases", () => {
    it("should handle concurrent status updates on different content", async () => {
      const placeInput: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "archived",
        reason: "Concurrent place update",
      };

      const regionInput: UpdateRegionStatusInput = {
        regionId: testRegion1.id,
        status: "archived",
        reason: "Concurrent region update",
      };

      const [placeResult, regionResult] = await Promise.all([
        adminUpdatePlaceStatus(context, adminUser.id, placeInput),
        adminUpdateRegionStatus(context, adminUser.id, regionInput),
      ]);

      expect(placeResult.isOk()).toBe(true);
      expect(regionResult.isOk()).toBe(true);

      if (placeResult.isOk() && regionResult.isOk()) {
        expect(placeResult.value.status).toBe("archived");
        expect(regionResult.value.status).toBe("archived");
      }
    });

    it("should handle concurrent deletions and status updates", async () => {
      const statusInput: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "archived",
        reason: "Status update",
      };

      const [statusResult, deleteResult] = await Promise.all([
        adminUpdatePlaceStatus(context, adminUser.id, statusInput),
        adminDeletePlace(context, adminUser.id, testPlace2.id, "Deletion"),
      ]);

      expect(statusResult.isOk()).toBe(true);
      expect(deleteResult.isOk()).toBe(true);
    });

    it("should maintain data integrity during content operations", async () => {
      const originalPlace = testPlace1;

      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "archived",
        reason: "Archiving for maintenance",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;

        // Original data should be preserved
        expect(updatedPlace.id).toBe(originalPlace.id);
        expect(updatedPlace.name).toBe(originalPlace.name);
        expect(updatedPlace.createdBy).toBe(originalPlace.createdBy);
        expect(updatedPlace.regionId).toBe(originalPlace.regionId);

        // Only status should be updated
        expect(updatedPlace.status).toBe("archived");
      }
    });

    it("should handle region deletion dependency checking correctly", async () => {
      // Create a region with a place
      const regionResult = await context.regionRepository.create(
        editorUser.id,
        {
          name: "Test Region for Deletion",
          description: "Testing deletion logic",
          coordinates: { latitude: 37.0, longitude: 141.0 },
          address: "Test Address",
          images: [],
          tags: ["test"],
        },
      );
      expect(regionResult.isOk()).toBe(true);

      if (regionResult.isOk()) {
        const region = regionResult.value;

        const placeResult = await context.placeRepository.create(
          editorUser.id,
          {
            name: "Test Place",
            description: "Test place",
            shortDescription: "Test",
            category: "restaurant",
            regionId: region.id,
            coordinates: { latitude: 37.001, longitude: 141.001 },
            address: "Test Place Address",
            images: [],
            tags: ["test"],
            businessHours: [],
          },
        );
        expect(placeResult.isOk()).toBe(true);

        if (placeResult.isOk()) {
          const place = placeResult.value;

          // Should fail to delete region with place
          const deleteRegionResult = await adminDeleteRegion(
            context,
            adminUser.id,
            region.id,
            "Should fail",
          );
          expect(deleteRegionResult.isErr()).toBe(true);

          // Delete the place first
          const deletePlaceResult = await adminDeletePlace(
            context,
            adminUser.id,
            place.id,
            "Cleanup",
          );
          expect(deletePlaceResult.isOk()).toBe(true);

          // Now should be able to delete region
          const deleteRegionResult2 = await adminDeleteRegion(
            context,
            adminUser.id,
            region.id,
            "Should succeed",
          );
          expect(deleteRegionResult2.isOk()).toBe(true);
        }
      }
    });

    it("should handle content management with special characters", async () => {
      // Create content with special characters in reason
      const input: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: "Spéciàl chàracters & émojis 🎉 in rëason",
      };

      const result = await adminUpdatePlaceStatus(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPlace = result.value;
        expect(updatedPlace.status).toBe("published");
      }
    });

    it("should prevent unauthorized access attempts", async () => {
      // Regular user should not be able to update content status
      const placeInput: UpdatePlaceStatusInput = {
        placeId: testPlace1.id,
        status: "published",
        reason: "Unauthorized access attempt",
      };

      const regionInput: UpdateRegionStatusInput = {
        regionId: testRegion1.id,
        status: "published",
        reason: "Unauthorized access attempt",
      };

      const [placeResult, regionResult, deletePlaceResult, deleteRegionResult] =
        await Promise.all([
          adminUpdatePlaceStatus(context, regularUser.id, placeInput),
          adminUpdateRegionStatus(context, regularUser.id, regionInput),
          adminDeletePlace(
            context,
            regularUser.id,
            testPlace1.id,
            "Unauthorized",
          ),
          adminDeleteRegion(
            context,
            regularUser.id,
            emptyRegion.id,
            "Unauthorized",
          ),
        ]);

      expect(placeResult.isErr()).toBe(true);
      expect(regionResult.isErr()).toBe(true);
      expect(deletePlaceResult.isErr()).toBe(true);
      expect(deleteRegionResult.isErr()).toBe(true);

      // All should have permission error
      if (placeResult.isErr()) {
        expect(placeResult.error.message).toBe(
          "Insufficient permissions: admin role required",
        );
      }
    });

    it("should handle statistics calculation with various content states", async () => {
      // Create content in various states
      await context.placeRepository.updateStatus(testPlace1.id, "archived");
      await context.placeRepository.updateStatus(testPlace2.id, "published");
      await context.regionRepository.updateStatus(testRegion2.id, "published");
      await context.userRepository.updateStatus(regularUser.id, "suspended");

      const result = await getContentStatistics(context, adminUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const stats = result.value;

        // Should reflect the updated states
        expect(stats.users.suspended).toBeGreaterThanOrEqual(1);
        expect(stats.regions.published).toBeGreaterThanOrEqual(2);
        expect(stats.places.published).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
