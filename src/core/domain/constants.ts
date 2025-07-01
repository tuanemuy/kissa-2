/**
 * Business rules and domain constants
 *
 * This file centralizes all business rules and domain-specific constants
 * used throughout the application to ensure consistency and ease of maintenance.
 */

// Coordinate system configuration
export const COORDINATE_SYSTEM = {
  /** Standard coordinate system used throughout the application */
  SYSTEM: "WGS84" as const,
  /** Minimum latitude value */
  MIN_LATITUDE: -90,
  /** Maximum latitude value */
  MAX_LATITUDE: 90,
  /** Minimum longitude value */
  MIN_LONGITUDE: -180,
  /** Maximum longitude value */
  MAX_LONGITUDE: 180,
} as const;

// Location and distance constants
export const LOCATION = {
  /** Default maximum distance in meters for checkin validation */
  DEFAULT_CHECKIN_DISTANCE_METERS: 500,
  /** Maximum allowed distance in meters for checkin validation */
  MAX_CHECKIN_DISTANCE_METERS: 10000,
  /** Minimum search radius in kilometers */
  MIN_SEARCH_RADIUS_KM: 0.1,
  /** Maximum search radius in kilometers */
  MAX_SEARCH_RADIUS_KM: 50,
} as const;

// User account constants
export const USER = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,
  /** Minimum user name length */
  MIN_NAME_LENGTH: 1,
  /** Maximum user name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum bio length */
  MAX_BIO_LENGTH: 500,
} as const;

// Place constants
export const PLACE = {
  /** Minimum place name length */
  MIN_NAME_LENGTH: 1,
  /** Maximum place name length */
  MAX_NAME_LENGTH: 200,
  /** Maximum place description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum short description length */
  MAX_SHORT_DESCRIPTION_LENGTH: 300,
  /** Maximum address length */
  MAX_ADDRESS_LENGTH: 500,
  /** Maximum phone number length */
  MAX_PHONE_LENGTH: 20,
  /** Maximum tag length */
  MAX_TAG_LENGTH: 50,
} as const;

// Checkin constants
export const CHECKIN = {
  /** Maximum comment length */
  MAX_COMMENT_LENGTH: 1000,
  /** Maximum photo caption length */
  MAX_CAPTION_LENGTH: 200,
  /** Maximum photos per checkin */
  MAX_PHOTOS_PER_CHECKIN: 10,
  /** Minimum rating value */
  MIN_RATING: 1,
  /** Maximum rating value */
  MAX_RATING: 5,
  /** Hours within which duplicate checkins are prevented */
  DUPLICATE_CHECKIN_WINDOW_HOURS: 24,
} as const;

// Time constants
export const TIME = {
  /** Session expiration time in hours */
  SESSION_EXPIRY_HOURS: 24 * 7, // 7 days
  /** Password reset token expiry hours */
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  /** Email verification token expiry hours */
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
} as const;

// Pagination constants
export const PAGINATION = {
  /** Default page size for listings */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum page size for listings */
  MAX_PAGE_SIZE: 100,
} as const;
