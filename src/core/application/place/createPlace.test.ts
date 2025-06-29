import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreatePlaceInput, createPlace } from "./createPlace";

describe("createPlace", () => {
  let context: Context;
  let editorUser: User;
  let visitorUser: User;
  let adminUser: User;
  let testRegion: Region;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users with different roles
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

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
    const regionResult = await context.regionRepository.create(editorUser.id, {
      name: "Test Region",
      images: [],
      tags: [],
    });
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;
  });

  describe("successful place creation", () => {
    it("should create place with valid input by editor", async () => {
      const input: CreatePlaceInput = {
        name: "Test Restaurant",
        description: "A great test restaurant for testing purposes",
        shortDescription: "Great test restaurant",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "123 Test Street, Tokyo, Japan",
        phone: "+81-3-1234-5678",
        website: "https://example.com",
        email: "contact@example.com",
        coverImage: "https://example.com/cover.jpg",
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        tags: ["test", "restaurant", "food"],
        businessHours: [
          {
            dayOfWeek: "monday",
            openTime: "09:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            dayOfWeek: "tuesday",
            openTime: "09:00",
            closeTime: "22:00",
            isClosed: false,
          },
        ],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.description).toBe(input.description);
        expect(result.value.shortDescription).toBe(input.shortDescription);
        expect(result.value.category).toBe(input.category);
        expect(result.value.regionId).toBe(input.regionId);
        expect(result.value.coordinates).toEqual(input.coordinates);
        expect(result.value.address).toBe(input.address);
        expect(result.value.phone).toBe(input.phone);
        expect(result.value.website).toBe(input.website);
        expect(result.value.email).toBe(input.email);
        expect(result.value.coverImage).toBe(input.coverImage);
        expect(result.value.images).toEqual(input.images);
        expect(result.value.tags).toEqual(input.tags);
        expect(result.value.businessHours).toEqual(input.businessHours);
        expect(result.value.createdBy).toBe(editorUser.id);
        expect(result.value.status).toBe("draft");
        expect(result.value.visitCount).toBe(0);
        expect(result.value.favoriteCount).toBe(0);
        expect(result.value.checkinCount).toBe(0);
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create place with minimal input by editor", async () => {
      const input: CreatePlaceInput = {
        name: "Minimal Place",
        category: "other",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.description).toBeUndefined();
        expect(result.value.shortDescription).toBeUndefined();
        expect(result.value.category).toBe(input.category);
        expect(result.value.regionId).toBe(input.regionId);
        expect(result.value.coordinates).toEqual(input.coordinates);
        expect(result.value.address).toBe(input.address);
        expect(result.value.phone).toBeUndefined();
        expect(result.value.website).toBeUndefined();
        expect(result.value.email).toBeUndefined();
        expect(result.value.coverImage).toBeUndefined();
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.businessHours).toEqual([]);
        expect(result.value.createdBy).toBe(editorUser.id);
        expect(result.value.status).toBe("draft");
      }
    });

    it("should create place by admin user", async () => {
      const input: CreatePlaceInput = {
        name: "Admin Place",
        category: "office",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Admin Building, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.createdBy).toBe(adminUser.id);
      }
    });

    it("should create place in region not owned by editor (admin permission)", async () => {
      // Create another region by a different user
      const anotherRegionResult = await context.regionRepository.create(
        adminUser.id,
        {
          name: "Admin Region",
          images: [],
          tags: [],
        },
      );
      if (anotherRegionResult.isErr()) {
        throw new Error("Failed to create admin region");
      }

      const input: CreatePlaceInput = {
        name: "Place in Admin Region",
        category: "education",
        regionId: anotherRegionResult.value.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Admin Area, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      // Admin should be able to create place in any region
      const result = await createPlace(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.regionId).toBe(anotherRegionResult.value.id);
        expect(result.value.createdBy).toBe(adminUser.id);
      }
    });
  });

  describe("permission failures", () => {
    it("should fail when visitor user tries to create place", async () => {
      const input: CreatePlaceInput = {
        name: "Visitor Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Visitor Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, visitorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        expect(result.error.message).toBe(
          "User does not have permission to create places",
        );
      }
    });

    it("should fail when inactive user tries to create place", async () => {
      // Set editor as suspended
      await context.userRepository.updateStatus(editorUser.id, "suspended");

      const input: CreatePlaceInput = {
        name: "Suspended User Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Suspended Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
        expect(result.error.message).toBe("User account is not active");
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "non-existent-user-id";
      const input: CreatePlaceInput = {
        name: "Non-existent User Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Ghost Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, nonExistentUserId, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
        expect(result.error.message).toBe("User not found");
      }
    });

    it("should fail when region does not exist", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";
      const input: CreatePlaceInput = {
        name: "Place in Non-existent Region",
        category: "restaurant",
        regionId: nonExistentRegionId,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Nowhere Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_NOT_FOUND);
        expect(result.error.message).toBe("Region not found");
      }
    });

    it("should fail when editor tries to create place in region not owned by them", async () => {
      // Create another region by admin
      const adminRegionResult = await context.regionRepository.create(
        adminUser.id,
        {
          name: "Admin Region",
          images: [],
          tags: [],
        },
      );
      if (adminRegionResult.isErr()) {
        throw new Error("Failed to create admin region");
      }

      const input: CreatePlaceInput = {
        name: "Unauthorized Place",
        category: "restaurant",
        regionId: adminRegionResult.value.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Unauthorized Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        expect(result.error.message).toBe(
          "User does not have permission to add places to this region",
        );
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle maximum length name", async () => {
      const input: CreatePlaceInput = {
        name: "A".repeat(200), // Maximum length
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
      }
    });

    it("should handle maximum length description", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        description: "A".repeat(2000), // Maximum length
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(input.description);
      }
    });

    it("should handle maximum length short description", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        shortDescription: "A".repeat(300), // Maximum length
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.shortDescription).toBe(input.shortDescription);
      }
    });

    it("should handle boundary coordinates", async () => {
      const input: CreatePlaceInput = {
        name: "Boundary Place",
        category: "nature",
        regionId: testRegion.id,
        coordinates: {
          latitude: -90, // Minimum latitude
          longitude: -180, // Minimum longitude
        },
        address: "Edge of the world",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual(input.coordinates);
      }
    });

    it("should handle maximum boundary coordinates", async () => {
      const input: CreatePlaceInput = {
        name: "Max Boundary Place",
        category: "nature",
        regionId: testRegion.id,
        coordinates: {
          latitude: 90, // Maximum latitude
          longitude: 180, // Maximum longitude
        },
        address: "Other edge of the world",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual(input.coordinates);
      }
    });

    it("should handle maximum length address", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "A".repeat(500), // Maximum length
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.address).toBe(input.address);
      }
    });

    it("should handle maximum length phone", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        phone: "1".repeat(20), // Maximum length
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.phone).toBe(input.phone);
      }
    });

    it("should handle maximum length tags", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: ["A".repeat(50), "B".repeat(50), "C".repeat(50)], // Maximum tag length
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(input.tags);
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
        const input: CreatePlaceInput = {
          name: `Test ${category} Place`,
          category,
          regionId: testRegion.id,
          coordinates: {
            latitude: 35.6762,
            longitude: 139.6503,
          },
          address: "Tokyo, Japan",
          images: [],
          tags: [],
          businessHours: [],
        };

        const result = await createPlace(context, editorUser.id, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.category).toBe(category);
        }
      }
    });

    it("should handle unicode characters in name", async () => {
      const input: CreatePlaceInput = {
        name: "テスト場所 🌸 Café des Amis",
        category: "cafe",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
      }
    });

    it("should handle special characters in tags", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [
          "tag-with-dash",
          "tag_with_underscore",
          "tag.with.dot",
          "tag+plus",
          "café",
          "寿司",
        ],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(input.tags);
      }
    });

    it("should handle valid image URLs", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        coverImage:
          "https://secure.example.com/images/cover.jpg?v=123&size=large",
        images: [
          "https://example.com/image1.jpg",
          "https://subdomain.example.org/path/to/image2.png",
          "https://cdn.example.net/uploads/image3.webp",
        ],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coverImage).toBe(input.coverImage);
        expect(result.value.images).toEqual(input.images);
      }
    });

    it("should handle valid email and website URLs", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        email: "contact@example.com",
        website: "https://www.example.com",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.email).toBe(input.email);
        expect(result.value.website).toBe(input.website);
      }
    });

    it("should handle valid business hours", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [
          {
            dayOfWeek: "monday",
            openTime: "09:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            dayOfWeek: "tuesday",
            openTime: "09:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            dayOfWeek: "wednesday",
            isClosed: true,
          },
          {
            dayOfWeek: "thursday",
            openTime: "00:00",
            closeTime: "23:59",
            isClosed: false,
          },
        ],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.businessHours).toEqual(input.businessHours);
      }
    });

    it("should handle empty arrays", async () => {
      const input: CreatePlaceInput = {
        name: "Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.businessHours).toEqual([]);
      }
    });
  });

  describe("concurrent creation", () => {
    it("should handle concurrent place creation by same user", async () => {
      const inputs = [
        {
          name: "Place 1",
          category: "restaurant" as const,
          regionId: testRegion.id,
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          address: "Address 1",
          images: [],
          tags: [],
          businessHours: [],
        },
        {
          name: "Place 2",
          category: "cafe" as const,
          regionId: testRegion.id,
          coordinates: { latitude: 35.6763, longitude: 139.6504 },
          address: "Address 2",
          images: [],
          tags: [],
          businessHours: [],
        },
        {
          name: "Place 3",
          category: "hotel" as const,
          regionId: testRegion.id,
          coordinates: { latitude: 35.6764, longitude: 139.6505 },
          address: "Address 3",
          images: [],
          tags: [],
          businessHours: [],
        },
      ];

      const results = await Promise.all(
        inputs.map((input) => createPlace(context, editorUser.id, input)),
      );

      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }

      // Verify all places have unique IDs
      const placeIds = results.map((r) => (r.isOk() ? r.value.id : ""));
      const uniqueIds = new Set(placeIds);
      expect(uniqueIds.size).toBe(inputs.length);
    });

    it("should handle concurrent place creation by different users", async () => {
      const input: CreatePlaceInput = {
        name: "Concurrent Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Concurrent Street, Tokyo",
        images: [],
        tags: [],
        businessHours: [],
      };

      const results = await Promise.all([
        createPlace(context, editorUser.id, input),
        createPlace(context, adminUser.id, input),
      ]);

      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }

      // Verify places are created by different users
      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.createdBy).toBe(editorUser.id);
        expect(results[1].value.createdBy).toBe(adminUser.id);
        expect(results[0].value.id).not.toBe(results[1].value.id);
      }
    });
  });

  describe("data integrity", () => {
    it("should set default values correctly", async () => {
      const input: CreatePlaceInput = {
        name: "Default Values Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const result = await createPlace(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("draft");
        expect(result.value.visitCount).toBe(0);
        expect(result.value.favoriteCount).toBe(0);
        expect(result.value.checkinCount).toBe(0);
        expect(result.value.averageRating).toBeUndefined();
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.businessHours).toEqual([]);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
        expect(result.value.createdAt.getTime()).toBe(
          result.value.updatedAt.getTime(),
        );
      }
    });

    it("should generate unique UUIDs", async () => {
      const input: CreatePlaceInput = {
        name: "UUID Test Place",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        images: [],
        tags: [],
        businessHours: [],
      };

      const results = await Promise.all([
        createPlace(context, editorUser.id, input),
        createPlace(context, editorUser.id, {
          ...input,
          name: "UUID Test Place 2",
        }),
      ]);

      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(true);

      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.id).not.toBe(results[1].value.id);
        expect(results[0].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(results[1].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    });
  });

  describe("transaction handling", () => {
    it("should fail when transaction fails", async () => {
      // Create context that fails transactions
      const failingContext = createMockContext({ shouldFailTransaction: true });

      // Set up test user and region in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "editor@example.com",
          password: hashedPassword.value,
          name: "Editor User",
        });
      }

      const editorResult =
        await failingContext.userRepository.findByEmail("editor@example.com");
      if (editorResult.isOk() && editorResult.value) {
        await failingContext.userRepository.updateRole(
          editorResult.value.id,
          "editor",
        );

        const regionResult = await failingContext.regionRepository.create(
          editorResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const input: CreatePlaceInput = {
            name: "Transaction Test Place",
            category: "restaurant",
            regionId: regionResult.value.id,
            coordinates: {
              latitude: 35.6762,
              longitude: 139.6503,
            },
            address: "Tokyo, Japan",
            images: [],
            tags: [],
            businessHours: [],
          };

          const result = await createPlace(
            failingContext,
            editorResult.value.id,
            input,
          );

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBe(ERROR_CODES.TRANSACTION_FAILED);
          }
        }
      }
    });
  });
});
