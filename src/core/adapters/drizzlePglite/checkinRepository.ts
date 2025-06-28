import { and, asc, count, desc, eq, exists, gte, lte, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  type CheckinPhotoRepository,
  type CheckinRepository,
  CheckinRepositoryError,
} from "@/core/domain/checkin/ports/checkinRepository";
import type {
  Checkin,
  CheckinPhoto,
  CheckinStats,
  CheckinStatus,
  CheckinWithDetails,
  CreateCheckinParams,
  ListCheckinsQuery,
  UpdateCheckinParams,
  UploadCheckinPhotosParams,
} from "@/core/domain/checkin/types";
import {
  checkinPhotoSchema,
  checkinSchema,
  checkinStatsSchema,
  checkinWithDetailsSchema,
} from "@/core/domain/checkin/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { checkinPhotos, checkins, places, regions, users } from "./schema";

export class DrizzlePgliteCheckinRepository implements CheckinRepository {
  constructor(private readonly db: Database) {}

  async create(
    userId: string,
    params: CreateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .insert(checkins)
        .values({
          userId,
          placeId: params.placeId,
          comment: params.comment,
          rating: params.rating,
          userLatitude: params.userLocation.latitude,
          userLongitude: params.userLocation.longitude,
          isPrivate: params.isPrivate,
        })
        .returning();

      const checkin = result[0];
      if (!checkin) {
        return err(new CheckinRepositoryError("Failed to create checkin"));
      }

      // Transform database result to domain model
      const checkinData = {
        ...checkin,
        userLocation:
          checkin.userLatitude && checkin.userLongitude
            ? {
                latitude: checkin.userLatitude,
                longitude: checkin.userLongitude,
              }
            : undefined,
        photos: [],
      };

      return validate(checkinSchema, checkinData).mapErr((error) => {
        return new CheckinRepositoryError("Invalid checkin data", error);
      });
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to create checkin", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<CheckinWithDetails | null, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .select({
          checkin: checkins,
          userName: users.name,
          userAvatar: users.avatar,
          placeName: places.name,
          placeAddress: places.address,
          placeLatitude: places.latitude,
          placeLongitude: places.longitude,
          regionName: regions.name,
        })
        .from(checkins)
        .innerJoin(users, eq(checkins.userId, users.id))
        .innerJoin(places, eq(checkins.placeId, places.id))
        .innerJoin(regions, eq(places.regionId, regions.id))
        .where(eq(checkins.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      const item = result[0];

      // Get photos for this checkin
      const photos = await this._getCheckinPhotos(id);

      // Calculate distance from place if user location is available
      let distanceFromPlace: number | undefined;
      if (item.checkin.userLatitude && item.checkin.userLongitude) {
        distanceFromPlace = this._calculateDistance(
          {
            latitude: item.checkin.userLatitude,
            longitude: item.checkin.userLongitude,
          },
          { latitude: item.placeLatitude, longitude: item.placeLongitude },
        );
      }

      const checkinWithDetails = {
        ...item.checkin,
        userLocation:
          item.checkin.userLatitude && item.checkin.userLongitude
            ? {
                latitude: item.checkin.userLatitude,
                longitude: item.checkin.userLongitude,
              }
            : undefined,
        photos: photos,
        userName: item.userName,
        userAvatar: item.userAvatar,
        placeName: item.placeName,
        placeRegionName: item.regionName,
        placeAddress: item.placeAddress,
        placeCoordinates: {
          latitude: item.placeLatitude,
          longitude: item.placeLongitude,
        },
        distanceFromPlace,
      };

      return validate(checkinWithDetailsSchema, checkinWithDetails).mapErr(
        (error) => {
          return new CheckinRepositoryError("Invalid checkin data", error);
        },
      );
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to find checkin by ID", error),
      );
    }
  }

  async update(
    id: string,
    params: UpdateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (params.comment !== undefined) updateData.comment = params.comment;
      if (params.rating !== undefined) updateData.rating = params.rating;
      if (params.isPrivate !== undefined)
        updateData.isPrivate = params.isPrivate;

      const result = await this.db
        .update(checkins)
        .set(updateData)
        .where(eq(checkins.id, id))
        .returning();

      const checkin = result[0];
      if (!checkin) {
        return err(new CheckinRepositoryError("Checkin not found"));
      }

      const checkinData = {
        ...checkin,
        userLocation:
          checkin.userLatitude && checkin.userLongitude
            ? {
                latitude: checkin.userLatitude,
                longitude: checkin.userLongitude,
              }
            : undefined,
        photos: [],
      };

      return validate(checkinSchema, checkinData).mapErr((error) => {
        return new CheckinRepositoryError("Invalid checkin data", error);
      });
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to update checkin", error));
    }
  }

  async updateStatus(
    id: string,
    status: CheckinStatus,
  ): Promise<Result<Checkin, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .update(checkins)
        .set({ status })
        .where(eq(checkins.id, id))
        .returning();

      const checkin = result[0];
      if (!checkin) {
        return err(new CheckinRepositoryError("Checkin not found"));
      }

      const checkinData = {
        ...checkin,
        userLocation:
          checkin.userLatitude && checkin.userLongitude
            ? {
                latitude: checkin.userLatitude,
                longitude: checkin.userLongitude,
              }
            : undefined,
        photos: [],
      };

      return validate(checkinSchema, checkinData).mapErr((error) => {
        return new CheckinRepositoryError("Invalid checkin data", error);
      });
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to update checkin status", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, CheckinRepositoryError>> {
    try {
      await this.db.delete(checkins).where(eq(checkins.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to delete checkin", error));
    }
  }

  async list(
    query: ListCheckinsQuery,
  ): Promise<
    Result<
      { items: CheckinWithDetails[]; count: number },
      CheckinRepositoryError
    >
  > {
    try {
      const { pagination, filter, sort } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        filter?.userId ? eq(checkins.userId, filter.userId) : undefined,
        filter?.placeId ? eq(checkins.placeId, filter.placeId) : undefined,
        filter?.status ? eq(checkins.status, filter.status) : undefined,
        filter?.hasRating ? sql`${checkins.rating} IS NOT NULL` : undefined,
        filter?.isPrivate !== undefined
          ? eq(checkins.isPrivate, filter.isPrivate)
          : undefined,
      ].filter((f) => f !== undefined);

      // Add region filter
      if (filter?.regionId) {
        filters.push(
          exists(
            this.db
              .select()
              .from(places)
              .where(
                and(
                  eq(places.id, checkins.placeId),
                  eq(places.regionId, filter.regionId),
                ),
              ),
          ),
        );
      }

      // Add photo filter
      if (filter?.hasPhotos) {
        filters.push(
          exists(
            this.db
              .select()
              .from(checkinPhotos)
              .where(eq(checkinPhotos.checkinId, checkins.id)),
          ),
        );
      }

      // Add date range filter
      if (filter?.dateRange) {
        filters.push(
          and(
            gte(checkins.createdAt, filter.dateRange.from),
            lte(checkins.createdAt, filter.dateRange.to),
          ),
        );
      }

      // Determine sort order
      const sortField = sort?.field || "createdAt";
      const sortDirection = sort?.direction || "desc";
      const orderBy = sortDirection === "asc" ? asc : desc;

      let sortColumn: any;
      switch (sortField) {
        case "rating":
          sortColumn = checkins.rating;
          break;
        case "updatedAt":
          sortColumn = checkins.updatedAt;
          break;
        default:
          sortColumn = checkins.createdAt;
      }

      const [items, countResult] = await Promise.all([
        this.db
          .select({
            checkin: checkins,
            userName: users.name,
            userAvatar: users.avatar,
            placeName: places.name,
            placeAddress: places.address,
            placeLatitude: places.latitude,
            placeLongitude: places.longitude,
            regionName: regions.name,
          })
          .from(checkins)
          .innerJoin(users, eq(checkins.userId, users.id))
          .innerJoin(places, eq(checkins.placeId, places.id))
          .innerJoin(regions, eq(places.regionId, regions.id))
          .where(and(...filters))
          .limit(limit)
          .offset(offset)
          .orderBy(orderBy(sortColumn)),
        this.db
          .select({ count: count() })
          .from(checkins)
          .where(and(...filters)),
      ]);

      const checkinsWithDetails: CheckinWithDetails[] = [];

      for (const item of items) {
        const photos = await this._getCheckinPhotos(item.checkin.id);

        let distanceFromPlace: number | undefined;
        if (item.checkin.userLatitude && item.checkin.userLongitude) {
          distanceFromPlace = this._calculateDistance(
            {
              latitude: item.checkin.userLatitude,
              longitude: item.checkin.userLongitude,
            },
            { latitude: item.placeLatitude, longitude: item.placeLongitude },
          );
        }

        const checkinWithDetails = {
          ...item.checkin,
          userLocation:
            item.checkin.userLatitude && item.checkin.userLongitude
              ? {
                  latitude: item.checkin.userLatitude,
                  longitude: item.checkin.userLongitude,
                }
              : undefined,
          photos: photos,
          userName: item.userName,
          userAvatar: item.userAvatar,
          placeName: item.placeName,
          placeRegionName: item.regionName,
          placeAddress: item.placeAddress,
          placeCoordinates: {
            latitude: item.placeLatitude,
            longitude: item.placeLongitude,
          },
          distanceFromPlace,
        };

        const validated = validate(
          checkinWithDetailsSchema,
          checkinWithDetails,
        );
        if (validated.isOk()) {
          checkinsWithDetails.push(validated.value);
        }
      }

      return ok({
        items: checkinsWithDetails,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to list checkins", error));
    }
  }

  async getByUser(
    userId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>> {
    try {
      const query = this.db
        .select({
          checkin: checkins,
          userName: users.name,
          userAvatar: users.avatar,
          placeName: places.name,
          placeAddress: places.address,
          placeLatitude: places.latitude,
          placeLongitude: places.longitude,
          regionName: regions.name,
        })
        .from(checkins)
        .innerJoin(users, eq(checkins.userId, users.id))
        .innerJoin(places, eq(checkins.placeId, places.id))
        .innerJoin(regions, eq(places.regionId, regions.id))
        .where(eq(checkins.userId, userId))
        .orderBy(desc(checkins.createdAt));

      if (limit) {
        query.limit(limit);
      }

      const items = await query;

      const checkinsWithDetails: CheckinWithDetails[] = [];

      for (const item of items) {
        const photos = await this._getCheckinPhotos(item.checkin.id);

        let distanceFromPlace: number | undefined;
        if (item.checkin.userLatitude && item.checkin.userLongitude) {
          distanceFromPlace = this._calculateDistance(
            {
              latitude: item.checkin.userLatitude,
              longitude: item.checkin.userLongitude,
            },
            { latitude: item.placeLatitude, longitude: item.placeLongitude },
          );
        }

        const checkinWithDetails = {
          ...item.checkin,
          userLocation:
            item.checkin.userLatitude && item.checkin.userLongitude
              ? {
                  latitude: item.checkin.userLatitude,
                  longitude: item.checkin.userLongitude,
                }
              : undefined,
          photos: photos,
          userName: item.userName,
          userAvatar: item.userAvatar,
          placeName: item.placeName,
          placeRegionName: item.regionName,
          placeAddress: item.placeAddress,
          placeCoordinates: {
            latitude: item.placeLatitude,
            longitude: item.placeLongitude,
          },
          distanceFromPlace,
        };

        const validated = validate(
          checkinWithDetailsSchema,
          checkinWithDetails,
        );
        if (validated.isOk()) {
          checkinsWithDetails.push(validated.value);
        }
      }

      return ok(checkinsWithDetails);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to get checkins by user", error),
      );
    }
  }

  async getByPlace(
    placeId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>> {
    try {
      const query = this.db
        .select({
          checkin: checkins,
          userName: users.name,
          userAvatar: users.avatar,
          placeName: places.name,
          placeAddress: places.address,
          placeLatitude: places.latitude,
          placeLongitude: places.longitude,
          regionName: regions.name,
        })
        .from(checkins)
        .innerJoin(users, eq(checkins.userId, users.id))
        .innerJoin(places, eq(checkins.placeId, places.id))
        .innerJoin(regions, eq(places.regionId, regions.id))
        .where(
          and(eq(checkins.placeId, placeId), eq(checkins.status, "active")),
        )
        .orderBy(desc(checkins.createdAt));

      if (limit) {
        query.limit(limit);
      }

      const items = await query;

      const checkinsWithDetails: CheckinWithDetails[] = [];

      for (const item of items) {
        const photos = await this._getCheckinPhotos(item.checkin.id);

        let distanceFromPlace: number | undefined;
        if (item.checkin.userLatitude && item.checkin.userLongitude) {
          distanceFromPlace = this._calculateDistance(
            {
              latitude: item.checkin.userLatitude,
              longitude: item.checkin.userLongitude,
            },
            { latitude: item.placeLatitude, longitude: item.placeLongitude },
          );
        }

        const checkinWithDetails = {
          ...item.checkin,
          userLocation:
            item.checkin.userLatitude && item.checkin.userLongitude
              ? {
                  latitude: item.checkin.userLatitude,
                  longitude: item.checkin.userLongitude,
                }
              : undefined,
          photos: photos,
          userName: item.userName,
          userAvatar: item.userAvatar,
          placeName: item.placeName,
          placeRegionName: item.regionName,
          placeAddress: item.placeAddress,
          placeCoordinates: {
            latitude: item.placeLatitude,
            longitude: item.placeLongitude,
          },
          distanceFromPlace,
        };

        const validated = validate(
          checkinWithDetailsSchema,
          checkinWithDetails,
        );
        if (validated.isOk()) {
          checkinsWithDetails.push(validated.value);
        }
      }

      return ok(checkinsWithDetails);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to get checkins by place", error),
      );
    }
  }

  async getRecentByUser(
    userId: string,
    limit = 10,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>> {
    return this.getByUser(userId, limit);
  }

  async getUserStats(
    userId: string,
  ): Promise<Result<CheckinStats, CheckinRepositoryError>> {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );

      const [
        totalCheckinsResult,
        checkinsThisMonthResult,
        uniquePlacesResult,
        uniqueRegionsResult,
        averageRatingResult,
        totalPhotosResult,
      ] = await Promise.all([
        // Total checkins
        this.db
          .select({ count: count() })
          .from(checkins)
          .where(eq(checkins.userId, userId)),

        // Checkins this month
        this.db
          .select({ count: count() })
          .from(checkins)
          .where(
            and(
              eq(checkins.userId, userId),
              gte(checkins.createdAt, startOfMonth),
            ),
          ),

        // Unique places
        this.db
          .select({ count: sql<number>`count(distinct ${checkins.placeId})` })
          .from(checkins)
          .where(eq(checkins.userId, userId)),

        // Unique regions
        this.db
          .select({ count: sql<number>`count(distinct ${places.regionId})` })
          .from(checkins)
          .innerJoin(places, eq(checkins.placeId, places.id))
          .where(eq(checkins.userId, userId)),

        // Average rating
        this.db
          .select({ avg: sql<number>`avg(${checkins.rating})` })
          .from(checkins)
          .where(
            and(
              eq(checkins.userId, userId),
              sql`${checkins.rating} IS NOT NULL`,
            ),
          ),

        // Total photos
        this.db
          .select({ count: count() })
          .from(checkinPhotos)
          .innerJoin(checkins, eq(checkinPhotos.checkinId, checkins.id))
          .where(eq(checkins.userId, userId)),
      ]);

      const stats = {
        totalCheckins: Number(totalCheckinsResult[0]?.count || 0),
        checkinsThisMonth: Number(checkinsThisMonthResult[0]?.count || 0),
        uniquePlaces: Number(uniquePlacesResult[0]?.count || 0),
        uniqueRegions: Number(uniqueRegionsResult[0]?.count || 0),
        averageRating: averageRatingResult[0]?.avg
          ? Number(averageRatingResult[0].avg)
          : undefined,
        totalPhotos: Number(totalPhotosResult[0]?.count || 0),
      };

      return validate(checkinStatsSchema, stats).mapErr((error) => {
        return new CheckinRepositoryError("Invalid stats data", error);
      });
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to get user stats", error));
    }
  }

  async getPlaceStats(
    placeId: string,
  ): Promise<
    Result<
      { checkinCount: number; averageRating: number },
      CheckinRepositoryError
    >
  > {
    try {
      const [checkinCountResult, averageRatingResult] = await Promise.all([
        this.db
          .select({ count: count() })
          .from(checkins)
          .where(
            and(eq(checkins.placeId, placeId), eq(checkins.status, "active")),
          ),

        this.db
          .select({ avg: sql<number>`avg(${checkins.rating})` })
          .from(checkins)
          .where(
            and(
              eq(checkins.placeId, placeId),
              eq(checkins.status, "active"),
              sql`${checkins.rating} IS NOT NULL`,
            ),
          ),
      ]);

      const stats = {
        checkinCount: Number(checkinCountResult[0]?.count || 0),
        averageRating: averageRatingResult[0]?.avg
          ? Number(averageRatingResult[0].avg)
          : 0,
      };

      return ok(stats);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to get place stats", error),
      );
    }
  }

  async checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .select({ userId: checkins.userId })
        .from(checkins)
        .where(eq(checkins.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(false);
      }

      return ok(result[0].userId === userId);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to check ownership", error),
      );
    }
  }

  async hasUserCheckedIn(
    userId: string,
    placeId: string,
  ): Promise<Result<boolean, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(checkins)
        .where(
          and(
            eq(checkins.userId, userId),
            eq(checkins.placeId, placeId),
            eq(checkins.status, "active"),
          ),
        );

      const checkinCount = Number(result[0]?.count || 0);
      return ok(checkinCount > 0);
    } catch (error) {
      return err(
        new CheckinRepositoryError(
          "Failed to check if user has checked in",
          error,
        ),
      );
    }
  }

  private async _getCheckinPhotos(checkinId: string): Promise<CheckinPhoto[]> {
    try {
      const result = await this.db
        .select()
        .from(checkinPhotos)
        .where(eq(checkinPhotos.checkinId, checkinId))
        .orderBy(asc(checkinPhotos.displayOrder));

      const validatedPhotos: CheckinPhoto[] = [];

      for (const item of result) {
        const validated = validate(checkinPhotoSchema, item);
        if (validated.isOk()) {
          validatedPhotos.push(validated.value);
        }
      }

      return validatedPhotos;
    } catch (_error) {
      return [];
    }
  }

  private _calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number },
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

