CREATE TYPE "public"."checkin_status" AS ENUM('active', 'hidden', 'reported', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."place_category" AS ENUM('restaurant', 'cafe', 'hotel', 'shopping', 'entertainment', 'culture', 'nature', 'historical', 'religious', 'transportation', 'hospital', 'education', 'office', 'other');--> statement-breakpoint
CREATE TYPE "public"."place_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."region_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."report_entity_type" AS ENUM('user', 'place', 'region', 'checkin');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'under_review', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('spam', 'inappropriate_content', 'harassment', 'false_information', 'copyright_violation', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trial', 'active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('visitor', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TABLE "checkin_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"checkin_id" uuid NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"comment" text,
	"rating" integer,
	"user_latitude" real,
	"user_longitude" real,
	"status" "checkin_status" DEFAULT 'active' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"checkin_notifications" boolean DEFAULT true NOT NULL,
	"editor_invite_notifications" boolean DEFAULT true NOT NULL,
	"system_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "place_business_hours" (
	"id" uuid PRIMARY KEY NOT NULL,
	"place_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"open_time" text,
	"close_time" text,
	"is_closed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "place_business_hours_place_day_unique" UNIQUE("place_id","day_of_week")
);
--> statement-breakpoint
CREATE TABLE "place_favorites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "place_favorites_user_place_unique" UNIQUE("user_id","place_id")
);
--> statement-breakpoint
CREATE TABLE "place_permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"place_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"can_edit" boolean DEFAULT true NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"invited_by" uuid NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "place_permissions_place_user_unique" UNIQUE("place_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"short_description" text,
	"category" "place_category" NOT NULL,
	"region_id" uuid NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"website" text,
	"email" text,
	"status" "place_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"cover_image" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"checkin_count" integer DEFAULT 0 NOT NULL,
	"average_rating" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region_favorites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "region_favorites_user_region_unique" UNIQUE("user_id","region_id")
);
--> statement-breakpoint
CREATE TABLE "region_pins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "region_pins_user_region_unique" UNIQUE("user_id","region_id")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"short_description" text,
	"latitude" real,
	"longitude" real,
	"address" text,
	"status" "region_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"cover_image" text,
	"images" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"place_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"entity_type" "report_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"type" "report_type" NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reports_reporter_entity_unique" UNIQUE("reporter_user_id","entity_type","entity_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'none' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"avatar" text,
	"role" "user_role" DEFAULT 'visitor' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "checkin_photos" ADD CONSTRAINT "checkin_photos_checkin_id_checkins_id_fk" FOREIGN KEY ("checkin_id") REFERENCES "public"."checkins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_business_hours" ADD CONSTRAINT "place_business_hours_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_favorites" ADD CONSTRAINT "place_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_favorites" ADD CONSTRAINT "place_favorites_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_permissions" ADD CONSTRAINT "place_permissions_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_permissions" ADD CONSTRAINT "place_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_permissions" ADD CONSTRAINT "place_permissions_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_favorites" ADD CONSTRAINT "region_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_favorites" ADD CONSTRAINT "region_favorites_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_pins" ADD CONSTRAINT "region_pins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_pins" ADD CONSTRAINT "region_pins_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkin_photos_checkin_id_idx" ON "checkin_photos" USING btree ("checkin_id");--> statement-breakpoint
CREATE INDEX "checkin_photos_display_order_idx" ON "checkin_photos" USING btree ("checkin_id","display_order");--> statement-breakpoint
CREATE INDEX "checkins_user_id_idx" ON "checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checkins_place_id_idx" ON "checkins" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "checkins_status_idx" ON "checkins" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkins_created_at_idx" ON "checkins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "checkins_rating_idx" ON "checkins" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_business_hours_place_id_idx" ON "place_business_hours" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_favorites_user_id_idx" ON "place_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_favorites_place_id_idx" ON "place_favorites" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_permissions_place_id_idx" ON "place_permissions" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "place_permissions_user_id_idx" ON "place_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_permissions_invited_by_idx" ON "place_permissions" USING btree ("invited_by");--> statement-breakpoint
CREATE INDEX "places_status_idx" ON "places" USING btree ("status");--> statement-breakpoint
CREATE INDEX "places_region_id_idx" ON "places" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "places_created_by_idx" ON "places" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "places_category_idx" ON "places" USING btree ("category");--> statement-breakpoint
CREATE INDEX "places_name_idx" ON "places" USING btree ("name");--> statement-breakpoint
CREATE INDEX "places_location_idx" ON "places" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "region_favorites_user_id_idx" ON "region_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "region_favorites_region_id_idx" ON "region_favorites" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "region_pins_user_id_idx" ON "region_pins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "region_pins_display_order_idx" ON "region_pins" USING btree ("user_id","display_order");--> statement-breakpoint
CREATE INDEX "regions_status_idx" ON "regions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "regions_created_by_idx" ON "regions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "regions_name_idx" ON "regions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "regions_location_idx" ON "regions" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_user_id");--> statement-breakpoint
CREATE INDEX "reports_entity_idx" ON "reports" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_type_idx" ON "reports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_reviewed_by_idx" ON "reports" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "system_settings_key_idx" ON "system_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "system_settings_is_active_idx" ON "system_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");