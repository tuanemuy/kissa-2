import type { Result } from "neverthrow";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import type { Context } from "@/core/application/context";
import { MockPasswordHasher, MockTokenGenerator } from "./authService";
import { MockEmailService } from "./emailService";
import { MockLocationService } from "./locationService";
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
import { MockReportRepository } from "./reportRepository";
import { MockSessionService } from "./sessionService";
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
  shouldFailEmail?: boolean;
  shouldFailSession?: boolean;
  shouldFailLocation?: boolean;
  shouldFailAdd?: boolean;
  shouldFailDelete?: boolean;
  shouldFailFeatured?: boolean;
  shouldFailFindById?: boolean;
  shouldFailFindByUser?: boolean;
  shouldFailFindByUserAndRegion?: boolean;
  shouldFailGetByCreator?: boolean;
  shouldFailGetByRegion?: boolean;
  shouldFailGetRegionsWithFavorites?: boolean;
  shouldFailGetRegionsWithPins?: boolean;
  shouldFailList?: boolean;
  shouldFailRemove?: boolean;
  shouldFailReorder?: boolean;
  shouldFailSearch?: boolean;
  shouldFailUpdate?: boolean;
  shouldThrowError?: boolean;
}

export function createMockContext(options: MockContextOptions = {}): Context {
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
  const mockSessionService = new MockSessionService();
  const mockLocationService = new MockLocationService();
  const mockRegionRepository = new MockRegionRepository();
  const mockRegionFavoriteRepository = new MockRegionFavoriteRepository();
  const mockRegionPinRepository = new MockRegionPinRepository();
  const mockPlaceRepository = new MockPlaceRepository();
  const mockPlaceFavoriteRepository = new MockPlaceFavoriteRepository();
  const mockPlacePermissionRepository = new MockPlacePermissionRepository();

  // Connect repositories so they can work together
  mockRegionFavoriteRepository.setRegionRepository(mockRegionRepository);
  mockRegionPinRepository.setRegionRepository(mockRegionRepository);
  mockPlaceFavoriteRepository.setPlaceRepository(mockPlaceRepository);
  mockPlacePermissionRepository.setUserRepository(mockUserRepository);
  mockPlacePermissionRepository.setPlaceRepository(mockPlaceRepository);
  const mockCheckinRepository = new MockCheckinRepository();
  const mockCheckinPhotoRepository = new MockCheckinPhotoRepository();
  const mockReportRepository = new MockReportRepository();

  if (options.shouldFailEmail) {
    mockEmailService.setShouldFail(true);
  }

  if (options.shouldFailSession) {
    mockSessionService.setShouldFail(true);
  }

  if (options.shouldFailLocation) {
    mockLocationService.setShouldFail(true);
  }

  if (options.shouldFailSearch) {
    mockRegionRepository.setShouldFailSearch(true);
    mockPlaceRepository.setShouldFailSearch(true);
  }

  if (options.shouldThrowError) {
    mockRegionRepository.setShouldThrowError(true);
    mockPlaceRepository.setShouldThrowError(true);
  }

  if (options.shouldFailDelete) {
    mockRegionRepository.setShouldFailDelete(true);
    mockPlaceRepository.setShouldFailDelete(true);
  }

  if (options.shouldFailGetByRegion) {
    mockPlaceRepository.setShouldFailGetByRegion(true);
  }

  if (options.shouldFailList) {
    mockRegionRepository.setShouldFailList(true);
  }

  if (options.shouldFailFeatured) {
    mockRegionRepository.setShouldFailFeatured(true);
  }

  if (options.shouldFailGetByCreator) {
    mockRegionRepository.setShouldFailGetByCreator(true);
  }

  if (options.shouldFailUpdate) {
    mockRegionRepository.setShouldFailUpdate(true);
  }

  if (options.shouldFailFindById) {
    mockRegionRepository.setShouldFailFindById(true);
    mockPlaceRepository.setShouldFailFindById(true);
  }

  if (options.shouldFailFindByUser) {
    mockRegionFavoriteRepository.setShouldFailFindByUser(true);
    mockRegionPinRepository.setShouldFailFindByUser(true);
    mockPlaceFavoriteRepository.setShouldFailFindByUser(true);
  }

  if (options.shouldFailFindByUserAndRegion) {
    mockRegionFavoriteRepository.setShouldFailFindByUserAndRegion(true);
    mockRegionPinRepository.setShouldFailFindByUserAndRegion(true);
    mockPlaceFavoriteRepository.setShouldFailFindByUserAndPlace(true);
  }

  if (options.shouldFailAdd) {
    mockRegionFavoriteRepository.setShouldFailAdd(true);
    mockRegionPinRepository.setShouldFailAdd(true);
    mockPlaceFavoriteRepository.setShouldFailAdd(true);
  }

  if (options.shouldFailRemove) {
    mockRegionFavoriteRepository.setShouldFailRemove(true);
    mockRegionPinRepository.setShouldFailRemove(true);
    mockPlaceFavoriteRepository.setShouldFailRemove(true);
  }

  if (options.shouldFailGetRegionsWithFavorites) {
    mockRegionFavoriteRepository.setShouldFailGetRegionsWithFavorites(true);
  }

  if (options.shouldFailGetRegionsWithPins) {
    mockRegionPinRepository.setShouldFailGetRegionsWithPins(true);
  }

  if (options.shouldFailReorder) {
    mockRegionPinRepository.setShouldFailReorder(true);
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
    sessionService: mockSessionService,

    regionRepository: mockRegionRepository,
    regionFavoriteRepository: mockRegionFavoriteRepository,
    regionPinRepository: mockRegionPinRepository,

    placeRepository: mockPlaceRepository,
    placeFavoriteRepository: mockPlaceFavoriteRepository,
    placePermissionRepository: mockPlacePermissionRepository,
    checkinRepository: mockCheckinRepository,
    checkinPhotoRepository: mockCheckinPhotoRepository,
    locationService: mockLocationService,
    reportRepository: mockReportRepository,

    database: {} as Omit<Database, "$client">,
    withTransaction: async <T>(
      fn: (txContext: Context) => Promise<Result<T, Error>>,
    ): Promise<Result<T, Error>> => {
      return fn(context);
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
  (context.sessionService as MockSessionService).clearSessions();
  (context.locationService as MockLocationService).reset();
  (context.regionRepository as MockRegionRepository).reset();
  (context.regionFavoriteRepository as MockRegionFavoriteRepository).reset();
  (context.regionPinRepository as MockRegionPinRepository).reset();
  (context.placeRepository as MockPlaceRepository).reset();
  (context.placeFavoriteRepository as MockPlaceFavoriteRepository).reset();
  (context.placePermissionRepository as MockPlacePermissionRepository).reset();
  (context.checkinRepository as MockCheckinRepository).reset();
  (context.checkinPhotoRepository as MockCheckinPhotoRepository).reset();
  (context.reportRepository as MockReportRepository).reset();
}