export class DrizzlePgliteCheckinPhotoRepository
  implements CheckinPhotoRepository
{
  constructor(private readonly db: Database) {}

  async add(
    params: UploadCheckinPhotosParams,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>> {
    try {
      const photos: CheckinPhoto[] = [];

      for (let i = 0; i < params.photos.length; i++) {
        const photo = params.photos[i];
        const result = await this.db
          .insert(checkinPhotos)
          .values({
            checkinId: params.checkinId,
            url: photo.url,
            caption: photo.caption,
            displayOrder: i,
          })
          .returning();

        const insertedPhoto = result[0];
        if (insertedPhoto) {
          const validated = validate(checkinPhotoSchema, insertedPhoto);
          if (validated.isOk()) {
            photos.push(validated.value);
          }
        }
      }

      return ok(photos);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to add checkin photos", error),
      );
    }
  }

  async findByCheckin(
    checkinId: string,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(checkinPhotos)
        .where(eq(checkinPhotos.checkinId, checkinId))
        .orderBy(asc(checkinPhotos.displayOrder));

      const validatedPhotos: CheckinPhoto[] = [];

      for (const item of result) {
        const validated = validate(checkinPhotoSchema, item);
        if (validated.isOk()) {
          validatedPhotos.push(validated.value);
        }
      }

      return ok(validatedPhotos);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to find photos by checkin", error),
      );
    }
  }

  async findById(
    id: string,
  ): Promise<Result<CheckinPhoto | null, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(checkinPhotos)
        .where(eq(checkinPhotos.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(checkinPhotoSchema, result[0]).mapErr((error) => {
        return new CheckinRepositoryError("Invalid photo data", error);
      });
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to find photo by ID", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, CheckinRepositoryError>> {
    try {
      await this.db.delete(checkinPhotos).where(eq(checkinPhotos.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to delete photo", error));
    }
  }

  async deleteByCheckin(
    checkinId: string,
  ): Promise<Result<void, CheckinRepositoryError>> {
    try {
      await this.db
        .delete(checkinPhotos)
        .where(eq(checkinPhotos.checkinId, checkinId));
      return ok(undefined);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to delete photos by checkin", error),
      );
    }
  }

  async updateCaption(
    id: string,
    caption: string,
  ): Promise<Result<CheckinPhoto, CheckinRepositoryError>> {
    try {
      const result = await this.db
        .update(checkinPhotos)
        .set({ caption })
        .where(eq(checkinPhotos.id, id))
        .returning();

      const photo = result[0];
      if (!photo) {
        return err(new CheckinRepositoryError("Photo not found"));
      }

      return validate(checkinPhotoSchema, photo).mapErr((error) => {
        return new CheckinRepositoryError("Invalid photo data", error);
      });
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to update photo caption", error),
      );
    }
  }

  async reorderPhotos(
    checkinId: string,
    photoIds: string[],
  ): Promise<Result<void, CheckinRepositoryError>> {
    try {
      // Update display order for each photo
      for (let i = 0; i < photoIds.length; i++) {
        await this.db
          .update(checkinPhotos)
          .set({ displayOrder: i })
          .where(
            and(
              eq(checkinPhotos.id, photoIds[i]),
              eq(checkinPhotos.checkinId, checkinId),
            ),
          );
      }

      return ok(undefined);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to reorder photos", error));
    }
  }
}
