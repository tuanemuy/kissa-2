import { and, asc, count, desc, eq, like, or, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { err, ok, type Result } from "neverthrow";
import {
  type PlaceFavoriteRepository,
  type PlacePermissionRepository,
  type PlaceRepository,
  PlaceRepositoryError,
} from "@/core/domain/place/ports/placeRepository";
import type {
  AddPlaceToFavoritesParams,
  BusinessHours,
  CreatePlaceParams,
  InviteEditorParams,
  ListPlacesQuery,
  Place,
  PlaceCategory,
  PlaceFavorite,
  PlacePermission,
  PlaceStatus,
  PlaceWithStats,
  SearchPlacesQuery,
  UpdatePermissionParams,
  UpdatePlaceParams,
} from "@/core/domain/place/types";
import {
  placeFavoriteSchema,
  placePermissionSchema,
  placeSchema,
  placeWithStatsSchema,
} from "@/core/domain/place/types";
import type { Coordinates } from "@/core/domain/region/types";
import { createBoundingBox, filterByDistance } from "@/lib/utils";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import {
  placeBusinessHours,
  placeFavorites,
  placePermissions,
  places,
  regions,
  users,
} from "./schema";

export class DrizzlePglitePlaceRepository implements PlaceRepository {
  constructor(private readonly db: Database) {}

  async create(
    createdBy: string,
    params: CreatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .insert(places)
        .values({
          name: params.name,
          description: params.description,
          shortDescription: params.shortDescription,
          category: params.category,
          regionId: params.regionId,
          latitude: params.coordinates.latitude,
          longitude: params.coordinates.longitude,
          address: params.address,
          phone: params.phone,
          website: params.website,
          email: params.email,
          coverImage: params.coverImage,
          images: params.images || [],
          tags: params.tags || [],
          createdBy,
        })
        .returning();

      const place = result[0];
      if (!place) {
        return err(new PlaceRepositoryError("Failed to create place"));
      }

      // Insert business hours if provided
      if (params.businessHours && params.businessHours.length > 0) {
        const businessHoursValues = params.businessHours.map((bh) => ({
          placeId: place.id,
          dayOfWeek: bh.dayOfWeek,
          openTime: bh.openTime,
          closeTime: bh.closeTime,
          isClosed: bh.isClosed,
        }));

        await this.db.insert(placeBusinessHours).values(businessHoursValues);
      }

      // Fetch business hours
      const businessHours = await this._getBusinessHours(place.id);

      // Transform database result to domain model
      const placeData = {
        ...place,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        businessHours,
      };

      return validate(placeSchema, placeData).mapErr((error) => {
        return new PlaceRepositoryError("Invalid place data", error);
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to create place", error));
    }
  }

  async findById(
    id: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats | null, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select({
          place: places,
          regionName: regions.name,
        })
        .from(places)
        .leftJoin(regions, eq(places.regionId, regions.id))
        .where(eq(places.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const { place, regionName } = result[0];

      // Get business hours
      const businessHours = await this._getBusinessHours(id);

      // Check user interactions if userId is provided
      let isFavorited = false;
      let hasEditPermission = false;
      let hasDeletePermission = false;

      if (userId) {
        const [favoriteResult, permissionResult] = await Promise.all([
          this.db
            .select()
            .from(placeFavorites)
            .where(
              and(
                eq(placeFavorites.userId, userId),
                eq(placeFavorites.placeId, id),
              ),
            )
            .limit(1),
          this.db
            .select()
            .from(placePermissions)
            .where(
              and(
                eq(placePermissions.userId, userId),
                eq(placePermissions.placeId, id),
              ),
            )
            .limit(1),
        ]);

        isFavorited = favoriteResult.length > 0;

        if (permissionResult.length > 0) {
          hasEditPermission = permissionResult[0].canEdit;
          hasDeletePermission = permissionResult[0].canDelete;
        }

        // Check if user is the creator (has all permissions)
        if (place.createdBy === userId) {
          hasEditPermission = true;
          hasDeletePermission = true;
        }
      }

      const placeWithStats = {
        ...place,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        businessHours,
        isFavorited,
        hasEditPermission,
        hasDeletePermission,
        regionName,
      };

      return validate(placeWithStatsSchema, placeWithStats).mapErr((error) => {
        return new PlaceRepositoryError("Invalid place data", error);
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to find place by ID", error));
    }
  }

  async update(
    id: string,
    params: UpdatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.shortDescription !== undefined)
        updateData.shortDescription = params.shortDescription;
      if (params.category !== undefined) updateData.category = params.category;
      if (params.coordinates !== undefined) {
        updateData.latitude = params.coordinates.latitude;
        updateData.longitude = params.coordinates.longitude;
      }
      if (params.address !== undefined) updateData.address = params.address;
      if (params.phone !== undefined) updateData.phone = params.phone;
      if (params.website !== undefined) updateData.website = params.website;
      if (params.email !== undefined) updateData.email = params.email;
      if (params.coverImage !== undefined)
        updateData.coverImage = params.coverImage;
      if (params.images !== undefined) updateData.images = params.images;
      if (params.tags !== undefined) updateData.tags = params.tags;

      const result = await this.db
        .update(places)
        .set(updateData)
        .where(eq(places.id, id))
        .returning();

      const place = result[0];
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      // Update business hours if provided
      if (params.businessHours !== undefined) {
        // Delete existing business hours
        await this.db
          .delete(placeBusinessHours)
          .where(eq(placeBusinessHours.placeId, id));

        // Insert new business hours
        if (params.businessHours.length > 0) {
          const businessHoursValues = params.businessHours.map((bh) => ({
            placeId: id,
            dayOfWeek: bh.dayOfWeek,
            openTime: bh.openTime,
            closeTime: bh.closeTime,
            isClosed: bh.isClosed,
          }));

          await this.db.insert(placeBusinessHours).values(businessHoursValues);
        }
      }

      // Get business hours
      const businessHours = await this._getBusinessHours(id);

      const placeData = {
        ...place,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        businessHours,
      };

      return validate(placeSchema, placeData).mapErr((error) => {
        return new PlaceRepositoryError("Invalid place data", error);
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to update place", error));
    }
  }

  async updateStatus(
    id: string,
    status: PlaceStatus,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .update(places)
        .set({ status })
        .where(eq(places.id, id))
        .returning();

      const place = result[0];
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      const businessHours = await this._getBusinessHours(id);

      const placeData = {
        ...place,
        coordinates: { latitude: place.latitude, longitude: place.longitude },
        businessHours,
      };

      return validate(placeSchema, placeData).mapErr((error) => {
        return new PlaceRepositoryError("Invalid place data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update place status", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db.delete(places).where(eq(places.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to delete place", error));
    }
  }

  async list(
    query: ListPlacesQuery,
    userId?: string,
  ): Promise<
    Result<{ items: PlaceWithStats[]; count: number }, PlaceRepositoryError>
  > {
    try {
      const { pagination, filter, sort } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        filter?.regionId ? eq(places.regionId, filter.regionId) : undefined,
        filter?.category ? eq(places.category, filter.category) : undefined,
        filter?.status ? eq(places.status, filter.status) : undefined,
        filter?.createdBy ? eq(places.createdBy, filter.createdBy) : undefined,
        filter?.keyword ? like(places.name, `%${filter.keyword}%`) : undefined,
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
          sql`${places.latitude} >= ${minLat} AND ${places.latitude} <= ${maxLat} AND ${places.longitude} >= ${minLng} AND ${places.longitude} <= ${maxLng}`,
        );
      }

      // Determine sort order
      const sortField = sort?.field || "createdAt";
      const sortDirection = sort?.direction || "desc";
      const orderBy = sortDirection === "asc" ? asc : desc;

      let sortColumn: PgColumn;
      switch (sortField) {
        case "name":
          sortColumn = places.name;
          break;
        case "updatedAt":
          sortColumn = places.updatedAt;
          break;
        case "visitCount":
          sortColumn = places.visitCount;
          break;
        case "favoriteCount":
          sortColumn = places.favoriteCount;
          break;
        case "checkinCount":
          sortColumn = places.checkinCount;
          break;
        default:
          sortColumn = places.createdAt;
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const [items, countResult] = await Promise.all([
        this.db
          .select({
            place: places,
            regionName: regions.name,
          })
          .from(places)
          .leftJoin(regions, eq(places.regionId, regions.id))
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(orderBy(sortColumn)),
        this.db.select({ count: count() }).from(places).where(whereCondition),
      ]);

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of items) {
        const businessHours = await this._getBusinessHours(item.place.id);

        let isFavorited = false;
        let hasEditPermission = false;
        let hasDeletePermission = false;

        if (userId) {
          const [favoriteResult, permissionResult] = await Promise.all([
            this.db
              .select()
              .from(placeFavorites)
              .where(
                and(
                  eq(placeFavorites.userId, userId),
                  eq(placeFavorites.placeId, item.place.id),
                ),
              )
              .limit(1),
            this.db
              .select()
              .from(placePermissions)
              .where(
                and(
                  eq(placePermissions.userId, userId),
                  eq(placePermissions.placeId, item.place.id),
                ),
              )
              .limit(1),
          ]);

          isFavorited = favoriteResult.length > 0;

          if (permissionResult.length > 0) {
            hasEditPermission = permissionResult[0].canEdit;
            hasDeletePermission = permissionResult[0].canDelete;
          }

          if (item.place.createdBy === userId) {
            hasEditPermission = true;
            hasDeletePermission = true;
          }
        }

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited,
          hasEditPermission,
          hasDeletePermission,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      // Apply accurate distance filtering if location filter was used
      let finalItems = placesWithStats;
      if (locationFilter) {
        finalItems = filterByDistance(
          placesWithStats,
          locationFilter.coordinates,
          locationFilter.radiusKm,
        );
      }

      return ok({
        items: finalItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to list places", error));
    }
  }

  async search(
    query: SearchPlacesQuery,
    userId?: string,
  ): Promise<
    Result<{ items: PlaceWithStats[]; count: number }, PlaceRepositoryError>
  > {
    try {
      const { pagination, keyword, regionId, category, location } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        eq(places.status, "published"),
        or(
          like(places.name, `%${keyword}%`),
          like(places.description, `%${keyword}%`),
        ),
      ];

      if (regionId) {
        filters.push(eq(places.regionId, regionId));
      }

      if (category) {
        filters.push(eq(places.category, category));
      }

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
          and(
            sql`${places.latitude} >= ${minLat}`,
            sql`${places.latitude} <= ${maxLat}`,
            sql`${places.longitude} >= ${minLng}`,
            sql`${places.longitude} <= ${maxLng}`,
          ),
        );
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const [items, countResult] = await Promise.all([
        this.db
          .select({
            place: places,
            regionName: regions.name,
          })
          .from(places)
          .leftJoin(regions, eq(places.regionId, regions.id))
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(places.visitCount), desc(places.favoriteCount)),
        this.db.select({ count: count() }).from(places).where(whereCondition),
      ]);

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of items) {
        const businessHours = await this._getBusinessHours(item.place.id);

        let isFavorited = false;
        let hasEditPermission = false;
        let hasDeletePermission = false;

        if (userId) {
          const [favoriteResult, permissionResult] = await Promise.all([
            this.db
              .select()
              .from(placeFavorites)
              .where(
                and(
                  eq(placeFavorites.userId, userId),
                  eq(placeFavorites.placeId, item.place.id),
                ),
              )
              .limit(1),
            this.db
              .select()
              .from(placePermissions)
              .where(
                and(
                  eq(placePermissions.userId, userId),
                  eq(placePermissions.placeId, item.place.id),
                ),
              )
              .limit(1),
          ]);

          isFavorited = favoriteResult.length > 0;

          if (permissionResult.length > 0) {
            hasEditPermission = permissionResult[0].canEdit;
            hasDeletePermission = permissionResult[0].canDelete;
          }

          if (item.place.createdBy === userId) {
            hasEditPermission = true;
            hasDeletePermission = true;
          }
        }

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited,
          hasEditPermission,
          hasDeletePermission,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      // Apply accurate distance filtering if location filter was used
      let finalItems = placesWithStats;
      if (searchLocationFilter) {
        finalItems = filterByDistance(
          placesWithStats,
          searchLocationFilter.coordinates,
          searchLocationFilter.radiusKm,
        );
      }

      return ok({
        items: finalItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to search places", error));
    }
  }

  async getByRegion(
    regionId: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      const items = await this.db
        .select({
          place: places,
          regionName: regions.name,
        })
        .from(places)
        .leftJoin(regions, eq(places.regionId, regions.id))
        .where(
          and(eq(places.regionId, regionId), eq(places.status, "published")),
        )
        .orderBy(desc(places.createdAt));

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of items) {
        const businessHours = await this._getBusinessHours(item.place.id);

        let isFavorited = false;
        let hasEditPermission = false;
        let hasDeletePermission = false;

        if (userId) {
          const [favoriteResult, permissionResult] = await Promise.all([
            this.db
              .select()
              .from(placeFavorites)
              .where(
                and(
                  eq(placeFavorites.userId, userId),
                  eq(placeFavorites.placeId, item.place.id),
                ),
              )
              .limit(1),
            this.db
              .select()
              .from(placePermissions)
              .where(
                and(
                  eq(placePermissions.userId, userId),
                  eq(placePermissions.placeId, item.place.id),
                ),
              )
              .limit(1),
          ]);

          isFavorited = favoriteResult.length > 0;

          if (permissionResult.length > 0) {
            hasEditPermission = permissionResult[0].canEdit;
            hasDeletePermission = permissionResult[0].canDelete;
          }

          if (item.place.createdBy === userId) {
            hasEditPermission = true;
            hasDeletePermission = true;
          }
        }

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited,
          hasEditPermission,
          hasDeletePermission,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      return ok(placesWithStats);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get places by region", error),
      );
    }
  }

  async getByCreator(
    createdBy: string,
    status?: PlaceStatus,
  ): Promise<Result<Place[], PlaceRepositoryError>> {
    try {
      const filters = [eq(places.createdBy, createdBy)];
      if (status) {
        filters.push(eq(places.status, status));
      }

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const items = await this.db
        .select()
        .from(places)
        .where(whereCondition)
        .orderBy(desc(places.createdAt));

      const validatedPlaces: Place[] = [];

      for (const item of items) {
        const businessHours = await this._getBusinessHours(item.id);

        const placeData = {
          ...item,
          coordinates: { latitude: item.latitude, longitude: item.longitude },
          businessHours,
        };

        const validated = validate(placeSchema, placeData);
        if (validated.isOk()) {
          validatedPlaces.push(validated.value);
        }
      }

      return ok(validatedPlaces);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get places by creator", error),
      );
    }
  }

  async getByPermission(
    userId: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      const items = await this.db
        .select({
          place: places,
          permission: placePermissions,
          regionName: regions.name,
        })
        .from(placePermissions)
        .innerJoin(places, eq(placePermissions.placeId, places.id))
        .leftJoin(regions, eq(places.regionId, regions.id))
        .where(eq(placePermissions.userId, userId))
        .orderBy(desc(places.createdAt));

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of items) {
        const businessHours = await this._getBusinessHours(item.place.id);

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited: false,
          hasEditPermission: item.permission.canEdit,
          hasDeletePermission: item.permission.canDelete,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      return ok(placesWithStats);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get places by permission", error),
      );
    }
  }

  async getMapLocations(regionId: string): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        coordinates: Coordinates;
        category: PlaceCategory;
      }>,
      PlaceRepositoryError
    >
  > {
    try {
      const items = await this.db
        .select({
          id: places.id,
          name: places.name,
          latitude: places.latitude,
          longitude: places.longitude,
          category: places.category,
        })
        .from(places)
        .where(
          and(eq(places.regionId, regionId), eq(places.status, "published")),
        );

      const locations = items.map((item) => ({
        id: item.id,
        name: item.name,
        coordinates: { latitude: item.latitude, longitude: item.longitude },
        category: item.category,
      }));

      return ok(locations);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get map locations", error),
      );
    }
  }

  async incrementVisitCount(
    id: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db
        .update(places)
        .set({
          visitCount: sql`${places.visitCount} + 1`,
        })
        .where(eq(places.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to increment visit count", error),
      );
    }
  }

  async updateCheckinCount(
    id: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db
        .update(places)
        .set({
          checkinCount: sql`${places.checkinCount} + 1`,
        })
        .where(eq(places.id, id));

      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update checkin count", error),
      );
    }
  }

  async updateRating(
    id: string,
    averageRating: number,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db
        .update(places)
        .set({ averageRating })
        .where(eq(places.id, id));

      return ok(undefined);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to update rating", error));
    }
  }

  async checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select({ createdBy: places.createdBy })
        .from(places)
        .where(eq(places.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      return ok(result[0].createdBy === userId);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to check ownership", error));
    }
  }

  async checkEditPermission(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>> {
    try {
      // Check if user is the creator
      const ownershipResult = await this.checkOwnership(id, userId);
      if (ownershipResult.isErr()) {
        return err(ownershipResult.error);
      }
      if (ownershipResult.value) {
        return ok(true);
      }

      // Check permissions
      const result = await this.db
        .select({ canEdit: placePermissions.canEdit })
        .from(placePermissions)
        .where(
          and(
            eq(placePermissions.placeId, id),
            eq(placePermissions.userId, userId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      return ok(result[0].canEdit);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to check edit permission", error),
      );
    }
  }

  async checkDeletePermission(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>> {
    try {
      // Check if user is the creator
      const ownershipResult = await this.checkOwnership(id, userId);
      if (ownershipResult.isErr()) {
        return err(ownershipResult.error);
      }
      if (ownershipResult.value) {
        return ok(true);
      }

      // Check permissions
      const result = await this.db
        .select({ canDelete: placePermissions.canDelete })
        .from(placePermissions)
        .where(
          and(
            eq(placePermissions.placeId, id),
            eq(placePermissions.userId, userId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      return ok(result[0].canDelete);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to check delete permission", error),
      );
    }
  }

  private async _getBusinessHours(placeId: string): Promise<BusinessHours[]> {
    try {
      const result = await this.db
        .select()
        .from(placeBusinessHours)
        .where(eq(placeBusinessHours.placeId, placeId))
        .orderBy(placeBusinessHours.dayOfWeek);

      return result.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        openTime: item.openTime || undefined,
        closeTime: item.closeTime || undefined,
        isClosed: item.isClosed,
      }));
    } catch (_error) {
      return [];
    }
  }
}

export class DrizzlePglitePlaceFavoriteRepository
  implements PlaceFavoriteRepository
{
  constructor(private readonly db: Database) {}

  async add(
    params: AddPlaceToFavoritesParams,
  ): Promise<Result<PlaceFavorite, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .insert(placeFavorites)
        .values({
          userId: params.userId,
          placeId: params.placeId,
        })
        .returning();

      const favorite = result[0];
      if (!favorite) {
        return err(
          new PlaceRepositoryError("Failed to add place to favorites"),
        );
      }

      // Update favorite count
      await this.updateFavoriteCount(params.placeId);

      return validate(placeFavoriteSchema, favorite).mapErr((error) => {
        return new PlaceRepositoryError("Invalid favorite data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to add place to favorites", error),
      );
    }
  }

  async remove(
    userId: string,
    placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db
        .delete(placeFavorites)
        .where(
          and(
            eq(placeFavorites.userId, userId),
            eq(placeFavorites.placeId, placeId),
          ),
        );

      // Update favorite count
      await this.updateFavoriteCount(placeId);

      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError(
          "Failed to remove place from favorites",
          error,
        ),
      );
    }
  }

  async findByUser(
    userId: string,
  ): Promise<Result<PlaceFavorite[], PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(placeFavorites)
        .where(eq(placeFavorites.userId, userId))
        .orderBy(desc(placeFavorites.createdAt));

      const validatedFavorites: PlaceFavorite[] = [];

      for (const item of result) {
        const validated = validate(placeFavoriteSchema, item);
        if (validated.isOk()) {
          validatedFavorites.push(validated.value);
        }
      }

      return ok(validatedFavorites);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to find favorites by user", error),
      );
    }
  }

  async findByUserAndPlace(
    userId: string,
    placeId: string,
  ): Promise<Result<PlaceFavorite | null, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(placeFavorites)
        .where(
          and(
            eq(placeFavorites.userId, userId),
            eq(placeFavorites.placeId, placeId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(placeFavoriteSchema, result[0]).mapErr((error) => {
        return new PlaceRepositoryError("Invalid favorite data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError(
          "Failed to find favorite by user and place",
          error,
        ),
      );
    }
  }

  async getPlacesWithFavorites(
    userId: string,
    limit?: number,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      const query = this.db
        .select({
          place: places,
          favorite: placeFavorites,
          regionName: regions.name,
        })
        .from(placeFavorites)
        .innerJoin(places, eq(placeFavorites.placeId, places.id))
        .leftJoin(regions, eq(places.regionId, regions.id))
        .where(eq(placeFavorites.userId, userId))
        .orderBy(desc(placeFavorites.createdAt));

      if (limit) {
        query.limit(limit);
      }

      const result = await query;

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of result) {
        const businessHours = await this._getBusinessHours(item.place.id);

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited: true,
          hasEditPermission: false,
          hasDeletePermission: false,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      return ok(placesWithStats);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get places with favorites", error),
      );
    }
  }

  async updateFavoriteCount(
    placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      const countResult = await this.db
        .select({ count: count() })
        .from(placeFavorites)
        .where(eq(placeFavorites.placeId, placeId));

      const favoriteCount = Number(countResult[0]?.count || 0);

      await this.db
        .update(places)
        .set({ favoriteCount })
        .where(eq(places.id, placeId));

      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update favorite count", error),
      );
    }
  }

  private async _getBusinessHours(placeId: string): Promise<BusinessHours[]> {
    try {
      const result = await this.db
        .select()
        .from(placeBusinessHours)
        .where(eq(placeBusinessHours.placeId, placeId))
        .orderBy(placeBusinessHours.dayOfWeek);

      return result.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        openTime: item.openTime || undefined,
        closeTime: item.closeTime || undefined,
        isClosed: item.isClosed,
      }));
    } catch (_error) {
      return [];
    }
  }
}

