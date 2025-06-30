import { err, ok } from "neverthrow";
import { describe, expect, it } from "vitest";
import type { CheckinWithDetails } from "@/core/domain/checkin/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import {
  getCheckinDetails,
  getUserRecentCheckins,
  ListUserCheckinsError,
  type ListUserCheckinsInput,
  listUserCheckins,
} from "./listUserCheckins";

const mockUser: User = {
  id: "user-1",
  email: "test@example.com",
  hashedPassword: "hashed-password",
  name: "Test User",
  role: "visitor",
  status: "active",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: undefined,
  bio: undefined,
  avatar: undefined,
};

const mockCheckin: CheckinWithDetails = {
  id: "checkin-1",
  userId: "user-1",
  placeId: "place-1",
  comment: "Great place!",
  rating: 5,
  photos: [],
  userLocation: {
    latitude: 35.6762,
    longitude: 139.6503,
  },
  status: "active",
  isPrivate: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  userName: "Test User",
  userAvatar: undefined,
  placeName: "Test Place",
  placeRegionName: "Test Region",
  placeAddress: "Test Address",
  placeCoordinates: {
    latitude: 35.6762,
    longitude: 139.6503,
  },
  distanceFromPlace: undefined,
};

const createMockContext = (
  userResult = ok(mockUser),
  checkinsResult = ok([mockCheckin]),
  checkinResult = ok(mockCheckin),
): Context =>
  ({
    userRepository: {
      findById: () => Promise.resolve(userResult),
      getByUser: () => Promise.resolve(checkinsResult),
    },
    checkinRepository: {
      getByUser: () => Promise.resolve(checkinsResult),
      findById: () => Promise.resolve(checkinResult),
    },
  }) as unknown as Context;

describe("listUserCheckins", () => {
  it("should return user checkins successfully", async () => {
    const context = createMockContext();
    const input: ListUserCheckinsInput = {
      userId: "user-1",
      limit: 20,
    };

    const result = await listUserCheckins(context, input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([mockCheckin]);
    }
  });

  it("should return error for invalid UUID", async () => {
    const context = createMockContext();
    const input: ListUserCheckinsInput = {
      userId: "invalid-uuid",
      limit: 20,
    };

    const result = await listUserCheckins(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("Invalid UUID format");
    }
  });

  it("should return error when user not found", async () => {
    const context = createMockContext(ok(null as any as User));
    const input: ListUserCheckinsInput = {
      userId: "user-1",
      limit: 20,
    };

    const result = await listUserCheckins(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("User not found");
    }
  });

  it("should return error when repository fails", async () => {
    const context = createMockContext(
      ok(mockUser),
      err(new Error("Database error")) as any,
    );
    const input: ListUserCheckinsInput = {
      userId: "user-1",
      limit: 20,
    };

    const result = await listUserCheckins(context, input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("Failed to get user checkins");
    }
  });
});

describe("getUserRecentCheckins", () => {
  it("should return recent checkins successfully", async () => {
    const context = createMockContext();

    const result = await getUserRecentCheckins(context, "user-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([mockCheckin]);
    }
  });
});

describe("getCheckinDetails", () => {
  it("should return checkin details successfully", async () => {
    const context = createMockContext();

    const result = await getCheckinDetails(context, "checkin-1", "user-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockCheckin);
    }
  });

  it("should return error for invalid checkin ID", async () => {
    const context = createMockContext();

    const result = await getCheckinDetails(context, "invalid-uuid", "user-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("Invalid checkin ID format");
    }
  });

  it("should return error when checkin not found", async () => {
    const context = createMockContext(
      ok(mockUser),
      ok([mockCheckin]),
      ok(null as any as CheckinWithDetails),
    );

    const result = await getCheckinDetails(context, "checkin-1", "user-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("Checkin not found");
    }
  });

  it("should hide private checkin from non-owner", async () => {
    const privateCheckin = {
      ...mockCheckin,
      isPrivate: true,
      userId: "other-user",
    };
    const context = createMockContext(
      ok(mockUser),
      ok([privateCheckin]),
      ok(privateCheckin),
    );

    const result = await getCheckinDetails(context, "checkin-1", "user-1");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ListUserCheckinsError);
      expect(result.error.message).toBe("Checkin not found");
    }
  });
});
