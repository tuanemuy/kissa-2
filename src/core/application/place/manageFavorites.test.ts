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
  addPlaceToFavorites,
  getUserFavoriteList,
  getUserFavoritePlaces,
  removePlaceFromFavorites,
} from "./manageFavorites";

describe("manageFavorites", () => {
  let context: Context;
  let user1: User;
  let user2: User;
  let editorUser: User;
  let testRegion: Region;
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

    // Create test region
    const regionResult = await context.regionRepository.create(editorUser.id, {
      name: "Test Region",
      description: "A test region for place favorites testing",
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

    // Create test places
    const place1Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Sushi Restaurant",
      description: "Premium sushi restaurant in Tokyo",
      shortDescription: "Premium sushi",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: { latitude: 35.6795, longitude: 139.6516 },
      address: "1-1-1 Shibuya, Tokyo, Japan",
      images: [],
      tags: ["sushi", "premium"],
      businessHours: [],
    });
    if (place1Result.isErr()) {
      throw new Error("Failed to create test place 1");
    }
    testPlace1 = place1Result.value;
    await context.placeRepository.updateStatus(testPlace1.id, "published");

    const place2Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Coffee Shop",
      description: "Cozy coffee shop in Tokyo",
      shortDescription: "Cozy coffee",
      category: "cafe",
      regionId: testRegion.id,
      coordinates: { latitude: 35.68, longitude: 139.652 },
      address: "2-2-2 Harajuku, Tokyo, Japan",
      images: [],
      tags: ["coffee", "cozy"],
      businessHours: [],
    });
    if (place2Result.isErr()) {
      throw new Error("Failed to create test place 2");
    }
    testPlace2 = place2Result.value;
    await context.placeRepository.updateStatus(testPlace2.id, "published");

    const place3Result = await context.placeRepository.create(editorUser.id, {
      name: "Tokyo Luxury Hotel",
      description: "Luxury hotel in Tokyo",
      shortDescription: "Luxury hotel",
      category: "hotel",
      regionId: testRegion.id,
      coordinates: { latitude: 35.6805, longitude: 139.6525 },
      address: "3-3-3 Ginza, Tokyo, Japan",
      images: [],
      tags: ["hotel", "luxury"],
      businessHours: [],
    });
    if (place3Result.isErr()) {
      throw new Error("Failed to create test place 3");
    }
    testPlace3 = place3Result.value;
    await context.placeRepository.updateStatus(testPlace3.id, "published");
  });

  describe("addPlaceToFavorites", () => {
    it("should successfully add a place to favorites", async () => {
      const params = {
        userId: user1.id,
        placeId: testPlace1.id,
      };

      const result = await addPlaceToFavorites(context, params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favorite = result.value;
        expect(favorite.userId).toBe(user1.id);
        expect(favorite.placeId).toBe(testPlace1.id);
        expect(favorite.createdAt).toBeDefined();
      }
    });

    it("should fail when place does not exist", async () => {
      const params = {
        userId: user1.id,
        placeId: "non-existent-place-id",
      };

      const result = await addPlaceToFavorites(context, params);

      expect(result.isErr()).toBe(true);
    });

    it("should fail when place is already favorited", async () => {
      const params = {
        userId: user1.id,
        placeId: testPlace1.id,
      };

      // Add to favorites first
      const firstResult = await addPlaceToFavorites(context, params);
      expect(firstResult.isOk()).toBe(true);

      // Try to add again
      const secondResult = await addPlaceToFavorites(context, params);

      expect(secondResult.isErr()).toBe(true);
    });

    it("should allow different users to favorite the same place", async () => {
      const params1 = {
        userId: user1.id,
        placeId: testPlace1.id,
      };

      const params2 = {
        userId: user2.id,
        placeId: testPlace1.id,
      };

      const result1 = await addPlaceToFavorites(context, params1);
      const result2 = await addPlaceToFavorites(context, params2);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        expect(result1.value.userId).toBe(user1.id);
        expect(result2.value.userId).toBe(user2.id);
        expect(result1.value.placeId).toBe(testPlace1.id);
        expect(result2.value.placeId).toBe(testPlace1.id);
      }
    });

    it("should handle invalid user ID", async () => {
      const params = {
        userId: "invalid-user-id",
        placeId: testPlace1.id,
      };

      const result = await addPlaceToFavorites(context, params);

      // This should be handled by the repository layer
      expect(result.isErr()).toBe(true);
    });

    it("should handle invalid place ID format", async () => {
      const params = {
        userId: user1.id,
        placeId: "invalid-place-id",
      };

      const result = await addPlaceToFavorites(context, params);

      expect(result.isErr()).toBe(true);
    });
  });

  describe("removePlaceFromFavorites", () => {
    it("should successfully remove a place from favorites", async () => {
      // Add to favorites first
      const addParams = {
        userId: user1.id,
        placeId: testPlace1.id,
      };
      const addResult = await addPlaceToFavorites(context, addParams);
      expect(addResult.isOk()).toBe(true);

      // Remove from favorites
      const removeResult = await removePlaceFromFavorites(
        context,
        user1.id,
        testPlace1.id,
      );

      expect(removeResult.isOk()).toBe(true);

      // Verify it's removed by checking favorites list
      const favoritesResult = await getUserFavoriteList(context, user1.id);
      expect(favoritesResult.isOk()).toBe(true);
      if (favoritesResult.isOk()) {
        const favorites = favoritesResult.value;
        expect(
          favorites.find((f) => f.placeId === testPlace1.id),
        ).toBeUndefined();
      }
    });

    it("should fail when place is not favorited", async () => {
      const result = await removePlaceFromFavorites(
        context,
        user1.id,
        testPlace1.id,
      );

      expect(result.isErr()).toBe(true);
    });

    it("should fail when user ID is invalid", async () => {
      const result = await removePlaceFromFavorites(
        context,
        "invalid-user-id",
        testPlace1.id,
      );

      expect(result.isErr()).toBe(true);
    });

    it("should fail when place ID is invalid", async () => {
      const result = await removePlaceFromFavorites(
        context,
        user1.id,
        "invalid-place-id",
      );

      expect(result.isErr()).toBe(true);
    });

    it("should only remove favorite for the specific user", async () => {
      // Both users favorite the same place
      const params1 = { userId: user1.id, placeId: testPlace1.id };
      const params2 = { userId: user2.id, placeId: testPlace1.id };

      await addPlaceToFavorites(context, params1);
      await addPlaceToFavorites(context, params2);

      // Remove for user1 only
      const removeResult = await removePlaceFromFavorites(
        context,
        user1.id,
        testPlace1.id,
      );
      expect(removeResult.isOk()).toBe(true);

      // Verify user1 no longer has it favorited
      const user1FavoritesResult = await getUserFavoriteList(context, user1.id);
      expect(user1FavoritesResult.isOk()).toBe(true);
      if (user1FavoritesResult.isOk()) {
        const user1Favorites = user1FavoritesResult.value;
        expect(
          user1Favorites.find((f) => f.placeId === testPlace1.id),
        ).toBeUndefined();
      }

      // Verify user2 still has it favorited
      const user2FavoritesResult = await getUserFavoriteList(context, user2.id);
      expect(user2FavoritesResult.isOk()).toBe(true);
      if (user2FavoritesResult.isOk()) {
        const user2Favorites = user2FavoritesResult.value;
        expect(
          user2Favorites.find((f) => f.placeId === testPlace1.id),
        ).toBeDefined();
      }
    });
  });

  describe("getUserFavoritePlaces", () => {
    it("should successfully get user's favorite places", async () => {
      // Add multiple places to favorites
      const params1 = { userId: user1.id, placeId: testPlace1.id };
      const params2 = { userId: user1.id, placeId: testPlace2.id };

      await addPlaceToFavorites(context, params1);
      await addPlaceToFavorites(context, params2);

      const result = await getUserFavoritePlaces(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoritePlaces = result.value;
        expect(favoritePlaces).toHaveLength(2);

        const placeIds = favoritePlaces.map((p) => p.id);
        expect(placeIds).toContain(testPlace1.id);
        expect(placeIds).toContain(testPlace2.id);

        // Verify places have isFavorited flag
        favoritePlaces.forEach((place) => {
          expect(place.isFavorited).toBe(true);
        });
      }
    });

    it("should return empty array when user has no favorites", async () => {
      const result = await getUserFavoritePlaces(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoritePlaces = result.value;
        expect(favoritePlaces).toHaveLength(0);
      }
    });

    it("should respect limit parameter", async () => {
      // Add multiple places to favorites
      const params1 = { userId: user1.id, placeId: testPlace1.id };
      const params2 = { userId: user1.id, placeId: testPlace2.id };
      const params3 = { userId: user1.id, placeId: testPlace3.id };

      await addPlaceToFavorites(context, params1);
      await addPlaceToFavorites(context, params2);
      await addPlaceToFavorites(context, params3);

      const result = await getUserFavoritePlaces(context, user1.id, 2);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoritePlaces = result.value;
        expect(favoritePlaces).toHaveLength(2);
      }
    });

    it("should handle invalid user ID", async () => {
      const result = await getUserFavoritePlaces(context, "invalid-user-id");

      expect(result.isErr()).toBe(true);
    });

    it("should return different favorites for different users", async () => {
      // User1 favorites place1 and place2
      await addPlaceToFavorites(context, {
        userId: user1.id,
        placeId: testPlace1.id,
      });
      await addPlaceToFavorites(context, {
        userId: user1.id,
        placeId: testPlace2.id,
      });

      // User2 favorites place2 and place3
      await addPlaceToFavorites(context, {
        userId: user2.id,
        placeId: testPlace2.id,
      });
      await addPlaceToFavorites(context, {
        userId: user2.id,
        placeId: testPlace3.id,
      });

      const user1Result = await getUserFavoritePlaces(context, user1.id);
      const user2Result = await getUserFavoritePlaces(context, user2.id);

      expect(user1Result.isOk()).toBe(true);
      expect(user2Result.isOk()).toBe(true);

      if (user1Result.isOk() && user2Result.isOk()) {
        const user1Places = user1Result.value;
        const user2Places = user2Result.value;

        expect(user1Places).toHaveLength(2);
        expect(user2Places).toHaveLength(2);

        const user1PlaceIds = user1Places.map((p) => p.id);
        const user2PlaceIds = user2Places.map((p) => p.id);

        expect(user1PlaceIds).toContain(testPlace1.id);
        expect(user1PlaceIds).toContain(testPlace2.id);
        expect(user2PlaceIds).toContain(testPlace2.id);
        expect(user2PlaceIds).toContain(testPlace3.id);
      }
    });
  });

  describe("getUserFavoriteList", () => {
    it("should successfully get user's favorite list", async () => {
      // Add multiple places to favorites
      const params1 = { userId: user1.id, placeId: testPlace1.id };
      const params2 = { userId: user1.id, placeId: testPlace2.id };

      await addPlaceToFavorites(context, params1);
      await addPlaceToFavorites(context, params2);

      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoriteList = result.value;
        expect(favoriteList).toHaveLength(2);

        favoriteList.forEach((favorite) => {
          expect(favorite.userId).toBe(user1.id);
          expect(favorite.id).toBeDefined();
          expect(favorite.createdAt).toBeDefined();
        });

        const placeIds = favoriteList.map((f) => f.placeId);
        expect(placeIds).toContain(testPlace1.id);
        expect(placeIds).toContain(testPlace2.id);
      }
    });

    it("should return empty array when user has no favorites", async () => {
      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoriteList = result.value;
        expect(favoriteList).toHaveLength(0);
      }
    });

    it("should handle invalid user ID", async () => {
      const result = await getUserFavoriteList(context, "invalid-user-id");

      expect(result.isErr()).toBe(true);
    });

    it("should maintain chronological order", async () => {
      // Add favorites with slight delay to ensure different timestamps
      await addPlaceToFavorites(context, {
        userId: user1.id,
        placeId: testPlace1.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await addPlaceToFavorites(context, {
        userId: user1.id,
        placeId: testPlace2.id,
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      await addPlaceToFavorites(context, {
        userId: user1.id,
        placeId: testPlace3.id,
      });

      const result = await getUserFavoriteList(context, user1.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const favoriteList = result.value;
        expect(favoriteList).toHaveLength(3);

        // Verify chronological order (most recent first)
        for (let i = 0; i < favoriteList.length - 1; i++) {
          expect(favoriteList[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            favoriteList[i + 1].createdAt.getTime(),
          );
        }
      }
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent favorite additions", async () => {
      const params1 = { userId: user1.id, placeId: testPlace1.id };
      const params2 = { userId: user1.id, placeId: testPlace2.id };

      // Attempt concurrent additions
      const [result1, result2] = await Promise.all([
        addPlaceToFavorites(context, params1),
        addPlaceToFavorites(context, params2),
      ]);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      // Verify both favorites were added
      const favoritesResult = await getUserFavoriteList(context, user1.id);
      expect(favoritesResult.isOk()).toBe(true);
      if (favoritesResult.isOk()) {
        const favorites = favoritesResult.value;
        expect(favorites).toHaveLength(2);
      }
    });

    it("should handle concurrent favorite of same place", async () => {
      const params = { userId: user1.id, placeId: testPlace1.id };

      // Attempt concurrent additions of the same place
      const [result1, result2] = await Promise.all([
        addPlaceToFavorites(context, params),
        addPlaceToFavorites(context, params),
      ]);

      // One should succeed, one should fail
      const successCount = [result1, result2].filter((r) => r.isOk()).length;
      const errorResults = [result1, result2].filter((r) => r.isErr());

      expect(successCount).toBe(1);
      expect(errorResults).toHaveLength(1);
    });

    it("should handle concurrent add and remove operations", async () => {
      // Add to favorites first
      const addParams = { userId: user1.id, placeId: testPlace1.id };
      const addResult = await addPlaceToFavorites(context, addParams);
      expect(addResult.isOk()).toBe(true);

      // Attempt concurrent add and remove
      const addParams2 = { userId: user1.id, placeId: testPlace2.id };
      const [addResult2, removeResult] = await Promise.all([
        addPlaceToFavorites(context, addParams2),
        removePlaceFromFavorites(context, user1.id, testPlace1.id),
      ]);

      expect(addResult2.isOk()).toBe(true);
      expect(removeResult.isOk()).toBe(true);

      // Verify final state
      const favoritesResult = await getUserFavoriteList(context, user1.id);
      expect(favoritesResult.isOk()).toBe(true);
      if (favoritesResult.isOk()) {
        const favorites = favoritesResult.value;
        expect(favorites).toHaveLength(1);
        expect(favorites[0].placeId).toBe(testPlace2.id);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle removing a favorite that was already removed", async () => {
      // Add to favorites
      const addParams = { userId: user1.id, placeId: testPlace1.id };
      await addPlaceToFavorites(context, addParams);

      // Remove it
      const removeResult1 = await removePlaceFromFavorites(
        context,
        user1.id,
        testPlace1.id,
      );
      expect(removeResult1.isOk()).toBe(true);

      // Try to remove it again
      const removeResult2 = await removePlaceFromFavorites(
        context,
        user1.id,
        testPlace1.id,
      );
      expect(removeResult2.isErr()).toBe(true);
    });

    it("should handle favorites with draft places", async () => {
      // Create a draft place
      const draftPlaceResult = await context.placeRepository.create(
        editorUser.id,
        {
          name: "Draft Place",
          description: "A draft place",
          shortDescription: "Draft",
          category: "restaurant",
          regionId: testRegion.id,
          coordinates: { latitude: 35.681, longitude: 139.653 },
          address: "4-4-4 Test, Tokyo, Japan",
          images: [],
          tags: ["draft"],
          businessHours: [],
        },
      );
      expect(draftPlaceResult.isOk()).toBe(true);

      if (draftPlaceResult.isOk()) {
        const draftPlace = draftPlaceResult.value;

        // Try to favorite the draft place
        const addParams = { userId: user1.id, placeId: draftPlace.id };
        const addResult = await addPlaceToFavorites(context, addParams);

        // This should work - users can favorite draft places
        expect(addResult.isOk()).toBe(true);
      }
    });

    it("should handle large number of favorites", async () => {
      // Create many places and favorite them
      const places = [];
      for (let i = 0; i < 50; i++) {
        const placeResult = await context.placeRepository.create(
          editorUser.id,
          {
            name: `Test Place ${i}`,
            description: `Description ${i}`,
            shortDescription: `Short ${i}`,
            category: "restaurant",
            regionId: testRegion.id,
            coordinates: {
              latitude: 35.6762 + i * 0.001,
              longitude: 139.6503 + i * 0.001,
            },
            address: `${i}-${i}-${i} Test, Tokyo, Japan`,
            images: [],
            tags: [`tag${i}`],
            businessHours: [],
          },
        );
        expect(placeResult.isOk()).toBe(true);
        if (placeResult.isOk()) {
          places.push(placeResult.value);
        }
      }

      // Add all to favorites
      for (const place of places) {
        const addParams = { userId: user1.id, placeId: place.id };
        const addResult = await addPlaceToFavorites(context, addParams);
        expect(addResult.isOk()).toBe(true);
      }

      // Get favorites list
      const favoritesResult = await getUserFavoritePlaces(context, user1.id);
      expect(favoritesResult.isOk()).toBe(true);
      if (favoritesResult.isOk()) {
        const favorites = favoritesResult.value;
        expect(favorites).toHaveLength(50);
      }
    });
  });
});
