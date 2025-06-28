import { err, type Result } from "neverthrow";
import { z } from "zod/v4";
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
import {
  DrizzlePgliteUserRepository,
  DrizzlePgliteUserSubscriptionRepository,
} from "@/core/adapters/drizzlePglite/userRepository";
import { ConsoleEmailService } from "@/core/adapters/email/consoleEmailService";
import type { Context } from "@/core/application/context";
import type { LocationService } from "@/core/domain/checkin/ports/locationService";
import type { ReportRepository } from "@/core/domain/report/ports/reportRepository";
import type {
  PasswordHasher,
  TokenGenerator,
} from "@/core/domain/user/ports/authService";
import type {
  EmailVerificationTokenRepository,
  NotificationSettingsRepository,
  UserSessionRepository,
} from "@/core/domain/user/ports/userRepository";

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
const regionRepository = new DrizzlePgliteRegionRepository(db);
const placeRepository = new DrizzlePglitePlaceRepository(db);
const placePermissionRepository = new DrizzlePglitePlacePermissionRepository(
  db,
);
const checkinRepository = new DrizzlePgliteCheckinRepository(db);
const checkinPhotoRepository = new DrizzlePgliteCheckinPhotoRepository(db);

// Create email service
const emailService = new ConsoleEmailService({
  fromEmail: "noreply@example.com",
  fromName: "Kissa App",
  baseUrl: env.data.NEXT_PUBLIC_URL,
});

// Stub implementations for missing services - using Proxy for dynamic method handling
const createRepositoryStub = () => {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === "string") {
          return async () => err(new Error(`Method ${prop} not implemented`));
        }
        return undefined;
      },
    },
  );
};

export const context: Context = {
  // Environment configuration
  publicUrl: env.data.NEXT_PUBLIC_URL,

  // User repositories and services
  userRepository,
  userSessionRepository: createRepositoryStub() as UserSessionRepository,
  userSubscriptionRepository,
  notificationSettingsRepository:
    createRepositoryStub() as NotificationSettingsRepository,
  emailVerificationTokenRepository:
    createRepositoryStub() as EmailVerificationTokenRepository,
  passwordHasher: createRepositoryStub() as PasswordHasher,
  tokenGenerator: createRepositoryStub() as TokenGenerator,
  emailService,

  // Region repositories
  regionRepository,

  // Place repositories
  placeRepository,
  placePermissionRepository,

  // Checkin repositories and services
  checkinRepository,
  checkinPhotoRepository,
  locationService: createRepositoryStub() as LocationService,

  // Report repository
  reportRepository: createRepositoryStub() as ReportRepository,

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
