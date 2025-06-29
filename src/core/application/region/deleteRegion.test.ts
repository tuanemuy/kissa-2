import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type DeleteRegionRequest, deleteRegion } from "./deleteRegion";

describe("deleteRegion", () => {
  let context: Context;
  let ownerUser: User;
  let otherEditorUser: User;
  let adminUser: User;
  let visitorUser: User;
  let emptyRegion: Region;
  let regionWithDraftPlaces: Region;
  let regionWithPublishedPlaces: Region;
  let regionWithMixedPlaces: Region;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users with different roles
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create owner user (editor)
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

    // Create another editor user
    const otherEditorResult = await context.userRepository.create({
      email: "other-editor@example.com",
      password: hashedPassword.value,
      name: "Other Editor User",
    });
    if (otherEditorResult.isErr()) {
      throw new Error("Failed to create other editor user");
    }
    otherEditorUser = otherEditorResult.value;
    await context.userRepository.updateRole(otherEditorUser.id, "editor");

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

    // Create visitor user
    const visitorResult = await context.userRepository.create({
      email: "visitor@example.com",
      password: hashedPassword.value,
      name: "Visitor User",
    });
    if (visitorResult.isErr()) {
      throw new Error("Failed to create visitor user");
    }
    visitorUser = visitorResult.value;

    // Create test regions
    const emptyRegionResult = await context.regionRepository.create(
      ownerUser.id,
      {
        name: "Empty Region",
        description: "A region with no places",
        images: [],
        tags: [],
      },
    );
    if (emptyRegionResult.isErr()) {
      throw new Error("Failed to create empty region");
    }
    emptyRegion = emptyRegionResult.value;

    const regionWithDraftResult = await context.regionRepository.create(
      ownerUser.id,
      {
        name: "Region with Draft Places",
        description: "A region that only has draft places",
        images: [],
        tags: [],
      },
    );
    if (regionWithDraftResult.isErr()) {
      throw new Error("Failed to create region with draft places");
    }
    regionWithDraftPlaces = regionWithDraftResult.value;

    const regionWithPublishedResult = await context.regionRepository.create(
      ownerUser.id,
      {
        name: "Region with Published Places",
        description: "A region that has published places",
        images: [],
        tags: [],
      },
    );
    if (regionWithPublishedResult.isErr()) {
      throw new Error("Failed to create region with published places");
    }
    regionWithPublishedPlaces = regionWithPublishedResult.value;

    const regionWithMixedResult = await context.regionRepository.create(
      ownerUser.id,
      {
        name: "Region with Mixed Places",
        description: "A region that has both draft and published places",
        images: [],
        tags: [],
      },
    );
    if (regionWithMixedResult.isErr()) {
      throw new Error("Failed to create region with mixed places");
    }
    regionWithMixedPlaces = regionWithMixedResult.value;

    // Create test places in regions
    // Draft place in regionWithDraftPlaces
    const draftPlaceResult = await context.placeRepository.create(
      ownerUser.id,
      {
        name: "Draft Place",
        category: "restaurant",
        regionId: regionWithDraftPlaces.id,
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Draft Address",
        images: [],
        tags: [],
        businessHours: [],
      },
    );
    if (draftPlaceResult.isErr()) {
      throw new Error("Failed to create draft place");
    }

    // Published place in regionWithPublishedPlaces
    const publishedPlaceResult = await context.placeRepository.create(
      ownerUser.id,
      {
        name: "Published Place",
        category: "restaurant",
        regionId: regionWithPublishedPlaces.id,
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Published Address",
        images: [],
        tags: [],
        businessHours: [],
      },
    );
    if (publishedPlaceResult.isErr()) {
      throw new Error("Failed to create published place");
    }
    await context.placeRepository.updateStatus(
      publishedPlaceResult.value.id,
      "published",
    );

    // Both draft and published places in regionWithMixedPlaces
    const mixedDraftPlaceResult = await context.placeRepository.create(
      ownerUser.id,
      {
        name: "Mixed Draft Place",
        category: "cafe",
        regionId: regionWithMixedPlaces.id,
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Mixed Draft Address",
        images: [],
        tags: [],
        businessHours: [],
      },
    );
    if (mixedDraftPlaceResult.isErr()) {
      throw new Error("Failed to create mixed draft place");
    }

    const mixedPublishedPlaceResult = await context.placeRepository.create(
      ownerUser.id,
      {
        name: "Mixed Published Place",
        category: "hotel",
        regionId: regionWithMixedPlaces.id,
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Mixed Published Address",
        images: [],
        tags: [],
        businessHours: [],
      },
    );
    if (mixedPublishedPlaceResult.isErr()) {
      throw new Error("Failed to create mixed published place");
    }
    await context.placeRepository.updateStatus(
      mixedPublishedPlaceResult.value.id,
      "published",
    );
  });

  describe("successful deletions", () => {
    it("should delete empty region by owner", async () => {
      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify region is deleted
      const getResult = await context.regionRepository.findById(emptyRegion.id);
      expect(getResult.isErr() || !getResult.value).toBe(true);
    });

    it("should delete region with only draft places by owner", async () => {
      const request: DeleteRegionRequest = {
        regionId: regionWithDraftPlaces.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify region is deleted
      const getResult = await context.regionRepository.findById(
        regionWithDraftPlaces.id,
      );
      expect(getResult.isErr() || !getResult.value).toBe(true);
    });

    it("should delete region by admin even if not owner", async () => {
      // Create a region by another user that admin should be able to delete
      const anotherRegionResult = await context.regionRepository.create(
        otherEditorUser.id,
        {
          name: "Another User's Region",
          images: [],
          tags: [],
        },
      );
      if (anotherRegionResult.isErr()) {
        throw new Error("Failed to create another user's region");
      }

      const request: DeleteRegionRequest = {
        regionId: anotherRegionResult.value.id,
        userId: adminUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should delete region with archived places", async () => {
      // Create a region with an archived place
      const regionResult = await context.regionRepository.create(ownerUser.id, {
        name: "Region with Archived Place",
        images: [],
        tags: [],
      });
      if (regionResult.isErr()) {
        throw new Error("Failed to create region for archived place test");
      }

      const archivedPlaceResult = await context.placeRepository.create(
        ownerUser.id,
        {
          name: "Archived Place",
          category: "restaurant",
          regionId: regionResult.value.id,
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: "Archived Address",
          images: [],
          tags: [],
          businessHours: [],
        },
      );
      if (archivedPlaceResult.isErr()) {
        throw new Error("Failed to create archived place");
      }
      await context.placeRepository.updateStatus(
        archivedPlaceResult.value.id,
        "archived",
      );

      const request: DeleteRegionRequest = {
        regionId: regionResult.value.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe("permission failures", () => {
    it("should fail when non-owner editor tries to delete region", async () => {
      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: otherEditorUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });

    it("should fail when visitor tries to delete region", async () => {
      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: visitorUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });

    it("should fail when region does not exist", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";

      const request: DeleteRegionRequest = {
        regionId: nonExistentRegionId,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_NOT_FOUND);
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440001";

      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: nonExistentUserId,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });
  });

  describe("business rule violations", () => {
    it("should fail when region has published places", async () => {
      const request: DeleteRegionRequest = {
        regionId: regionWithPublishedPlaces.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_HAS_PLACES);
      }
    });

    it("should fail when region has mixed draft and published places", async () => {
      const request: DeleteRegionRequest = {
        regionId: regionWithMixedPlaces.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_HAS_PLACES);
      }
    });

    it("should fail even for admin when region has published places", async () => {
      const request: DeleteRegionRequest = {
        regionId: regionWithPublishedPlaces.id,
        userId: adminUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_HAS_PLACES);
      }
    });
  });

  describe("dependency checking", () => {
    it("should properly check place dependencies", async () => {
      // This test verifies that the function properly checks for places
      const request: DeleteRegionRequest = {
        regionId: regionWithDraftPlaces.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      // Should succeed because the places are draft
      expect(result.isOk()).toBe(true);
    });

    it("should handle multiple published places in region", async () => {
      // Create a region with multiple published places
      const regionResult = await context.regionRepository.create(ownerUser.id, {
        name: "Region with Multiple Published Places",
        images: [],
        tags: [],
      });
      if (regionResult.isErr()) {
        throw new Error("Failed to create region for multiple places test");
      }

      // Create multiple published places
      for (let i = 0; i < 3; i++) {
        const placeResult = await context.placeRepository.create(ownerUser.id, {
          name: `Published Place ${i + 1}`,
          category: "restaurant",
          regionId: regionResult.value.id,
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: `Address ${i + 1}`,
          images: [],
          tags: [],
          businessHours: [],
        });
        if (placeResult.isOk()) {
          await context.placeRepository.updateStatus(
            placeResult.value.id,
            "published",
          );
        }
      }

      const request: DeleteRegionRequest = {
        regionId: regionResult.value.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_HAS_PLACES);
      }
    });

    it("should handle region with many draft places", async () => {
      // Create a region with many draft places
      const regionResult = await context.regionRepository.create(ownerUser.id, {
        name: "Region with Many Draft Places",
        images: [],
        tags: [],
      });
      if (regionResult.isErr()) {
        throw new Error("Failed to create region for many draft places test");
      }

      // Create multiple draft places
      for (let i = 0; i < 10; i++) {
        await context.placeRepository.create(ownerUser.id, {
          name: `Draft Place ${i + 1}`,
          category: "restaurant",
          regionId: regionResult.value.id,
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: `Draft Address ${i + 1}`,
          images: [],
          tags: [],
          businessHours: [],
        });
      }

      const request: DeleteRegionRequest = {
        regionId: regionResult.value.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      // Should succeed because all places are draft
      expect(result.isOk()).toBe(true);
    });
  });

  describe("concurrent deletion attempts", () => {
    it("should handle concurrent deletion attempts gracefully", async () => {
      const requests: DeleteRegionRequest[] = [
        {
          regionId: emptyRegion.id,
          userId: ownerUser.id,
        },
        {
          regionId: emptyRegion.id,
          userId: ownerUser.id,
        },
      ];

      const results = await Promise.all(
        requests.map((request) => deleteRegion(context, request)),
      );

      // One should succeed, one should fail (region already deleted)
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      expect(successCount + failureCount).toBe(2);
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });

    it("should handle concurrent deletion of different regions", async () => {
      // Create multiple empty regions
      const region1Result = await context.regionRepository.create(
        ownerUser.id,
        {
          name: "Concurrent Region 1",
          images: [],
          tags: [],
        },
      );
      const region2Result = await context.regionRepository.create(
        ownerUser.id,
        {
          name: "Concurrent Region 2",
          images: [],
          tags: [],
        },
      );

      if (region1Result.isErr() || region2Result.isErr()) {
        throw new Error("Failed to create concurrent test regions");
      }

      const requests: DeleteRegionRequest[] = [
        {
          regionId: region1Result.value.id,
          userId: ownerUser.id,
        },
        {
          regionId: region2Result.value.id,
          userId: ownerUser.id,
        },
      ];

      const results = await Promise.all(
        requests.map((request) => deleteRegion(context, request)),
      );

      // Both should succeed
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("should handle places repository failure", async () => {
      const failingContext = createMockContext({ shouldFailGetByRegion: true });

      // Set up the same test data in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "owner@example.com",
          password: hashedPassword.value,
          name: "Owner User",
        });
      }

      const ownerResult =
        await failingContext.userRepository.findByEmail("owner@example.com");
      if (ownerResult.isOk() && ownerResult.value) {
        await failingContext.userRepository.updateRole(
          ownerResult.value.id,
          "editor",
        );

        const regionResult = await failingContext.regionRepository.create(
          ownerResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const request: DeleteRegionRequest = {
            regionId: regionResult.value.id,
            userId: ownerResult.value.id,
          };

          const result = await deleteRegion(failingContext, request);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
          }
        }
      }
    });

    it("should handle region repository delete failure", async () => {
      const failingContext = createMockContext({ shouldFailDelete: true });

      // Set up the same test data in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "owner@example.com",
          password: hashedPassword.value,
          name: "Owner User",
        });
      }

      const ownerResult =
        await failingContext.userRepository.findByEmail("owner@example.com");
      if (ownerResult.isOk() && ownerResult.value) {
        await failingContext.userRepository.updateRole(
          ownerResult.value.id,
          "editor",
        );

        const regionResult = await failingContext.regionRepository.create(
          ownerResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const request: DeleteRegionRequest = {
            regionId: regionResult.value.id,
            userId: ownerResult.value.id,
          };

          const result = await deleteRegion(failingContext, request);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBe(ERROR_CODES.REGION_DELETE_FAILED);
          }
        }
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle region with places created by different users", async () => {
      // Create a region
      const regionResult = await context.regionRepository.create(ownerUser.id, {
        name: "Multi-User Places Region",
        images: [],
        tags: [],
      });
      if (regionResult.isErr()) {
        throw new Error("Failed to create multi-user region");
      }

      // Create a place by the owner (draft)
      await context.placeRepository.create(ownerUser.id, {
        name: "Owner's Draft Place",
        category: "restaurant",
        regionId: regionResult.value.id,
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Owner Address",
        images: [],
        tags: [],
        businessHours: [],
      });

      // Create a place by admin (published)
      const adminPlaceResult = await context.placeRepository.create(
        adminUser.id,
        {
          name: "Admin's Published Place",
          category: "cafe",
          regionId: regionResult.value.id,
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: "Admin Address",
          images: [],
          tags: [],
          businessHours: [],
        },
      );
      if (adminPlaceResult.isOk()) {
        await context.placeRepository.updateStatus(
          adminPlaceResult.value.id,
          "published",
        );
      }

      const request: DeleteRegionRequest = {
        regionId: regionResult.value.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      // Should fail because there's a published place (regardless of who created it)
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_HAS_PLACES);
      }
    });

    it("should handle empty places array", async () => {
      // This test ensures that the places checking logic handles empty arrays correctly
      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isOk()).toBe(true);
    });

    it("should handle malformed region ID", async () => {
      const request: DeleteRegionRequest = {
        regionId: "not-a-valid-uuid",
        userId: ownerUser.id,
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_NOT_FOUND);
      }
    });

    it("should handle malformed user ID", async () => {
      const request: DeleteRegionRequest = {
        regionId: emptyRegion.id,
        userId: "not-a-valid-uuid",
      };

      const result = await deleteRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });
  });
});
