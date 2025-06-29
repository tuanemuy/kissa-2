import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreatePlaceInput, createPlace } from "./createPlace";
import { type UpdatePlaceRequest, updatePlace } from "./updatePlace";

describe("updatePlace", () => {
  let context: Context;
  let ownerUser: User;
  let otherUser: User;
  let adminUser: User;
  let testRegion: Region;
  let testPlace: Place;

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

    // Create other user (editor)
    const otherResult = await context.userRepository.create({
      email: "other@example.com",
      password: hashedPassword.value,
      name: "Other User",
    });
    if (otherResult.isErr()) {
      throw new Error("Failed to create other user");
    }
    otherUser = otherResult.value;
    await context.userRepository.updateRole(otherUser.id, "editor");

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

    // Create test region
    const regionResult = await context.regionRepository.create(ownerUser.id, {
      name: "Test Region",
      images: [],
      tags: [],
    });
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;

    // Create test place
    const placeInput: CreatePlaceInput = {
      name: "Test Place",
      description: "A test place for updating",
      shortDescription: "Test place",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      address: "123 Test Street, Tokyo, Japan",
      phone: "+81-3-1234-5678",
      website: "https://example.com",
      email: "test@example.com",
      coverImage: "https://example.com/cover.jpg",
      images: ["https://example.com/image1.jpg"],
      tags: ["test", "restaurant"],
      businessHours: [
        {
          dayOfWeek: "monday",
          openTime: "09:00",
          closeTime: "22:00",
          isClosed: false,
        },
      ],
    };

    const placeResult = await createPlace(context, ownerUser.id, placeInput);
    if (placeResult.isErr()) {
      throw new Error("Failed to create test place");
    }
    testPlace = placeResult.value;
  });

  describe("successful place updates", () => {
    it("should update place name by owner", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Test Place",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Updated Test Place");
        expect(result.value.description).toBe(testPlace.description);
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          testPlace.updatedAt.getTime(),
        );
      }
    });

    it("should update multiple fields simultaneously", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Restaurant",
          description: "An updated description",
          shortDescription: "Updated short desc",
          category: "cafe",
          address: "456 New Street, Tokyo, Japan",
          phone: "+81-3-9876-5432",
          website: "https://updated.example.com",
          email: "updated@example.com",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("Updated Restaurant");
        expect(result.value.description).toBe("An updated description");
        expect(result.value.shortDescription).toBe("Updated short desc");
        expect(result.value.category).toBe("cafe");
        expect(result.value.address).toBe("456 New Street, Tokyo, Japan");
        expect(result.value.phone).toBe("+81-3-9876-5432");
        expect(result.value.website).toBe("https://updated.example.com");
        expect(result.value.email).toBe("updated@example.com");
      }
    });

    it("should update coordinates", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: 35.6895,
            longitude: 139.6917,
          },
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: 35.6895,
          longitude: 139.6917,
        });
      }
    });

    it("should update images and cover image", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          coverImage: "https://example.com/new-cover.jpg",
          images: [
            "https://example.com/new-image1.jpg",
            "https://example.com/new-image2.jpg",
            "https://example.com/new-image3.jpg",
          ],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coverImage).toBe(
          "https://example.com/new-cover.jpg",
        );
        expect(result.value.images).toEqual([
          "https://example.com/new-image1.jpg",
          "https://example.com/new-image2.jpg",
          "https://example.com/new-image3.jpg",
        ]);
      }
    });

    it("should update tags", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          tags: ["updated", "new-tags", "modern"],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(["updated", "new-tags", "modern"]);
      }
    });

    it("should update business hours", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          businessHours: [
            {
              dayOfWeek: "monday",
              openTime: "08:00",
              closeTime: "23:00",
              isClosed: false,
            },
            {
              dayOfWeek: "tuesday",
              openTime: "08:00",
              closeTime: "23:00",
              isClosed: false,
            },
            {
              dayOfWeek: "wednesday",
              isClosed: true,
            },
          ],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.businessHours).toEqual([
          {
            dayOfWeek: "monday",
            openTime: "08:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            dayOfWeek: "tuesday",
            openTime: "08:00",
            closeTime: "23:00",
            isClosed: false,
          },
          {
            dayOfWeek: "wednesday",
            isClosed: true,
          },
        ]);
      }
    });

    it("should clear optional fields when set to undefined", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          description: undefined,
          shortDescription: undefined,
          phone: undefined,
          website: undefined,
          email: undefined,
          coverImage: undefined,
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBeUndefined();
        expect(result.value.shortDescription).toBeUndefined();
        expect(result.value.phone).toBeUndefined();
        expect(result.value.website).toBeUndefined();
        expect(result.value.email).toBeUndefined();
        expect(result.value.coverImage).toBeUndefined();
      }
    });

    it("should empty arrays when set to empty", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          images: [],
          tags: [],
          businessHours: [],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.businessHours).toEqual([]);
      }
    });

    it("should preserve unchanged fields", async () => {
      const originalName = testPlace.name;
      const originalDescription = testPlace.description;
      const originalCategory = testPlace.category;

      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          address: "Updated address only",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(originalName);
        expect(result.value.description).toBe(originalDescription);
        expect(result.value.category).toBe(originalCategory);
        expect(result.value.address).toBe("Updated address only");
      }
    });
  });

  describe("permission validation", () => {
    it("should fail when user does not own place and has no permission", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: otherUser.id,
        params: {
          name: "Unauthorized Update",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        );
      }
    });

    it("should fail when place does not exist", async () => {
      const nonExistentPlaceId = "550e8400-e29b-41d4-a716-446655440000";
      const request: UpdatePlaceRequest = {
        placeId: nonExistentPlaceId,
        userId: ownerUser.id,
        params: {
          name: "Non-existent Place Update",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_FOUND);
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: nonExistentUserId,
        params: {
          name: "Non-existent User Update",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          ERROR_CODES.PLACE_EDIT_PERMISSION_REQUIRED,
        );
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle maximum length name", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "A".repeat(200), // Maximum length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("A".repeat(200));
      }
    });

    it("should handle maximum length description", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          description: "B".repeat(2000), // Maximum length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe("B".repeat(2000));
      }
    });

    it("should handle maximum length short description", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          shortDescription: "C".repeat(300), // Maximum length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.shortDescription).toBe("C".repeat(300));
      }
    });

    it("should handle boundary coordinates", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: -90, // Minimum latitude
            longitude: -180, // Minimum longitude
          },
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: -90,
          longitude: -180,
        });
      }
    });

    it("should handle maximum boundary coordinates", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          coordinates: {
            latitude: 90, // Maximum latitude
            longitude: 180, // Maximum longitude
          },
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual({
          latitude: 90,
          longitude: 180,
        });
      }
    });

    it("should handle maximum length address", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          address: "D".repeat(500), // Maximum length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.address).toBe("D".repeat(500));
      }
    });

    it("should handle maximum length phone", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          phone: "1".repeat(20), // Maximum length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.phone).toBe("1".repeat(20));
      }
    });

    it("should handle maximum length tags", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          tags: ["E".repeat(50), "F".repeat(50), "G".repeat(50)], // Maximum tag length
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual([
          "E".repeat(50),
          "F".repeat(50),
          "G".repeat(50),
        ]);
      }
    });

    it("should handle all categories", async () => {
      const categories = [
        "restaurant",
        "cafe",
        "hotel",
        "shopping",
        "entertainment",
        "culture",
        "nature",
        "historical",
        "religious",
        "transportation",
        "hospital",
        "education",
        "office",
        "other",
      ] as const;

      for (const category of categories) {
        const request: UpdatePlaceRequest = {
          placeId: testPlace.id,
          userId: ownerUser.id,
          params: {
            category,
          },
        };

        const result = await updatePlace(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.category).toBe(category);
        }
      }
    });

    it("should handle unicode characters in name", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "更新されたテスト場所 🌸 Café des Amis",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("更新されたテスト場所 🌸 Café des Amis");
      }
    });

    it("should handle special characters in tags", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          tags: [
            "updated-tag",
            "tag_with_underscore",
            "tag.with.dot",
            "tag+plus",
            "café",
            "寿司",
          ],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual([
          "updated-tag",
          "tag_with_underscore",
          "tag.with.dot",
          "tag+plus",
          "café",
          "寿司",
        ]);
      }
    });

    it("should handle valid image URLs", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          coverImage:
            "https://secure.example.com/images/updated-cover.jpg?v=456&size=large",
          images: [
            "https://example.com/updated-image1.jpg",
            "https://subdomain.example.org/path/to/updated-image2.png",
            "https://cdn.example.net/uploads/updated-image3.webp",
          ],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coverImage).toBe(
          "https://secure.example.com/images/updated-cover.jpg?v=456&size=large",
        );
        expect(result.value.images).toEqual([
          "https://example.com/updated-image1.jpg",
          "https://subdomain.example.org/path/to/updated-image2.png",
          "https://cdn.example.net/uploads/updated-image3.webp",
        ]);
      }
    });

    it("should handle valid email and website URLs", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          email: "updated@example.com",
          website: "https://www.updated-example.com",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe("updated@example.com");
        expect(result.value.website).toBe("https://www.updated-example.com");
      }
    });

    it("should handle valid business hours", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          businessHours: [
            {
              dayOfWeek: "monday",
              openTime: "07:30",
              closeTime: "23:30",
              isClosed: false,
            },
            {
              dayOfWeek: "tuesday",
              openTime: "00:00",
              closeTime: "23:59",
              isClosed: false,
            },
            {
              dayOfWeek: "wednesday",
              isClosed: true,
            },
            {
              dayOfWeek: "thursday",
              openTime: "12:00",
              closeTime: "18:00",
              isClosed: false,
            },
          ],
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.businessHours).toEqual([
          {
            dayOfWeek: "monday",
            openTime: "07:30",
            closeTime: "23:30",
            isClosed: false,
          },
          {
            dayOfWeek: "tuesday",
            openTime: "00:00",
            closeTime: "23:59",
            isClosed: false,
          },
          {
            dayOfWeek: "wednesday",
            isClosed: true,
          },
          {
            dayOfWeek: "thursday",
            openTime: "12:00",
            closeTime: "18:00",
            isClosed: false,
          },
        ]);
      }
    });
  });

  describe("concurrent updates", () => {
    it("should handle concurrent updates by same user", async () => {
      const requests = [
        {
          placeId: testPlace.id,
          userId: ownerUser.id,
          params: { name: "Concurrent Update 1" },
        },
        {
          placeId: testPlace.id,
          userId: ownerUser.id,
          params: { description: "Concurrent description update" },
        },
        {
          placeId: testPlace.id,
          userId: ownerUser.id,
          params: { address: "Concurrent address update" },
        },
      ];

      const results = await Promise.all(
        requests.map((request) => updatePlace(context, request)),
      );

      // All updates should succeed
      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe("data integrity", () => {
    it("should preserve place ID and creation data", async () => {
      const originalId = testPlace.id;
      const originalCreatedBy = testPlace.createdBy;
      const originalCreatedAt = testPlace.createdAt;
      const originalStatus = testPlace.status;

      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Place",
          description: "New description",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(originalId);
        expect(result.value.createdBy).toBe(originalCreatedBy);
        expect(result.value.createdAt).toEqual(originalCreatedAt);
        expect(result.value.status).toBe(originalStatus);
        expect(result.value.updatedAt.getTime()).toBeGreaterThan(
          originalCreatedAt.getTime(),
        );
      }
    });

    it("should preserve counts and ratings", async () => {
      const originalVisitCount = testPlace.visitCount;
      const originalFavoriteCount = testPlace.favoriteCount;
      const originalCheckinCount = testPlace.checkinCount;
      const originalAverageRating = testPlace.averageRating;

      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "Updated Place",
        },
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.visitCount).toBe(originalVisitCount);
        expect(result.value.favoriteCount).toBe(originalFavoriteCount);
        expect(result.value.checkinCount).toBe(originalCheckinCount);
        expect(result.value.averageRating).toBe(originalAverageRating);
      }
    });

    it("should update timestamp correctly", async () => {
      const beforeUpdate = Date.now();

      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {
          name: "Timestamp Test Place",
        },
      };

      const result = await updatePlace(context, request);

      // Add a small delay to ensure we capture the time after the update completes
      await new Promise((resolve) => setTimeout(resolve, 1));
      const afterUpdate = Date.now();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate,
        );
        expect(result.value.updatedAt.getTime()).toBeLessThanOrEqual(
          afterUpdate,
        );
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          testPlace.updatedAt.getTime(),
        );
      }
    });
  });

  describe("empty parameter updates", () => {
    it("should handle empty parameter object", async () => {
      const request: UpdatePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
        params: {},
      };

      const result = await updatePlace(context, request);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // All fields should remain the same except updatedAt
        expect(result.value.name).toBe(testPlace.name);
        expect(result.value.description).toBe(testPlace.description);
        expect(result.value.category).toBe(testPlace.category);
        expect(result.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
          testPlace.updatedAt.getTime(),
        );
      }
    });
  });
});
