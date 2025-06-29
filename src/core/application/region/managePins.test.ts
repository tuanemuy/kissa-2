import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  getUserPinList,
  getUserPinnedRegions,
  pinRegion,
  reorderPinnedRegions,
  unpinRegion,
} from "./managePins";

describe("managePins", () => {
  let context: Context;
  let user1: User;
  let user2: User;
  let region1: Region;
  let region2: Region;
  let region3: Region;
  let region4: Region;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create user 1
    const user1Result = await context.userRepository.create({
      email: "user1@example.com",
      password: hashedPassword.value,
      name: "User 1",
    });
    if (user1Result.isErr()) {
      throw new Error("Failed to create user 1");
    }
    user1 = user1Result.value;

    // Create user 2
    const user2Result = await context.userRepository.create({
      email: "user2@example.com",
      password: hashedPassword.value,
      name: "User 2",
    });
    if (user2Result.isErr()) {
      throw new Error("Failed to create user 2");
    }
    user2 = user2Result.value;

    // Create editor for regions
    const editorResult = await context.userRepository.create({
      email: "editor@example.com",
      password: hashedPassword.value,
      name: "Editor User",
    });
    if (editorResult.isErr()) {
      throw new Error("Failed to create editor user");
    }
    const editorUser = editorResult.value;
    await context.userRepository.updateRole(editorUser.id, "editor");

    // Create test regions
    const region1Result = await context.regionRepository.create(editorUser.id, {
      name: "Tokyo",
      description: "Capital of Japan",
      shortDescription: "Capital city",
      coordinates: { latitude: 35.6762, longitude: 139.6503 },
      address: "Tokyo, Japan",
      coverImage: "https://example.com/tokyo.jpg",
      images: ["https://example.com/tokyo1.jpg"],
      tags: ["urban", "capital"],
    });
    if (region1Result.isErr()) {
      throw new Error("Failed to create region 1");
    }
    region1 = region1Result.value;
    await context.regionRepository.updateStatus(region1.id, "published");

    const region2Result = await context.regionRepository.create(editorUser.id, {
      name: "Osaka",
      description: "Food capital of Japan",
      shortDescription: "Food capital",
      coordinates: { latitude: 34.6937, longitude: 135.5023 },
      address: "Osaka, Japan",
      coverImage: "https://example.com/osaka.jpg",
      images: ["https://example.com/osaka1.jpg"],
      tags: ["food", "culture"],
    });
    if (region2Result.isErr()) {
      throw new Error("Failed to create region 2");
    }
    region2 = region2Result.value;
    await context.regionRepository.updateStatus(region2.id, "published");

    const region3Result = await context.regionRepository.create(editorUser.id, {
      name: "Kyoto",
      description: "Historic capital of Japan",
      shortDescription: "Historic city",
      coordinates: { latitude: 35.0116, longitude: 135.7681 },
      address: "Kyoto, Japan",
      coverImage: "https://example.com/kyoto.jpg",
      images: ["https://example.com/kyoto1.jpg"],
      tags: ["historic", "temples"],
    });
    if (region3Result.isErr()) {
      throw new Error("Failed to create region 3");
    }
    region3 = region3Result.value;
    await context.regionRepository.updateStatus(region3.id, "published");

    const region4Result = await context.regionRepository.create(editorUser.id, {
      name: "Hiroshima",
      description: "Peace memorial city",
      shortDescription: "Peace city",
      coordinates: { latitude: 34.3853, longitude: 132.4553 },
      address: "Hiroshima, Japan",
      coverImage: "https://example.com/hiroshima.jpg",
      images: ["https://example.com/hiroshima1.jpg"],
      tags: ["history", "peace"],
    });
    if (region4Result.isErr()) {
      throw new Error("Failed to create region 4");
    }
    region4 = region4Result.value;
    await context.regionRepository.updateStatus(region4.id, "published");
  });

  describe("pinRegion", () => {
    it("should pin region successfully", async () => {
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      const result = await pinRegion(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(user1.id);
        expect(result.value.regionId).toBe(region1.id);
        expect(result.value.id).toBeDefined();
        expect(result.value.displayOrder).toBeGreaterThanOrEqual(0);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should pin region with custom display order", async () => {
      const params = {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 5,
      };

      const result = await pinRegion(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.displayOrder).toBe(5);
      }
    });

    it("should pin multiple regions for same user", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      };
      const params2 = {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      };

      const result1 = await pinRegion(context, params1);
      const result2 = await pinRegion(context, params2);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.regionId).toBe(region1.id);
        expect(result2.value.regionId).toBe(region2.id);
        expect(result1.value.displayOrder).toBe(1);
        expect(result2.value.displayOrder).toBe(2);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it("should pin same region for different users", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
      };
      const params2 = {
        userId: user2.id,
        regionId: region1.id,
      };

      const result1 = await pinRegion(context, params1);
      const result2 = await pinRegion(context, params2);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.userId).toBe(user1.id);
        expect(result2.value.userId).toBe(user2.id);
        expect(result1.value.regionId).toBe(region1.id);
        expect(result2.value.regionId).toBe(region1.id);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it("should fail when region does not exist", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";
      const params = {
        userId: user1.id,
        regionId: nonExistentRegionId,
      };

      const result = await pinRegion(context, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Region not found");
      }
    });

    it("should fail when region is already pinned", async () => {
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      // Pin region first time
      const firstResult = await pinRegion(context, params);
      expect(firstResult.isOk()).toBe(true);

      // Try to pin again
      const secondResult = await pinRegion(context, params);
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.message).toBe("Region is already pinned");
      }
    });

    it("should handle repository findById failure", async () => {
      const failingContext = createMockContext({ shouldFailFindById: true });
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      const result = await pinRegion(failingContext, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to verify region existence");
      }
    });

    it("should handle repository findByUserAndRegion failure", async () => {
      const failingContext = createMockContext({
        shouldFailFindByUserAndRegion: true,
      });

      // Set up test data in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "editor@example.com",
          password: hashedPassword.value,
          name: "Editor User",
        });
        await failingContext.userRepository.create({
          email: "user1@example.com",
          password: hashedPassword.value,
          name: "User 1",
        });
      }

      const editorResult =
        await failingContext.userRepository.findByEmail("editor@example.com");
      const userResult =
        await failingContext.userRepository.findByEmail("user1@example.com");

      if (
        editorResult.isOk() &&
        editorResult.value &&
        userResult.isOk() &&
        userResult.value
      ) {
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
          const params = {
            userId: userResult.value.id,
            regionId: regionResult.value.id,
          };

          const result = await pinRegion(failingContext, params);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.message).toBe("Failed to check existing pin");
          }
        }
      }
    });

    it("should handle repository add failure", async () => {
      const failingContext = createMockContext({ shouldFailAdd: true });

      // Set up test data in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "editor@example.com",
          password: hashedPassword.value,
          name: "Editor User",
        });
        await failingContext.userRepository.create({
          email: "user1@example.com",
          password: hashedPassword.value,
          name: "User 1",
        });
      }

      const editorResult =
        await failingContext.userRepository.findByEmail("editor@example.com");
      const userResult =
        await failingContext.userRepository.findByEmail("user1@example.com");

      if (
        editorResult.isOk() &&
        editorResult.value &&
        userResult.isOk() &&
        userResult.value
      ) {
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
          const params = {
            userId: userResult.value.id,
            regionId: regionResult.value.id,
          };

          const result = await pinRegion(failingContext, params);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.message).toBe("Failed to pin region");
          }
        }
      }
    });

    it("should handle malformed UUIDs", async () => {
      const params = {
        userId: "not-a-valid-uuid",
        regionId: region1.id,
      };

      const result = await pinRegion(context, params);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("unpinRegion", () => {
    beforeEach(async () => {
      // Pin some regions for testing removal
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      });
      await pinRegion(context, {
        userId: user2.id,
        regionId: region1.id,
        displayOrder: 1,
      });
    });

    it("should unpin region successfully", async () => {
      const result = await unpinRegion(context, user1.id, region1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify it's unpinned by trying to unpin again
      const secondResult = await unpinRegion(context, user1.id, region1.id);
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.message).toBe("Region is not pinned");
      }
    });

    it("should unpin correct region when multiple users pin same region", async () => {
      // Unpin region1 from user1's pins
      const result = await unpinRegion(context, user1.id, region1.id);
      expect(result.isOk()).toBe(true);

      // user2 should still have region1 pinned
      const user2PinsResult = await getUserPinList(context, user2.id);
      expect(user2PinsResult.isOk()).toBe(true);
      if (user2PinsResult.isOk()) {
        const hasRegion1 = user2PinsResult.value.some(
          (pin) => pin.regionId === region1.id,
        );
        expect(hasRegion1).toBe(true);
      }
    });

    it("should unpin correct region when user has multiple pins", async () => {
      // Unpin region1 from user1's pins
      const result = await unpinRegion(context, user1.id, region1.id);
      expect(result.isOk()).toBe(true);

      // user1 should still have region2 pinned
      const user1PinsResult = await getUserPinList(context, user1.id);
      expect(user1PinsResult.isOk()).toBe(true);
      if (user1PinsResult.isOk()) {
        expect(user1PinsResult.value).toHaveLength(1);
        expect(user1PinsResult.value[0].regionId).toBe(region2.id);
      }
    });

    it("should fail when region is not pinned", async () => {
      const result = await unpinRegion(context, user1.id, region3.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Region is not pinned");
      }
    });

    it("should fail when user has no pins", async () => {
      // Create a new user with no pins
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "newuser@example.com",
          password: hashedPassword.value,
          name: "New User",
        });

        if (newUserResult.isOk()) {
          const result = await unpinRegion(
            context,
            newUserResult.value.id,
            region1.id,
          );

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.message).toBe("Region is not pinned");
          }
        }
      }
    });

    it("should handle repository findByUserAndRegion failure", async () => {
      const failingContext = createMockContext({
        shouldFailFindByUserAndRegion: true,
      });

      const result = await unpinRegion(failingContext, user1.id, region1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to check existing pin");
      }
    });

    it("should handle repository remove failure", async () => {
      const failingContext = createMockContext({ shouldFailRemove: true });

      const result = await unpinRegion(failingContext, user1.id, region1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to unpin region");
      }
    });

    it("should handle malformed UUIDs", async () => {
      const result = await unpinRegion(context, "not-a-valid-uuid", region1.id);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("getUserPinnedRegions", () => {
    beforeEach(async () => {
      // Pin some regions for testing
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      });
      await pinRegion(context, {
        userId: user2.id,
        regionId: region3.id,
        displayOrder: 1,
      });
    });

    it("should get user's pinned regions with full data", async () => {
      const result = await getUserPinnedRegions(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(
          result.value.every((region) => typeof region.id === "string"),
        ).toBe(true);
        expect(
          result.value.every((region) => typeof region.name === "string"),
        ).toBe(true);
        expect(result.value.every((region) => region.isPinned === true)).toBe(
          true,
        );
        expect(
          result.value.every(
            (region) => typeof region.pinDisplayOrder === "number",
          ),
        ).toBe(true);

        const regionIds = result.value.map((r) => r.id);
        expect(regionIds).toContain(region1.id);
        expect(regionIds).toContain(region2.id);
        expect(regionIds).not.toContain(region3.id);

        // Check display order
        const region1Data = result.value.find((r) => r.id === region1.id);
        const region2Data = result.value.find((r) => r.id === region2.id);
        expect(region1Data?.pinDisplayOrder).toBe(1);
        expect(region2Data?.pinDisplayOrder).toBe(2);
      }
    });

    it("should return empty array when user has no pins", async () => {
      // Create a new user with no pins
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "nopins@example.com",
          password: hashedPassword.value,
          name: "No Pins User",
        });

        if (newUserResult.isOk()) {
          const result = await getUserPinnedRegions(
            context,
            newUserResult.value.id,
          );

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            expect(result.value).toHaveLength(0);
          }
        }
      }
    });

    it("should return different results for different users", async () => {
      const user1Result = await getUserPinnedRegions(context, user1.id);
      const user2Result = await getUserPinnedRegions(context, user2.id);

      expect(user1Result.isOk()).toBe(true);
      expect(user2Result.isOk()).toBe(true);

      if (user1Result.isOk() && user2Result.isOk()) {
        expect(user1Result.value).toHaveLength(2);
        expect(user2Result.value).toHaveLength(1);

        const user1RegionIds = user1Result.value.map((r) => r.id);
        const user2RegionIds = user2Result.value.map((r) => r.id);

        expect(user1RegionIds).toContain(region1.id);
        expect(user1RegionIds).toContain(region2.id);
        expect(user2RegionIds).toContain(region3.id);
        expect(user2RegionIds).not.toContain(region1.id);
        expect(user2RegionIds).not.toContain(region2.id);
      }
    });

    it("should handle repository failure", async () => {
      const failingContext = createMockContext({
        shouldFailGetRegionsWithPins: true,
      });

      const result = await getUserPinnedRegions(failingContext, user1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get pinned regions");
      }
    });

    it("should handle malformed user ID", async () => {
      const result = await getUserPinnedRegions(context, "not-a-valid-uuid");

      expect(result.isErr()).toBe(true);
    });
  });

  describe("getUserPinList", () => {
    beforeEach(async () => {
      // Pin some regions for testing
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      });
      await pinRegion(context, {
        userId: user2.id,
        regionId: region3.id,
        displayOrder: 1,
      });
    });

    it("should get user's pin list metadata", async () => {
      const result = await getUserPinList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value.every((pin) => typeof pin.id === "string")).toBe(
          true,
        );
        expect(result.value.every((pin) => pin.userId === user1.id)).toBe(true);
        expect(
          result.value.every((pin) => typeof pin.regionId === "string"),
        ).toBe(true);
        expect(
          result.value.every((pin) => typeof pin.displayOrder === "number"),
        ).toBe(true);
        expect(result.value.every((pin) => pin.createdAt instanceof Date)).toBe(
          true,
        );
        expect(result.value.every((pin) => pin.updatedAt instanceof Date)).toBe(
          true,
        );

        const regionIds = result.value.map((pin) => pin.regionId);
        expect(regionIds).toContain(region1.id);
        expect(regionIds).toContain(region2.id);
        expect(regionIds).not.toContain(region3.id);

        // Check display order
        const pin1 = result.value.find((pin) => pin.regionId === region1.id);
        const pin2 = result.value.find((pin) => pin.regionId === region2.id);
        expect(pin1?.displayOrder).toBe(1);
        expect(pin2?.displayOrder).toBe(2);
      }
    });

    it("should return empty array when user has no pins", async () => {
      // Create a new user with no pins
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "nopins2@example.com",
          password: hashedPassword.value,
          name: "No Pins User 2",
        });

        if (newUserResult.isOk()) {
          const result = await getUserPinList(context, newUserResult.value.id);

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            expect(result.value).toHaveLength(0);
          }
        }
      }
    });

    it("should return different results for different users", async () => {
      const user1Result = await getUserPinList(context, user1.id);
      const user2Result = await getUserPinList(context, user2.id);

      expect(user1Result.isOk()).toBe(true);
      expect(user2Result.isOk()).toBe(true);

      if (user1Result.isOk() && user2Result.isOk()) {
        expect(user1Result.value).toHaveLength(2);
        expect(user2Result.value).toHaveLength(1);

        expect(user1Result.value.every((pin) => pin.userId === user1.id)).toBe(
          true,
        );
        expect(user2Result.value.every((pin) => pin.userId === user2.id)).toBe(
          true,
        );

        const user1RegionIds = user1Result.value.map((pin) => pin.regionId);
        const user2RegionIds = user2Result.value.map((pin) => pin.regionId);

        expect(user1RegionIds).toContain(region1.id);
        expect(user1RegionIds).toContain(region2.id);
        expect(user2RegionIds).toContain(region3.id);
      }
    });

    it("should include timestamps", async () => {
      const result = await getUserPinList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.every((pin) => pin.createdAt instanceof Date)).toBe(
          true,
        );
        expect(result.value.every((pin) => pin.updatedAt instanceof Date)).toBe(
          true,
        );
        expect(result.value.every((pin) => pin.createdAt.getTime() > 0)).toBe(
          true,
        );
        expect(result.value.every((pin) => pin.updatedAt.getTime() > 0)).toBe(
          true,
        );
      }
    });

    it("should handle repository failure", async () => {
      const failingContext = createMockContext({ shouldFailFindByUser: true });

      const result = await getUserPinList(failingContext, user1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to get pin list");
      }
    });

    it("should handle malformed user ID", async () => {
      const result = await getUserPinList(context, "not-a-valid-uuid");

      expect(result.isErr()).toBe(true);
    });

    it("should return unique pin IDs", async () => {
      const result = await getUserPinList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const pinIds = result.value.map((pin) => pin.id);
        const uniqueIds = new Set(pinIds);
        expect(uniqueIds.size).toBe(pinIds.length);
      }
    });
  });

  describe("reorderPinnedRegions", () => {
    beforeEach(async () => {
      // Pin some regions for testing reorder
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region3.id,
        displayOrder: 3,
      });
    });

    it("should reorder pinned regions successfully", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region3.id, region1.id, region2.id], // New order
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify the new order
      const pinsResult = await getUserPinList(context, user1.id);
      expect(pinsResult.isOk()).toBe(true);
      if (pinsResult.isOk()) {
        // Sort by display order to check the new arrangement
        const sortedPins = pinsResult.value.sort(
          (a, b) => a.displayOrder - b.displayOrder,
        );
        expect(sortedPins[0].regionId).toBe(region3.id);
        expect(sortedPins[1].regionId).toBe(region1.id);
        expect(sortedPins[2].regionId).toBe(region2.id);
      }
    });

    it("should handle partial reorder", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region2.id, region1.id], // Only reorder first two
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should handle single region reorder", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region1.id], // Single region
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should handle empty reorder list", async () => {
      const params = {
        userId: user1.id,
        regionIds: [], // Empty list
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should fail when region is not pinned by user", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region1.id, region4.id], // region4 is not pinned
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          `Region ${region4.id} is not pinned by user`,
        );
      }
    });

    it("should fail when user has no pins", async () => {
      // Create a new user with no pins
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "nopins3@example.com",
          password: hashedPassword.value,
          name: "No Pins User 3",
        });

        if (newUserResult.isOk()) {
          const params = {
            userId: newUserResult.value.id,
            regionIds: [region1.id],
          };

          const result = await reorderPinnedRegions(context, params);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.message).toBe(
              `Region ${region1.id} is not pinned by user`,
            );
          }
        }
      }
    });

    it("should handle repository findByUser failure", async () => {
      const failingContext = createMockContext({ shouldFailFindByUser: true });

      const params = {
        userId: user1.id,
        regionIds: [region1.id, region2.id],
      };

      const result = await reorderPinnedRegions(failingContext, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Failed to get user's pinned regions",
        );
      }
    });

    it("should handle repository reorder failure", async () => {
      const failingContext = createMockContext({ shouldFailReorder: true });

      const params = {
        userId: user1.id,
        regionIds: [region1.id, region2.id],
      };

      const result = await reorderPinnedRegions(failingContext, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Failed to reorder pinned regions");
      }
    });

    it("should validate all region IDs before reordering", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region1.id, region2.id, region4.id], // Mix of pinned and unpinned
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          `Region ${region4.id} is not pinned by user`,
        );
      }
    });

    it("should handle duplicate region IDs", async () => {
      const params = {
        userId: user1.id,
        regionIds: [region1.id, region2.id, region1.id], // Duplicate region1
      };

      const result = await reorderPinnedRegions(context, params);

      // Should still work - the validation only checks if regions are pinned
      expect(result.isOk()).toBe(true);
    });

    it("should handle malformed UUIDs", async () => {
      const params = {
        userId: "not-a-valid-uuid",
        regionIds: [region1.id],
      };

      const result = await reorderPinnedRegions(context, params);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent pinning of same region by different users", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
      };
      const params2 = {
        userId: user2.id,
        regionId: region1.id,
      };

      const results = await Promise.all([
        pinRegion(context, params1),
        pinRegion(context, params2),
      ]);

      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(true);

      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.userId).toBe(user1.id);
        expect(results[1].value.userId).toBe(user2.id);
        expect(results[0].value.regionId).toBe(region1.id);
        expect(results[1].value.regionId).toBe(region1.id);
      }
    });

    it("should handle concurrent pin and unpin", async () => {
      // First pin a region
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
      });

      // Then try concurrent pin (should fail) and unpin (should succeed)
      const results = await Promise.all([
        pinRegion(context, {
          userId: user1.id,
          regionId: region1.id,
        }), // Should fail - already pinned
        unpinRegion(context, user1.id, region1.id), // Should succeed
      ]);

      expect(results[0].isErr()).toBe(true); // Pin should fail
      expect(results[1].isOk()).toBe(true); // Unpin should succeed
    });

    it("should handle concurrent unpinning of same pin", async () => {
      // First pin a region
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
      });

      // Then try concurrent unpins
      const results = await Promise.all([
        unpinRegion(context, user1.id, region1.id),
        unpinRegion(context, user1.id, region1.id),
      ]);

      // One should succeed, one should fail
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });

    it("should handle concurrent reordering", async () => {
      // Pin multiple regions first
      await pinRegion(context, {
        userId: user1.id,
        regionId: region1.id,
        displayOrder: 1,
      });
      await pinRegion(context, {
        userId: user1.id,
        regionId: region2.id,
        displayOrder: 2,
      });

      const params1 = {
        userId: user1.id,
        regionIds: [region2.id, region1.id],
      };
      const params2 = {
        userId: user1.id,
        regionIds: [region1.id, region2.id],
      };

      const results = await Promise.all([
        reorderPinnedRegions(context, params1),
        reorderPinnedRegions(context, params2),
      ]);

      // Both should succeed (last one wins)
      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(true);
    });
  });
});
