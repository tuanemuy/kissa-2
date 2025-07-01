import type { Result } from "neverthrow";
import { z } from "zod/v4";
import { BcryptPasswordHasher } from "@/core/adapters/auth/bcryptPasswordHasher";
import { CryptoTokenGenerator } from "@/core/adapters/auth/cryptoTokenGenerator";
import { DrizzleSessionService } from "@/core/adapters/auth/drizzleSessionService";
import {
  DrizzlePgliteCheckinPhotoRepository,
  DrizzlePgliteCheckinRepository,
} from "@/core/adapters/drizzlePglite/checkinRepository";
import {
  getDatabase,
  withTransaction,
} from "@/core/adapters/drizzlePglite/client";
import {
  DrizzlePglitePlaceFavoriteRepository,
  DrizzlePglitePlacePermissionRepository,
  DrizzlePglitePlaceRepository,
} from "@/core/adapters/drizzlePglite/placeRepository";
import {
  DrizzlePgliteRegionFavoriteRepository,
  DrizzlePgliteRegionPinRepository,
  DrizzlePgliteRegionRepository,
} from "@/core/adapters/drizzlePglite/regionRepository";
import { DrizzlePgliteReportRepository } from "@/core/adapters/drizzlePglite/reportRepository";
import { DrizzlePgliteSystemSettingsRepository } from "@/core/adapters/drizzlePglite/systemSettingsRepository";
import {
  DrizzlePgliteEmailVerificationTokenRepository,
  DrizzlePgliteNotificationSettingsRepository,
  DrizzlePglitePasswordResetTokenRepository,
  DrizzlePgliteUserRepository,
  DrizzlePgliteUserSessionRepository,
  DrizzlePgliteUserSubscriptionRepository,
} from "@/core/adapters/drizzlePglite/userRepository";
import { ConsoleEmailService } from "@/core/adapters/email/consoleEmailService";
import { SMTPEmailService } from "@/core/adapters/email/smtpEmailService";
import { HaversineLocationService } from "@/core/adapters/location/haversineLocationService";
import {
  MockBillingHistoryRepository,
  MockPaymentMethodRepository,
  MockUsageMetricsRepository,
} from "@/core/adapters/mock/paymentRepository";
import { LocalStorageService } from "@/core/adapters/storage/localStorageService";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  DATABASE_DIRECTORY: z.string().min(1),
  // SMTP configuration (optional - falls back to console if not provided)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  const errors = env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Environment validation failed: ${errors}`);
}

const db = getDatabase(env.data.DATABASE_DIRECTORY);

// Create repository instances
const userRepository = new DrizzlePgliteUserRepository(db);
const userSubscriptionRepository = new DrizzlePgliteUserSubscriptionRepository(
  db,
);
const notificationSettingsRepository =
  new DrizzlePgliteNotificationSettingsRepository(db);
const userSessionRepository = new DrizzlePgliteUserSessionRepository(db);
const emailVerificationTokenRepository =
  new DrizzlePgliteEmailVerificationTokenRepository(db);
const passwordResetTokenRepository =
  new DrizzlePglitePasswordResetTokenRepository(db);
// TODO: Replace with proper Drizzle implementations
const paymentMethodRepository = new MockPaymentMethodRepository();
const billingHistoryRepository = new MockBillingHistoryRepository();
const usageMetricsRepository = new MockUsageMetricsRepository();
const regionRepository = new DrizzlePgliteRegionRepository(db);
const regionFavoriteRepository = new DrizzlePgliteRegionFavoriteRepository(db);
const regionPinRepository = new DrizzlePgliteRegionPinRepository(db);
const placeRepository = new DrizzlePglitePlaceRepository(db);
const placeFavoriteRepository = new DrizzlePglitePlaceFavoriteRepository(db);
const placePermissionRepository = new DrizzlePglitePlacePermissionRepository(
  db,
);
const checkinRepository = new DrizzlePgliteCheckinRepository(db);
const checkinPhotoRepository = new DrizzlePgliteCheckinPhotoRepository(db);
const reportRepository = new DrizzlePgliteReportRepository(db);
const systemSettingsRepository = new DrizzlePgliteSystemSettingsRepository(db);

// Create services
const emailService = (() => {
  // Use SMTP service if all required SMTP config is provided
  if (
    env.data.SMTP_HOST &&
    env.data.SMTP_PORT &&
    env.data.SMTP_USER &&
    env.data.SMTP_PASS &&
    env.data.SMTP_FROM_EMAIL &&
    env.data.SMTP_FROM_NAME
  ) {
    return new SMTPEmailService({
      host: env.data.SMTP_HOST,
      port: env.data.SMTP_PORT,
      secure: env.data.SMTP_SECURE ?? false,
      auth: {
        user: env.data.SMTP_USER,
        pass: env.data.SMTP_PASS,
      },
      fromEmail: env.data.SMTP_FROM_EMAIL,
      fromName: env.data.SMTP_FROM_NAME,
      baseUrl: env.data.NEXT_PUBLIC_URL,
    });
  }

  // Fallback to console service for development
  return new ConsoleEmailService({
    fromEmail: "noreply@example.com",
    fromName: "Kissa App",
    baseUrl: env.data.NEXT_PUBLIC_URL,
  });
})();
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const sessionService = new DrizzleSessionService(
  userRepository,
  userSessionRepository,
  tokenGenerator,
);
const locationService = new HaversineLocationService();
const storageService = new LocalStorageService({
  uploadDir: "uploads",
  baseUrl: env.data.NEXT_PUBLIC_URL,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
});

export const context: Context = {
  // Environment configuration
  publicUrl: env.data.NEXT_PUBLIC_URL,

  // User repositories and services
  userRepository,
  userSessionRepository,
  userSubscriptionRepository,
  notificationSettingsRepository,
  emailVerificationTokenRepository,
  passwordResetTokenRepository,
  paymentMethodRepository,
  billingHistoryRepository,
  usageMetricsRepository,
  passwordHasher,
  tokenGenerator,
  emailService,
  sessionService,

  // Region repositories
  regionRepository,
  regionFavoriteRepository,
  regionPinRepository,

  // Storage service
  storageService,

  // Place repositories
  placeRepository,
  placeFavoriteRepository,
  placePermissionRepository,

  // Checkin repositories and services
  checkinRepository,
  checkinPhotoRepository,
  locationService,

  // Report repository
  reportRepository,

  // System settings repository
  systemSettingsRepository,

  // Database transaction support
  database: db,
  withTransaction: <T>(fn: (txContext: Context) => Promise<Result<T, Error>>) =>
    withTransaction(db, async (tx) => {
      // Create a new context with the transaction database
      const txContext: Context = {
        ...context,
        database: tx,
      };
      return await fn(txContext);
    }),
};
