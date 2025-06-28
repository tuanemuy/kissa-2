import type { Result } from "neverthrow";
import { z } from "zod/v4";
import { BcryptPasswordHasher } from "@/core/adapters/auth/bcryptPasswordHasher";
import { CryptoTokenGenerator } from "@/core/adapters/auth/cryptoTokenGenerator";
import {
  DrizzlePgliteCheckinPhotoRepository,
  DrizzlePgliteCheckinRepository,
} from "@/core/adapters/drizzlePglite/checkinRepository";
import {
  getDatabase,
  withTransaction,
} from "@/core/adapters/drizzlePglite/client";
import {
  DrizzlePglitePlacePermissionRepository,
  DrizzlePglitePlaceRepository,
} from "@/core/adapters/drizzlePglite/placeRepository";
import { DrizzlePgliteRegionRepository } from "@/core/adapters/drizzlePglite/regionRepository";
import { DrizzlePgliteReportRepository } from "@/core/adapters/drizzlePglite/reportRepository";
import {
  DrizzlePgliteEmailVerificationTokenRepository,
  DrizzlePgliteNotificationSettingsRepository,
  DrizzlePglitePasswordResetTokenRepository,
  DrizzlePgliteUserRepository,
  DrizzlePgliteUserSessionRepository,
  DrizzlePgliteUserSubscriptionRepository,
} from "@/core/adapters/drizzlePglite/userRepository";
import { ConsoleEmailService } from "@/core/adapters/email/consoleEmailService";
import { HaversineLocationService } from "@/core/adapters/location/haversineLocationService";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  DATABASE_DIRECTORY: z.string().min(1),
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
const regionRepository = new DrizzlePgliteRegionRepository(db);
const placeRepository = new DrizzlePglitePlaceRepository(db);
const placePermissionRepository = new DrizzlePglitePlacePermissionRepository(
  db,
);
const checkinRepository = new DrizzlePgliteCheckinRepository(db);
const checkinPhotoRepository = new DrizzlePgliteCheckinPhotoRepository(db);
const reportRepository = new DrizzlePgliteReportRepository(db);

// Create services
const emailService = new ConsoleEmailService({
  fromEmail: "noreply@example.com",
  fromName: "Kissa App",
  baseUrl: env.data.NEXT_PUBLIC_URL,
});
const passwordHasher = new BcryptPasswordHasher();
const tokenGenerator = new CryptoTokenGenerator();
const locationService = new HaversineLocationService();

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
  passwordHasher,
  tokenGenerator,
  emailService,

  // Region repositories
  regionRepository,

  // Place repositories
  placeRepository,
  placePermissionRepository,

  // Checkin repositories and services
  checkinRepository,
  checkinPhotoRepository,
  locationService,

  // Report repository
  reportRepository,

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
