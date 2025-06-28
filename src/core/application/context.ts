import type { UserRepository, UserSessionRepository, NotificationSettingsRepository, EmailVerificationTokenRepository } from "@/core/domain/user/ports/userRepository";
import type { PasswordHasher, TokenGenerator } from "@/core/domain/user/ports/authService";
import type { EmailService } from "@/core/domain/user/ports/emailService";
import type { RegionRepository } from "@/core/domain/region/ports/regionRepository";
import type { PlaceRepository } from "@/core/domain/place/ports/placeRepository";
import type { CheckinRepository, CheckinPhotoRepository } from "@/core/domain/checkin/ports/checkinRepository";
import type { LocationService } from "@/core/domain/checkin/ports/locationService";

export interface Context {
  // Environment configuration
  publicUrl: string;
  
  // User repositories and services
  userRepository: UserRepository;
  userSessionRepository: UserSessionRepository;
  notificationSettingsRepository: NotificationSettingsRepository;
  emailVerificationTokenRepository: EmailVerificationTokenRepository;
  passwordHasher: PasswordHasher;
  tokenGenerator: TokenGenerator;
  emailService: EmailService;
  
  // Region repositories
  regionRepository: RegionRepository;
  
  // Place repositories  
  placeRepository: PlaceRepository;
  
  // Checkin repositories and services
  checkinRepository: CheckinRepository;
  checkinPhotoRepository: CheckinPhotoRepository;
  locationService: LocationService;
}
