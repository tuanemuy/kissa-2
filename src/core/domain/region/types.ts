import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";
import { COORDINATE_SYSTEM, LOCATION, PLACE } from "../constants";

export const regionStatusSchema = z.enum(["draft", "published", "archived"]);
export type RegionStatus = z.infer<typeof regionStatusSchema>;

/**
 * Coordinates schema using WGS84 coordinate system
 */
export const coordinatesSchema = z.object({
  latitude: z
    .number()
    .min(COORDINATE_SYSTEM.MIN_LATITUDE)
    .max(COORDINATE_SYSTEM.MAX_LATITUDE),
  longitude: z
    .number()
    .min(COORDINATE_SYSTEM.MIN_LONGITUDE)
    .max(COORDINATE_SYSTEM.MAX_LONGITUDE),
});
export type Coordinates = z.infer<typeof coordinatesSchema>;

export const regionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(PLACE.MIN_NAME_LENGTH).max(PLACE.MAX_NAME_LENGTH),
  description: z.string().max(PLACE.MAX_DESCRIPTION_LENGTH).optional(),
  shortDescription: z
    .string()
    .max(PLACE.MAX_SHORT_DESCRIPTION_LENGTH)
    .optional(),
  coordinates: coordinatesSchema.optional(),
  address: z.string().max(PLACE.MAX_ADDRESS_LENGTH).optional(),
  status: regionStatusSchema,
  createdBy: z.string().uuid(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(PLACE.MAX_TAG_LENGTH)).default([]),
  visitCount: z.number().int().min(0).default(0),
  favoriteCount: z.number().int().min(0).default(0),
  placeCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Region = z.infer<typeof regionSchema>;

export const regionFavoriteSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
  createdAt: z.date(),
});
export type RegionFavorite = z.infer<typeof regionFavoriteSchema>;

export const regionPinSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
  displayOrder: z.number().int().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type RegionPin = z.infer<typeof regionPinSchema>;

export const createRegionSchema = z.object({
  name: z.string().min(PLACE.MIN_NAME_LENGTH).max(PLACE.MAX_NAME_LENGTH),
  description: z.string().max(PLACE.MAX_DESCRIPTION_LENGTH).optional(),
  shortDescription: z
    .string()
    .max(PLACE.MAX_SHORT_DESCRIPTION_LENGTH)
    .optional(),
  coordinates: coordinatesSchema.optional(),
  address: z.string().max(PLACE.MAX_ADDRESS_LENGTH).optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(PLACE.MAX_TAG_LENGTH)).default([]),
});
export type CreateRegionParams = z.infer<typeof createRegionSchema>;

export const updateRegionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(PLACE.MAX_DESCRIPTION_LENGTH).optional(),
  shortDescription: z
    .string()
    .max(PLACE.MAX_SHORT_DESCRIPTION_LENGTH)
    .optional(),
  coordinates: coordinatesSchema.optional(),
  address: z.string().max(PLACE.MAX_ADDRESS_LENGTH).optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string().max(PLACE.MAX_TAG_LENGTH)).optional(),
});
export type UpdateRegionParams = z.infer<typeof updateRegionSchema>;

export const listRegionsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      status: regionStatusSchema.optional(),
      createdBy: z.string().uuid().optional(),
      keyword: z.string().optional(),
      tags: z.array(z.string()).optional(),
      location: z
        .object({
          coordinates: coordinatesSchema,
          radiusKm: z.number().min(LOCATION.MIN_SEARCH_RADIUS_KM).max(100),
        })
        .optional(),
      featured: z.boolean().optional(),
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
      ]),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
});
export type ListRegionsQuery = z.infer<typeof listRegionsQuerySchema>;

export const searchRegionsQuerySchema = z.object({
  pagination: paginationSchema,
  keyword: z.string().min(1),
  location: z
    .object({
      coordinates: coordinatesSchema,
      radiusKm: z.number().min(0.1).max(100),
    })
    .optional(),
});
export type SearchRegionsQuery = z.infer<typeof searchRegionsQuerySchema>;

export const addRegionToFavoritesSchema = z.object({
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
});
export type AddRegionToFavoritesParams = z.infer<
  typeof addRegionToFavoritesSchema
>;

export const pinRegionSchema = z.object({
  userId: z.string().uuid(),
  regionId: z.string().uuid(),
  displayOrder: z.number().int().min(0).optional(),
});
export type PinRegionParams = z.infer<typeof pinRegionSchema>;

export const reorderPinnedRegionsSchema = z.object({
  userId: z.string().uuid(),
  regionIds: z.array(z.string().uuid()),
});
export type ReorderPinnedRegionsParams = z.infer<
  typeof reorderPinnedRegionsSchema
>;

export const regionWithStatsSchema = regionSchema.extend({
  isFavorited: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  pinDisplayOrder: z.number().int().optional(),
});
export type RegionWithStats = z.infer<typeof regionWithStatsSchema>;
