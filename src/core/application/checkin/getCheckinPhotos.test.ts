import { beforeEach, describe, expect, it } from "vitest";
import {
  createMockContext,
  resetMockContext,
} from "@/core/adapters/mock/testContext";
import type { Checkin, CheckinPhoto } from "@/core/domain/checkin/types";
import type { Place } from "@/core/domain/place/types";
import type { Region } from "@/core/domain/region/types";
import type { User } from "@/core/domain/user/types";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { type CreatePlaceInput, createPlace } from "../place/createPlace";
import { type CreateRegionInput, createRegion } from "../region/createRegion";
import { type CreateCheckinInput, createCheckin } from "./createCheckin";
import {
  type GetCheckinPhotosInput,
  getCheckinPhotoById,
  getCheckinPhotos,
} from "./getCheckinPhotos";

describe("getCheckinPhotos", () => {
  let context: Context;
  let activeUser: User;
  let otherUser: User;
  let adminUser: User;
  let testRegion: Region;
  let testPlace: Place;
  let publicCheckin: Checkin;
  let privateCheckin: Checkin;
  let publicCheckinPhotos: CheckinPhoto[];
  let privateCheckinPhotos: CheckinPhoto[];

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

    // Create public checkin with photos
    const publicCheckinInput: CreateCheckinInput = {
      placeId: testPlace.id,
      comment: "Public checkin!",
      rating: 5,
      userLocation: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      isPrivate: false,
      photos: [
        {
          url: "https://example.com/photo1.jpg",
          caption: "Photo 1",
        },
        {
          url: "https://example.com/photo2.jpg",
          caption: "Photo 2",
        },
      ],
    };
    const publicCheckinResult = await createCheckin(
      context,
      activeUser.id,
      publicCheckinInput,
    );
    if (publicCheckinResult.isErr()) {
      throw new Error(
        `Failed to create public checkin: ${publicCheckinResult.error.message}`,
      );
    }
    publicCheckin = publicCheckinResult.value;

    // Get the photos that were created
    const publicPhotosResult =
      await context.checkinPhotoRepository.findByCheckin(publicCheckin.id);
    if (publicPhotosResult.isErr()) {
      throw new Error("Failed to get public checkin photos");
    }
    publicCheckinPhotos = publicPhotosResult.value;

    // Create private checkin with photos
    const privateCheckinInput: CreateCheckinInput = {
      placeId: testPlace.id,
      comment: "Private checkin!",
      rating: 4,
      userLocation: {
        latitude: 35.6762,
        longitude: 139.6503,
      },
      isPrivate: true,
      photos: [
        {
          url: "https://example.com/private1.jpg",
          caption: "Private Photo 1",
        },
      ],
    };
    const privateCheckinResult = await createCheckin(
      context,
      activeUser.id,
      privateCheckinInput,
    );
    if (privateCheckinResult.isErr()) {
      throw new Error(
        `Failed to create private checkin: ${privateCheckinResult.error.message}`,
      );
    }
    privateCheckin = privateCheckinResult.value;

    // Get the photos that were created
    const privatePhotosResult =
      await context.checkinPhotoRepository.findByCheckin(privateCheckin.id);
    if (privatePhotosResult.isErr()) {
      throw new Error("Failed to get private checkin photos");
    }
    privateCheckinPhotos = privatePhotosResult.value;
  });

  describe("public checkin photos", () => {
    it("should get photos from public checkin without authentication", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: publicCheckin.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photos = result.value;
        expect(photos).toHaveLength(2);
        expect(photos[0].url).toBe("https://example.com/photo1.jpg");
        expect(photos[0].caption).toBe("Photo 1");
        expect(photos[1].url).toBe("https://example.com/photo2.jpg");
        expect(photos[1].caption).toBe("Photo 2");
      }
    });

    it("should get photos from public checkin with authentication", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: publicCheckin.id,
        userId: otherUser.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photos = result.value;
        expect(photos).toHaveLength(2);
      }
    });
  });

  describe("private checkin photos", () => {
    it("should fail to get photos from private checkin without authentication", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: privateCheckin.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.AUTHENTICATION_REQUIRED);
      }
    });

    it("should get photos from private checkin as owner", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: privateCheckin.id,
        userId: activeUser.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photos = result.value;
        expect(photos).toHaveLength(1);
        expect(photos[0].url).toBe("https://example.com/private1.jpg");
        expect(photos[0].caption).toBe("Private Photo 1");
      }
    });

    it("should get photos from private checkin as admin", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: privateCheckin.id,
        userId: adminUser.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photos = result.value;
        expect(photos).toHaveLength(1);
      }
    });

    it("should fail to get photos from private checkin as non-owner", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: privateCheckin.id,
        userId: otherUser.id,
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });
  });

  describe("error handling", () => {
    it("should fail if checkin does not exist", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: "00000000-0000-0000-0000-000000000000",
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_NOT_FOUND);
      }
    });

    it("should fail if user does not exist", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: privateCheckin.id,
        userId: "00000000-0000-0000-0000-000000000000",
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail with invalid checkin ID format", async () => {
      const input: GetCheckinPhotosInput = {
        checkinId: "invalid-uuid",
      };

      const result = await getCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });
  });

  describe("getCheckinPhotoById", () => {
    it("should get individual photo from public checkin", async () => {
      const photoId = publicCheckinPhotos[0].id;

      const result = await getCheckinPhotoById(context, photoId);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photo = result.value;
        expect(photo.id).toBe(photoId);
        expect(photo.url).toBe("https://example.com/photo1.jpg");
      }
    });

    it("should get individual photo from private checkin as owner", async () => {
      const photoId = privateCheckinPhotos[0].id;

      const result = await getCheckinPhotoById(context, photoId, activeUser.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photo = result.value;
        expect(photo.id).toBe(photoId);
        expect(photo.url).toBe("https://example.com/private1.jpg");
      }
    });

    it("should fail to get individual photo from private checkin without auth", async () => {
      const photoId = privateCheckinPhotos[0].id;

      const result = await getCheckinPhotoById(context, photoId);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.AUTHENTICATION_REQUIRED);
      }
    });

    it("should fail if photo does not exist", async () => {
      const result = await getCheckinPhotoById(
        context,
        "00000000-0000-0000-0000-000000000000",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PHOTO_NOT_FOUND);
      }
    });
  });
});
