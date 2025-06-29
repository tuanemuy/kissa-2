import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

// Enums
export const userRoleEnum = pgEnum("user_role", ["visitor", "editor", "admin"]);
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "none",
  "trial",
  "active",
  "expired",
  "cancelled",
]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "standard",
  "premium",
]);
export const regionStatusEnum = pgEnum("region_status", [
  "draft",
  "published",
  "archived",
]);
export const placeStatusEnum = pgEnum("place_status", [
  "draft",
  "published",
  "archived",
]);
export const placeCategoryEnum = pgEnum("place_category", [
  "restaurant",
  "cafe",
  "hotel",
  "shopping",
  "entertainment",
  "culture",
  "nature",
  "historical",
  "religious",
  "transportation",
  "hospital",
  "education",
  "office",
  "other",
]);
export const checkinStatusEnum = pgEnum("checkin_status", [
  "active",
  "hidden",
  "reported",
  "deleted",
]);
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
]);
export const reportTypeEnum = pgEnum("report_type", [
  "spam",
  "inappropriate_content",
  "harassment",
  "false_information",
  "copyright_violation",
  "other",
]);
export const reportEntityTypeEnum = pgEnum("report_entity_type", [
  "user",
  "place",
  "region",
  "checkin",
]);

// Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    email: text("email").notNull().unique(),
    hashedPassword: text("hashed_password").notNull(),
    name: text("name").notNull(),
    bio: text("bio"),
    avatar: text("avatar"),
    role: userRoleEnum("role").notNull().default("visitor"),
    status: userStatusEnum("status").notNull().default("active"),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerifiedAt: timestamp("email_verified_at"),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    statusIdx: index("users_status_idx").on(table.status),
    roleIdx: index("users_role_idx").on(table.role),
  }),
);

// User Subscriptions Table
export const userSubscriptions = pgTable(
  "user_subscriptions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("none"),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
    statusIdx: index("user_subscriptions_status_idx").on(table.status),
  }),
);

// Notification Settings Table
export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  checkinNotifications: boolean("checkin_notifications")
    .notNull()
    .default(true),
  editorInviteNotifications: boolean("editor_invite_notifications")
    .notNull()
    .default(true),
  systemNotifications: boolean("system_notifications").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// User Sessions Table
export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: index("user_sessions_token_idx").on(table.token),
    userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("user_sessions_expires_at_idx").on(table.expiresAt),
  }),
);

// Password Reset Tokens Table
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  }),
);

// Email Verification Tokens Table
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
    userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  }),
);

// Regions Table
export const regions = pgTable(
  "regions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    address: text("address"),
    status: regionStatusEnum("status").notNull().default("draft"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    coverImage: text("cover_image"),
    images: text("images").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    visitCount: integer("visit_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    placeCount: integer("place_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("regions_status_idx").on(table.status),
    createdByIdx: index("regions_created_by_idx").on(table.createdBy),
    nameIdx: index("regions_name_idx").on(table.name),
    locationIdx: index("regions_location_idx").on(
      table.latitude,
      table.longitude,
    ),
  }),
);

// Region Favorites Table
export const regionFavorites = pgTable(
  "region_favorites",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userRegionIdx: unique("region_favorites_user_region_unique").on(
      table.userId,
      table.regionId,
    ),
    userIdIdx: index("region_favorites_user_id_idx").on(table.userId),
    regionIdIdx: index("region_favorites_region_id_idx").on(table.regionId),
  }),
);

// Region Pins Table
export const regionPins = pgTable(
  "region_pins",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userRegionIdx: unique("region_pins_user_region_unique").on(
      table.userId,
      table.regionId,
    ),
    userIdIdx: index("region_pins_user_id_idx").on(table.userId),
    displayOrderIdx: index("region_pins_display_order_idx").on(
      table.userId,
      table.displayOrder,
    ),
  }),
);

// Places Table
export const places = pgTable(
  "places",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    description: text("description"),
    shortDescription: text("short_description"),
    category: placeCategoryEnum("category").notNull(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    address: text("address").notNull(),
    phone: text("phone"),
    website: text("website"),
    email: text("email"),
    status: placeStatusEnum("status").notNull().default("draft"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    coverImage: text("cover_image"),
    images: text("images").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    visitCount: integer("visit_count").notNull().default(0),
    favoriteCount: integer("favorite_count").notNull().default(0),
    checkinCount: integer("checkin_count").notNull().default(0),
    averageRating: real("average_rating"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("places_status_idx").on(table.status),
    regionIdIdx: index("places_region_id_idx").on(table.regionId),
    createdByIdx: index("places_created_by_idx").on(table.createdBy),
    categoryIdx: index("places_category_idx").on(table.category),
    nameIdx: index("places_name_idx").on(table.name),
    locationIdx: index("places_location_idx").on(
      table.latitude,
      table.longitude,
    ),
  }),
);

// Place Business Hours Table
export const placeBusinessHours = pgTable(
  "place_business_hours",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    openTime: text("open_time"),
    closeTime: text("close_time"),
    isClosed: boolean("is_closed").notNull().default(false),
  },
  (table) => ({
    placeIdIdx: index("place_business_hours_place_id_idx").on(table.placeId),
    placeDayIdx: unique("place_business_hours_place_day_unique").on(
      table.placeId,
      table.dayOfWeek,
    ),
  }),
);

