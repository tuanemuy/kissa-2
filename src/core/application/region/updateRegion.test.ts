import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type UpdateRegionRequest, updateRegion } from "./updateRegion";

describe("updateRegion", () => {
  let context: Context;
  let ownerUser: User;
  let otherEditorUser: User;
  let adminUser: User;
  let visitorUser: User;
  let testRegion: Region;

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

    // Create test region by owner
    const regionResult = await context.regionRepository.create(ownerUser.id, {
      name: "Test Region",
      description: "Original description",
      shortDescription: "Original short description",
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      address: "Original Address, Tokyo, Japan",
      coverImage: "https://example.com/original-cover.jpg",
      images: ["https://example.com/original-image1.jpg"],
      tags: ["original", "test"],
    });
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;
  });

  describe("successful updates", () => {
    it("should update region with all fields by owner", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Region Name",
          description: "Updated description with more details",
          shortDescription: "Updated short description",
          coordinates: {
            latitude: 35.685,
            longitude: 139.7514,
          },
          address: "Updated Address, Shibuya, Tokyo, Japan",
          coverImage: "https://example.com/updated-cover.jpg",
          images: [
            "https://example.com/updated-image1.jpg",
            "https://example.com/updated-image2.jpg",
          ],
          tags: ["updated", "test", "region"],
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(request.params.name);
        expect(result.value.description).toBe(request.params.description);
        expect(result.value.shortDescription).toBe(
          request.params.shortDescription,
        );
        expect(result.value.coordinates).toEqual(request.params.coordinates);
        expect(result.value.address).toBe(request.params.address);
        expect(result.value.coverImage).toBe(request.params.coverImage);
        expect(result.value.images).toEqual(request.params.images);
        expect(result.value.tags).toEqual(request.params.tags);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          testRegion.updatedAt.getTime(),
        );
      }
    });

    it("should update region with partial fields by owner", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "Partially Updated Region",
          description: "Only updating name and description",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(request.params.name);
        expect(result.value.description).toBe(request.params.description);
        // Other fields should remain unchanged
        expect(result.value.shortDescription).toBe(testRegion.shortDescription);
        expect(result.value.coordinates).toEqual(testRegion.coordinates);
        expect(result.value.address).toBe(testRegion.address);
        expect(result.value.coverImage).toBe(testRegion.coverImage);
        expect(result.value.images).toEqual(testRegion.images);
        expect(result.value.tags).toEqual(testRegion.tags);
      }
    });

    it("should update region with single field by owner", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "Just Name Update",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(request.params.name);
        expect(result.value.description).toBe(testRegion.description);
        expect(result.value.shortDescription).toBe(testRegion.shortDescription);
      }
    });

    it("should clear optional fields when set to undefined", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          description: undefined,
          shortDescription: undefined,
          coordinates: undefined,
          address: undefined,
          coverImage: undefined,
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBeUndefined();
        expect(result.value.shortDescription).toBeUndefined();
        expect(result.value.coordinates).toBeUndefined();
        expect(result.value.address).toBeUndefined();
        expect(result.value.coverImage).toBeUndefined();
      }
    });

    it("should update images array", async () => {
      const newImages: string[] = [];

      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          images: newImages,
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.images).toEqual(newImages);
      }
    });

    it("should update tags array", async () => {
      const newTags = ["new", "updated", "tags", "test"];

      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          tags: newTags,
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(newTags);
      }
    });

    it("should clear arrays when set to empty", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          images: [],
          tags: [],
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
      }
    });
  });

  describe("permission failures", () => {
    it("should fail when non-owner editor tries to update region", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: otherEditorUser.id,
        params: {
          name: "Unauthorized Update",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });

    it("should fail when visitor tries to update region", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: visitorUser.id,
        params: {
          name: "Visitor Update",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });

    it("should fail when region does not exist", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";

      const request: UpdateRegionRequest = {
        regionId: nonExistentRegionId,
        userId: ownerUser.id,
        params: {
          name: "Non-existent Region Update",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_NOT_FOUND);
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440001";

      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: nonExistentUserId,
        params: {
          name: "Non-existent User Update",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_ACCESS_DENIED);
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle minimum length name", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "A", // Minimum 1 character
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("A");
      }
    });

    it("should handle maximum length name", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "A".repeat(200), // Maximum 200 characters
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("A".repeat(200));
      }
    });

    it("should handle maximum length description", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          description: "A".repeat(2000), // Maximum 2000 characters
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe("A".repeat(2000));
      }
    });

    it("should handle maximum length short description", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          shortDescription: "A".repeat(300), // Maximum 300 characters
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.shortDescription).toBe("A".repeat(300));
      }
    });

    it("should handle maximum length address", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          address: "A".repeat(500), // Maximum 500 characters
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.address).toBe("A".repeat(500));
      }
    });

    it("should handle boundary coordinates", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: -90, // Minimum latitude
            longitude: -180, // Minimum longitude
          },
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: -90,
          longitude: -180,
        });
      }
    });

    it("should handle maximum boundary coordinates", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: 90, // Maximum latitude
            longitude: 180, // Maximum longitude
          },
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: 90,
          longitude: 180,
        });
      }
    });

    it("should handle maximum length tags", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          tags: ["A".repeat(50), "B".repeat(50), "C".repeat(50)], // Maximum tag length
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual([
          "A".repeat(50),
          "B".repeat(50),
          "C".repeat(50),
        ]);
      }
    });

    it("should handle unicode characters in name", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "テスト地域 🌸 Région Test",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("テスト地域 🌸 Région Test");
      }
    });

    it("should handle special characters in tags", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          tags: ["tag-with-dash", "tag_with_underscore", "café", "地域"],
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual([
          "tag-with-dash",
          "tag_with_underscore",
          "café",
          "地域",
        ]);
      }
    });

    it("should handle valid image URLs", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          coverImage: "https://example.com/new-cover.jpg",
          images: [
            "https://example.com/new-image1.jpg",
            "https://cdn.example.net/new-image2.png",
          ],
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coverImage).toBe(request.params.coverImage);
        expect(result.value.images).toEqual(request.params.images);
      }
    });

    it("should handle zero coordinates", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: 0,
            longitude: 0,
          },
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: 0,
          longitude: 0,
        });
      }
    });
  });

  describe("concurrent updates", () => {
    it("should handle concurrent updates to same region", async () => {
      const requests: UpdateRegionRequest[] = [
        {
          regionId: testRegion.id,
          userId: ownerUser.id,
          params: { name: "Concurrent Update 1" },
        },
        {
          regionId: testRegion.id,
          userId: ownerUser.id,
          params: { description: "Concurrent description update" },
        },
        {
          regionId: testRegion.id,
          userId: ownerUser.id,
          params: { tags: ["concurrent", "test"] },
        },
      ];

      const results = await Promise.all(
        requests.map((request) => updateRegion(context, request)),
      );

      // All updates should succeed individually
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }
    });

    it("should handle update to non-existent region concurrently", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";

      const requests: UpdateRegionRequest[] = [
        {
          regionId: nonExistentRegionId,
          userId: ownerUser.id,
          params: { name: "Non-existent 1" },
        },
        {
          regionId: nonExistentRegionId,
          userId: ownerUser.id,
          params: { name: "Non-existent 2" },
        },
      ];

      const results = await Promise.all(
        requests.map((request) => updateRegion(context, request)),
      );

      // All should fail with region not found
      for (const result of results) {
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.REGION_NOT_FOUND);
        }
      }
    });
  });

  describe("data integrity", () => {
    it("should preserve region metadata during update", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Name",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Metadata should be preserved
        expect(result.value.id).toBe(testRegion.id);
        expect(result.value.createdBy).toBe(testRegion.createdBy);
        expect(result.value.status).toBe(testRegion.status);
        expect(result.value.visitCount).toBe(testRegion.visitCount);
        expect(result.value.favoriteCount).toBe(testRegion.favoriteCount);
        expect(result.value.placeCount).toBe(testRegion.placeCount);
        expect(result.value.createdAt).toEqual(testRegion.createdAt);
        // Only updatedAt should change
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          testRegion.updatedAt.getTime(),
        );
      }
    });

    it("should handle empty update params", async () => {
      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {},
      };

      const result = await updateRegion(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // All data should remain the same except updatedAt
        expect(result.value.name).toBe(testRegion.name);
        expect(result.value.description).toBe(testRegion.description);
        expect(result.value.shortDescription).toBe(testRegion.shortDescription);
        expect(result.value.coordinates).toEqual(testRegion.coordinates);
        expect(result.value.address).toBe(testRegion.address);
        expect(result.value.coverImage).toBe(testRegion.coverImage);
        expect(result.value.images).toEqual(testRegion.images);
        expect(result.value.tags).toEqual(testRegion.tags);
      }
    });
  });

  describe("error handling", () => {
    it("should handle repository update failure", async () => {
      // Create a context that will fail updates
      const failingContext = createMockContext({ shouldFailUpdate: true });

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
          const request: UpdateRegionRequest = {
            regionId: regionResult.value.id,
            userId: ownerResult.value.id,
            params: {
              name: "Should Fail Update",
            },
          };

          const result = await updateRegion(failingContext, request);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBe(ERROR_CODES.REGION_UPDATE_FAILED);
          }
        }
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      // Create a context that throws unexpected errors
      const context = createMockContext({ shouldThrowError: true });

      const request: UpdateRegionRequest = {
        regionId: testRegion.id,
        userId: ownerUser.id,
        params: {
          name: "Should Throw Error",
        },
      };

      const result = await updateRegion(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
});
