import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { CHECKIN, LOCATION } from "../constants";
import { coordinatesSchema } from "../region/types";

export const checkinStatusSchema = z.enum([
  "active",
  "hidden",
  "reported",
  "deleted",
]);
export type CheckinStatus = z.infer<typeof checkinStatusSchema>;

export const checkinSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  placeId: z.string().uuid(),
  comment: z.string().max(CHECKIN.MAX_COMMENT_LENGTH).optional(),
  rating: z
    .number()
    .int()
    .min(CHECKIN.MIN_RATING)
    .max(CHECKIN.MAX_RATING)
    .optional(),
  photos: z.array(z.string().url()).default([]),
  userLocation: coordinatesSchema.optional(),
  status: checkinStatusSchema.default("active"),
  isPrivate: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Checkin = z.infer<typeof checkinSchema>;

export const checkinPhotoSchema = z.object({
  id: z.string().uuid(),
  checkinId: z.string().uuid(),
  url: z.string().url(),
  caption: z.string().max(CHECKIN.MAX_CAPTION_LENGTH).optional(),
  displayOrder: z.number().int().min(0).default(0),
  createdAt: z.date(),
});
export type CheckinPhoto = z.infer<typeof checkinPhotoSchema>;

export const createCheckinSchema = z.object({
  placeId: z.string().uuid(),
  comment: z.string().max(CHECKIN.MAX_COMMENT_LENGTH).optional(),
  rating: z
    .number()
    .int()
    .min(CHECKIN.MIN_RATING)
    .max(CHECKIN.MAX_RATING)
    .optional(),
  userLocation: coordinatesSchema,
  isPrivate: z.boolean().default(false),
});
export type CreateCheckinParams = z.infer<typeof createCheckinSchema>;

export const updateCheckinSchema = z.object({
  comment: z.string().max(CHECKIN.MAX_COMMENT_LENGTH).optional(),
  rating: z
    .number()
    .int()
    .min(CHECKIN.MIN_RATING)
    .max(CHECKIN.MAX_RATING)
    .optional(),
  isPrivate: z.boolean().optional(),
});
export type UpdateCheckinParams = z.infer<typeof updateCheckinSchema>;

export const uploadCheckinPhotosSchema = z.object({
  checkinId: z.string().uuid(),
  photos: z.array(
    z.object({
      url: z.string().url(),
      caption: z.string().max(CHECKIN.MAX_CAPTION_LENGTH).optional(),
    }),
  ),
});
export type UploadCheckinPhotosParams = z.infer<
  typeof uploadCheckinPhotosSchema
>;

export const listCheckinsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      userId: z.string().uuid().optional(),
      placeId: z.string().uuid().optional(),
      regionId: z.string().uuid().optional(),
      status: checkinStatusSchema.optional(),
      hasRating: z.boolean().optional(),
      hasPhotos: z.boolean().optional(),
      isPrivate: z.boolean().optional(),
      dateRange: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z.enum(["createdAt", "rating", "updatedAt"]),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
});
export type ListCheckinsQuery = z.infer<typeof listCheckinsQuerySchema>;

export const validateLocationSchema = z.object({
  userLocation: coordinatesSchema,
  placeLocation: coordinatesSchema,
  maxDistanceMeters: z
    .number()
    .int()
    .min(1)
    .max(LOCATION.MAX_CHECKIN_DISTANCE_METERS)
    .default(LOCATION.DEFAULT_CHECKIN_DISTANCE_METERS),
});
export type ValidateLocationParams = z.infer<typeof validateLocationSchema>;

export const checkinWithDetailsSchema = checkinSchema.extend({
  userName: z.string(),
  userAvatar: z.string().url().optional(),
  placeName: z.string(),
  placeRegionName: z.string(),
  placeAddress: z.string(),
  placeCoordinates: coordinatesSchema,
  photos: z.array(checkinPhotoSchema).default([]),
  distanceFromPlace: z.number().optional(),
});
export type CheckinWithDetails = z.infer<typeof checkinWithDetailsSchema>;

export const checkinStatsSchema = z.object({
  totalCheckins: z.number().int().min(0),
  checkinsThisMonth: z.number().int().min(0),
  uniquePlaces: z.number().int().min(0),
  uniqueRegions: z.number().int().min(0),
  averageRating: z.number().min(0).max(5).optional(),
  totalPhotos: z.number().int().min(0),
});
export type CheckinStats = z.infer<typeof checkinStatsSchema>;