export class DrizzlePglitePlacePermissionRepository
  implements PlacePermissionRepository
{
  constructor(private readonly db: Database) {}

  async invite(
    invitedBy: string,
    params: InviteEditorParams,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>> {
    try {
      // Find user by email
      const userResult = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, params.email))
        .limit(1);

      if (userResult.length === 0) {
        return err(new PlaceRepositoryError("User not found"));
      }

      const userId = userResult[0].id;

      const result = await this.db
        .insert(placePermissions)
        .values({
          placeId: params.placeId,
          userId,
          canEdit: params.canEdit,
          canDelete: params.canDelete,
          invitedBy,
        })
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new PlaceRepositoryError("Failed to create permission"));
      }

      return validate(placePermissionSchema, permission).mapErr((error) => {
        return new PlaceRepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to invite editor", error));
    }
  }

  async accept(
    permissionId: string,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .update(placePermissions)
        .set({ acceptedAt: new Date() })
        .where(eq(placePermissions.id, permissionId))
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new PlaceRepositoryError("Permission not found"));
      }

      return validate(placePermissionSchema, permission).mapErr((error) => {
        return new PlaceRepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to accept permission", error),
      );
    }
  }

  async update(
    id: string,
    params: UpdatePermissionParams,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (params.canEdit !== undefined) updateData.canEdit = params.canEdit;
      if (params.canDelete !== undefined)
        updateData.canDelete = params.canDelete;

      const result = await this.db
        .update(placePermissions)
        .set(updateData)
        .where(eq(placePermissions.id, id))
        .returning();

      const permission = result[0];
      if (!permission) {
        return err(new PlaceRepositoryError("Permission not found"));
      }

      return validate(placePermissionSchema, permission).mapErr((error) => {
        return new PlaceRepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update permission", error),
      );
    }
  }

  async remove(id: string): Promise<Result<void, PlaceRepositoryError>> {
    try {
      await this.db.delete(placePermissions).where(eq(placePermissions.id, id));
      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to remove permission", error),
      );
    }
  }

  async findByPlace(
    placeId: string,
  ): Promise<Result<PlacePermission[], PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(placePermissions)
        .where(eq(placePermissions.placeId, placeId))
        .orderBy(desc(placePermissions.invitedAt));

      const validatedPermissions: PlacePermission[] = [];

      for (const item of result) {
        const validated = validate(placePermissionSchema, item);
        if (validated.isOk()) {
          validatedPermissions.push(validated.value);
        }
      }

      return ok(validatedPermissions);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to find permissions by place", error),
      );
    }
  }

  async findByUser(
    userId: string,
  ): Promise<Result<PlacePermission[], PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(placePermissions)
        .where(eq(placePermissions.userId, userId))
        .orderBy(desc(placePermissions.invitedAt));

      const validatedPermissions: PlacePermission[] = [];

      for (const item of result) {
        const validated = validate(placePermissionSchema, item);
        if (validated.isOk()) {
          validatedPermissions.push(validated.value);
        }
      }

      return ok(validatedPermissions);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to find permissions by user", error),
      );
    }
  }

  async findByUserAndPlace(
    userId: string,
    placeId: string,
  ): Promise<Result<PlacePermission | null, PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(placePermissions)
        .where(
          and(
            eq(placePermissions.userId, userId),
            eq(placePermissions.placeId, placeId),
          ),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(placePermissionSchema, result[0]).mapErr((error) => {
        return new PlaceRepositoryError("Invalid permission data", error);
      });
    } catch (error) {
      return err(
        new PlaceRepositoryError(
          "Failed to find permission by user and place",
          error,
        ),
      );
    }
  }

  async getSharedPlaces(
    userId: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      const result = await this.db
        .select({
          place: places,
          permission: placePermissions,
          regionName: regions.name,
        })
        .from(placePermissions)
        .innerJoin(places, eq(placePermissions.placeId, places.id))
        .leftJoin(regions, eq(places.regionId, regions.id))
        .where(eq(placePermissions.userId, userId))
        .orderBy(desc(places.createdAt));

      const placesWithStats: PlaceWithStats[] = [];

      for (const item of result) {
        const businessHours = await this._getBusinessHours(item.place.id);

        const placeWithStats = {
          ...item.place,
          coordinates: {
            latitude: item.place.latitude,
            longitude: item.place.longitude,
          },
          businessHours,
          isFavorited: false,
          hasEditPermission: item.permission.canEdit,
          hasDeletePermission: item.permission.canDelete,
          regionName: item.regionName,
        };

        const validated = validate(placeWithStatsSchema, placeWithStats);
        if (validated.isOk()) {
          placesWithStats.push(validated.value);
        }
      }

      return ok(placesWithStats);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get shared places", error),
      );
    }
  }

  private async _getBusinessHours(placeId: string): Promise<BusinessHours[]> {
    try {
      const result = await this.db
        .select()
        .from(placeBusinessHours)
        .where(eq(placeBusinessHours.placeId, placeId))
        .orderBy(placeBusinessHours.dayOfWeek);

      return result.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        openTime: item.openTime || undefined,
        closeTime: item.closeTime || undefined,
        isClosed: item.isClosed,
      }));
    } catch (_error) {
      return [];
    }
  }
}
