import { beforeEach, describe, expect, it } from "vitest";
import type { MockCheckinRepository } from "@/core/adapters/mock/placeRepository";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreatePlaceInput, createPlace } from "./createPlace";
import { type DeletePlaceRequest, deletePlace } from "./deletePlace";

describe("deletePlace", () => {
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
      description: "A test place for deletion",
      shortDescription: "Test place",
      category: "restaurant",
      regionId: testRegion.id,
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      address: "123 Test Street, Tokyo, Japan",
      images: [],
      tags: ["test", "restaurant"],
      businessHours: [],
    };

    const placeResult = await createPlace(context, ownerUser.id, placeInput);
    if (placeResult.isErr()) {
      throw new Error("Failed to create test place");
    }
    testPlace = placeResult.value;
  });

  describe("successful place deletion", () => {
    it("should delete place by owner", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);

      // Verify place no longer exists
      const findResult = await context.placeRepository.findById(testPlace.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).toBeNull();
      }
    });

    it("should delete place without checkins", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });

    it("should delete place with non-active checkins", async () => {
      // Add hidden checkin to the place
      const hiddenCheckin: CheckinWithDetails = {
        id: "checkin-1",
        userId: "other-user-id",
        placeId: testPlace.id,
        status: "hidden",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: "Other User",
        placeName: testPlace.name,
        placeRegionName: testRegion.name,
        placeAddress: testPlace.address,
        placeCoordinates: testPlace.coordinates,
        photos: [],
      };

      (context.checkinRepository as MockCheckinRepository).addTestCheckin(
        hiddenCheckin,
      );

      // Add deleted checkin to the place
      const deletedCheckin: CheckinWithDetails = {
        id: "checkin-2",
        userId: "another-user-id",
        placeId: testPlace.id,
        status: "deleted",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: "Another User",
        placeName: testPlace.name,
        placeRegionName: testRegion.name,
        placeAddress: testPlace.address,
        placeCoordinates: testPlace.coordinates,
        photos: [],
      };

      (context.checkinRepository as MockCheckinRepository).addTestCheckin(
        deletedCheckin,
      );

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("permission validation", () => {
    it("should fail when user does not own place and has no permission", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: otherUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(
          ERROR_CODES.PLACE_DELETE_PERMISSION_REQUIRED,
        );
        expect(result.error.message).toBe(
          "You don't have permission to delete this place",
        );
      }
    });

    it("should fail when place does not exist", async () => {
      const nonExistentPlaceId = "550e8400-e29b-41d4-a716-446655440000";
      const request: DeletePlaceRequest = {
        placeId: nonExistentPlaceId,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_FOUND);
      }
    });

    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: nonExistentUserId,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_FOUND);
      }
    });
  });

  describe("dependency validation", () => {
    it("should fail when place has active checkins", async () => {
      // Add active checkin to the place
      const activeCheckin: CheckinWithDetails = {
        id: "active-checkin-1",
        userId: otherUser.id,
        placeId: testPlace.id,
        comment: "Great place!",
        rating: 5,
        status: "active",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: "Other User",
        placeName: testPlace.name,
        placeRegionName: testRegion.name,
        placeAddress: testPlace.address,
        placeCoordinates: testPlace.coordinates,
        photos: [],
      };

      (context.checkinRepository as MockCheckinRepository).addTestCheckin(
        activeCheckin,
      );

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CONTENT_HAS_DEPENDENCIES);
        expect(result.error.message).toBe(
          "Cannot delete place that has active check-ins",
        );
      }
    });

    it("should fail when place has multiple active checkins", async () => {
      // Add multiple active checkins to the place
      const activeCheckins: CheckinWithDetails[] = [
        {
          id: "active-checkin-1",
          userId: otherUser.id,
          placeId: testPlace.id,
          comment: "Great place!",
          rating: 5,
          status: "active",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: "Other User",
          placeName: testPlace.name,
          placeRegionName: testRegion.name,
          placeAddress: testPlace.address,
          placeCoordinates: testPlace.coordinates,
          photos: [],
        },
        {
          id: "active-checkin-2",
          userId: adminUser.id,
          placeId: testPlace.id,
          comment: "Nice atmosphere!",
          rating: 4,
          status: "active",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: "Admin User",
          placeName: testPlace.name,
          placeRegionName: testRegion.name,
          placeAddress: testPlace.address,
          placeCoordinates: testPlace.coordinates,
          photos: [],
        },
      ];

      for (const checkin of activeCheckins) {
        (context.checkinRepository as MockCheckinRepository).addTestCheckin(
          checkin,
        );
      }

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CONTENT_HAS_DEPENDENCIES);
        expect(result.error.message).toBe(
          "Cannot delete place that has active check-ins",
        );
      }
    });

    it("should succeed when place has mix of active and non-active checkins but no active ones", async () => {
      // Add multiple non-active checkins to the place
      const nonActiveCheckins: CheckinWithDetails[] = [
        {
          id: "hidden-checkin-1",
          userId: otherUser.id,
          placeId: testPlace.id,
          comment: "Hidden checkin",
          rating: 5,
          status: "hidden",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: "Other User",
          placeName: testPlace.name,
          placeRegionName: testRegion.name,
          placeAddress: testPlace.address,
          placeCoordinates: testPlace.coordinates,
          photos: [],
        },
        {
          id: "deleted-checkin-1",
          userId: adminUser.id,
          placeId: testPlace.id,
          comment: "Deleted checkin",
          status: "deleted",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: "Admin User",
          placeName: testPlace.name,
          placeRegionName: testRegion.name,
          placeAddress: testPlace.address,
          placeCoordinates: testPlace.coordinates,
          photos: [],
        },
        {
          id: "reported-checkin-1",
          userId: ownerUser.id,
          placeId: testPlace.id,
          comment: "Reported checkin",
          status: "reported",
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: "Owner User",
          placeName: testPlace.name,
          placeRegionName: testRegion.name,
          placeAddress: testPlace.address,
          placeCoordinates: testPlace.coordinates,
          photos: [],
        },
      ];

      for (const checkin of nonActiveCheckins) {
        (context.checkinRepository as MockCheckinRepository).addTestCheckin(
          checkin,
        );
      }

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle place with no checkins at all", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });

    it("should handle concurrent deletion attempts", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      // Try to delete the same place concurrently
      const results = await Promise.allSettled([
        deletePlace(context, request),
        deletePlace(context, request),
      ]);

      // One should succeed, one should fail (place not found)
      let successCount = 0;
      let notFoundCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          if (result.value.isOk()) {
            successCount++;
          } else if (result.value.error.code === ERROR_CODES.PLACE_NOT_FOUND) {
            notFoundCount++;
          }
        }
      }

      // Expect one success and one "not found" error
      expect(successCount).toBe(1);
      expect(notFoundCount).toBe(1);
    });
  });

  describe("data integrity", () => {
    it("should not delete place on permission check failure", async () => {
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: otherUser.id, // User without permission
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);

      // Verify place still exists
      const findResult = await context.placeRepository.findById(testPlace.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull();
        expect(findResult.value?.id).toBe(testPlace.id);
      }
    });

    it("should not delete place when it has active checkins", async () => {
      // Add active checkin to the place
      const activeCheckin: CheckinWithDetails = {
        id: "active-checkin-1",
        userId: otherUser.id,
        placeId: testPlace.id,
        comment: "Great place!",
        rating: 5,
        status: "active",
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        userName: "Other User",
        placeName: testPlace.name,
        placeRegionName: testRegion.name,
        placeAddress: testPlace.address,
        placeCoordinates: testPlace.coordinates,
        photos: [],
      };

      (context.checkinRepository as MockCheckinRepository).addTestCheckin(
        activeCheckin,
      );

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isErr()).toBe(true);

      // Verify place still exists
      const findResult = await context.placeRepository.findById(testPlace.id);
      expect(findResult.isOk()).toBe(true);
      if (findResult.isOk()) {
        expect(findResult.value).not.toBeNull();
        expect(findResult.value?.id).toBe(testPlace.id);
      }
    });

    it("should not affect other places when deleting one place", async () => {
      // Create another place
      const anotherPlaceInput: CreatePlaceInput = {
        name: "Another Test Place",
        category: "cafe",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6763,
          longitude: 139.6504,
        },
        address: "456 Another Street, Tokyo, Japan",
        images: [],
        tags: ["another", "cafe"],
        businessHours: [],
      };

      const anotherPlaceResult = await createPlace(
        context,
        ownerUser.id,
        anotherPlaceInput,
      );
      if (anotherPlaceResult.isErr()) {
        throw new Error("Failed to create another test place");
      }
      const anotherPlace = anotherPlaceResult.value;

      // Delete the first place
      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);

      // Verify first place is deleted
      const firstPlaceResult = await context.placeRepository.findById(
        testPlace.id,
      );
      expect(firstPlaceResult.isOk()).toBe(true);
      if (firstPlaceResult.isOk()) {
        expect(firstPlaceResult.value).toBeNull();
      }

      // Verify second place still exists
      const secondPlaceResult = await context.placeRepository.findById(
        anotherPlace.id,
      );
      expect(secondPlaceResult.isOk()).toBe(true);
      if (secondPlaceResult.isOk()) {
        expect(secondPlaceResult.value).not.toBeNull();
        expect(secondPlaceResult.value?.id).toBe(anotherPlace.id);
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
          email: "owner@example.com",
          password: hashedPassword.value,
          name: "Owner User",
        });
      }

      const ownerResult =
        await failingContext.userRepository.findByEmail("owner@example.com");
      if (ownerResult.isOk() && ownerResult.value) {
        await failingContext.userRepository.updateRole(
          ownerResult.value.id,
          "editor",
        );

        const regionResult = await failingContext.regionRepository.create(
          ownerResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const placeInput: CreatePlaceInput = {
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

          const placeResult = await createPlace(
            failingContext,
            ownerResult.value.id,
            placeInput,
          );

          if (placeResult.isOk()) {
            const request: DeletePlaceRequest = {
              placeId: placeResult.value.id,
              userId: ownerResult.value.id,
            };

            const result = await deletePlace(failingContext, request);

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
              expect(result.error.code).toBe(ERROR_CODES.TRANSACTION_FAILED);
            }
          }
        }
      }
    });
  });

  describe("various place states", () => {
    it("should delete draft place", async () => {
      // testPlace is created as draft by default
      expect(testPlace.status).toBe("draft");

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });

    it("should delete published place", async () => {
      // Update place status to published
      await context.placeRepository.updateStatus(testPlace.id, "published");

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });

    it("should delete archived place", async () => {
      // Update place status to archived
      await context.placeRepository.updateStatus(testPlace.id, "archived");

      const request: DeletePlaceRequest = {
        placeId: testPlace.id,
        userId: ownerUser.id,
      };

      const result = await deletePlace(context, request);

      expect(result.isOk()).toBe(true);
    });
  });
});
