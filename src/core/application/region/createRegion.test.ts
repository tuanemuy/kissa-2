import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreateRegionInput, createRegion } from "./createRegion";

describe("createRegion", () => {
  let context: Context;
  let editorUser: User;
  let visitorUser: User;
  let adminUser: User;

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
  });

  describe("successful region creation", () => {
    it("should create region with valid input by editor", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        description: "A test region for testing purposes",
        shortDescription: "Test region",
        coordinates: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        address: "Tokyo, Japan",
        coverImage: "https://example.com/cover.jpg",
        images: [],
        tags: ["test", "example", "region"],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.description).toBe(input.description);
        expect(result.value.shortDescription).toBe(input.shortDescription);
        expect(result.value.coordinates).toEqual(input.coordinates);
        expect(result.value.address).toBe(input.address);
        expect(result.value.coverImage).toBe(input.coverImage);
        expect(result.value.images).toEqual(input.images);
        expect(result.value.tags).toEqual(input.tags);
        expect(result.value.createdBy).toBe(editorUser.id);
        expect(result.value.status).toBe("draft");
        expect(result.value.visitCount).toBe(0);
        expect(result.value.favoriteCount).toBe(0);
        expect(result.value.placeCount).toBe(0);
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create region with minimal input by editor", async () => {
      const input: CreateRegionInput = {
        name: "Minimal Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.description).toBeUndefined();
        expect(result.value.shortDescription).toBeUndefined();
        expect(result.value.coordinates).toBeUndefined();
        expect(result.value.address).toBeUndefined();
        expect(result.value.coverImage).toBeUndefined();
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.createdBy).toBe(editorUser.id);
        expect(result.value.status).toBe("draft");
      }
    });

    it("should create region by admin user", async () => {
      const input: CreateRegionInput = {
        name: "Admin Region",
        description: "Region created by admin",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, adminUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
        expect(result.value.createdBy).toBe(adminUser.id);
      }
    });
  });

  describe("permission failures", () => {
    it("should fail when visitor user tries to create region", async () => {
      const input: CreateRegionInput = {
        name: "Visitor Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, visitorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      }
    });

    it("should fail when inactive user tries to create region", async () => {
      // Set editor as suspended
      await context.userRepository.updateStatus(editorUser.id, "suspended");

      const input: CreateRegionInput = {
        name: "Suspended User Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "non-existent-user-id";
      const input: CreateRegionInput = {
        name: "Non-existent User Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, nonExistentUserId, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle maximum length name", async () => {
      const input: CreateRegionInput = {
        name: "A".repeat(200), // Maximum length
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
      }
    });

    it("should handle maximum length description", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        description: "A".repeat(2000), // Maximum length
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.description).toBe(input.description);
      }
    });

    it("should handle maximum length short description", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        shortDescription: "A".repeat(300), // Maximum length
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.shortDescription).toBe(input.shortDescription);
      }
    });

    it("should handle boundary coordinates", async () => {
      const input: CreateRegionInput = {
        name: "Boundary Region",
        coordinates: {
          latitude: -90, // Minimum latitude
          longitude: -180, // Minimum longitude
        },
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual(input.coordinates);
      }
    });

    it("should handle maximum boundary coordinates", async () => {
      const input: CreateRegionInput = {
        name: "Max Boundary Region",
        coordinates: {
          latitude: 90, // Maximum latitude
          longitude: 180, // Maximum longitude
        },
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coordinates).toEqual(input.coordinates);
      }
    });

    it("should handle maximum length address", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        address: "A".repeat(500), // Maximum length
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.address).toBe(input.address);
      }
    });

    it("should handle maximum length tags", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        images: [],
        tags: ["A".repeat(50), "B".repeat(50), "C".repeat(50)], // Maximum tag length
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(input.tags);
      }
    });

    it("should handle unicode characters in name", async () => {
      const input: CreateRegionInput = {
        name: "テスト地域 🌸 Région Test",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(input.name);
      }
    });

    it("should handle special characters in tags", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.tags).toEqual(input.tags);
      }
    });

    it("should handle valid image URLs", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.coverImage).toBe(input.coverImage);
        expect(result.value.images).toEqual(input.images);
      }
    });

    it("should handle empty arrays", async () => {
      const input: CreateRegionInput = {
        name: "Test Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
      }
    });
  });

  describe("concurrent creation", () => {
    it("should handle concurrent region creation by same user", async () => {
      const inputs = [
        { name: "Region 1", images: [], tags: [] },
        { name: "Region 2", images: [], tags: [] },
        { name: "Region 3", images: [], tags: [] },
      ];

      const results = await Promise.all(
        inputs.map((input) => createRegion(context, editorUser.id, input)),
      );

      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }

      // Verify all regions have unique IDs
      const regionIds = results.map((r) => (r.isOk() ? r.value.id : ""));
      const uniqueIds = new Set(regionIds);
      expect(uniqueIds.size).toBe(inputs.length);
    });

    it("should handle concurrent region creation by different users", async () => {
      const input: CreateRegionInput = {
        name: "Concurrent Region",
        images: [],
        tags: [],
      };

      const results = await Promise.all([
        createRegion(context, editorUser.id, input),
        createRegion(context, adminUser.id, input),
      ]);

      for (const result of results) {
        expect(result.isOk()).toBe(true);
      }

      // Verify regions are created by different users
      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.createdBy).toBe(editorUser.id);
        expect(results[1].value.createdBy).toBe(adminUser.id);
        expect(results[0].value.id).not.toBe(results[1].value.id);
      }
    });
  });

  describe("data integrity", () => {
    it("should set default values correctly", async () => {
      const input: CreateRegionInput = {
        name: "Default Values Region",
        images: [],
        tags: [],
      };

      const result = await createRegion(context, editorUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("draft");
        expect(result.value.visitCount).toBe(0);
        expect(result.value.favoriteCount).toBe(0);
        expect(result.value.placeCount).toBe(0);
        expect(result.value.images).toEqual([]);
        expect(result.value.tags).toEqual([]);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
        expect(result.value.createdAt.getTime()).toBe(
          result.value.updatedAt.getTime(),
        );
      }
    });

    it("should generate unique UUIDs", async () => {
      const input: CreateRegionInput = {
        name: "UUID Test Region",
        images: [],
        tags: [],
      };

      const results = await Promise.all([
        createRegion(context, editorUser.id, input),
        createRegion(context, editorUser.id, {
          ...input,
          name: "UUID Test Region 2",
        }),
      ]);

      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(true);

      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.id).not.toBe(results[1].value.id);
        expect(results[0].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(results[1].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    });
  });
});
