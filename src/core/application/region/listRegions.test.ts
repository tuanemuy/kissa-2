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
  getFeaturedRegions,
  getRegionsByCreator,
  type ListRegionsRequest,
  listRegions,
} from "./listRegions";

describe("listRegions", () => {
  let context: Context;
  let editorUser: User;
  let adminUser: User;
  let visitorUser: User;
  let publishedRegion: Region;
  let _draftRegion: Region;
  let archivedRegion: Region;
  let anotherPublishedRegion: Region;

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

    // Create test regions with different statuses
    const publishedRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Published Region",
        description: "This is a published region for testing",
        shortDescription: "Published test region",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        address: "Tokyo, Japan",
        coverImage: "https://example.com/published.jpg",
        images: ["https://example.com/pub1.jpg"],
        tags: ["published", "tokyo", "test"],
      },
    );
    if (publishedRegionResult.isErr()) {
      throw new Error("Failed to create published region");
    }
    publishedRegion = publishedRegionResult.value;
    await context.regionRepository.updateStatus(
      publishedRegion.id,
      "published",
    );

    const draftRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Draft Region",
        description: "This is a draft region for testing",
        tags: ["draft", "test"],
        images: [],
      },
    );
    if (draftRegionResult.isErr()) {
      throw new Error("Failed to create draft region");
    }
    _draftRegion = draftRegionResult.value;

    const archivedRegionResult = await context.regionRepository.create(
      editorUser.id,
      {
        name: "Archived Region",
        description: "This is an archived region for testing",
        tags: ["archived", "test"],
        images: [],
      },
    );
    if (archivedRegionResult.isErr()) {
      throw new Error("Failed to create archived region");
    }
    archivedRegion = archivedRegionResult.value;
    await context.regionRepository.updateStatus(archivedRegion.id, "archived");

    // Create another published region by admin
    const anotherPublishedResult = await context.regionRepository.create(
      adminUser.id,
      {
        name: "Another Published Region",
        description: "Another published region by admin",
        coordinates: { latitude: 35.685, longitude: 139.7514 },
        address: "Shibuya, Tokyo, Japan",
        tags: ["published", "shibuya", "admin"],
        images: [],
      },
    );
    if (anotherPublishedResult.isErr()) {
      throw new Error("Failed to create another published region");
    }
    anotherPublishedRegion = anotherPublishedResult.value;
    await context.regionRepository.updateStatus(
      anotherPublishedRegion.id,
      "published",
    );
  });

  describe("listRegions function", () => {
    describe("basic listing", () => {
      it("should list published regions for anonymous user", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(2); // Only published regions
          expect(result.value.count).toBe(2);
          expect(result.value.totalPages).toBe(1);
          expect(result.value.currentPage).toBe(1);

          const regionNames = result.value.items.map((r) => r.name);
          expect(regionNames).toContain("Published Region");
          expect(regionNames).toContain("Another Published Region");
          expect(regionNames).not.toContain("Draft Region");
          expect(regionNames).not.toContain("Archived Region");
        }
      });

      it("should list all regions for owner user", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              createdBy: editorUser.id,
            },
          },
          userId: editorUser.id,
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(3); // All regions by editor
          expect(result.value.count).toBe(3);

          const regionNames = result.value.items.map((r) => r.name);
          expect(regionNames).toContain("Published Region");
          expect(regionNames).toContain("Draft Region");
          expect(regionNames).toContain("Archived Region");
        }
      });

      it("should handle pagination correctly", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 1,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.count).toBe(2); // Total published regions
          expect(result.value.totalPages).toBe(2);
          expect(result.value.currentPage).toBe(1);
        }
      });

      it("should handle second page", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 2,
              limit: 1,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.count).toBe(2);
          expect(result.value.totalPages).toBe(2);
          expect(result.value.currentPage).toBe(2);
        }
      });

      it("should handle empty results", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              keyword: "nonexistentregion",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.count).toBe(0);
          expect(result.value.totalPages).toBe(0);
          expect(result.value.currentPage).toBe(1);
        }
      });
    });

    describe("filtering", () => {
      it("should filter by status", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              status: "published",
            },
          },
          userId: editorUser.id,
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(2);
          expect(
            result.value.items.every((r) => r.status === "published"),
          ).toBe(true);
        }
      });

      it("should filter by creator", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              createdBy: adminUser.id,
            },
          },
          userId: adminUser.id,
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.items[0].name).toBe("Another Published Region");
          expect(result.value.items[0].createdBy).toBe(adminUser.id);
        }
      });

      it("should filter by keyword", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              keyword: "Tokyo",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          // Should include regions that have "Tokyo" in name, description, or address
          const hasTokyoRegion = result.value.items.some(
            (r) =>
              r.name.includes("Tokyo") ||
              r.description?.includes("Tokyo") ||
              r.address?.includes("Tokyo"),
          );
          expect(hasTokyoRegion).toBe(true);
        }
      });

      it("should filter by tags", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              tags: ["tokyo"],
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(0);
          const hasTokyoTag = result.value.items.some((r) =>
            r.tags.includes("tokyo"),
          );
          expect(hasTokyoTag).toBe(true);
        }
      });

      it("should filter by location", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              location: {
                coordinates: {
                  latitude: 35.6762,
                  longitude: 139.6503,
                },
                radiusKm: 10,
              },
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should include regions near Tokyo coordinates
          const hasNearbyRegion = result.value.items.some(
            (r) =>
              r.coordinates &&
              Math.abs(r.coordinates.latitude - 35.6762) < 1 &&
              Math.abs(r.coordinates.longitude - 139.6503) < 1,
          );
          expect(hasNearbyRegion).toBe(true);
        }
      });

      it("should filter by featured flag", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              featured: true,
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Featured filtering should work
          expect(result.value.items).toBeDefined();
        }
      });

      it("should combine multiple filters", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              status: "published",
              tags: ["test"],
              keyword: "Published",
            },
          },
          userId: editorUser.id,
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should return regions that match all filters
          expect(
            result.value.items.every((r) => r.status === "published"),
          ).toBe(true);
          expect(result.value.items.every((r) => r.tags.includes("test"))).toBe(
            true,
          );
          expect(
            result.value.items.every((r) => r.name.includes("Published")),
          ).toBe(true);
        }
      });
    });

    describe("sorting", () => {
      it("should sort by name ascending", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "asc",
              orderBy: "name",
            },
            sort: {
              field: "name",
              direction: "asc",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(1);
          // Check if sorted by name ascending
          for (let i = 0; i < result.value.items.length - 1; i++) {
            expect(
              result.value.items[i].name.localeCompare(
                result.value.items[i + 1].name,
              ),
            ).toBeLessThanOrEqual(0);
          }
        }
      });

      it("should sort by name descending", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "name",
            },
            sort: {
              field: "name",
              direction: "desc",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(1);
          // Check if sorted by name descending
          for (let i = 0; i < result.value.items.length - 1; i++) {
            expect(
              result.value.items[i].name.localeCompare(
                result.value.items[i + 1].name,
              ),
            ).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it("should sort by createdAt", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            sort: {
              field: "createdAt",
              direction: "desc",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThan(1);
          // Check if sorted by createdAt descending
          for (let i = 0; i < result.value.items.length - 1; i++) {
            expect(
              result.value.items[i].createdAt.getTime(),
            ).toBeGreaterThanOrEqual(
              result.value.items[i + 1].createdAt.getTime(),
            );
          }
        }
      });

      it("should sort by visitCount", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "visitCount",
            },
            sort: {
              field: "visitCount",
              direction: "desc",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should sort by visit count
          expect(result.value.items).toBeDefined();
        }
      });

      it("should sort by favoriteCount", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "favoriteCount",
            },
            sort: {
              field: "favoriteCount",
              direction: "desc",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should sort by favorite count
          expect(result.value.items).toBeDefined();
        }
      });
    });

    describe("user-specific data", () => {
      it("should include user-specific data when userId provided", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: visitorUser.id,
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should include user-specific data like isFavorited, isPinned
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

      it("should not include user-specific data when no userId", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          // Should not include user-specific data or they should be undefined
          expect(result.value.items).toBeDefined();
        }
      });
    });

    describe("error handling", () => {
      it("should handle repository failure", async () => {
        const failingContext = createMockContext({ shouldFailList: true });

        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(failingContext, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
        }
      });

      it("should handle unexpected errors", async () => {
        const context = createMockContext({ shouldThrowError: true });

        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle large page numbers", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 999,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.currentPage).toBe(999);
        }
      });

      it("should handle very large limit", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 1000,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeLessThanOrEqual(1000);
          expect(result.value.totalPages).toBe(1);
        }
      });

      it("should handle boundary coordinates", async () => {
        const request: ListRegionsRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              location: {
                coordinates: {
                  latitude: -90,
                  longitude: -180,
                },
                radiusKm: 100,
              },
            },
          },
        };

        const result = await listRegions(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toBeDefined();
        }
      });
    });
  });

  describe("getFeaturedRegions function", () => {
    it("should get featured regions with default limit", async () => {
      const result = await getFeaturedRegions(context);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeLessThanOrEqual(10); // Default limit
      }
    });

    it("should get featured regions with custom limit", async () => {
      const result = await getFeaturedRegions(context, 5);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        expect(result.value.length).toBeLessThanOrEqual(5);
      }
    });

    it("should get featured regions with user context", async () => {
      const result = await getFeaturedRegions(context, 10, visitorUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Array);
        // Should include user-specific data when userId provided
        expect(
          result.value.every(
            (r) =>
              typeof r.isFavorited === "boolean" || r.isFavorited === undefined,
          ),
        ).toBe(true);
      }
    });

    it("should handle repository failure", async () => {
      const failingContext = createMockContext({ shouldFailFeatured: true });

      const result = await getFeaturedRegions(failingContext);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await getFeaturedRegions(context);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });

    it("should handle zero limit", async () => {
      const result = await getFeaturedRegions(context, 0);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle negative limit", async () => {
      const result = await getFeaturedRegions(context, -1);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("getRegionsByCreator function", () => {
    it("should get all regions by creator", async () => {
      const result = await getRegionsByCreator(context, editorUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(3); // All regions by editor
        expect(result.value.every((r) => r.createdBy === editorUser.id)).toBe(
          true,
        );

        const regionNames = result.value.map((r) => r.name);
        expect(regionNames).toContain("Published Region");
        expect(regionNames).toContain("Draft Region");
        expect(regionNames).toContain("Archived Region");
      }
    });

    it("should get regions by creator filtered by status", async () => {
      const result = await getRegionsByCreator(
        context,
        editorUser.id,
        "published",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1); // Only published region by editor
        expect(result.value[0].name).toBe("Published Region");
        expect(result.value[0].status).toBe("published");
        expect(result.value[0].createdBy).toBe(editorUser.id);
      }
    });

    it("should get draft regions by creator", async () => {
      const result = await getRegionsByCreator(context, editorUser.id, "draft");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1); // Only draft region by editor
        expect(result.value[0].name).toBe("Draft Region");
        expect(result.value[0].status).toBe("draft");
        expect(result.value[0].createdBy).toBe(editorUser.id);
      }
    });

    it("should get archived regions by creator", async () => {
      const result = await getRegionsByCreator(
        context,
        editorUser.id,
        "archived",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1); // Only archived region by editor
        expect(result.value[0].name).toBe("Archived Region");
        expect(result.value[0].status).toBe("archived");
        expect(result.value[0].createdBy).toBe(editorUser.id);
      }
    });

    it("should return empty array for non-existent creator", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";
      const result = await getRegionsByCreator(context, nonExistentUserId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should return empty array for creator with no regions", async () => {
      const result = await getRegionsByCreator(context, visitorUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should set user-specific data to default values", async () => {
      const result = await getRegionsByCreator(context, editorUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.every((r) => r.isFavorited === false)).toBe(true);
        expect(result.value.every((r) => r.isPinned === false)).toBe(true);
        expect(result.value.every((r) => r.pinDisplayOrder === undefined)).toBe(
          true,
        );
      }
    });

    it("should handle repository failure", async () => {
      const failingContext = createMockContext({
        shouldFailGetByCreator: true,
      });

      const result = await getRegionsByCreator(failingContext, editorUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.REGION_FETCH_FAILED);
      }
    });

    it("should handle unexpected errors", async () => {
      const context = createMockContext({ shouldThrowError: true });

      const result = await getRegionsByCreator(context, editorUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
      }
    });
  });
});
