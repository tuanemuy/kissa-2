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
import type { StorageService } from "@/core/domain/region/ports/storageService";
import type { ReportRepository } from "@/core/domain/report/ports/reportRepository";
import type { SystemSettingsRepository } from "@/core/domain/systemSettings/ports/systemSettingsRepository";
import type {
  PasswordHasher,
  TokenGenerator,
} from "@/core/domain/user/ports/authService";
import type { EmailService } from "@/core/domain/user/ports/emailService";
import type { SessionService } from "@/core/domain/user/ports/sessionService";
import type {
  BillingHistoryRepository,
  EmailVerificationTokenRepository,
  NotificationSettingsRepository,
  PasswordResetTokenRepository,
  PaymentMethodRepository,
  UsageMetricsRepository,
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
  paymentMethodRepository: PaymentMethodRepository;
  billingHistoryRepository: BillingHistoryRepository;
  usageMetricsRepository: UsageMetricsRepository;
  passwordHasher: PasswordHasher;
  tokenGenerator: TokenGenerator;
  emailService: EmailService;
  sessionService: SessionService;

  // Region repositories
  regionRepository: RegionRepository;
  regionFavoriteRepository: RegionFavoriteRepository;
  regionPinRepository: RegionPinRepository;

  // Storage service
  storageService: StorageService;

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

  // System settings repository
  systemSettingsRepository: SystemSettingsRepository;

  // Database transaction support
  database: Database | Omit<Database, "$client">;
  withTransaction<T>(
    fn: (txContext: Context) => Promise<Result<T, Error>>,
  ): Promise<Result<T, Error>>;
}

// Type alias for application layer
export type ApplicationContext = Context;
