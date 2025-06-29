import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  addRegionToFavorites,
  getUserFavoriteList,
  getUserFavoriteRegions,
  removeRegionFromFavorites,
} from "./manageFavorites";

describe("manageFavorites", () => {
  let context: Context;
  let user1: User;
  let user2: User;
  let region1: Region;
  let region2: Region;
  let region3: Region;

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
  });

  describe("addRegionToFavorites", () => {
    it("should add region to favorites successfully", async () => {
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      const result = await addRegionToFavorites(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(user1.id);
        expect(result.value.regionId).toBe(region1.id);
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should add multiple regions to favorites for same user", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
      };
      const params2 = {
        userId: user1.id,
        regionId: region2.id,
      };

      const result1 = await addRegionToFavorites(context, params1);
      const result2 = await addRegionToFavorites(context, params2);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.regionId).toBe(region1.id);
        expect(result2.value.regionId).toBe(region2.id);
        expect(result1.value.id).not.toBe(result2.value.id);
      }
    });

    it("should add same region to favorites for different users", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
      };
      const params2 = {
        userId: user2.id,
        regionId: region1.id,
      };

      const result1 = await addRegionToFavorites(context, params1);
      const result2 = await addRegionToFavorites(context, params2);

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

      const result = await addRegionToFavorites(context, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
      }
    });

    it("should fail when region is already favorited", async () => {
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      // Add to favorites first time
      const firstResult = await addRegionToFavorites(context, params);
      expect(firstResult.isOk()).toBe(true);

      // Try to add again
      const secondResult = await addRegionToFavorites(context, params);
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.code).toBeDefined();
      }
    });

    it("should handle repository findById failure", async () => {
      const failingContext = createMockContext({ shouldFailFindById: true });
      const params = {
        userId: user1.id,
        regionId: region1.id,
      };

      const result = await addRegionToFavorites(failingContext, params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
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

          const result = await addRegionToFavorites(failingContext, params);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBeDefined();
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

          const result = await addRegionToFavorites(failingContext, params);

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBeDefined();
          }
        }
      }
    });

    it("should handle malformed UUIDs", async () => {
      const params = {
        userId: "not-a-valid-uuid",
        regionId: region1.id,
      };

      const result = await addRegionToFavorites(context, params);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("removeRegionFromFavorites", () => {
    beforeEach(async () => {
      // Add some favorites for testing removal
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region1.id,
      });
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region2.id,
      });
      await addRegionToFavorites(context, {
        userId: user2.id,
        regionId: region1.id,
      });
    });

    it("should remove region from favorites successfully", async () => {
      const result = await removeRegionFromFavorites(
        context,
        user1.id,
        region1.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }

      // Verify it's removed by trying to remove again
      const secondResult = await removeRegionFromFavorites(
        context,
        user1.id,
        region1.id,
      );
      expect(secondResult.isErr()).toBe(true);
      if (secondResult.isErr()) {
        expect(secondResult.error.code).toBeDefined();
      }
    });

    it("should remove correct favorite when multiple users favorite same region", async () => {
      // Remove region1 from user1's favorites
      const result = await removeRegionFromFavorites(
        context,
        user1.id,
        region1.id,
      );
      expect(result.isOk()).toBe(true);

      // user2 should still have region1 in favorites
      const user2FavoritesResult = await getUserFavoriteList(context, user2.id);
      expect(user2FavoritesResult.isOk()).toBe(true);
      if (user2FavoritesResult.isOk()) {
        const hasRegion1 = user2FavoritesResult.value.some(
          (fav) => fav.regionId === region1.id,
        );
        expect(hasRegion1).toBe(true);
      }
    });

    it("should remove correct region when user has multiple favorites", async () => {
      // Remove region1 from user1's favorites
      const result = await removeRegionFromFavorites(
        context,
        user1.id,
        region1.id,
      );
      expect(result.isOk()).toBe(true);

      // user1 should still have region2 in favorites
      const user1FavoritesResult = await getUserFavoriteList(context, user1.id);
      expect(user1FavoritesResult.isOk()).toBe(true);
      if (user1FavoritesResult.isOk()) {
        expect(user1FavoritesResult.value).toHaveLength(1);
        expect(user1FavoritesResult.value[0].regionId).toBe(region2.id);
      }
    });

    it("should fail when region is not favorited", async () => {
      const result = await removeRegionFromFavorites(
        context,
        user1.id,
        region3.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
      }
    });

    it("should fail when user has no favorites", async () => {
      // Create a new user with no favorites
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "newuser@example.com",
          password: hashedPassword.value,
          name: "New User",
        });

        if (newUserResult.isOk()) {
          const result = await removeRegionFromFavorites(
            context,
            newUserResult.value.id,
            region1.id,
          );

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBeDefined();
          }
        }
      }
    });

    it("should handle repository findByUserAndRegion failure", async () => {
      const failingContext = createMockContext({
        shouldFailFindByUserAndRegion: true,
      });

      const result = await removeRegionFromFavorites(
        failingContext,
        user1.id,
        region1.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
      }
    });

    it("should handle repository remove failure", async () => {
      const failingContext = createMockContext({ shouldFailRemove: true });

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
          // First add to favorites with regular context
          await addRegionToFavorites(context, {
            userId: userResult.value.id,
            regionId: regionResult.value.id,
          });

          // Then try to remove with failing context
          const result = await removeRegionFromFavorites(
            failingContext,
            userResult.value.id,
            regionResult.value.id,
          );

          expect(result.isErr()).toBe(true);
          if (result.isErr()) {
            expect(result.error.code).toBeDefined();
          }
        }
      }
    });

    it("should handle malformed UUIDs", async () => {
      const result = await removeRegionFromFavorites(
        context,
        "not-a-valid-uuid",
        region1.id,
      );

      expect(result.isErr()).toBe(true);
    });
  });

  describe("getUserFavoriteRegions", () => {
    beforeEach(async () => {
      // Add some favorites for testing
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region1.id,
      });
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region2.id,
      });
      await addRegionToFavorites(context, {
        userId: user2.id,
        regionId: region3.id,
      });
    });

    it("should get user's favorite regions with full data", async () => {
      const result = await getUserFavoriteRegions(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(
          result.value.every((region) => typeof region.id === "string"),
        ).toBe(true);
        expect(
          result.value.every((region) => typeof region.name === "string"),
        ).toBe(true);
        expect(
          result.value.every((region) => region.isFavorited === true),
        ).toBe(true);

        const regionIds = result.value.map((r) => r.id);
        expect(regionIds).toContain(region1.id);
        expect(regionIds).toContain(region2.id);
        expect(regionIds).not.toContain(region3.id);
      }
    });

    it("should get user's favorite regions with limit", async () => {
      const result = await getUserFavoriteRegions(context, user1.id, 1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0].isFavorited).toBe(true);
      }
    });

    it("should return empty array when user has no favorites", async () => {
      // Create a new user with no favorites
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "nofavorites@example.com",
          password: hashedPassword.value,
          name: "No Favorites User",
        });

        if (newUserResult.isOk()) {
          const result = await getUserFavoriteRegions(
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
      const user1Result = await getUserFavoriteRegions(context, user1.id);
      const user2Result = await getUserFavoriteRegions(context, user2.id);

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
        shouldFailGetRegionsWithFavorites: true,
      });

      const result = await getUserFavoriteRegions(failingContext, user1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
      }
    });

    it("should handle zero limit", async () => {
      const result = await getUserFavoriteRegions(context, user1.id, 0);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle large limit", async () => {
      const result = await getUserFavoriteRegions(context, user1.id, 1000);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeLessThanOrEqual(1000);
        expect(result.value).toHaveLength(2); // User1 has 2 favorites
      }
    });

    it("should handle malformed user ID", async () => {
      const result = await getUserFavoriteRegions(context, "not-a-valid-uuid");

      expect(result.isErr()).toBe(true);
    });
  });

  describe("getUserFavoriteList", () => {
    beforeEach(async () => {
      // Add some favorites for testing
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region1.id,
      });
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region2.id,
      });
      await addRegionToFavorites(context, {
        userId: user2.id,
        regionId: region3.id,
      });
    });

    it("should get user's favorite list metadata", async () => {
      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value.every((fav) => typeof fav.id === "string")).toBe(
          true,
        );
        expect(result.value.every((fav) => fav.userId === user1.id)).toBe(true);
        expect(
          result.value.every((fav) => typeof fav.regionId === "string"),
        ).toBe(true);
        expect(result.value.every((fav) => fav.createdAt instanceof Date)).toBe(
          true,
        );

        const regionIds = result.value.map((fav) => fav.regionId);
        expect(regionIds).toContain(region1.id);
        expect(regionIds).toContain(region2.id);
        expect(regionIds).not.toContain(region3.id);
      }
    });

    it("should return empty array when user has no favorites", async () => {
      // Create a new user with no favorites
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const newUserResult = await context.userRepository.create({
          email: "nofavorites2@example.com",
          password: hashedPassword.value,
          name: "No Favorites User 2",
        });

        if (newUserResult.isOk()) {
          const result = await getUserFavoriteList(
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
      const user1Result = await getUserFavoriteList(context, user1.id);
      const user2Result = await getUserFavoriteList(context, user2.id);

      expect(user1Result.isOk()).toBe(true);
      expect(user2Result.isOk()).toBe(true);

      if (user1Result.isOk() && user2Result.isOk()) {
        expect(user1Result.value).toHaveLength(2);
        expect(user2Result.value).toHaveLength(1);

        expect(user1Result.value.every((fav) => fav.userId === user1.id)).toBe(
          true,
        );
        expect(user2Result.value.every((fav) => fav.userId === user2.id)).toBe(
          true,
        );

        const user1RegionIds = user1Result.value.map((fav) => fav.regionId);
        const user2RegionIds = user2Result.value.map((fav) => fav.regionId);

        expect(user1RegionIds).toContain(region1.id);
        expect(user1RegionIds).toContain(region2.id);
        expect(user2RegionIds).toContain(region3.id);
      }
    });

    it("should include creation timestamps", async () => {
      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.every((fav) => fav.createdAt instanceof Date)).toBe(
          true,
        );
        expect(result.value.every((fav) => fav.createdAt.getTime() > 0)).toBe(
          true,
        );
      }
    });

    it("should handle repository failure", async () => {
      const failingContext = createMockContext({ shouldFailFindByUser: true });

      const result = await getUserFavoriteList(failingContext, user1.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBeDefined();
      }
    });

    it("should handle malformed user ID", async () => {
      const result = await getUserFavoriteList(context, "not-a-valid-uuid");

      expect(result.isErr()).toBe(true);
    });

    it("should return unique favorite IDs", async () => {
      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoriteIds = result.value.map((fav) => fav.id);
        const uniqueIds = new Set(favoriteIds);
        expect(uniqueIds.size).toBe(favoriteIds.length);
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent additions of same region by different users", async () => {
      const params1 = {
        userId: user1.id,
        regionId: region1.id,
      };
      const params2 = {
        userId: user2.id,
        regionId: region1.id,
      };

      const results = await Promise.all([
        addRegionToFavorites(context, params1),
        addRegionToFavorites(context, params2),
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

    it("should handle concurrent addition and removal", async () => {
      // First add a favorite
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region1.id,
      });

      // Then try concurrent add (should fail) and remove (should succeed)
      const results = await Promise.all([
        addRegionToFavorites(context, {
          userId: user1.id,
          regionId: region1.id,
        }), // Should fail - already exists
        removeRegionFromFavorites(context, user1.id, region1.id), // Should succeed
      ]);

      expect(results[0].isErr()).toBe(true); // Add should fail
      expect(results[1].isOk()).toBe(true); // Remove should succeed
    });

    it("should handle concurrent removals of same favorite", async () => {
      // First add a favorite
      await addRegionToFavorites(context, {
        userId: user1.id,
        regionId: region1.id,
      });

      // Then try concurrent removals
      const results = await Promise.all([
        removeRegionFromFavorites(context, user1.id, region1.id),
        removeRegionFromFavorites(context, user1.id, region1.id),
      ]);

      // One should succeed, one should fail
      const successCount = results.filter((r) => r.isOk()).length;
      const failureCount = results.filter((r) => r.isErr()).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);
    });
  });
});
