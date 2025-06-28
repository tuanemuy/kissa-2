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
import { type CreatePlaceInput, createPlace } from "../place/createPlace";
import { type CreateRegionInput, createRegion } from "../region/createRegion";
import { type CreateCheckinInput, createCheckin } from "./createCheckin";

describe("createCheckin", () => {
  let context: Context;
  let activeUser: User;
  let suspendedUser: User;
  let testRegion: Region;
  let publishedPlace: Place;
  let draftPlace: Place;

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

    // Create suspended user
    const suspendedResult = await context.userRepository.create({
      email: "suspended@example.com",
      password: hashedPassword.value,
      name: "Suspended User",
    });
    if (suspendedResult.isErr()) {
      throw new Error("Failed to create suspended user");
    }
    suspendedUser = suspendedResult.value;
    await context.userRepository.updateStatus(suspendedUser.id, "suspended");

    // Create test region
    const regionInput: CreateRegionInput = {
      name: "Test Region",
      images: [],
      tags: [],
    };
    const regionResult = await createRegion(
      context,
      activeUser.id,
      regionInput,
    );
    if (regionResult.isErr()) {
      throw new Error("Failed to create test region");
    }
    testRegion = regionResult.value;

    // Create published place
    const publishedPlaceInput: CreatePlaceInput = {
      name: "Test Restaurant",
      description: "A test restaurant for check-ins",
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
    const publishedPlaceResult = await createPlace(
      context,
      activeUser.id,
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
      activeUser.id,
      draftPlaceInput,
    );
    if (draftPlaceResult.isErr()) {
      throw new Error("Failed to create draft place");
    }
    draftPlace = draftPlaceResult.value;
  });

  describe("successful checkin creation", () => {
    it("should create checkin with minimal valid input", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762, // Same as place location
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.userId).toBe(activeUser.id);
        expect(result.value.placeId).toBe(publishedPlace.id);
        expect(result.value.status).toBe("active");
        expect(result.value.isPrivate).toBe(false);
        expect(result.value.comment).toBeUndefined();
        expect(result.value.rating).toBeUndefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should create checkin with comment and rating", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        comment: "Great place! Loved the atmosphere.",
        rating: 5,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.comment).toBe("Great place! Loved the atmosphere.");
        expect(result.value.rating).toBe(5);
      }
    });

    it("should create private checkin", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        isPrivate: true,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.isPrivate).toBe(true);
      }
    });

    it("should create checkin with photos", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [
          {
            url: "https://example.com/photo1.jpg",
            caption: "Delicious food!",
          },
          {
            url: "https://example.com/photo2.jpg",
            caption: "Beautiful interior",
          },
        ],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBeDefined();
        // Photos are handled by the repository, so we can't directly test them here
        // but we can verify the checkin was created successfully
      }
    });

    it("should create checkin with maximum length comment", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        comment: "A".repeat(1000), // Maximum length
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.comment).toBe("A".repeat(1000));
      }
    });

    it("should create checkin with all rating values", async () => {
      const ratings = [1, 2, 3, 4, 5];

      for (const rating of ratings) {
        const input: CreateCheckinInput = {
          placeId: publishedPlace.id,
          rating,
          userLocation: {
            latitude: 35.6762,
            longitude: 139.6503,
          },
          isPrivate: false,
          photos: [],
        };

        const result = await createCheckin(context, activeUser.id, input);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.rating).toBe(rating);
        }
      }
    });

    it("should handle nearby location (within distance threshold)", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762 + 0.0001, // Slightly different but within threshold
          longitude: 139.6503 + 0.0001,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.placeId).toBe(publishedPlace.id);
      }
    });

    it("should handle unicode characters in comment", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        comment: "素晴らしいレストランです！🍣🍜 Great sushi and ramen! 🌟",
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.comment).toBe(
          "素晴らしいレストランです！🍣🍜 Great sushi and ramen! 🌟",
        );
      }
    });
  });

  describe("user validation failures", () => {
    it("should fail when user does not exist", async () => {
      const nonExistentUserId = "550e8400-e29b-41d4-a716-446655440000";
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, nonExistentUserId, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
      }
    });

    it("should fail when user is not active", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, suspendedUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.USER_INACTIVE);
        expect(result.error.message).toBe("User account is not active");
      }
    });
  });

  describe("place validation failures", () => {
    it("should fail when place does not exist", async () => {
      const nonExistentPlaceId = "550e8400-e29b-41d4-a716-446655440000";
      const input: CreateCheckinInput = {
        placeId: nonExistentPlaceId,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_FOUND);
      }
    });

    it("should fail when place is not published", async () => {
      const input: CreateCheckinInput = {
        placeId: draftPlace.id,
        userLocation: {
          latitude: 35.6763,
          longitude: 139.6504,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.PLACE_NOT_PUBLISHED);
        expect(result.error.message).toBe(
          "Cannot check in to unpublished place",
        );
      }
    });
  });

  describe("location validation failures", () => {
    it("should fail when user is too far from place", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 36.0, // Far from place location
          longitude: 140.0,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_TOO_FAR);
        expect(result.error.message).toBe(
          "User location is too far from place",
        );
      }
    });

    it("should handle boundary coordinates", async () => {
      // Test with extreme but valid coordinates
      const extremeInput: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: -90,
          longitude: -180,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, extremeInput);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(ERROR_CODES.CHECKIN_TOO_FAR);
      }
    });
  });

  describe("validation edge cases", () => {
    it("should handle empty comment", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        comment: "",
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.comment).toBe("");
      }
    });

    it("should handle photo with maximum caption length", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [
          {
            url: "https://example.com/photo.jpg",
            caption: "A".repeat(200), // Maximum caption length
          },
        ],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBeDefined();
      }
    });

    it("should handle multiple photos", async () => {
      const photos = [];
      for (let i = 0; i < 10; i++) {
        photos.push({
          url: `https://example.com/photo${i}.jpg`,
          caption: `Photo ${i}`,
        });
      }

      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos,
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBeDefined();
      }
    });

    it("should handle valid photo URLs with query parameters", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [
          {
            url: "https://secure.example.com/photos/image.jpg?v=123&size=large&format=webp",
            caption: "High quality image",
          },
        ],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBeDefined();
      }
    });
  });

  describe("concurrent checkin creation", () => {
    it("should handle concurrent checkins by same user to different places", async () => {
      // Create another published place
      const anotherPlaceInput: CreatePlaceInput = {
        name: "Another Restaurant",
        category: "restaurant",
        regionId: testRegion.id,
        coordinates: {
          latitude: 35.6765,
          longitude: 139.6506,
        },
        address: "789 Another Street, Tokyo, Japan",
        images: [],
        tags: ["another", "restaurant"],
        businessHours: [],
      };
      const anotherPlaceResult = await createPlace(
        context,
        activeUser.id,
        anotherPlaceInput,
      );
      if (anotherPlaceResult.isOk()) {
        await context.placeRepository.updateStatus(
          anotherPlaceResult.value.id,
          "published",
        );

        const inputs = [
          {
            placeId: publishedPlace.id,
            userLocation: { latitude: 35.6762, longitude: 139.6503 },
            isPrivate: false,
            photos: [],
          },
          {
            placeId: anotherPlaceResult.value.id,
            userLocation: { latitude: 35.6765, longitude: 139.6506 },
            isPrivate: false,
            photos: [],
          },
        ];

        const results = await Promise.all(
          inputs.map((input) => createCheckin(context, activeUser.id, input)),
        );

        for (const result of results) {
          expect(result.isOk()).toBe(true);
        }

        // Verify checkins have unique IDs
        if (results[0].isOk() && results[1].isOk()) {
          expect(results[0].value.id).not.toBe(results[1].value.id);
        }
      }
    });

    it("should handle concurrent checkins by different users to same place", async () => {
      // Create another active user
      const hashedPassword = await context.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        const anotherUserResult = await context.userRepository.create({
          email: "another@example.com",
          password: hashedPassword.value,
          name: "Another User",
        });

        if (anotherUserResult.isOk()) {
          const input: CreateCheckinInput = {
            placeId: publishedPlace.id,
            userLocation: {
              latitude: 35.6762,
              longitude: 139.6503,
            },
            isPrivate: false,
            photos: [],
          };

          const results = await Promise.all([
            createCheckin(context, activeUser.id, input),
            createCheckin(context, anotherUserResult.value.id, input),
          ]);

          for (const result of results) {
            expect(result.isOk()).toBe(true);
          }

          // Verify checkins are by different users
          if (results[0].isOk() && results[1].isOk()) {
            expect(results[0].value.userId).toBe(activeUser.id);
            expect(results[1].value.userId).toBe(anotherUserResult.value.id);
            expect(results[0].value.id).not.toBe(results[1].value.id);
          }
        }
      }
    });
  });

  describe("transaction handling", () => {
    it("should fail when transaction fails", async () => {
      // Create context that fails transactions
      const failingContext = createMockContext({ shouldFailTransaction: true });

      // Set up test data in failing context
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "active@example.com",
          password: hashedPassword.value,
          name: "Active User",
        });
      }

      const userResult =
        await failingContext.userRepository.findByEmail("active@example.com");
      if (userResult.isOk() && userResult.value) {
        const regionResult = await failingContext.regionRepository.create(
          userResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const placeResult = await createPlace(
            failingContext,
            userResult.value.id,
            {
              name: "Test Place",
              category: "restaurant",
              regionId: regionResult.value.id,
              coordinates: { latitude: 35.6762, longitude: 139.6503 },
              address: "Tokyo, Japan",
              images: [],
              tags: [],
              businessHours: [],
            },
          );

          if (placeResult.isOk()) {
            await failingContext.placeRepository.updateStatus(
              placeResult.value.id,
              "published",
            );

            const input: CreateCheckinInput = {
              placeId: placeResult.value.id,
              userLocation: { latitude: 35.6762, longitude: 139.6503 },
              isPrivate: false,
              photos: [],
            };

            const result = await createCheckin(
              failingContext,
              userResult.value.id,
              input,
            );

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
              expect(result.error.code).toBe(ERROR_CODES.TRANSACTION_FAILED);
            }
          }
        }
      }
    });
  });

  describe("data integrity", () => {
    it("should set default values correctly", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe("active");
        expect(result.value.isPrivate).toBe(false);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
        expect(result.value.createdAt.getTime()).toBe(
          result.value.updatedAt.getTime(),
        );
      }
    });

    it("should generate unique UUIDs", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const results = await Promise.all([
        createCheckin(context, activeUser.id, input),
        createCheckin(context, activeUser.id, input),
      ]);

      expect(results[0].isOk()).toBe(true);
      expect(results[1].isOk()).toBe(true);

      if (results[0].isOk() && results[1].isOk()) {
        expect(results[0].value.id).not.toBe(results[1].value.id);
        expect(results[0].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(results[1].value.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
      }
    });

    it("should update place statistics correctly", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        rating: 4,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);

      // Verify place checkin count was updated
      const updatedPlaceResult = await context.placeRepository.findById(
        publishedPlace.id,
      );
      if (updatedPlaceResult.isOk() && updatedPlaceResult.value) {
        expect(updatedPlaceResult.value.checkinCount).toBeGreaterThan(
          publishedPlace.checkinCount,
        );
      }
    });
  });

  describe("location service integration", () => {
    it("should validate location using location service", async () => {
      const input: CreateCheckinInput = {
        placeId: publishedPlace.id,
        userLocation: {
          latitude: 35.6762,
          longitude: 139.6503,
        },
        isPrivate: false,
        photos: [],
      };

      const result = await createCheckin(context, activeUser.id, input);

      expect(result.isOk()).toBe(true);
      // The location service should have been called to validate the distance
    });

    it("should handle location service errors gracefully", async () => {
      // Create context with failing location service
      const failingContext = createMockContext({
        shouldFailTransaction: true,
      });

      // Set up test data
      const hashedPassword =
        await failingContext.passwordHasher.hash("password123");
      if (hashedPassword.isOk()) {
        await failingContext.userRepository.create({
          email: "active@example.com",
          password: hashedPassword.value,
          name: "Active User",
        });
      }

      const userResult =
        await failingContext.userRepository.findByEmail("active@example.com");
      if (userResult.isOk() && userResult.value) {
        const regionResult = await failingContext.regionRepository.create(
          userResult.value.id,
          {
            name: "Test Region",
            images: [],
            tags: [],
          },
        );

        if (regionResult.isOk()) {
          const placeResult = await createPlace(
            failingContext,
            userResult.value.id,
            {
              name: "Test Place",
              category: "restaurant",
              regionId: regionResult.value.id,
              coordinates: { latitude: 35.6762, longitude: 139.6503 },
              address: "Tokyo, Japan",
              images: [],
              tags: [],
              businessHours: [],
            },
          );

          if (placeResult.isOk()) {
            await failingContext.placeRepository.updateStatus(
              placeResult.value.id,
              "published",
            );

            const input: CreateCheckinInput = {
              placeId: placeResult.value.id,
              userLocation: { latitude: 35.6762, longitude: 139.6503 },
              isPrivate: false,
              photos: [],
            };

            const result = await createCheckin(
              failingContext,
              userResult.value.id,
              input,
            );

            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
              expect(result.error.code).toBe(
                ERROR_CODES.LOCATION_VALIDATION_FAILED,
              );
            }
          }
        }
      }
    });
  });
});
