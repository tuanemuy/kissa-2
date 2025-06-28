import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { err, ok, type Result } from "neverthrow";
import {
  type RegionFavoriteRepository,
  type RegionPinRepository,
  type RegionRepository,
  RegionRepositoryError,
} from "@/core/domain/region/ports/regionRepository";
import type {
  AddRegionToFavoritesParams,
  CreateRegionParams,
  ListRegionsQuery,
  PinRegionParams,
  Region,
  RegionFavorite,
  RegionPin,
  RegionStatus,
  RegionWithStats,
  ReorderPinnedRegionsParams,
  SearchRegionsQuery,
  UpdateRegionParams,
} from "@/core/domain/region/types";
import {
  regionFavoriteSchema,
  regionPinSchema,
  regionSchema,
  regionWithStatsSchema,
} from "@/core/domain/region/types";
import { createBoundingBox, filterByDistance } from "@/lib/utils";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { regionFavorites, regionPins, regions } from "./schema";

export class DrizzlePgliteRegionRepository implements RegionRepository {
  constructor(private readonly db: Database) {}

  async create(
    createdBy: string,
    params: CreateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>> {
    try {
      const result = await this.db
        .insert(regions)
        .values({
          name: params.name,
          description: params.description,
          shortDescription: params.shortDescription,
          latitude: params.coordinates?.latitude,
          longitude: params.coordinates?.longitude,
          address: params.address,
          coverImage: params.coverImage,
          images: params.images || [],
          tags: params.tags || [],
          createdBy,
        })
        .returning();

      const region = result[0];
      if (!region) {
        return err(new RegionRepositoryError("Failed to create region"));
      }

      // Transform database result to domain model
      const regionData = {
        ...region,
        coordinates:
          region.latitude && region.longitude
            ? { latitude: region.latitude, longitude: region.longitude }
            : undefined,
      };

      return validate(regionSchema, regionData).mapErr((error) => {
        return new RegionRepositoryError("Invalid region data", error);
      });
    } catch (error) {
      return err(new RegionRepositoryError("Failed to create region", error));
    }
  }

  async findById(
    id: string,
    userId?: string,
  ): Promise<Result<RegionWithStats | null, RegionRepositoryError>> {
    try {
      const baseQuery = this.db
        .select({
          id: regions.id,
          name: regions.name,
          description: regions.description,
          shortDescription: regions.shortDescription,
          latitude: regions.latitude,
          longitude: regions.longitude,
          address: regions.address,
          status: regions.status,
          createdBy: regions.createdBy,
          coverImage: regions.coverImage,
          images: regions.images,
          tags: regions.tags,
          visitCount: regions.visitCount,
          favoriteCount: regions.favoriteCount,
          placeCount: regions.placeCount,
          createdAt: regions.createdAt,
          updatedAt: regions.updatedAt,
        })
        .from(regions)
        .where(eq(regions.id, id))
        .limit(1);

      const result = await baseQuery;

      if (result.length === 0) {
        return ok(null);
      }

      const region = result[0];

      // Check user interactions if userId is provided
      let isFavorited = false;
      let isPinned = false;
      let pinDisplayOrder: number | undefined;

      if (userId) {
        const [favoriteResult, pinResult] = await Promise.all([
          this.db
            .select()
            .from(regionFavorites)
            .where(
              and(
                eq(regionFavorites.userId, userId),
                eq(regionFavorites.regionId, id),
              ),
            )
            .limit(1),
          this.db
            .select()
            .from(regionPins)
            .where(
              and(eq(regionPins.userId, userId), eq(regionPins.regionId, id)),
            )
            .limit(1),
        ]);

        isFavorited = favoriteResult.length > 0;
        isPinned = pinResult.length > 0;
        pinDisplayOrder = pinResult[0]?.displayOrder;
      }

      const regionWithStats = {
        ...region,
        coordinates:
          region.latitude && region.longitude
            ? { latitude: region.latitude, longitude: region.longitude }
            : undefined,
        isFavorited,
        isPinned,
        pinDisplayOrder,
      };

      return validate(regionWithStatsSchema, regionWithStats).mapErr(
        (error) => {
          return new RegionRepositoryError("Invalid region data", error);
        },
      );
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to find region by ID", error),
      );
    }
  }

