import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { type CreateRegionInput, createRegion } from "../region/createRegion";
import { type CreatePlaceInput, createPlace } from "./createPlace";
import {
  getMapLocations,
  getPlacesByCreator,
  getPlacesByPermission,
  getPlacesByRegion,
  type ListPlacesRequest,
  listPlaces,
} from "./listPlaces";

describe("listPlaces application services", () => {
  let context: Context;
  let editorUser: User;
  let otherUser: User;
  let adminUser: User;
  let testRegion: Region;
  let publishedPlace: Place;
  let _draftPlace: Place;
  let archivedPlace: Place;

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

    // Create other user
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
    const regionInput: CreateRegionInput = {
      name: "Test Region",
      images: [],
      tags: [],
    };
    const regionResult = await createRegion(
      context,
      editorUser.id,
      regionInput,
    );
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;

    // Create published place
    const publishedPlaceInput: CreatePlaceInput = {
      name: "Published Restaurant",
      description: "A published test restaurant",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      address: "123 Published Street, Tokyo, Japan",
      images: [],
      tags: ["published", "restaurant"],
      businessHours: [],
    };
    const publishedPlaceResult = await createPlace(
      context,
      editorUser.id,
      publishedPlaceInput,
    );
    if (publishedPlaceResult.isErr()) {
      throw new Error("Failed to create published place");
    }
    publishedPlace = publishedPlaceResult.value;
    await context.placeRepository.updateStatus(publishedPlace.id, "published");

    // Create draft place
    const draftPlaceInput: CreatePlaceInput = {
      name: "Draft Cafe",
      description: "A draft test cafe",
      category: "cafe",
      regionId: testRegion.id,
      coordinates: {
        latitude: 35.6763,
        longitude: 139.6504,
      },
      address: "456 Draft Street, Tokyo, Japan",
      images: [],
      tags: ["draft", "cafe"],
      businessHours: [],
    };
    const draftPlaceResult = await createPlace(
      context,
      editorUser.id,
      draftPlaceInput,
    );
    if (draftPlaceResult.isErr()) {
      throw new Error("Failed to create draft place");
    }
    _draftPlace = draftPlaceResult.value;

    // Create archived place
    const archivedPlaceInput: CreatePlaceInput = {
      name: "Archived Hotel",
      description: "An archived test hotel",
      category: "hotel",
      regionId: testRegion.id,
      coordinates: {
        latitude: 35.6764,
        longitude: 139.6505,
      },
      address: "789 Archived Street, Tokyo, Japan",
      images: [],
      tags: ["archived", "hotel"],
      businessHours: [],
    };
    const archivedPlaceResult = await createPlace(
      context,
      editorUser.id,
      archivedPlaceInput,
    );
    if (archivedPlaceResult.isErr()) {
      throw new Error("Failed to create archived place");
    }
    archivedPlace = archivedPlaceResult.value;
    await context.placeRepository.updateStatus(archivedPlace.id, "archived");
  });

  describe("listPlaces", () => {
    describe("successful listing", () => {
      it("should list all published places for anonymous user", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.items[0].name).toBe("Published Restaurant");
          expect(result.value.count).toBe(1);
          expect(result.value.totalPages).toBe(1);
          expect(result.value.currentPage).toBe(1);
        }
      });

      it("should list all places for authenticated user with permissions", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThanOrEqual(3);
          expect(result.value.count).toBeGreaterThanOrEqual(3);
        }
      });

      it("should filter places by category", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              category: "restaurant",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.items[0].category).toBe("restaurant");
        }
      });

      it("should filter places by region", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              regionId: testRegion.id,
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThanOrEqual(3);
          for (const place of result.value.items) {
            expect(place.regionId).toBe(testRegion.id);
          }
        }
      });

      it("should search places by keyword", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              keyword: "Published",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(1);
          expect(result.value.items[0].name).toContain("Published");
        }
      });

      it("should handle pagination correctly", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 2,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(2);
          expect(result.value.currentPage).toBe(1);
          expect(result.value.totalPages).toBeGreaterThanOrEqual(2);
        }
      });

      it("should sort places by name", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            sort: {
              field: "name",
              direction: "asc",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const names = result.value.items.map((place) => place.name);
          const sortedNames = [...names].sort();
          expect(names).toEqual(sortedNames);
        }
      });

      it("should sort places by creation date", async () => {
        const request: ListPlacesRequest = {
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
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const dates = result.value.items.map((place) => place.createdAt);
          for (let i = 1; i < dates.length; i++) {
            expect(dates[i].getTime()).toBeLessThanOrEqual(
              dates[i - 1].getTime(),
            );
          }
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty results", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
            filter: {
              keyword: "NonExistentPlace",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
          expect(result.value.count).toBe(0);
          expect(result.value.totalPages).toBe(0);
        }
      });

      it("should handle large page numbers", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 999,
              limit: 10,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items).toHaveLength(0);
        }
      });

      it("should handle very large limit", async () => {
        const request: ListPlacesRequest = {
          query: {
            pagination: {
              page: 1,
              limit: 1000,
              order: "desc",
              orderBy: "createdAt",
            },
          },
          userId: editorUser.id,
        };

        const result = await listPlaces(context, request);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.items.length).toBeGreaterThanOrEqual(3);
        }
      });
    });
  });

  describe("getPlacesByRegion", () => {
    describe("successful retrieval", () => {
      it("should get all places in a region", async () => {
        const result = await getPlacesByRegion(
          context,
          testRegion.id,
          editorUser.id,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThanOrEqual(3);
          for (const place of result.value) {
            expect(place.regionId).toBe(testRegion.id);
          }
        }
      });

      it("should get published places only for anonymous user", async () => {
        const result = await getPlacesByRegion(context, testRegion.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(1);
          expect(result.value[0].name).toBe("Published Restaurant");
        }
      });

      it("should handle non-existent region", async () => {
        const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";
        const result = await getPlacesByRegion(
          context,
          nonExistentRegionId,
          editorUser.id,
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      });
    });
  });

  describe("getPlacesByCreator", () => {
    describe("successful retrieval", () => {
      it("should get all places by creator", async () => {
        const result = await getPlacesByCreator(context, editorUser.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThanOrEqual(3);
          for (const place of result.value) {
            expect(place.createdBy).toBe(editorUser.id);
          }
        }
      });

      it("should filter places by status", async () => {
        const result = await getPlacesByCreator(
          context,
          editorUser.id,
          "published",
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(1);
          expect(result.value[0].status).toBe("published");
        }
      });

      it("should get draft places only", async () => {
        const result = await getPlacesByCreator(
          context,
          editorUser.id,
          "draft",
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(1);
          expect(result.value[0].status).toBe("draft");
        }
      });

      it("should get archived places only", async () => {
        const result = await getPlacesByCreator(
          context,
          editorUser.id,
          "archived",
        );

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(1);
          expect(result.value[0].status).toBe("archived");
        }
      });

      it("should handle user with no places", async () => {
        const result = await getPlacesByCreator(context, otherUser.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      });

      it("should handle non-existent user", async () => {
        const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";
        const result = await getPlacesByCreator(context, nonExistentUserId);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      });
    });
  });

  describe("getPlacesByPermission", () => {
    describe("successful retrieval", () => {
      it("should get places where user has permissions", async () => {
        const result = await getPlacesByPermission(context, editorUser.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThanOrEqual(3);
        }
      });

      it("should handle user with no permissions", async () => {
        // Create a visitor user with no special permissions
        const hashedPassword = await context.passwordHasher.hash("password123");
        if (hashedPassword.isOk()) {
          const visitorResult = await context.userRepository.create({
            email: "visitor@example.com",
            password: hashedPassword.value,
            name: "Visitor User",
          });

          if (visitorResult.isOk()) {
            const result = await getPlacesByPermission(
              context,
              visitorResult.value.id,
            );

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
              expect(result.value).toHaveLength(0);
            }
          }
        }
      });

      it("should get all places for admin user", async () => {
        const result = await getPlacesByPermission(context, adminUser.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThanOrEqual(3);
        }
      });
    });
  });

  describe("getMapLocations", () => {
    describe("successful retrieval", () => {
      it("should get map locations for a region", async () => {
        const result = await getMapLocations(context, testRegion.id);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThan(0);
          for (const location of result.value) {
            expect(location.id).toBeDefined();
            expect(location.name).toBeDefined();
            expect(location.coordinates).toBeDefined();
            expect(location.category).toBeDefined();
            expect(location.coordinates.latitude).toBeGreaterThanOrEqual(-90);
            expect(location.coordinates.latitude).toBeLessThanOrEqual(90);
            expect(location.coordinates.longitude).toBeGreaterThanOrEqual(-180);
            expect(location.coordinates.longitude).toBeLessThanOrEqual(180);
          }
        }
      });

      it("should handle region with no places", async () => {
        // Create empty region
        const emptyRegionInput: CreateRegionInput = {
          name: "Empty Region",
          images: [],
          tags: [],
        };
        const emptyRegionResult = await createRegion(
          context,
          editorUser.id,
          emptyRegionInput,
        );

        if (emptyRegionResult.isOk()) {
          const result = await getMapLocations(
            context,
            emptyRegionResult.value.id,
          );

          expect(result.isOk()).toBe(true);
          if (result.isOk()) {
            expect(result.value).toHaveLength(0);
          }
        }
      });

      it("should handle non-existent region", async () => {
        const nonExistentRegionId = "550e8400-e29b-41d4-a716-446655440000";
        const result = await getMapLocations(context, nonExistentRegionId);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      });
    });
  });

  describe("performance considerations", () => {
    it("should handle large datasets efficiently", async () => {
      // Create many places
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        const placeInput: CreatePlaceInput = {
          name: `Performance Test Place ${i}`,
          category: "restaurant",
          regionId: testRegion.id,
          coordinates: {
            latitude: 35.6762 + i * 0.001,
            longitude: 139.6503 + i * 0.001,
          },
          address: `${i} Performance Street, Tokyo, Japan`,
          images: [],
          tags: [`performance-${i}`],
          businessHours: [],
        };
        createPromises.push(createPlace(context, editorUser.id, placeInput));
      }

      await Promise.all(createPromises);

      const request: ListPlacesRequest = {
        query: {
          pagination: {
            page: 1,
            limit: 25,
            order: "desc",
            orderBy: "createdAt",
          },
        },
        userId: editorUser.id,
      };

      const startTime = Date.now();
      const result = await listPlaces(context, request);
      const endTime = Date.now();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.items).toHaveLength(25);
        expect(result.value.count).toBeGreaterThanOrEqual(50);
      }

      // Should complete within reasonable time (adjust as needed)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
