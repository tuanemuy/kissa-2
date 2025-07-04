/**
 * Application-wide error codes for better error classification and handling
 */

// Generic error codes
export const GENERIC_ERROR_CODES = {
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  STRING_ERROR: "STRING_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// User-related error codes
export const USER_ERROR_CODES = {
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_INACTIVE: "USER_INACTIVE",
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_DELETED: "USER_DELETED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  PASSWORD_TOO_WEAK: "PASSWORD_TOO_WEAK",
  EMAIL_ALREADY_TAKEN: "EMAIL_ALREADY_TAKEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  USER_FETCH_FAILED: "USER_FETCH_FAILED",
} as const;

// Subscription-related error codes
export const SUBSCRIPTION_ERROR_CODES = {
  SUBSCRIPTION_NOT_FOUND: "SUBSCRIPTION_NOT_FOUND",
  SUBSCRIPTION_ALREADY_EXISTS: "SUBSCRIPTION_ALREADY_EXISTS",
  SUBSCRIPTION_EXPIRED: "SUBSCRIPTION_EXPIRED",
  SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
  PLAN_NOT_AVAILABLE: "PLAN_NOT_AVAILABLE",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
} as const;

// Authentication-related error codes
export const AUTH_ERROR_CODES = {
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_NOT_FOUND: "TOKEN_NOT_FOUND",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
} as const;

// Region-related error codes
export const REGION_ERROR_CODES = {
  REGION_NOT_FOUND: "REGION_NOT_FOUND",
  REGION_ALREADY_EXISTS: "REGION_ALREADY_EXISTS",
  REGION_HAS_PLACES: "REGION_HAS_PLACES",
  REGION_NOT_PUBLISHED: "REGION_NOT_PUBLISHED",
  REGION_ARCHIVED: "REGION_ARCHIVED",
  REGION_ACCESS_DENIED: "REGION_ACCESS_DENIED",
  REGION_UPDATE_FAILED: "REGION_UPDATE_FAILED",
  REGION_CREATE_FAILED: "REGION_CREATE_FAILED",
  REGION_DELETE_FAILED: "REGION_DELETE_FAILED",
  REGION_FETCH_FAILED: "REGION_FETCH_FAILED",
} as const;

// Place-related error codes
export const PLACE_ERROR_CODES = {
  PLACE_NOT_FOUND: "PLACE_NOT_FOUND",
  PLACE_ALREADY_EXISTS: "PLACE_ALREADY_EXISTS",
  PLACE_NOT_PUBLISHED: "PLACE_NOT_PUBLISHED",
  PLACE_ARCHIVED: "PLACE_ARCHIVED",
  PLACE_ACCESS_DENIED: "PLACE_ACCESS_DENIED",
  PLACE_EDIT_PERMISSION_REQUIRED: "PLACE_EDIT_PERMISSION_REQUIRED",
  PLACE_DELETE_PERMISSION_REQUIRED: "PLACE_DELETE_PERMISSION_REQUIRED",
  PLACE_FETCH_FAILED: "PLACE_FETCH_FAILED",
  PLACE_UPDATE_FAILED: "PLACE_UPDATE_FAILED",
  PLACE_CREATE_FAILED: "PLACE_CREATE_FAILED",
  PLACE_DELETE_FAILED: "PLACE_DELETE_FAILED",
} as const;

// Checkin-related error codes
export const CHECKIN_ERROR_CODES = {
  CHECKIN_NOT_FOUND: "CHECKIN_NOT_FOUND",
  CHECKIN_TOO_FAR: "CHECKIN_TOO_FAR",
  CHECKIN_DUPLICATE: "CHECKIN_DUPLICATE",
  CHECKIN_ACCESS_DENIED: "CHECKIN_ACCESS_DENIED",
  CHECKIN_DELETED: "CHECKIN_DELETED",
  CHECKIN_ALREADY_DELETED: "CHECKIN_ALREADY_DELETED",
  LOCATION_VALIDATION_FAILED: "LOCATION_VALIDATION_FAILED",
  PHOTOS_UPLOAD_FAILED: "PHOTOS_UPLOAD_FAILED",
  PHOTO_NOT_FOUND: "PHOTO_NOT_FOUND",
  PHOTO_LIMIT_EXCEEDED: "PHOTO_LIMIT_EXCEEDED",
} as const;

// Database-related error codes
export const DATABASE_ERROR_CODES = {
  CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  QUERY_FAILED: "DATABASE_QUERY_FAILED",
  TRANSACTION_FAILED: "DATABASE_TRANSACTION_FAILED",
  CONSTRAINT_VIOLATION: "DATABASE_CONSTRAINT_VIOLATION",
  UNIQUE_VIOLATION: "DATABASE_UNIQUE_VIOLATION",
  FOREIGN_KEY_VIOLATION: "DATABASE_FOREIGN_KEY_VIOLATION",
} as const;

// External service error codes
export const EXTERNAL_SERVICE_ERROR_CODES = {
  EMAIL_SERVICE_FAILED: "EMAIL_SERVICE_FAILED",
  STORAGE_SERVICE_FAILED: "STORAGE_SERVICE_FAILED",
  LOCATION_SERVICE_FAILED: "LOCATION_SERVICE_FAILED",
  PAYMENT_SERVICE_FAILED: "PAYMENT_SERVICE_FAILED",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  IMAGE_LIMIT_EXCEEDED: "IMAGE_LIMIT_EXCEEDED",
  IMAGE_NOT_FOUND: "IMAGE_NOT_FOUND",
} as const;

// Admin-related error codes
export const ADMIN_ERROR_CODES = {
  ADMIN_PERMISSION_REQUIRED: "ADMIN_PERMISSION_REQUIRED",
  CANNOT_MODIFY_SELF: "CANNOT_MODIFY_SELF",
  CONTENT_HAS_DEPENDENCIES: "CONTENT_HAS_DEPENDENCIES",
} as const;

// Reporting-related error codes
export const REPORT_ERROR_CODES = {
  REPORT_NOT_FOUND: "REPORT_NOT_FOUND",
  REPORT_ALREADY_EXISTS: "REPORT_ALREADY_EXISTS",
  REPORT_RESOLVED: "REPORT_RESOLVED",
  CANNOT_REPORT_OWN_CONTENT: "CANNOT_REPORT_OWN_CONTENT",
} as const;

// All error codes combined for easy access
export const ERROR_CODES = {
  ...GENERIC_ERROR_CODES,
  ...USER_ERROR_CODES,
  ...SUBSCRIPTION_ERROR_CODES,
  ...AUTH_ERROR_CODES,
  ...REGION_ERROR_CODES,
  ...PLACE_ERROR_CODES,
  ...CHECKIN_ERROR_CODES,
  ...DATABASE_ERROR_CODES,
  ...EXTERNAL_SERVICE_ERROR_CODES,
  ...ADMIN_ERROR_CODES,
  ...REPORT_ERROR_CODES,
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