  async update(
    id: string,
    params: UpdateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.shortDescription !== undefined)
        updateData.shortDescription = params.shortDescription;
      if (params.coordinates !== undefined) {
        updateData.latitude = params.coordinates.latitude;
        updateData.longitude = params.coordinates.longitude;
      }
      if (params.address !== undefined) updateData.address = params.address;
      if (params.coverImage !== undefined)
        updateData.coverImage = params.coverImage;
      if (params.images !== undefined) updateData.images = params.images;
      if (params.tags !== undefined) updateData.tags = params.tags;

      const result = await this.db
        .update(regions)
        .set(updateData)
        .where(eq(regions.id, id))
        .returning();

      const region = result[0];
      if (!region) {
        return err(new RegionRepositoryError("Region not found"));
      }

      const regionData = {
        ...region,
        coordinates:
          region.latitude && region.longitude
            ? { latitude: region.latitude, longitude: region.longitude }
            : undefined,
      };

      return validate(regionSchema, regionData).mapErr((error) => {
        return new RegionRepositoryError("Invalid region data", error);
      });
    } catch (error) {
      return err(new RegionRepositoryError("Failed to update region", error));
    }
  }

  async updateStatus(
    id: string,
    status: RegionStatus,
  ): Promise<Result<Region, RegionRepositoryError>> {
    try {
      const result = await this.db
        .update(regions)
        .set({ status })
        .where(eq(regions.id, id))
        .returning();

      const region = result[0];
      if (!region) {
        return err(new RegionRepositoryError("Region not found"));
      }

      const regionData = {
        ...region,
        coordinates:
          region.latitude && region.longitude
            ? { latitude: region.latitude, longitude: region.longitude }
            : undefined,
      };

      return validate(regionSchema, regionData).mapErr((error) => {
        return new RegionRepositoryError("Invalid region data", error);
      });
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to update region status", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, RegionRepositoryError>> {
    try {
      await this.db.delete(regions).where(eq(regions.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RegionRepositoryError("Failed to delete region", error));
    }
  }

  async list(
    query: ListRegionsQuery,
    userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  > {
    try {
      const { pagination, filter, sort } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        filter?.status ? eq(regions.status, filter.status) : undefined,
        filter?.createdBy ? eq(regions.createdBy, filter.createdBy) : undefined,
        filter?.keyword ? like(regions.name, `%${filter.keyword}%`) : undefined,
      ].filter((f) => f !== undefined);

      // Add location filter if provided
      let locationFilter:
        | {
            coordinates: { latitude: number; longitude: number };
            radiusKm: number;
          }
        | undefined;
      if (filter?.location) {
        const { coordinates, radiusKm } = filter.location;
        locationFilter = { coordinates, radiusKm };

        // Use accurate bounding box as preliminary filter for performance
        const { minLat, maxLat, minLng, maxLng } = createBoundingBox(
          coordinates,
          radiusKm,
        );

        filters.push(
          sql`${regions.latitude} IS NOT NULL AND ${regions.longitude} IS NOT NULL AND ${regions.latitude} >= ${minLat} AND ${regions.latitude} <= ${maxLat} AND ${regions.longitude} >= ${minLng} AND ${regions.longitude} <= ${maxLng}`,
        );
      }

      // Determine sort order
      const sortField = sort?.field || "createdAt";
      const sortDirection = sort?.direction || "desc";
      const orderBy = sortDirection === "asc" ? asc : desc;

      let sortColumn: PgColumn;
      switch (sortField) {
        case "name":
          sortColumn = regions.name;
          break;
        case "updatedAt":
          sortColumn = regions.updatedAt;
          break;
        case "visitCount":
          sortColumn = regions.visitCount;
          break;
        case "favoriteCount":
          sortColumn = regions.favoriteCount;
          break;
        default:
          sortColumn = regions.createdAt;
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(regions)
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(orderBy(sortColumn)),
        this.db.select({ count: count() }).from(regions).where(whereCondition),
      ]);

      // Add user interaction data if userId is provided
      const regionsWithStats: RegionWithStats[] = [];

      // Optimize N+1 query problem by batch-fetching user interactions
      const favoriteMap = new Map<string, boolean>();
      const pinMap = new Map<
        string,
        { isPinned: boolean; displayOrder?: number }
      >();

      if (userId && items.length > 0) {
        const regionIds = items.map((item) => item.id);

        // Batch fetch favorites and pins
        const [favoriteResults, pinResults] = await Promise.all([
          this.db
            .select()
            .from(regionFavorites)
            .where(
              and(
                eq(regionFavorites.userId, userId),
                inArray(regionFavorites.regionId, regionIds),
              ),
            ),
          this.db
            .select()
            .from(regionPins)
            .where(
              and(
                eq(regionPins.userId, userId),
                inArray(regionPins.regionId, regionIds),
              ),
            ),
        ]);

        // Create lookup maps
        favoriteResults.forEach((fav) => {
          favoriteMap.set(fav.regionId, true);
        });

        pinResults.forEach((pin) => {
          pinMap.set(pin.regionId, {
            isPinned: true,
            displayOrder: pin.displayOrder,
          });
        });
      }

      for (const item of items) {
        const isFavorited = favoriteMap.get(item.id) || false;
        const pinInfo = pinMap.get(item.id) || { isPinned: false };

        const regionWithStats = {
          ...item,
          coordinates:
            item.latitude && item.longitude
              ? { latitude: item.latitude, longitude: item.longitude }
              : undefined,
          isFavorited,
          isPinned: pinInfo.isPinned,
          pinDisplayOrder: pinInfo.displayOrder,
        };

        const validated = validate(regionWithStatsSchema, regionWithStats);
        if (validated.isOk()) {
          regionsWithStats.push(validated.value);
        }
      }

      // Apply accurate distance filtering if location filter was used
      let finalItems = regionsWithStats;
      if (locationFilter) {
        finalItems = filterByDistance(
          regionsWithStats,
          locationFilter.coordinates,
          locationFilter.radiusKm,
        );
      }

      return ok({
        items: finalItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RegionRepositoryError("Failed to list regions", error));
    }
  }

  async search(
    query: SearchRegionsQuery,
    userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  > {
    try {
      const { pagination, keyword, location } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        eq(regions.status, "published"),
        or(
          like(regions.name, `%${keyword}%`),
          like(regions.description, `%${keyword}%`),
        ),
      ];

      // Add location filter if provided
      let searchLocationFilter:
        | {
            coordinates: { latitude: number; longitude: number };
            radiusKm: number;
          }
        | undefined;
      if (location) {
        const { coordinates, radiusKm } = location;
        searchLocationFilter = { coordinates, radiusKm };

        // Use accurate bounding box as preliminary filter for performance
        const { minLat, maxLat, minLng, maxLng } = createBoundingBox(
          coordinates,
          radiusKm,
        );

        filters.push(
          sql`${regions.latitude} IS NOT NULL AND ${regions.longitude} IS NOT NULL AND ${regions.latitude} >= ${minLat} AND ${regions.latitude} <= ${maxLat} AND ${regions.longitude} >= ${minLng} AND ${regions.longitude} <= ${maxLng}`,
        );
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(regions)
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(regions.visitCount), desc(regions.favoriteCount)),
        this.db.select({ count: count() }).from(regions).where(whereCondition),
      ]);

      // Process items similar to list method
      const regionsWithStats: RegionWithStats[] = [];

      // Optimize N+1 query problem by batch-fetching user interactions
      const favoriteMap = new Map<string, boolean>();
      const pinMap = new Map<
        string,
        { isPinned: boolean; displayOrder?: number }
      >();

      if (userId && items.length > 0) {
        const regionIds = items.map((item) => item.id);

        // Batch fetch favorites and pins
        const [favoriteResults, pinResults] = await Promise.all([
          this.db
            .select()
            .from(regionFavorites)
            .where(
              and(
                eq(regionFavorites.userId, userId),
                inArray(regionFavorites.regionId, regionIds),
              ),
            ),
          this.db
            .select()
            .from(regionPins)
            .where(
              and(
                eq(regionPins.userId, userId),
                inArray(regionPins.regionId, regionIds),
              ),
            ),
        ]);

        // Create lookup maps
        favoriteResults.forEach((fav) => {
          favoriteMap.set(fav.regionId, true);
        });

        pinResults.forEach((pin) => {
          pinMap.set(pin.regionId, {
            isPinned: true,
            displayOrder: pin.displayOrder,
          });
        });
      }

      for (const item of items) {
        const isFavorited = favoriteMap.get(item.id) || false;
        const pinInfo = pinMap.get(item.id) || { isPinned: false };

        const regionWithStats = {
          ...item,
          coordinates:
            item.latitude && item.longitude
              ? { latitude: item.latitude, longitude: item.longitude }
              : undefined,
          isFavorited,
          isPinned: pinInfo.isPinned,
          pinDisplayOrder: pinInfo.displayOrder,
        };

        const validated = validate(regionWithStatsSchema, regionWithStats);
        if (validated.isOk()) {
          regionsWithStats.push(validated.value);
        }
      }

      // Apply accurate distance filtering if location filter was used
      let finalItems = regionsWithStats;
      if (searchLocationFilter) {
        finalItems = filterByDistance(
          regionsWithStats,
          searchLocationFilter.coordinates,
          searchLocationFilter.radiusKm,
        );
      }

      return ok({
        items: finalItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new RegionRepositoryError("Failed to search regions", error));
    }
  }

  async getFeatured(
    limit: number,
    userId?: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    try {
      const items = await this.db
        .select()
        .from(regions)
        .where(eq(regions.status, "published"))
        .orderBy(desc(regions.visitCount), desc(regions.favoriteCount))
        .limit(limit);

      const regionsWithStats: RegionWithStats[] = [];

      // Optimize N+1 query problem by batch-fetching user interactions
      const favoriteMap = new Map<string, boolean>();
      const pinMap = new Map<
        string,
        { isPinned: boolean; displayOrder?: number }
      >();

      if (userId && items.length > 0) {
        const regionIds = items.map((item) => item.id);

        // Batch fetch favorites and pins
        const [favoriteResults, pinResults] = await Promise.all([
          this.db
            .select()
            .from(regionFavorites)
            .where(
              and(
                eq(regionFavorites.userId, userId),
                inArray(regionFavorites.regionId, regionIds),
              ),
            ),
          this.db
            .select()
            .from(regionPins)
            .where(
              and(
                eq(regionPins.userId, userId),
                inArray(regionPins.regionId, regionIds),
              ),
            ),
        ]);

        // Create lookup maps
        favoriteResults.forEach((fav) => {
          favoriteMap.set(fav.regionId, true);
        });

        pinResults.forEach((pin) => {
          pinMap.set(pin.regionId, {
            isPinned: true,
            displayOrder: pin.displayOrder,
          });
        });
      }

      for (const item of items) {
        const isFavorited = favoriteMap.get(item.id) || false;
        const pinInfo = pinMap.get(item.id) || { isPinned: false };

        const regionWithStats = {
          ...item,
          coordinates:
            item.latitude && item.longitude
              ? { latitude: item.latitude, longitude: item.longitude }
              : undefined,
          isFavorited,
          isPinned: pinInfo.isPinned,
          pinDisplayOrder: pinInfo.displayOrder,
        };

        const validated = validate(regionWithStatsSchema, regionWithStats);
        if (validated.isOk()) {
          regionsWithStats.push(validated.value);
        }
      }

      return ok(regionsWithStats);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to get featured regions", error),
      );
    }
  }

  async getByCreator(
    createdBy: string,
    status?: RegionStatus,
  ): Promise<Result<Region[], RegionRepositoryError>> {
    try {
      const filters = [eq(regions.createdBy, createdBy)];
      if (status) {
        filters.push(eq(regions.status, status));
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const items = await this.db
        .select()
        .from(regions)
        .where(whereCondition)
        .orderBy(desc(regions.createdAt));

      const validatedRegions: Region[] = [];

      for (const item of items) {
        const regionData = {
          ...item,
          coordinates:
            item.latitude && item.longitude
              ? { latitude: item.latitude, longitude: item.longitude }
              : undefined,
        };

        const validated = validate(regionSchema, regionData);
        if (validated.isOk()) {
          validatedRegions.push(validated.value);
        }
      }

      return ok(validatedRegions);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to get regions by creator", error),
      );
    }
  }

  async incrementVisitCount(
    id: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      await this.db
        .update(regions)
        .set({
          visitCount: sql`${regions.visitCount} + 1`,
        })
        .where(eq(regions.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to increment visit count", error),
      );
    }
  }

  async updatePlaceCount(
    id: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      // This would typically be called after place creation/deletion
      // For now, we'll increment by 1, but in a real implementation
      // this should count actual places
      await this.db
        .update(regions)
        .set({
          placeCount: sql`${regions.placeCount} + 1`,
        })
        .where(eq(regions.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to update place count", error),
      );
    }
  }

  async checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, RegionRepositoryError>> {
    try {
      const result = await this.db
        .select({ createdBy: regions.createdBy })
        .from(regions)
        .where(eq(regions.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      return ok(result[0].createdBy === userId);
    } catch (error) {
      return err(new RegionRepositoryError("Failed to check ownership", error));
    }
  }
}

export class DrizzlePgliteRegionFavoriteRepository
  implements RegionFavoriteRepository
{
  constructor(private readonly db: Database) {}

  async add(
    params: AddRegionToFavoritesParams,
  ): Promise<Result<RegionFavorite, RegionRepositoryError>> {
    try {
      const result = await this.db
        .insert(regionFavorites)
        .values({
          userId: params.userId,
          regionId: params.regionId,
        })
        .returning();

      const favorite = result[0];
      if (!favorite) {
        return err(
          new RegionRepositoryError("Failed to add region to favorites"),
        );
      }

      // Update favorite count
      await this.updateFavoriteCount(params.regionId);

      return validate(regionFavoriteSchema, favorite).mapErr((error) => {
        return new RegionRepositoryError("Invalid favorite data", error);
      });
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to add region to favorites", error),
      );
    }
  }

  async remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      await this.db
        .delete(regionFavorites)
        .where(
          and(
            eq(regionFavorites.userId, userId),
            eq(regionFavorites.regionId, regionId),
          ),
        );

      // Update favorite count
      await this.updateFavoriteCount(regionId);

      return ok(undefined);
    } catch (error) {
      return err(
        new RegionRepositoryError(
          "Failed to remove region from favorites",
          error,
        ),
      );
    }
  }

  async findByUser(
    userId: string,
  ): Promise<Result<RegionFavorite[], RegionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(regionFavorites)
        .where(eq(regionFavorites.userId, userId))
        .orderBy(desc(regionFavorites.createdAt));

      const validatedFavorites: RegionFavorite[] = [];

      for (const item of result) {
        const validated = validate(regionFavoriteSchema, item);
        if (validated.isOk()) {
          validatedFavorites.push(validated.value);
        }
      }

      return ok(validatedFavorites);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to find favorites by user", error),
      );
    }
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionFavorite | null, RegionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(regionFavorites)
        .where(
          and(
            eq(regionFavorites.userId, userId),
            eq(regionFavorites.regionId, regionId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(regionFavoriteSchema, result[0]).mapErr((error) => {
        return new RegionRepositoryError("Invalid favorite data", error);
      });
    } catch (error) {
      return err(
        new RegionRepositoryError(
          "Failed to find favorite by user and region",
          error,
        ),
      );
    }
  }

  async getRegionsWithFavorites(
    userId: string,
    limit?: number,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    try {
      const query = this.db
        .select({
          region: regions,
          favorite: regionFavorites,
        })
        .from(regionFavorites)
        .innerJoin(regions, eq(regionFavorites.regionId, regions.id))
        .where(eq(regionFavorites.userId, userId))
        .orderBy(desc(regionFavorites.createdAt));

      if (limit) {
        query.limit(limit);
      }

      const result = await query;

      const regionsWithStats: RegionWithStats[] = [];

      for (const item of result) {
        const regionWithStats = {
          ...item.region,
          coordinates:
            item.region.latitude && item.region.longitude
              ? {
                  latitude: item.region.latitude,
                  longitude: item.region.longitude,
                }
              : undefined,
          isFavorited: true,
          isPinned: false,
          pinDisplayOrder: undefined,
        };

        const validated = validate(regionWithStatsSchema, regionWithStats);
        if (validated.isOk()) {
          regionsWithStats.push(validated.value);
        }
      }

      return ok(regionsWithStats);
    } catch (error) {
      return err(
        new RegionRepositoryError(
          "Failed to get regions with favorites",
          error,
        ),
      );
    }
  }

  async updateFavoriteCount(
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      const countResult = await this.db
        .select({ count: count() })
        .from(regionFavorites)
        .where(eq(regionFavorites.regionId, regionId));

      const favoriteCount = Number(countResult[0]?.count || 0);

      await this.db
        .update(regions)
        .set({ favoriteCount })
        .where(eq(regions.id, regionId));

      return ok(undefined);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to update favorite count", error),
      );
    }
  }
}

