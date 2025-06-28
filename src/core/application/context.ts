import type { Result } from "neverthrow";
import type { Database } from "@/core/adapters/drizzlePglite/client";
import type {
  CheckinPhotoRepository,
  CheckinRepository,
} from "@/core/domain/checkin/ports/checkinRepository";
import type { LocationService } from "@/core/domain/checkin/ports/locationService";
import type {
  PlaceFavoriteRepository,
  PlacePermissionRepository,
  PlaceRepository,
} from "@/core/domain/place/ports/placeRepository";
import type {
  RegionFavoriteRepository,
  RegionPinRepository,
  RegionRepository,
} from "@/core/domain/region/ports/regionRepository";
import type { ReportRepository } from "@/core/domain/report/ports/reportRepository";
import type {
  PasswordHasher,
  TokenGenerator,
} from "@/core/domain/user/ports/authService";
import type { EmailService } from "@/core/domain/user/ports/emailService";
import type {
  EmailVerificationTokenRepository,
  NotificationSettingsRepository,
  PasswordResetTokenRepository,
  UserRepository,
  UserSessionRepository,
  UserSubscriptionRepository,
} from "@/core/domain/user/ports/userRepository";

export interface Context {
  // Environment configuration
  publicUrl: string;

  // User repositories and services
  userRepository: UserRepository;
  userSessionRepository: UserSessionRepository;
  userSubscriptionRepository: UserSubscriptionRepository;
  notificationSettingsRepository: NotificationSettingsRepository;
  emailVerificationTokenRepository: EmailVerificationTokenRepository;
  passwordResetTokenRepository: PasswordResetTokenRepository;
  passwordHasher: PasswordHasher;
  tokenGenerator: TokenGenerator;
  emailService: EmailService;

  // Region repositories
  regionRepository: RegionRepository;
  regionFavoriteRepository: RegionFavoriteRepository;
  regionPinRepository: RegionPinRepository;

  // Place repositories
  placeRepository: PlaceRepository;
  placeFavoriteRepository: PlaceFavoriteRepository;
  placePermissionRepository: PlacePermissionRepository;

  // Checkin repositories and services
  checkinRepository: CheckinRepository;
  checkinPhotoRepository: CheckinPhotoRepository;
  locationService: LocationService;

  // Report repository
  reportRepository: ReportRepository;

  // Database transaction support
  database: Database | Omit<Database, "$client">;
  withTransaction<T>(
    fn: (txContext: Context) => Promise<Result<T, Error>>,
  ): Promise<Result<T, Error>>;
}
