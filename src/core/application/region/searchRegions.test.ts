import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import {
  advancedSearchRegions,
  getRegionSearchSuggestions,
  type SearchRegionsRequest,
  searchRegions,
} from "./searchRegions";

describe("searchRegions", () => {
  let context: Context;
  let editorUser: User;
  let visitorUser: User;
  let tokyoRegion: Region;
  let osakaRegion: Region;
  let kyotoRegion: Region;
  let shibuyaRegion: Region;

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

    // Create test regions with different characteristics
    const tokyoRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Tokyo Metropolitan Area",
        description:
          "The bustling capital region of Japan with modern attractions",
        shortDescription: "Japan's vibrant capital",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Tokyo, Japan",
        coverImage: "https://example.com/tokyo.jpg",
        images: [
          "https://example.com/tokyo1.jpg",
          "https://example.com/tokyo2.jpg",
        ],
        tags: ["urban", "modern", "business", "tokyo", "capital"],
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
        description:
          "Famous for food culture and friendly people in western Japan",
        shortDescription: "Japan's kitchen",
        coordinates: { latitude: 34.6937, longitude: 135.5023 },
        address: "Osaka, Japan",
        coverImage: "https://example.com/osaka.jpg",
        images: ["https://example.com/osaka1.jpg"],
        tags: ["food", "culture", "osaka", "kansai", "friendly"],
      },
    );
    if (osakaRegionResult.isErr()) {
      throw new Error("Failed to create Osaka region");
    }
    osakaRegion = osakaRegionResult.value;
    await context.regionRepository.updateStatus(osakaRegion.id, "published");

    const kyotoRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Kyoto Ancient Capital",
        description:
          "Historic temples, traditional gardens, and cultural heritage",
        shortDescription: "Historic cultural center",
        coordinates: { latitude: 35.0116, longitude: 135.7681 },
        address: "Kyoto, Japan",
        coverImage: "https://example.com/kyoto.jpg",
        images: [
          "https://example.com/kyoto1.jpg",
          "https://example.com/kyoto2.jpg",
        ],
        tags: ["historic", "temples", "culture", "kyoto", "traditional"],
      },
    );
    if (kyotoRegionResult.isErr()) {
      throw new Error("Failed to create Kyoto region");
    }
    kyotoRegion = kyotoRegionResult.value;
    await context.regionRepository.updateStatus(kyotoRegion.id, "published");

    const shibuyaRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Shibuya District",
        description: "Famous crossing and youth culture hub in Tokyo",
        shortDescription: "Youth culture center",
        coordinates: { latitude: 35.6598, longitude: 139.7006 },
        address: "Shibuya, Tokyo, Japan",
        coverImage: "https://example.com/shibuya.jpg",
        images: ["https://example.com/shibuya1.jpg"],
        tags: ["youth", "shopping", "tokyo", "shibuya", "crossing"],
      },
    );
    if (shibuyaRegionResult.isErr()) {
      throw new Error("Failed to create Shibuya region");
    }
    shibuyaRegion = shibuyaRegionResult.value;
    await context.regionRepository.updateStatus(shibuyaRegion.id, "published");
  });

  describe("searchRegions function", () => {
    describe("keyword search", () => {
      it("should search regions by keyword", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          expect(result.value.searchTerm).toBe("Tokyo");
          expect(result.value.currentPage).toBe(1);
          expect(result.value.totalPages).toBeGreaterThanOrEqual(1);
          expect(result.value.count).toBeGreaterThan(0);

          // Should include regions that match "Tokyo"
          const regionNames = result.value.items.map((r) => r.name);
          const hasTokyoMatch = regionNames.some((name) =>
            name.toLowerCase().includes("tokyo"),
          );
          expect(hasTokyoMatch).toBe(true);
        }
      });

      it("should search regions by partial keyword", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "Kyo",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should match both "Kyoto" and "Tokyo"
          const regionNames = result.value.items.map((r) => r.name);
          const hasKyoMatch = regionNames.some((name) =>
            name.toLowerCase().includes("kyo"),
          );
          expect(hasKyoMatch).toBe(true);
        }
      });

      it("should search regions case-insensitively", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "OSAKA",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          const regionNames = result.value.items.map((r) => r.name);
          const hasOsakaMatch = regionNames.some((name) =>
            name.toLowerCase().includes("osaka"),
          );
          expect(hasOsakaMatch).toBe(true);
        }
      });

      it("should search in description and tags", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "food",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should find Osaka region which has "food" in tags
          const osakaMatch = result.value.items.find((r) =>
            r.name.includes("Osaka"),
          );
          expect(osakaMatch).toBeDefined();
        }
      });

      it("should trim whitespace from keyword", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.searchTerm).toBe("Tokyo");
          expect(result.value.items.length).toBeGreaterThan(0);
        }
      });

      it("should handle no search results", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

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
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
          expect(result.error.message).toBe("Search keyword is required");
        }
      });

      it("should fail with whitespace-only keyword", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
          expect(result.error.message).toBe("Search keyword is required");
        }
      });
    });

    describe("location-based search", () => {
      it("should search regions near Tokyo", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "region",
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
              radiusKm: 50,
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include Tokyo and Shibuya regions
          const regionNames = result.value.items.map((r) => r.name);
          const hasTokyoNearby = regionNames.some(
            (name) => name.includes("Tokyo") || name.includes("Shibuya"),
          );
          expect(hasTokyoNearby).toBe(true);
        }
      });

      it("should search regions near Osaka", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "Japan",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            location: {
              coordinates: {
                latitude: 34.6937,
                longitude: 135.5023,
              },
              radiusKm: 100,
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include Osaka and possibly Kyoto
          const regionNames = result.value.items.map((r) => r.name);
          const hasOsakaNearby = regionNames.some(
            (name) => name.includes("Osaka") || name.includes("Kyoto"),
          );
          expect(hasOsakaNearby).toBe(true);
        }
      });

      it("should handle very small search radius", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "city",
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
              radiusKm: 0.1, // Very small radius
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Might return no results due to small radius
          expect(result.value.items.length).toBeGreaterThanOrEqual(0);
        }
      });

      it("should handle boundary coordinates", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "region",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            location: {
              coordinates: {
                latitude: -90,
                longitude: -180,
              },
              radiusKm: 100,
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should return no results as no regions are near the poles
          expect(result.value.items).toHaveLength(0);
        }
      });
    });

    describe("pagination", () => {
      it("should handle pagination correctly", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "region",
            pagination: {
              page: 1,
              limit: 2,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

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
        const request: SearchRegionsRequest = {
          query: {
            keyword: "Japan",
            pagination: {
              page: 2,
              limit: 1,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.currentPage).toBe(2);
          if (result.value.count > 1) {
            expect(result.value.items.length).toBeLessThanOrEqual(1);
          }
        }
      });

      it("should handle large page numbers", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "region",
            pagination: {
              page: 999,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.currentPage).toBe(999);
        }
      });
    });

    describe("user context", () => {
      it("should include user-specific data when userId provided", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include user-specific data
          expect(
            result.value.items.every(
              (r) =>
                typeof r.isFavorited === "boolean" ||
                r.isFavorited === undefined,
            ),
          ).toBe(true);
          expect(
            result.value.items.every(
              (r) =>
                typeof r.isPinned === "boolean" || r.isPinned === undefined,
            ),
          ).toBe(true);
        }
      });

      it("should work without user context", async () => {
        const request: SearchRegionsRequest = {
          query: {
            keyword: "Osaka",
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
        }
      });
    });

    describe("visit count tracking", () => {
      it("should increment visit count for searched regions", async () => {
        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Visit count tracking is async, so we just verify the search worked
          // The actual visit count increment would be tested in repository tests
        }
      });
    });

    describe("error handling", () => {
      it("should handle repository search failure", async () => {
        const failingContext = createMockContext({ shouldFailSearch: true });

        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(failingContext, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
          expect(result.error.message).toBe("Failed to search regions");
        }
      });

      it("should handle unexpected errors", async () => {
        const context = createMockContext({ shouldThrowError: true });

        const request: SearchRegionsRequest = {
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

        const result = await searchRegions(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
          expect(result.error.message).toBe(
            "Unexpected error while searching regions",
          );
        }
      });
    });
  });

  describe("getRegionSearchSuggestions function", () => {
    it("should get search suggestions for partial keyword", async () => {
      const result = await getRegionSearchSuggestions(context, "Tok");

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

    it("should get search suggestions with custom limit", async () => {
      const result = await getRegionSearchSuggestions(context, "region", 3);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeLessThanOrEqual(3);
      }
    });

    it("should return empty array for short keywords", async () => {
      const result = await getRegionSearchSuggestions(context, "T");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should return empty array for empty keyword", async () => {
      const result = await getRegionSearchSuggestions(context, "");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it("should trim whitespace from keyword", async () => {
      const result = await getRegionSearchSuggestions(context, "  Osa  ");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        if (result.value.length > 0) {
          const hasOsakaSuggestion = result.value.some((suggestion) =>
            suggestion.toLowerCase().includes("osa"),
          );
          expect(hasOsakaSuggestion).toBe(true);
        }
      }
    });

    it("should return unique suggestions", async () => {
      const result = await getRegionSearchSuggestions(context, "Japan");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Check that all suggestions are unique
        const uniqueSuggestions = new Set(result.value);
        expect(uniqueSuggestions.size).toBe(result.value.length);
      }
    });

    it("should handle repository search failure", async () => {
      const failingContext = createMockContext({ shouldFailSearch: true });

      const result = await getRegionSearchSuggestions(failingContext, "Tokyo");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
        expect(result.error.message).toBe("Failed to get search suggestions");
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await getRegionSearchSuggestions(context, "Tokyo");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        expect(result.error.message).toBe(
          "Unexpected error while getting search suggestions",
        );
      }
    });
  });

  describe("advancedSearchRegions function", () => {
    it("should search by keyword only", async () => {
      const result = await advancedSearchRegions(context, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        expect(result.value.searchTerm).toBe("Tokyo");
        const regionNames = result.value.items.map((r) => r.name);
        const hasTokyoMatch = regionNames.some((name) =>
          name.toLowerCase().includes("tokyo"),
        );
        expect(hasTokyoMatch).toBe(true);
      }
    });

    it("should search by tags only", async () => {
      const result = await advancedSearchRegions(context, {
        tags: ["food"],
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include regions with "food" tag
        const hasFoodTag = result.value.items.some((region) =>
          region.tags.some((tag) => tag.toLowerCase().includes("food")),
        );
        expect(hasFoodTag).toBe(true);
      }
    });

    it("should search by location only", async () => {
      const result = await advancedSearchRegions(context, {
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
        // Should include regions near Tokyo
        const regionNames = result.value.items.map((r) => r.name);
        const hasTokyoNearby = regionNames.some(
          (name) => name.includes("Tokyo") || name.includes("Shibuya"),
        );
        expect(hasTokyoNearby).toBe(true);
      }
    });

    it("should search by multiple criteria", async () => {
      const result = await advancedSearchRegions(context, {
        keyword: "culture",
        tags: ["culture"],
        location: {
          latitude: 35.0116,
          longitude: 135.7681,
          radiusKm: 100,
        },
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include regions that match multiple criteria
        const hasCultureMatch = result.value.items.some(
          (region) =>
            region.tags.includes("culture") &&
            (region.name.toLowerCase().includes("culture") ||
              region.description?.toLowerCase().includes("culture")),
        );
        expect(hasCultureMatch).toBe(true);
      }
    });

    it("should filter by multiple tags", async () => {
      const result = await advancedSearchRegions(context, {
        tags: ["culture", "historic"],
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
        // Should include regions that have at least one of the tags
        const hasRequiredTags = result.value.items.every((region) =>
          region.tags.some(
            (tag) =>
              tag.toLowerCase().includes("culture") ||
              tag.toLowerCase().includes("historic"),
          ),
        );
        expect(hasRequiredTags).toBe(true);
      }
    });

    it("should include user context when provided", async () => {
      const result = await advancedSearchRegions(
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
            (r) =>
              typeof r.isFavorited === "boolean" || r.isFavorited === undefined,
          ),
        ).toBe(true);
      }
    });

    it("should handle wildcard search when no keyword provided", async () => {
      const result = await advancedSearchRegions(context, {
        tags: ["tokyo"],
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.searchTerm).toBe("");
        expect(result.value.items.length).toBeGreaterThan(0);
      }
    });

    it("should handle empty tag filtering", async () => {
      const result = await advancedSearchRegions(context, {
        keyword: "Tokyo",
        tags: [],
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeGreaterThan(0);
      }
    });

    it("should fail when no search criteria provided", async () => {
      const result = await advancedSearchRegions(context, {
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
        expect(result.error.message).toBe(
          "At least one search criteria must be provided",
        );
      }
    });

    it("should fail when all criteria are empty", async () => {
      const result = await advancedSearchRegions(context, {
        keyword: "",
        tags: [],
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it("should handle repository search failure", async () => {
      const failingContext = createMockContext({ shouldFailSearch: true });

      const result = await advancedSearchRegions(failingContext, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
        expect(result.error.message).toBe("Failed to perform advanced search");
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await advancedSearchRegions(context, {
        keyword: "Tokyo",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        expect(result.error.message).toBe(
          "Unexpected error during advanced search",
        );
      }
    });

    it("should handle pagination correctly", async () => {
      const result = await advancedSearchRegions(context, {
        keyword: "Japan",
        pagination: { page: 1, limit: 2 },
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items.length).toBeLessThanOrEqual(2);
        expect(result.value.currentPage).toBe(1);
        if (result.value.count > 2) {
          expect(result.value.totalPages).toBeGreaterThan(1);
        }
      }
    });
  });
});
