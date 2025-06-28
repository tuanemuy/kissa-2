import { ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";
import { MockPasswordHasher, MockTokenGenerator } from "./authService";
import { MockDatabase } from "./database";
import { MockEmailService } from "./emailService";
import {
  MockCheckinPhotoRepository,
  MockCheckinRepository,
  MockPlaceFavoriteRepository,
  MockPlacePermissionRepository,
  MockPlaceRepository,
} from "./placeRepository";
import {
  MockRegionFavoriteRepository,
  MockRegionPinRepository,
  MockRegionRepository,
} from "./regionRepository";
import {
  MockEmailVerificationTokenRepository,
  MockNotificationSettingsRepository,
  MockPasswordResetTokenRepository,
  MockUserRepository,
  MockUserSessionRepository,
  MockUserSubscriptionRepository,
} from "./userRepository";

export interface MockContextOptions {
  publicUrl?: string;
  shouldFailTransaction?: boolean;
  shouldFailEmail?: boolean;
}

export function createMockContext(options: MockContextOptions = {}): Context {
  const mockDatabase = new MockDatabase();
  const mockUserRepository = new MockUserRepository();
  const mockUserSessionRepository = new MockUserSessionRepository();
  const mockUserSubscriptionRepository = new MockUserSubscriptionRepository();
  const mockNotificationSettingsRepository =
    new MockNotificationSettingsRepository();
  const mockPasswordResetTokenRepository =
    new MockPasswordResetTokenRepository();
  const mockEmailVerificationTokenRepository =
    new MockEmailVerificationTokenRepository();
  const mockPasswordHasher = new MockPasswordHasher();
  const mockTokenGenerator = new MockTokenGenerator();
  const mockEmailService = new MockEmailService();
  const mockRegionRepository = new MockRegionRepository();
  const mockRegionFavoriteRepository = new MockRegionFavoriteRepository();
  const mockRegionPinRepository = new MockRegionPinRepository();
  const mockPlaceRepository = new MockPlaceRepository();
  const mockPlaceFavoriteRepository = new MockPlaceFavoriteRepository();
  const mockPlacePermissionRepository = new MockPlacePermissionRepository();
  const mockCheckinRepository = new MockCheckinRepository();
  const mockCheckinPhotoRepository = new MockCheckinPhotoRepository();

  if (options.shouldFailTransaction) {
    mockDatabase.setShouldFailTransaction(true);
  }

  if (options.shouldFailEmail) {
    mockEmailService.setShouldFail(true);
  }

  const context: Context = {
    publicUrl: options.publicUrl || "http://localhost:3000",

    userRepository: mockUserRepository,
    userSessionRepository: mockUserSessionRepository,
    userSubscriptionRepository: mockUserSubscriptionRepository,
    notificationSettingsRepository: mockNotificationSettingsRepository,
    emailVerificationTokenRepository: mockEmailVerificationTokenRepository,
    passwordResetTokenRepository: mockPasswordResetTokenRepository,
    passwordHasher: mockPasswordHasher,
    tokenGenerator: mockTokenGenerator,
    emailService: mockEmailService,

    regionRepository: mockRegionRepository,
    regionFavoriteRepository: mockRegionFavoriteRepository,
    regionPinRepository: mockRegionPinRepository,

    placeRepository: mockPlaceRepository,
    placeFavoriteRepository: mockPlaceFavoriteRepository,
    placePermissionRepository: mockPlacePermissionRepository,
    checkinRepository: mockCheckinRepository,
    checkinPhotoRepository: mockCheckinPhotoRepository,
    locationService: {} as any,
    reportRepository: {} as any,

    database: mockDatabase as any,
    withTransaction: <T>(
      fn: (txContext: Context) => Promise<Result<T, Error>>,
    ): Promise<Result<T, Error>> => {
      return mockDatabase.withTransaction(context, fn);
    },
  };

  return context;
}

export function resetMockContext(context: Context): void {
  (context.userRepository as MockUserRepository).reset();
  (context.userSessionRepository as MockUserSessionRepository).reset();
  (
    context.userSubscriptionRepository as MockUserSubscriptionRepository
  ).reset();
  (
    context.notificationSettingsRepository as MockNotificationSettingsRepository
  ).reset();
  (
    context.passwordResetTokenRepository as MockPasswordResetTokenRepository
  ).reset();
  (
    context.emailVerificationTokenRepository as MockEmailVerificationTokenRepository
  ).reset();
  (context.passwordHasher as MockPasswordHasher).reset();
  (context.tokenGenerator as MockTokenGenerator).reset();
  (context.emailService as MockEmailService).reset();
  (context.regionRepository as MockRegionRepository).reset();
  (context.regionFavoriteRepository as MockRegionFavoriteRepository).reset();
  (context.regionPinRepository as MockRegionPinRepository).reset();
  (context.placeRepository as MockPlaceRepository).reset();
  (context.placeFavoriteRepository as MockPlaceFavoriteRepository).reset();
  (context.placePermissionRepository as MockPlacePermissionRepository).reset();
  (context.checkinRepository as MockCheckinRepository).reset();
  (context.checkinPhotoRepository as MockCheckinPhotoRepository).reset();
  (context.database as any as MockDatabase).reset();
}