export class DrizzlePgliteRegionPinRepository implements RegionPinRepository {
  constructor(private readonly db: Database) {}

  async add(
    params: PinRegionParams,
  ): Promise<Result<RegionPin, RegionRepositoryError>> {
    try {
      let displayOrder = params.displayOrder;

      if (displayOrder === undefined) {
        const maxOrderResult = await this.getMaxDisplayOrder(params.userId);
        if (maxOrderResult.isErr()) {
          return err(maxOrderResult.error);
        }
        displayOrder = maxOrderResult.value + 1;
      }

      const result = await this.db
        .insert(regionPins)
        .values({
          userId: params.userId,
          regionId: params.regionId,
          displayOrder,
        })
        .returning();

      const pin = result[0];
      if (!pin) {
        return err(new RegionRepositoryError("Failed to pin region"));
      }

      return validate(regionPinSchema, pin).mapErr((error) => {
        return new RegionRepositoryError("Invalid pin data", error);
      });
    } catch (error) {
      return err(new RegionRepositoryError("Failed to pin region", error));
    }
  }

  async remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      await this.db
        .delete(regionPins)
        .where(
          and(eq(regionPins.userId, userId), eq(regionPins.regionId, regionId)),
        );

      return ok(undefined);
    } catch (error) {
      return err(new RegionRepositoryError("Failed to unpin region", error));
    }
  }

  async findByUser(
    userId: string,
  ): Promise<Result<RegionPin[], RegionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(regionPins)
        .where(eq(regionPins.userId, userId))
        .orderBy(asc(regionPins.displayOrder));

      const validatedPins: RegionPin[] = [];

      for (const item of result) {
        const validated = validate(regionPinSchema, item);
        if (validated.isOk()) {
          validatedPins.push(validated.value);
        }
      }

      return ok(validatedPins);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to find pins by user", error),
      );
    }
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionPin | null, RegionRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(regionPins)
        .where(
          and(eq(regionPins.userId, userId), eq(regionPins.regionId, regionId)),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(regionPinSchema, result[0]).mapErr((error) => {
        return new RegionRepositoryError("Invalid pin data", error);
      });
    } catch (error) {
      return err(
        new RegionRepositoryError(
          "Failed to find pin by user and region",
          error,
        ),
      );
    }
  }

  async reorder(
    params: ReorderPinnedRegionsParams,
  ): Promise<Result<void, RegionRepositoryError>> {
    try {
      // Update display order for each pinned region
      for (let i = 0; i < params.regionIds.length; i++) {
        await this.db
          .update(regionPins)
          .set({ displayOrder: i })
          .where(
            and(
              eq(regionPins.userId, params.userId),
              eq(regionPins.regionId, params.regionIds[i]),
            ),
          );
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to reorder pinned regions", error),
      );
    }
  }

  async getRegionsWithPins(
    userId: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    try {
      const result = await this.db
        .select({
          region: regions,
          pin: regionPins,
        })
        .from(regionPins)
        .innerJoin(regions, eq(regionPins.regionId, regions.id))
        .where(eq(regionPins.userId, userId))
        .orderBy(asc(regionPins.displayOrder));

      const regionsWithStats: RegionWithStats[] = [];

      for (const item of result) {
        const regionWithStats = {
          ...item.region,
          coordinates:
            item.region.latitude && item.region.longitude
              ? {
                  latitude: item.region.latitude,
                  longitude: item.region.longitude,
                }
              : undefined,
          isFavorited: false,
          isPinned: true,
          pinDisplayOrder: item.pin.displayOrder,
        };

        const validated = validate(regionWithStatsSchema, regionWithStats);
        if (validated.isOk()) {
          regionsWithStats.push(validated.value);
        }
      }

      return ok(regionsWithStats);
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to get regions with pins", error),
      );
    }
  }

  async getMaxDisplayOrder(
    userId: string,
  ): Promise<Result<number, RegionRepositoryError>> {
    try {
      const result = await this.db
        .select({ maxOrder: sql<number>`max(${regionPins.displayOrder})` })
        .from(regionPins)
        .where(eq(regionPins.userId, userId));

      const maxOrder = result[0]?.maxOrder || 0;
      return ok(Number(maxOrder));
    } catch (error) {
      return err(
        new RegionRepositoryError("Failed to get max display order", error),
      );
    }
  }
}
