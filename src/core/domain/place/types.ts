import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { coordinatesSchema } from "../region/types";

export const placeStatusSchema = z.enum(["draft", "published", "archived"]);
export type PlaceStatus = z.infer<typeof placeStatusSchema>;

export const placeCategorySchema = z.enum([
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
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

export const businessHoursSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  openTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  closeTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  isClosed: z.boolean().default(false),
});
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const placeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  category: placeCategorySchema,
  regionId: z.string().uuid(),
  coordinates: coordinatesSchema,
  address: z.string().max(500),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  status: placeStatusSchema,
  createdBy: z.string().uuid(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  businessHours: z.array(businessHoursSchema).default([]),
  visitCount: z.number().int().min(0).default(0),
  favoriteCount: z.number().int().min(0).default(0),
  checkinCount: z.number().int().min(0).default(0),
  averageRating: z.number().min(0).max(5).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Place = z.infer<typeof placeSchema>;

export const placeFavoriteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  placeId: z.string().uuid(),
  createdAt: z.date(),
});
export type PlaceFavorite = z.infer<typeof placeFavoriteSchema>;

export const placePermissionSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string().uuid(),
  userId: z.string().uuid(),
  canEdit: z.boolean().default(true),
  canDelete: z.boolean().default(false),
  invitedBy: z.string().uuid(),
  invitedAt: z.date(),
  acceptedAt: z.date().optional(),
});
export type PlacePermission = z.infer<typeof placePermissionSchema>;

export const createPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  category: placeCategorySchema,
  regionId: z.string().uuid(),
  coordinates: coordinatesSchema,
  address: z.string().max(500),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).default([]),
  businessHours: z.array(businessHoursSchema).default([]),
});
export type CreatePlaceParams = z.infer<typeof createPlaceSchema>;

export const updatePlaceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(300).optional(),
  category: placeCategorySchema.optional(),
  coordinates: coordinatesSchema.optional(),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string().max(50)).optional(),
  businessHours: z.array(businessHoursSchema).optional(),
});
export type UpdatePlaceParams = z.infer<typeof updatePlaceSchema>;

export const listPlacesQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      regionId: z.string().uuid().optional(),
      category: placeCategorySchema.optional(),
      status: placeStatusSchema.optional(),
      createdBy: z.string().uuid().optional(),
      keyword: z.string().optional(),
      tags: z.array(z.string()).optional(),
      location: z
        .object({
          coordinates: coordinatesSchema,
          radiusKm: z.number().min(0.1).max(50),
        })
        .optional(),
      hasPermission: z.boolean().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z.enum([
        "name",
        "createdAt",
        "updatedAt",
        "visitCount",
        "favoriteCount",
        "checkinCount",
      ]),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
});
export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;

export const searchPlacesQuerySchema = z.object({
  pagination: paginationSchema,
  keyword: z.string().min(1),
  regionId: z.string().uuid().optional(),
  category: placeCategorySchema.optional(),
  location: z
    .object({
      coordinates: coordinatesSchema,
      radiusKm: z.number().min(0.1).max(50),
    })
    .optional(),
});
export type SearchPlacesQuery = z.infer<typeof searchPlacesQuerySchema>;

export const addPlaceToFavoritesSchema = z.object({
  userId: z.string().uuid(),
  placeId: z.string().uuid(),
});
export type AddPlaceToFavoritesParams = z.infer<
  typeof addPlaceToFavoritesSchema
>;

export const inviteEditorSchema = z.object({
  placeId: z.string().uuid(),
  email: z.string().email(),
  canEdit: z.boolean().default(true),
  canDelete: z.boolean().default(false),
});
export type InviteEditorParams = z.infer<typeof inviteEditorSchema>;

export const updatePermissionSchema = z.object({
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});
export type UpdatePermissionParams = z.infer<typeof updatePermissionSchema>;

export const placeWithStatsSchema = placeSchema.extend({
  isFavorited: z.boolean().optional(),
  hasEditPermission: z.boolean().optional(),
  hasDeletePermission: z.boolean().optional(),
  regionName: z.string().optional(),
});
export type PlaceWithStats = z.infer<typeof placeWithStatsSchema>;
