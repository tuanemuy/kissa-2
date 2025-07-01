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
  deleteCheckinPhoto,
  type UploadCheckinPhotosInput,
  updateCheckinPhotoCaption,
  uploadCheckinPhotos,
} from "./uploadCheckinPhotos";

describe("uploadCheckinPhotos", () => {
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

    // Create test checkin without photos
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

  describe("uploadCheckinPhotos", () => {
    it("should successfully upload photos to checkin", async () => {
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
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

      const result = await uploadCheckinPhotos(context, input);

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

    it("should successfully upload photos without captions", async () => {
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: [
          {
            url: "https://example.com/photo1.jpg",
          },
        ],
      };

      const result = await uploadCheckinPhotos(context, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const photos = result.value;
        expect(photos).toHaveLength(1);
        expect(photos[0].url).toBe("https://example.com/photo1.jpg");
        expect(photos[0].caption).toBeUndefined();
      }
    });

    it("should fail if user does not exist", async () => {
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: "00000000-0000-0000-0000-000000000000",
        photos: [{ url: "https://example.com/photo1.jpg" }],
      };

      const result = await uploadCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail if checkin does not exist", async () => {
      const input: UploadCheckinPhotosInput = {
        checkinId: "00000000-0000-0000-0000-000000000000",
        userId: activeUser.id,
        photos: [{ url: "https://example.com/photo1.jpg" }],
      };

      const result = await uploadCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_NOT_FOUND);
      }
    });

    it("should fail if user is not the owner", async () => {
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: otherUser.id,
        photos: [{ url: "https://example.com/photo1.jpg" }],
      };

      const result = await uploadCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if user account is inactive", async () => {
      // Suspend the user
      await context.userRepository.updateStatus(activeUser.id, "suspended");

      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: [{ url: "https://example.com/photo1.jpg" }],
      };

      const result = await uploadCheckinPhotos(context, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
      }
    });

    it("should fail if trying to upload too many photos", async () => {
      // First upload some photos to approach the limit
      const firstUpload: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: Array.from({ length: 5 }, (_, i) => ({
          url: `https://example.com/photo${i + 1}.jpg`,
        })),
      };
      await uploadCheckinPhotos(context, firstUpload);

      // Try to upload more photos that would exceed the limit
      const secondUpload: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: Array.from({ length: 6 }, (_, i) => ({
          url: `https://example.com/photo${i + 6}.jpg`,
        })),
      };

      const result = await uploadCheckinPhotos(context, secondUpload);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PHOTO_LIMIT_EXCEEDED);
      }
    });
  });

  describe("deleteCheckinPhoto", () => {
    let uploadedPhotos: CheckinPhoto[];

    beforeEach(async () => {
      // Upload some photos first
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: [
          { url: "https://example.com/photo1.jpg", caption: "Photo 1" },
          { url: "https://example.com/photo2.jpg", caption: "Photo 2" },
        ],
      };
      const result = await uploadCheckinPhotos(context, input);
      if (result.isErr()) {
        throw new Error("Failed to upload photos for test");
      }
      uploadedPhotos = result.value;
    });

    it("should successfully delete photo as owner", async () => {
      const photoId = uploadedPhotos[0].id;

      const result = await deleteCheckinPhoto(context, photoId, activeUser.id);

      expect(result.isOk()).toBe(true);

      // Verify photo is deleted
      const photoResult =
        await context.checkinPhotoRepository.findById(photoId);
      if (photoResult.isOk()) {
        expect(photoResult.value).toBeNull();
      }
    });

    it("should successfully delete photo as admin", async () => {
      const photoId = uploadedPhotos[0].id;

      const result = await deleteCheckinPhoto(context, photoId, adminUser.id);

      expect(result.isOk()).toBe(true);
    });

    it("should fail to delete photo as non-owner", async () => {
      const photoId = uploadedPhotos[0].id;

      const result = await deleteCheckinPhoto(context, photoId, otherUser.id);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if photo does not exist", async () => {
      const result = await deleteCheckinPhoto(
        context,
        "00000000-0000-0000-0000-000000000000",
        activeUser.id,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PHOTO_NOT_FOUND);
      }
    });
  });

  describe("updateCheckinPhotoCaption", () => {
    let uploadedPhotos: CheckinPhoto[];

    beforeEach(async () => {
      // Upload some photos first
      const input: UploadCheckinPhotosInput = {
        checkinId: testCheckin.id,
        userId: activeUser.id,
        photos: [
          {
            url: "https://example.com/photo1.jpg",
            caption: "Original Caption",
          },
        ],
      };
      const result = await uploadCheckinPhotos(context, input);
      if (result.isErr()) {
        throw new Error("Failed to upload photos for test");
      }
      uploadedPhotos = result.value;
    });

    it("should successfully update photo caption", async () => {
      const photoId = uploadedPhotos[0].id;
      const newCaption = "Updated Caption";

      const result = await updateCheckinPhotoCaption(
        context,
        photoId,
        activeUser.id,
        newCaption,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const updatedPhoto = result.value;
        expect(updatedPhoto.caption).toBe(newCaption);
      }
    });

    it("should fail to update caption as non-owner", async () => {
      const photoId = uploadedPhotos[0].id;
      const newCaption = "Updated Caption";

      const result = await updateCheckinPhotoCaption(
        context,
        photoId,
        otherUser.id,
        newCaption,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
      }
    });

    it("should fail if photo does not exist", async () => {
      const result = await updateCheckinPhotoCaption(
        context,
        "00000000-0000-0000-0000-000000000000",
        activeUser.id,
        "New Caption",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PHOTO_NOT_FOUND);
      }
    });

    it("should fail if caption is too long", async () => {
      const photoId = uploadedPhotos[0].id;
      const tooLongCaption = "x".repeat(201); // Assuming max length is 200

      const result = await updateCheckinPhotoCaption(
        context,
        photoId,
        activeUser.id,
        tooLongCaption,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      }
    });
  });
});