// Place Favorites Table
export const placeFavorites = pgTable(
  "place_favorites",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userPlaceIdx: unique("place_favorites_user_place_unique").on(
      table.userId,
      table.placeId,
    ),
    userIdIdx: index("place_favorites_user_id_idx").on(table.userId),
    placeIdIdx: index("place_favorites_place_id_idx").on(table.placeId),
  }),
);

// Place Permissions Table
export const placePermissions = pgTable(
  "place_permissions",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canEdit: boolean("can_edit").notNull().default(true),
    canDelete: boolean("can_delete").notNull().default(false),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    invitedAt: timestamp("invited_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => ({
    placeUserIdx: unique("place_permissions_place_user_unique").on(
      table.placeId,
      table.userId,
    ),
    placeIdIdx: index("place_permissions_place_id_idx").on(table.placeId),
    userIdIdx: index("place_permissions_user_id_idx").on(table.userId),
    invitedByIdx: index("place_permissions_invited_by_idx").on(table.invitedBy),
  }),
);

// Checkins Table
export const checkins = pgTable(
  "checkins",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    comment: text("comment"),
    rating: integer("rating"),
    userLatitude: real("user_latitude"),
    userLongitude: real("user_longitude"),
    status: checkinStatusEnum("status").notNull().default("active"),
    isPrivate: boolean("is_private").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("checkins_user_id_idx").on(table.userId),
    placeIdIdx: index("checkins_place_id_idx").on(table.placeId),
    statusIdx: index("checkins_status_idx").on(table.status),
    createdAtIdx: index("checkins_created_at_idx").on(table.createdAt),
    ratingIdx: index("checkins_rating_idx").on(table.rating),
  }),
);

// Checkin Photos Table
export const checkinPhotos = pgTable(
  "checkin_photos",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    checkinId: uuid("checkin_id")
      .notNull()
      .references(() => checkins.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    checkinIdIdx: index("checkin_photos_checkin_id_idx").on(table.checkinId),
    displayOrderIdx: index("checkin_photos_display_order_idx").on(
      table.checkinId,
      table.displayOrder,
    ),
  }),
);

// Reports Table
export const reports = pgTable(
  "reports",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: reportEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    type: reportTypeEnum("type").notNull(),
    reason: text("reason").notNull(),
    status: reportStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    reporterIdx: index("reports_reporter_idx").on(table.reporterUserId),
    entityIdx: index("reports_entity_idx").on(table.entityType, table.entityId),
    statusIdx: index("reports_status_idx").on(table.status),
    typeIdx: index("reports_type_idx").on(table.type),
    createdAtIdx: index("reports_created_at_idx").on(table.createdAt),
    reviewedByIdx: index("reports_reviewed_by_idx").on(table.reviewedBy),
    // Ensure a user can only report the same entity once
    reporterEntityUnique: unique("reports_reporter_entity_unique").on(
      table.reporterUserId,
      table.entityType,
      table.entityId,
    ),
  }),
);

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  subscription: one(userSubscriptions, {
    fields: [users.id],
    references: [userSubscriptions.userId],
  }),
  notificationSettings: one(notificationSettings, {
    fields: [users.id],
    references: [notificationSettings.userId],
  }),
  sessions: many(userSessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  regions: many(regions),
  places: many(places),
  regionFavorites: many(regionFavorites),
  regionPins: many(regionPins),
  placeFavorites: many(placeFavorites),
  placePermissions: many(placePermissions),
  placeInvitations: many(placePermissions, { relationName: "placeInviter" }),
  checkins: many(checkins),
  reports: many(reports),
  reviewedReports: many(reports, { relationName: "reportReviewer" }),
}));

export const regionRelations = relations(regions, ({ one, many }) => ({
  creator: one(users, {
    fields: [regions.createdBy],
    references: [users.id],
  }),
  places: many(places),
  favorites: many(regionFavorites),
  pins: many(regionPins),
}));

export const placeRelations = relations(places, ({ one, many }) => ({
  region: one(regions, {
    fields: [places.regionId],
    references: [regions.id],
  }),
  creator: one(users, {
    fields: [places.createdBy],
    references: [users.id],
  }),
  businessHours: many(placeBusinessHours),
  favorites: many(placeFavorites),
  permissions: many(placePermissions),
  checkins: many(checkins),
}));

export const checkinRelations = relations(checkins, ({ one, many }) => ({
  user: one(users, {
    fields: [checkins.userId],
    references: [users.id],
  }),
  place: one(places, {
    fields: [checkins.placeId],
    references: [places.id],
  }),
  photos: many(checkinPhotos),
}));

export const reportRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterUserId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
    relationName: "reportReviewer",
  }),
}));
