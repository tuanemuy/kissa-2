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
import {
  advancedSearchPlaces,
  getPlaceSearchSuggestions,
  type SearchPlacesRequest,
  searchPlaces,
  searchPlacesByCategory,
} from "./searchPlaces";

describe("searchPlaces", () => {
  let context: Context;
  let editorUser: User;
  let visitorUser: User;
  let tokyoRegion: Region;
  let osakaRegion: Region;
  let tokyoRestaurant: Place;
  let tokyoCafe: Place;
  let osakaRestaurant: Place;
  let tokyoHotel: Place;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
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

    // Create test regions
    const tokyoRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Tokyo Metropolitan Area",
        description: "The bustling capital region of Japan",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Tokyo, Japan",
        images: [],
        tags: ["urban", "modern"],
      },
    );
    if (tokyoRegionResult.isErr()) {
      throw new Error("Failed to create Tokyo region");
    }
    tokyoRegion = tokyoRegionResult.value;
    await context.regionRepository.updateStatus(tokyoRegion.id, "published");

    const osakaRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Osaka City",
        description: "Famous for food culture in western Japan",
        coordinates: { latitude: 34.6937, longitude: 135.5023 },
        address: "Osaka, Japan",
        images: [],
        tags: ["food", "culture"],
      },
    );
    if (osakaRegionResult.isErr()) {
      throw new Error("Failed to create Osaka region");
    }
    osakaRegion = osakaRegionResult.value;
    await context.regionRepository.updateStatus(osakaRegion.id, "published");

    // Create test places
    const tokyoRestaurantResult = await context.placeRepository.create(
      editorUser.id,
      {
        name: "Tokyo Sushi House",
        description: "Premium sushi restaurant in Tokyo with fresh ingredients",
        shortDescription: "Premium sushi in Tokyo",
        category: "restaurant",
        regionId: tokyoRegion.id,
        coordinates: { latitude: 35.6795, longitude: 139.6516 },
        address: "1-1-1 Shibuya, Tokyo, Japan",
        phone: "+81-3-1234-5678",
        website: "https://tokyosushi.example.com",
        email: "info@tokyosushi.example.com",
        images: ["https://example.com/sushi1.jpg"],
        tags: ["sushi", "premium", "tokyo"],
        businessHours: [
          {
            dayOfWeek: "monday",
            openTime: "18:00",
            closeTime: "23:00",
            isClosed: false,
          },
        ],
      },
    );
    if (tokyoRestaurantResult.isErr()) {
      throw new Error("Failed to create Tokyo restaurant");
    }
    tokyoRestaurant = tokyoRestaurantResult.value;
    await context.placeRepository.updateStatus(tokyoRestaurant.id, "published");

    const tokyoCafeResult = await context.placeRepository.create(
      editorUser.id,
      {
        name: "Tokyo Coffee Roasters",
        description: "Artisan coffee shop with locally roasted beans",
        shortDescription: "Artisan coffee in Tokyo",
        category: "cafe",
        regionId: tokyoRegion.id,
        coordinates: { latitude: 35.673, longitude: 139.655 },
        address: "2-2-2 Harajuku, Tokyo, Japan",
        phone: "+81-3-2345-6789",
        images: ["https://example.com/coffee1.jpg"],
        tags: ["coffee", "artisan", "tokyo"],
        businessHours: [
          {
            dayOfWeek: "monday",
            openTime: "07:00",
            closeTime: "19:00",
            isClosed: false,
          },
        ],
      },
    );
    if (tokyoCafeResult.isErr()) {
      throw new Error("Failed to create Tokyo cafe");
    }
    tokyoCafe = tokyoCafeResult.value;
    await context.placeRepository.updateStatus(tokyoCafe.id, "published");

    const osakaRestaurantResult = await context.placeRepository.create(
      editorUser.id,
      {
        name: "Osaka Takoyaki Stand",
        description: "Famous takoyaki stand in Dotonbori district",
        shortDescription: "Famous takoyaki in Osaka",
        category: "restaurant",
        regionId: osakaRegion.id,
        coordinates: { latitude: 34.6688, longitude: 135.5037 },
        address: "3-3-3 Dotonbori, Osaka, Japan",
        phone: "+81-6-3456-7890",
        images: ["https://example.com/takoyaki1.jpg"],
        tags: ["takoyaki", "street-food", "osaka"],
        businessHours: [
          {
            dayOfWeek: "monday",
            openTime: "12:00",
            closeTime: "22:00",
            isClosed: false,
          },
        ],
      },
    );
    if (osakaRestaurantResult.isErr()) {
      throw new Error("Failed to create Osaka restaurant");
    }
    osakaRestaurant = osakaRestaurantResult.value;
    await context.placeRepository.updateStatus(osakaRestaurant.id, "published");

    const tokyoHotelResult = await context.placeRepository.create(
      editorUser.id,
      {
        name: "Tokyo Grand Hotel",
        description: "Luxury hotel in central Tokyo with excellent service",
        shortDescription: "Luxury hotel in Tokyo",
        category: "hotel",
        regionId: tokyoRegion.id,
        coordinates: { latitude: 35.685, longitude: 139.7514 },
        address: "4-4-4 Ginza, Tokyo, Japan",
        phone: "+81-3-4567-8901",
        website: "https://tokyogrand.example.com",
        images: ["https://example.com/hotel1.jpg"],
        tags: ["luxury", "hotel", "tokyo"],
        businessHours: [],
      },
    );
    if (tokyoHotelResult.isErr()) {
      throw new Error("Failed to create Tokyo hotel");
    }
    tokyoHotel = tokyoHotelResult.value;
    await context.placeRepository.updateStatus(tokyoHotel.id, "published");
  });

  describe("searchPlaces function", () => {
    describe("keyword search", () => {
      it("should search places by keyword", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          expect(result.value.searchTerm).toBe("Tokyo");
          expect(result.value.currentPage).toBe(1);
          expect(result.value.totalPages).toBeGreaterThanOrEqual(1);
          expect(result.value.count).toBeGreaterThan(0);

          // Should include places that match "Tokyo"
          const placeNames = result.value.items.map((p) => p.name);
          const hasTokyoMatch = placeNames.some((name) =>
            name.toLowerCase().includes("tokyo"),
          );
          expect(hasTokyoMatch).toBe(true);
        }
      });

      it("should search places by partial keyword", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Sushi",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should match "Tokyo Sushi House"
          const placeName = result.value.items.find((p) =>
            p.name.includes("Sushi"),
          );
          expect(placeName).toBeDefined();
        }
      });

      it("should search places case-insensitively", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "COFFEE",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          const placeNames = result.value.items.map((p) => p.name);
          const hasCoffeeMatch = placeNames.some((name) =>
            name.toLowerCase().includes("coffee"),
          );
          expect(hasCoffeeMatch).toBe(true);
        }
      });

      it("should search in description and tags", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "artisan",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should find Tokyo Coffee Roasters which has "artisan" in description and tags
          const coffeePlace = result.value.items.find((p) =>
            p.name.includes("Coffee"),
          );
          expect(coffeePlace).toBeDefined();
        }
      });

      it("should trim whitespace from keyword", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "  Tokyo  ",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.searchTerm).toBe("Tokyo");
          expect(result.value.items.length).toBeGreaterThan(0);
        }
      });

      it("should handle no search results", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "NonexistentPlace",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.count).toBe(0);
          expect(result.value.totalPages).toBe(0);
          expect(result.value.searchTerm).toBe("NonexistentPlace");
        }
      });
    });

    describe("keyword validation", () => {
      it("should fail with empty keyword", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        }
      });

      it("should fail with whitespace-only keyword", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "   ",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        }
      });
    });

    describe("region-based search", () => {
      it("should search places within specific region", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "restaurant",
            regionId: tokyoRegion.id,
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should only include places from Tokyo region
          expect(
            result.value.items.every((p) => p.regionId === tokyoRegion.id),
          ).toBe(true);

          const placeNames = result.value.items.map((p) => p.name);
          expect(placeNames).toContain("Tokyo Sushi House");
          expect(placeNames).not.toContain("Osaka Takoyaki Stand");
        }
      });

      it("should search places in different region", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "restaurant",
            regionId: osakaRegion.id,
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should only include places from Osaka region
          expect(
            result.value.items.every((p) => p.regionId === osakaRegion.id),
          ).toBe(true);

          const placeNames = result.value.items.map((p) => p.name);
          expect(placeNames).toContain("Osaka Takoyaki Stand");
          expect(placeNames).not.toContain("Tokyo Sushi House");
        }
      });
    });

    describe("category-based search", () => {
      it("should search places by category", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            category: "restaurant",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should only include restaurants
          expect(
            result.value.items.every((p) => p.category === "restaurant"),
          ).toBe(true);

          const placeNames = result.value.items.map((p) => p.name);
          expect(placeNames).toContain("Tokyo Sushi House");
          expect(placeNames).not.toContain("Tokyo Coffee Roasters");
        }
      });

      it("should search places by different category", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            category: "cafe",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should only include cafes
          expect(result.value.items.every((p) => p.category === "cafe")).toBe(
            true,
          );

          const placeNames = result.value.items.map((p) => p.name);
          expect(placeNames).toContain("Tokyo Coffee Roasters");
          expect(placeNames).not.toContain("Tokyo Sushi House");
        }
      });
    });

    describe("location-based search", () => {
      it("should search places near Tokyo", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            location: {
              coordinates: {
                latitude: 35.6762,
                longitude: 139.6503,
              },
              radiusKm: 10,
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include Tokyo places
          const tokyoPlaces = result.value.items.filter(
            (p) => p.regionId === tokyoRegion.id,
          );
          expect(tokyoPlaces.length).toBeGreaterThan(0);
        }
      });

      it("should handle very small search radius", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "restaurant",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            location: {
              coordinates: {
                latitude: 35.6795,
                longitude: 139.6516,
              },
              radiusKm: 0.1, // Very small radius
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Might return few or no results due to small radius
          expect(result.value.items.length).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe("pagination", () => {
      it("should handle pagination correctly", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 2,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeLessThanOrEqual(2);
          expect(result.value.currentPage).toBe(1);
          if (result.value.count > 2) {
            expect(result.value.totalPages).toBeGreaterThan(1);
          }
        }
      });

      it("should handle second page", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 2,
              limit: 1,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.currentPage).toBe(2);
          if (result.value.count > 1) {
            expect(result.value.items.length).toBeLessThanOrEqual(1);
          }
        }
      });
    });

    describe("user context", () => {
      it("should include user-specific data when userId provided", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: visitorUser.id,
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include user-specific data
          expect(
            result.value.items.every(
              (p) =>
                typeof p.isFavorited === "boolean" ||
                p.isFavorited === undefined,
            ),
          ).toBe(true);
          expect(
            result.value.items.every(
              (p) =>
                typeof p.hasEditPermission === "boolean" ||
                p.hasEditPermission === undefined,
            ),
          ).toBe(true);
        }
      });

      it("should work without user context", async () => {
        const request: SearchPlacesRequest = {
          query: {
            keyword: "restaurant",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
        }
      });
    });

    describe("error handling", () => {
      it("should handle repository search failure", async () => {
        const failingContext = createMockContext({ shouldFailSearch: true });

        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(failingContext, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.PLACE_FETCH_FAILED);
        }
      });

      it("should handle unexpected errors", async () => {
        const context = createMockContext({ shouldThrowError: true });

        const request: SearchPlacesRequest = {
          query: {
            keyword: "Tokyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchPlaces(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getPlaceSearchSuggestions function", () => {
    it("should get search suggestions for partial keyword", async () => {
      const result = await getPlaceSearchSuggestions(context, "Tok");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeLessThanOrEqual(10);
        // Should include Tokyo-related suggestions
        const hasTokyoSuggestion = result.value.some((suggestion) =>
          suggestion.toLowerCase().includes("tok"),
        );
        expect(hasTokyoSuggestion).toBe(true);
      }
    });

    it("should get search suggestions with region filter", async () => {
      const result = await getPlaceSearchSuggestions(
        context,
        "restaurant",
        tokyoRegion.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        // Should include suggestions from Tokyo region only
        const hasTokyoSuggestion = result.value.some((suggestion) =>
          suggestion.toLowerCase().includes("tokyo"),
        );
        const hasOsakaSuggestion = result.value.some((suggestion) =>
          suggestion.toLowerCase().includes("osaka"),
        );
        expect(hasTokyoSuggestion).toBe(true);
        expect(hasOsakaSuggestion).toBe(false);
      }
    });

    it("should get search suggestions with custom limit", async () => {
      const result = await getPlaceSearchSuggestions(
        context,
        "Tokyo",
        undefined,
        3,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeLessThanOrEqual(3);
      }
    });

    it("should return empty array for short keywords", async () => {
      const result = await getPlaceSearchSuggestions(context, "T");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should return empty array for empty keyword", async () => {
      const result = await getPlaceSearchSuggestions(context, "");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should trim whitespace from keyword", async () => {
      const result = await getPlaceSearchSuggestions(context, "  Sushi  ");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        if (result.value.length > 0) {
          const hasSushiSuggestion = result.value.some((suggestion) =>
            suggestion.toLowerCase().includes("sushi"),
          );
          expect(hasSushiSuggestion).toBe(true);
        }
      }
    });

    it("should return unique suggestions", async () => {
      const result = await getPlaceSearchSuggestions(context, "Tokyo");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Check that all suggestions are unique
        const uniqueSuggestions = new Set(result.value);
        expect(uniqueSuggestions.size).toBe(result.value.length);
      }
    });

    it("should handle repository search failure", async () => {
      const failingContext = createMockContext({ shouldFailSearch: true });

      const result = await getPlaceSearchSuggestions(failingContext, "Tokyo");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_FETCH_FAILED);
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await getPlaceSearchSuggestions(context, "Tokyo");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("advancedSearchPlaces function", () => {
    it("should search by keyword only", async () => {
      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        expect(result.value.searchTerm).toBe("Tokyo");
        const placeNames = result.value.items.map((p) => p.name);
        const hasTokyoMatch = placeNames.some((name) =>
          name.toLowerCase().includes("tokyo"),
        );
        expect(hasTokyoMatch).toBe(true);
      }
    });

    it("should search by region only", async () => {
      const result = await advancedSearchPlaces(context, {
        regionId: tokyoRegion.id,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include places from Tokyo region only
        expect(
          result.value.items.every((p) => p.regionId === tokyoRegion.id),
        ).toBe(true);
      }
    });

    it("should search by category only", async () => {
      const result = await advancedSearchPlaces(context, {
        category: "restaurant",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include restaurants only
        expect(
          result.value.items.every((p) => p.category === "restaurant"),
        ).toBe(true);
      }
    });

    it("should search by location only", async () => {
      const result = await advancedSearchPlaces(context, {
        location: {
          latitude: 35.6762,
          longitude: 139.6503,
          radiusKm: 50,
        },
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include places near Tokyo
        const tokyoPlaces = result.value.items.filter(
          (p) => p.regionId === tokyoRegion.id,
        );
        expect(tokyoPlaces.length).toBeGreaterThan(0);
      }
    });

    it("should search by multiple criteria", async () => {
      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        regionId: tokyoRegion.id,
        category: "restaurant",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should match all criteria
        expect(
          result.value.items.every((p) => p.regionId === tokyoRegion.id),
        ).toBe(true);
        expect(
          result.value.items.every((p) => p.category === "restaurant"),
        ).toBe(true);
        const placeNames = result.value.items.map((p) => p.name);
        const hasTokyoMatch = placeNames.some((name) =>
          name.toLowerCase().includes("tokyo"),
        );
        expect(hasTokyoMatch).toBe(true);
      }
    });

    it("should filter by hasRating true", async () => {
      // First set rating on one place
      await context.placeRepository.updateRating(tokyoRestaurant.id, 4.5);

      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        hasRating: true,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should only include places with ratings
        expect(
          result.value.items.every((p) => p.averageRating !== undefined),
        ).toBe(true);
      }
    });

    it("should filter by hasRating false", async () => {
      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        hasRating: false,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should only include places without ratings
        expect(
          result.value.items.every((p) => p.averageRating === undefined),
        ).toBe(true);
      }
    });

    it("should filter by minimum rating", async () => {
      // Set ratings on places
      await context.placeRepository.updateRating(tokyoRestaurant.id, 4.5);
      await context.placeRepository.updateRating(tokyoCafe.id, 3.0);

      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        minRating: 4.0,
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should only include places with rating >= 4.0
        expect(
          result.value.items.every(
            (p) => p.averageRating === undefined || p.averageRating >= 4.0,
          ),
        ).toBe(true);
      }
    });

    it("should include user context when provided", async () => {
      const result = await advancedSearchPlaces(
        context,
        {
          keyword: "Tokyo",
          pagination: { page: 1, limit: 10 },
        },
        visitorUser.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include user-specific data
        expect(
          result.value.items.every(
            (p) =>
              typeof p.isFavorited === "boolean" || p.isFavorited === undefined,
          ),
        ).toBe(true);
      }
    });

    it("should handle wildcard search when no keyword provided", async () => {
      const result = await advancedSearchPlaces(context, {
        category: "restaurant",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.searchTerm).toBe("");
        expect(result.value.items.length).toBeGreaterThan(0);
      }
    });

    it("should fail when no search criteria provided", async () => {
      const result = await advancedSearchPlaces(context, {
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it("should handle repository search failure", async () => {
      const failingContext = createMockContext({ shouldFailSearch: true });

      const result = await advancedSearchPlaces(failingContext, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_FETCH_FAILED);
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await advancedSearchPlaces(context, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });

  describe("searchPlacesByCategory function", () => {
    it("should search places by category in region", async () => {
      const result = await searchPlacesByCategory(
        context,
        tokyoRegion.id,
        "restaurant",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        // Should only include restaurants from Tokyo region
        expect(result.value.every((p) => p.category === "restaurant")).toBe(
          true,
        );
        expect(result.value.every((p) => p.regionId === tokyoRegion.id)).toBe(
          true,
        );

        const placeNames = result.value.map((p) => p.name);
        expect(placeNames).toContain("Tokyo Sushi House");
        expect(placeNames).not.toContain("Tokyo Coffee Roasters");
        expect(placeNames).not.toContain("Osaka Takoyaki Stand");
      }
    });

    it("should search cafes in region", async () => {
      const result = await searchPlacesByCategory(
        context,
        tokyoRegion.id,
        "cafe",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        // Should only include cafes from Tokyo region
        expect(result.value.every((p) => p.category === "cafe")).toBe(true);
        expect(result.value.every((p) => p.regionId === tokyoRegion.id)).toBe(
          true,
        );

        const placeNames = result.value.map((p) => p.name);
        expect(placeNames).toContain("Tokyo Coffee Roasters");
        expect(placeNames).not.toContain("Tokyo Sushi House");
      }
    });

    it("should search places with user context", async () => {
      const result = await searchPlacesByCategory(
        context,
        tokyoRegion.id,
        "restaurant",
        visitorUser.id,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        // Should include user-specific data
        expect(
          result.value.every(
            (p) =>
              typeof p.isFavorited === "boolean" || p.isFavorited === undefined,
          ),
        ).toBe(true);
      }
    });

    it("should search places with custom limit", async () => {
      const result = await searchPlacesByCategory(
        context,
        tokyoRegion.id,
        "restaurant",
        undefined,
        1,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeLessThanOrEqual(1);
      }
    });

    it("should return empty array when no places match", async () => {
      const result = await searchPlacesByCategory(
        context,
        osakaRegion.id,
        "hotel", // No hotels in Osaka region
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle non-existent region", async () => {
      const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";

      const result = await searchPlacesByCategory(
        context,
        nonExistentRegionId,
        "restaurant",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle repository search failure", async () => {
      const failingContext = createMockContext({ shouldFailSearch: true });

      const result = await searchPlacesByCategory(
        failingContext,
        tokyoRegion.id,
        "restaurant",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_FETCH_FAILED);
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await searchPlacesByCategory(
        context,
        tokyoRegion.id,
        "restaurant",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
});
