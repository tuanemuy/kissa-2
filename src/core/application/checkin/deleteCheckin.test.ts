import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Checkin } from "@/core/domain/checkin/types";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreatePlaceInput, createPlace } from "../place/createPlace";
import { type CreateRegionInput, createRegion } from "../region/createRegion";
import { type CreateCheckinInput, createCheckin } from "./createCheckin";
import {
  type DeleteCheckinInput,
  deleteCheckin,
  hardDeleteCheckin,
} from "./deleteCheckin";

describe("deleteCheckin", () => {
  let context: Context;
  let activeUser: User;
  let otherUser: User;
  let adminUser: User;
  let testRegion: Region;
  let testPlace: Place;
  let testCheckin: Checkin;

  beforeEach(async () => {
    context = createMockContext();
    resetMockContext(context);

    // Create test users
    const hashedPassword = await context.passwordHasher.hash("password123");
    if (hashedPassword.isErr()) {
      throw new Error("Failed to hash password in test setup");
    }

    // Create active user
    const activeResult = await context.userRepository.create({
      email: "active@example.com",
      password: hashedPassword.value,
      name: "Active User",
    });
    if (activeResult.isErr()) {
      throw new Error("Failed to create active user");
    }
    activeUser = activeResult.value;
    await context.userRepository.updateRole(activeUser.id, "editor");

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
      description: "A test region",
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      images: [],
      tags: [],
    };
    const regionResult = await createRegion(
      context,
      activeUser.id,
      regionInput,
    );
    if (regionResult.isErr()) {
      throw new Error(
        `Failed to create test region: ${regionResult.error.message}`,
      );
    }
    testRegion = regionResult.value;

    // Create test place
    const placeInput: CreatePlaceInput = {
      regionId: testRegion.id,
      name: "Test Place",
      description: "A test place",
      coordinates: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      address: "Test Address",
      category: "restaurant",
      images: [],
      tags: [],
      businessHours: [],
    };
    const placeResult = await createPlace(context, activeUser.id, placeInput);
    if (placeResult.isErr()) {
      throw new Error(
        `Failed to create test place: ${placeResult.error.message}`,
      );
    }
    testPlace = placeResult.value;

    // Publish the place so we can create checkins
    const publishResult = await context.placeRepository.updateStatus(
      testPlace.id,
      "published",
    );
    if (publishResult.isErr()) {
      throw new Error(
        `Failed to publish test place: ${publishResult.error.message}`,
      );
    }
    testPlace = publishResult.value;

    // Create test checkin
    const checkinInput: CreateCheckinInput = {
      placeId: testPlace.id,
      comment: "Great place!",
      rating: 5,
      userLocation: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      isPrivate: false,
      photos: [],
    };
    const checkinResult = await createCheckin(
      context,
      activeUser.id,
      checkinInput,
    );
    if (checkinResult.isErr()) {
      throw new Error(
        `Failed to create test checkin: ${checkinResult.error.message}`,
      );
    }
    testCheckin = checkinResult.value;
  });

  describe("soft delete (deleteCheckin)", () => {
    it("should successfully delete own checkin", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isOk()).toBe(true);

      // Verify checkin is marked as deleted
      const checkinResult = await context.checkinRepository.findById(
        testCheckin.id,
      );
      if (checkinResult.isOk() && checkinResult.value) {
        expect(checkinResult.value.status).toBe("deleted");
      }
    });

    it("should allow admin to delete any checkin", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: adminUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isOk()).toBe(true);

      // Verify checkin is marked as deleted
      const checkinResult = await context.checkinRepository.findById(
        testCheckin.id,
      );
      if (checkinResult.isOk() && checkinResult.value) {
        expect(checkinResult.value.status).toBe("deleted");
      }
    });

    it("should fail if user does not exist", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: "00000000-0000-0000-0000-000000000000",
      };

      const result = await deleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail if checkin does not exist", async () => {
      const input: DeleteCheckinInput = {
        checkinId: "00000000-0000-0000-0000-000000000000",
        userId: activeUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_NOT_FOUND);
      }
    });

    it("should fail if user is not owner and not admin", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: otherUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if user account is inactive", async () => {
      // Suspend the user
      await context.userRepository.updateStatus(activeUser.id, "suspended");

      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail if checkin is already deleted", async () => {
      // First delete the checkin
      await deleteCheckin(context, {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      });

      // Try to delete again
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      };

      const result = await deleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_ALREADY_DELETED);
      }
    });
  });

  describe("hard delete (hardDeleteCheckin)", () => {
    it("should allow admin to permanently delete checkin", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: adminUser.id,
      };

      const result = await hardDeleteCheckin(context, input);

      expect(result.isOk()).toBe(true);

      // Verify checkin no longer exists
      const checkinResult = await context.checkinRepository.findById(
        testCheckin.id,
      );
      if (checkinResult.isOk()) {
        expect(checkinResult.value).toBeNull();
      }
    });

    it("should fail if user is not admin", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      };

      const result = await hardDeleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if user does not exist", async () => {
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: "00000000-0000-0000-0000-000000000000",
      };

      const result = await hardDeleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail if checkin does not exist", async () => {
      const input: DeleteCheckinInput = {
        checkinId: "00000000-0000-0000-0000-000000000000",
        userId: adminUser.id,
      };

      const result = await hardDeleteCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_NOT_FOUND);
      }
    });

    it("should handle already soft-deleted checkin", async () => {
      // First soft delete the checkin
      await deleteCheckin(context, {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      });

      // Then hard delete it
      const input: DeleteCheckinInput = {
        checkinId: testCheckin.id,
        userId: adminUser.id,
      };

      const result = await hardDeleteCheckin(context, input);

      expect(result.isOk()).toBe(true);

      // Verify checkin no longer exists
      const checkinResult = await context.checkinRepository.findById(
        testCheckin.id,
      );
      if (checkinResult.isOk()) {
        expect(checkinResult.value).toBeNull();
      }
    });
  });
});
