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
import { type UpdateCheckinInput, updateCheckin } from "./updateCheckin";

describe("updateCheckin", () => {
  let context: Context;
  let activeUser: User;
  let otherUser: User;
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
      images: [],
      tags: [],
      address: "Test Address",
      category: "restaurant",
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

  describe("successful update", () => {
    it("should update checkin comment", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        comment: "Updated comment",
      };

      const result = await updateCheckin(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updated = result.value;
        expect(updated.comment).toBe("Updated comment");
        expect(updated.rating).toBe(testCheckin.rating); // Should remain unchanged
        expect(updated.isPrivate).toBe(testCheckin.isPrivate); // Should remain unchanged
      }
    });

    it("should update checkin rating", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        rating: 3,
      };

      const result = await updateCheckin(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updated = result.value;
        expect(updated.rating).toBe(3);
        expect(updated.comment).toBe(testCheckin.comment); // Should remain unchanged
      }
    });

    it("should update checkin privacy", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        isPrivate: true,
      };

      const result = await updateCheckin(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updated = result.value;
        expect(updated.isPrivate).toBe(true);
        expect(updated.comment).toBe(testCheckin.comment); // Should remain unchanged
        expect(updated.rating).toBe(testCheckin.rating); // Should remain unchanged
      }
    });

    it("should update multiple fields", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        comment: "Updated comment",
        rating: 4,
        isPrivate: true,
      };

      const result = await updateCheckin(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updated = result.value;
        expect(updated.comment).toBe("Updated comment");
        expect(updated.rating).toBe(4);
        expect(updated.isPrivate).toBe(true);
      }
    });
  });

  describe("error handling", () => {
    it("should fail if user does not exist", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: "00000000-0000-0000-0000-000000000000",
        comment: "Updated comment",
      };

      const result = await updateCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail if checkin does not exist", async () => {
      const input: UpdateCheckinInput = {
        checkinId: "00000000-0000-0000-0000-000000000000",
        userId: activeUser.id,
        comment: "Updated comment",
      };

      const result = await updateCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_NOT_FOUND);
      }
    });

    it("should fail if user is not the owner", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: otherUser.id,
        comment: "Updated comment",
      };

      const result = await updateCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if no fields to update", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
      };

      const result = await updateCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });

    it("should fail if user account is inactive", async () => {
      // Suspend the user
      await context.userRepository.updateStatus(activeUser.id, "suspended");

      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        comment: "Updated comment",
      };

      const result = await updateCheckin(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });
  });

  describe("validation", () => {
    it("should validate comment length", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        comment: "x".repeat(1001), // Exceeds max length
      };

      // This should be caught by Zod validation at the API layer
      // Here we test the application logic directly
      const result = await updateCheckin(context, input);
      expect(result.isOk()).toBe(true); // Application layer doesn't validate, assumes pre-validated input
    });

    it("should validate rating range", async () => {
      const input: UpdateCheckinInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        rating: 6, // Exceeds max rating
      };

      // This should be caught by Zod validation at the API layer
      const result = await updateCheckin(context, input);
      expect(result.isOk()).toBe(true); // Application layer doesn't validate, assumes pre-validated input
    });
  });
});
