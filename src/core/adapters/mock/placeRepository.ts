import { err, ok, type Result } from "neverthrow";
import { v4 as uuidv4 } from "uuid";
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
  type PlaceFavoriteRepository,
  type PlacePermissionRepository,
  type PlaceRepository,
  PlaceRepositoryError,
} from "@/core/domain/place/ports/placeRepository";
import type {
  AddPlaceToFavoritesParams,
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
import type { Coordinates } from "@/core/domain/region/types";

export class MockPlaceRepository implements PlaceRepository {
  private places: Place[] = [];

  async create(
    createdBy: string,
    params: CreatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const now = new Date();
      const place: Place = {
        id: uuidv4(),
        name: params.name,
        description: params.description,
        shortDescription: params.shortDescription,
        category: params.category,
        regionId: params.regionId,
        coordinates: params.coordinates,
        address: params.address,
        phone: params.phone,
        website: params.website,
        email: params.email,
        status: "draft",
        createdBy,
        coverImage: params.coverImage,
        images: params.images || [],
        tags: params.tags || [],
        businessHours: params.businessHours || [],
        visitCount: 0,
        favoriteCount: 0,
        checkinCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      this.places.push(place);
      return ok(place);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to create place", error));
    }
  }

  async findById(
    id: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats | null, PlaceRepositoryError>> {
    try {
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return ok(null);
      }

      const placeWithStats: PlaceWithStats = {
        ...place,
        isFavorited: false,
        hasEditPermission: place.createdBy === userId,
        hasDeletePermission: place.createdBy === userId,
      };

      return ok(placeWithStats);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to find place", error));
    }
  }

  async update(
    id: string,
    params: UpdatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const placeIndex = this.places.findIndex((p) => p.id === id);
      if (placeIndex === -1) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      const updatedPlace = {
        ...this.places[placeIndex],
        ...params,
        updatedAt: new Date(),
      };

      this.places[placeIndex] = updatedPlace;
      return ok(updatedPlace);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to update place", error));
    }
  }

  async updateStatus(
    id: string,
    status: PlaceStatus,
  ): Promise<Result<Place, PlaceRepositoryError>> {
    try {
      const placeIndex = this.places.findIndex((p) => p.id === id);
      if (placeIndex === -1) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      this.places[placeIndex] = {
        ...this.places[placeIndex],
        status,
        updatedAt: new Date(),
      };

      return ok(this.places[placeIndex]);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update place status", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, PlaceRepositoryError>> {
    try {
      const placeIndex = this.places.findIndex((p) => p.id === id);
      if (placeIndex === -1) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      this.places.splice(placeIndex, 1);
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
      let filteredPlaces = [...this.places];

      if (query.filter?.regionId) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.regionId === query.filter?.regionId,
        );
      }

      if (query.filter?.category) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.category === query.filter?.category,
        );
      }

      if (query.filter?.status) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.status === query.filter?.status,
        );
      }

      if (query.filter?.createdBy) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.createdBy === query.filter?.createdBy,
        );
      }

      const items: PlaceWithStats[] = filteredPlaces.map((place) => ({
        ...place,
        isFavorited: false,
        hasEditPermission: place.createdBy === userId,
        hasDeletePermission: place.createdBy === userId,
      }));

      return ok({ items, count: items.length });
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
      let filteredPlaces = this.places.filter((place) =>
        place.name.toLowerCase().includes(query.keyword.toLowerCase()),
      );

      if (query.regionId) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.regionId === query.regionId,
        );
      }

      if (query.category) {
        filteredPlaces = filteredPlaces.filter(
          (p) => p.category === query.category,
        );
      }

      const items: PlaceWithStats[] = filteredPlaces.map((place) => ({
        ...place,
        isFavorited: false,
        hasEditPermission: place.createdBy === userId,
        hasDeletePermission: place.createdBy === userId,
      }));

      return ok({ items, count: items.length });
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to search places", error));
    }
  }

  async getByRegion(
    regionId: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      const filteredPlaces = this.places.filter((p) => p.regionId === regionId);
      const items: PlaceWithStats[] = filteredPlaces.map((place) => ({
        ...place,
        isFavorited: false,
        hasEditPermission: place.createdBy === userId,
        hasDeletePermission: place.createdBy === userId,
      }));

      return ok(items);
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
      let filteredPlaces = this.places.filter((p) => p.createdBy === createdBy);

      if (status) {
        filteredPlaces = filteredPlaces.filter((p) => p.status === status);
      }

      return ok(filteredPlaces);
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
      // For mock, just return places created by user
      const filteredPlaces = this.places.filter((p) => p.createdBy === userId);
      const items: PlaceWithStats[] = filteredPlaces.map((place) => ({
        ...place,
        isFavorited: false,
        hasEditPermission: true,
        hasDeletePermission: true,
      }));

      return ok(items);
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
      const filteredPlaces = this.places.filter((p) => p.regionId === regionId);
      const locations = filteredPlaces.map((place) => ({
        id: place.id,
        name: place.name,
        coordinates: place.coordinates,
        category: place.category,
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
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      place.visitCount += 1;
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
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      place.checkinCount += 1;
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
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      place.averageRating = averageRating;
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
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      return ok(place.createdBy === userId);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to check ownership", error));
    }
  }

  async checkEditPermission(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>> {
    try {
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      // For mock, owner always has edit permission
      return ok(place.createdBy === userId);
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
      const place = this.places.find((p) => p.id === id);
      if (!place) {
        return err(new PlaceRepositoryError("Place not found"));
      }

      // For mock, owner always has delete permission
      return ok(place.createdBy === userId);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to check delete permission", error),
      );
    }
  }

  reset(): void {
    this.places = [];
  }
}

export class MockPlaceFavoriteRepository implements PlaceFavoriteRepository {
  private favorites: PlaceFavorite[] = [];

  async add(
    params: AddPlaceToFavoritesParams,
  ): Promise<Result<PlaceFavorite, PlaceRepositoryError>> {
    try {
      const favorite: PlaceFavorite = {
        id: uuidv4(),
        userId: params.userId,
        placeId: params.placeId,
        createdAt: new Date(),
      };

      this.favorites.push(favorite);
      return ok(favorite);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to add favorite", error));
    }
  }

  async remove(
    userId: string,
    placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      const index = this.favorites.findIndex(
        (f) => f.userId === userId && f.placeId === placeId,
      );
      if (index === -1) {
        return err(new PlaceRepositoryError("Favorite not found"));
      }

      this.favorites.splice(index, 1);
      return ok(undefined);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to remove favorite", error));
    }
  }

  async findByUser(
    userId: string,
  ): Promise<Result<PlaceFavorite[], PlaceRepositoryError>> {
    try {
      const userFavorites = this.favorites.filter((f) => f.userId === userId);
      return ok(userFavorites);
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
      const favorite = this.favorites.find(
        (f) => f.userId === userId && f.placeId === placeId,
      );
      return ok(favorite || null);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to find favorite", error));
    }
  }

  async getPlacesWithFavorites(
    _userId: string,
    _limit?: number,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      // Mock implementation - just return empty array
      return ok([]);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get places with favorites", error),
      );
    }
  }

  async updateFavoriteCount(
    _placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>> {
    try {
      // Mock implementation - no-op
      return ok(undefined);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update favorite count", error),
      );
    }
  }

  reset(): void {
    this.favorites = [];
  }
}

export class MockPlacePermissionRepository
  implements PlacePermissionRepository
{
  private permissions: PlacePermission[] = [];

  async invite(
    invitedBy: string,
    params: InviteEditorParams,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>> {
    try {
      const permission: PlacePermission = {
        id: uuidv4(),
        placeId: params.placeId,
        userId: uuidv4(), // Mock user ID
        canEdit: params.canEdit,
        canDelete: params.canDelete,
        invitedBy,
        invitedAt: new Date(),
      };

      this.permissions.push(permission);
      return ok(permission);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to invite editor", error));
    }
  }

  async accept(
    permissionId: string,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>> {
    try {
      const permission = this.permissions.find((p) => p.id === permissionId);
      if (!permission) {
        return err(new PlaceRepositoryError("Permission not found"));
      }

      permission.acceptedAt = new Date();
      return ok(permission);
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
      const permission = this.permissions.find((p) => p.id === id);
      if (!permission) {
        return err(new PlaceRepositoryError("Permission not found"));
      }

      if (params.canEdit !== undefined) {
        permission.canEdit = params.canEdit;
      }
      if (params.canDelete !== undefined) {
        permission.canDelete = params.canDelete;
      }

      return ok(permission);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to update permission", error),
      );
    }
  }

  async remove(id: string): Promise<Result<void, PlaceRepositoryError>> {
    try {
      const index = this.permissions.findIndex((p) => p.id === id);
      if (index === -1) {
        return err(new PlaceRepositoryError("Permission not found"));
      }

      this.permissions.splice(index, 1);
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
      const placePermissions = this.permissions.filter(
        (p) => p.placeId === placeId,
      );
      return ok(placePermissions);
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
      const userPermissions = this.permissions.filter(
        (p) => p.userId === userId,
      );
      return ok(userPermissions);
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
      const permission = this.permissions.find(
        (p) => p.userId === userId && p.placeId === placeId,
      );
      return ok(permission || null);
    } catch (error) {
      return err(new PlaceRepositoryError("Failed to find permission", error));
    }
  }

  async getSharedPlaces(
    _userId: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>> {
    try {
      // Mock implementation - just return empty array
      return ok([]);
    } catch (error) {
      return err(
        new PlaceRepositoryError("Failed to get shared places", error),
      );
    }
  }

  reset(): void {
    this.permissions = [];
  }
}

export class MockCheckinRepository implements CheckinRepository {
  private checkins: CheckinWithDetails[] = [];

  async create(
    userId: string,
    params: CreateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>> {
    try {
      const now = new Date();
      const checkin: Checkin = {
        id: uuidv4(),
        userId,
        placeId: params.placeId,
        comment: params.comment,
        rating: params.rating,
        photos: [],
        userLocation: params.userLocation,
        status: "active",
        isPrivate: params.isPrivate || false,
        createdAt: now,
        updatedAt: now,
      };

      const checkinWithDetails: CheckinWithDetails = {
        ...checkin,
        userName: "Test User",
        placeName: "Test Place",
        placeRegionName: "Test Region",
        placeAddress: "Test Address",
        placeCoordinates: { latitude: 0, longitude: 0 },
        photos: [],
      };

      this.checkins.push(checkinWithDetails);
      return ok(checkin);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to create checkin", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<CheckinWithDetails | null, CheckinRepositoryError>> {
    try {
      const checkin = this.checkins.find((c) => c.id === id);
      return ok(checkin || null);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to find checkin", error));
    }
  }

  async update(
    id: string,
    params: UpdateCheckinParams,
  ): Promise<Result<Checkin, CheckinRepositoryError>> {
    try {
      const checkinIndex = this.checkins.findIndex((c) => c.id === id);
      if (checkinIndex === -1) {
        return err(new CheckinRepositoryError("Checkin not found"));
      }

      const updatedCheckin = {
        ...this.checkins[checkinIndex],
        ...params,
        updatedAt: new Date(),
      };

      this.checkins[checkinIndex] = updatedCheckin;

      // Return just the basic checkin data
      const {
        userName: _userName,
        placeName: _placeName,
        placeRegionName: _placeRegionName,
        placeAddress: _placeAddress,
        placeCoordinates: _placeCoordinates,
        distanceFromPlace: _distanceFromPlace,
        userAvatar: _userAvatar,
        photos: _photos,
        ...basicCheckin
      } = updatedCheckin;
      return ok({
        ...basicCheckin,
        photos: _photos?.map((p) => p.url) || [],
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
      const checkinIndex = this.checkins.findIndex((c) => c.id === id);
      if (checkinIndex === -1) {
        return err(new CheckinRepositoryError("Checkin not found"));
      }

      this.checkins[checkinIndex].status = status;
      this.checkins[checkinIndex].updatedAt = new Date();

      // Return just the basic checkin data
      const {
        userName: _userName,
        placeName: _placeName,
        placeRegionName: _placeRegionName,
        placeAddress: _placeAddress,
        placeCoordinates: _placeCoordinates,
        photos: _photos,
        distanceFromPlace: _distanceFromPlace,
        userAvatar: _userAvatar,
        ...basicCheckin
      } = this.checkins[checkinIndex];
      return ok({
        ...basicCheckin,
        photos: _photos?.map((p) => p.url) || [],
      });
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to update checkin status", error),
      );
    }
  }

  async delete(id: string): Promise<Result<void, CheckinRepositoryError>> {
    try {
      const checkinIndex = this.checkins.findIndex((c) => c.id === id);
      if (checkinIndex === -1) {
        return err(new CheckinRepositoryError("Checkin not found"));
      }

      this.checkins.splice(checkinIndex, 1);
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
      let filteredCheckins = [...this.checkins];

      if (query.filter?.userId) {
        filteredCheckins = filteredCheckins.filter(
          (c) => c.userId === query.filter?.userId,
        );
      }

      if (query.filter?.placeId) {
        filteredCheckins = filteredCheckins.filter(
          (c) => c.placeId === query.filter?.placeId,
        );
      }

      if (query.filter?.status) {
        filteredCheckins = filteredCheckins.filter(
          (c) => c.status === query.filter?.status,
        );
      }

      return ok({ items: filteredCheckins, count: filteredCheckins.length });
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to list checkins", error));
    }
  }

  async getByUser(
    userId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>> {
    try {
      let filteredCheckins = this.checkins.filter((c) => c.userId === userId);
      if (limit) {
        filteredCheckins = filteredCheckins.slice(0, limit);
      }
      return ok(filteredCheckins);
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
      let filteredCheckins = this.checkins.filter((c) => c.placeId === placeId);
      if (limit) {
        filteredCheckins = filteredCheckins.slice(0, limit);
      }
      return ok(filteredCheckins);
    } catch (error) {
      return err(
        new CheckinRepositoryError("Failed to get checkins by place", error),
      );
    }
  }

  async getRecentByUser(
    userId: string,
    limit?: number,
  ): Promise<Result<CheckinWithDetails[], CheckinRepositoryError>> {
    try {
      let filteredCheckins = this.checkins
        .filter((c) => c.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (limit) {
        filteredCheckins = filteredCheckins.slice(0, limit);
      }
      return ok(filteredCheckins);
    } catch (error) {
      return err(
        new CheckinRepositoryError(
          "Failed to get recent checkins by user",
          error,
        ),
      );
    }
  }

  async getUserStats(
    userId: string,
  ): Promise<Result<CheckinStats, CheckinRepositoryError>> {
    try {
      const userCheckins = this.checkins.filter((c) => c.userId === userId);
      const stats: CheckinStats = {
        totalCheckins: userCheckins.length,
        checkinsThisMonth: 0, // Mock implementation
        uniquePlaces: new Set(userCheckins.map((c) => c.placeId)).size,
        uniqueRegions: 0, // Mock implementation
        totalPhotos: userCheckins.reduce(
          (total, c) => total + c.photos.length,
          0,
        ),
      };
      return ok(stats);
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
      const placeCheckins = this.checkins.filter((c) => c.placeId === placeId);
      const ratingsWithValues = placeCheckins.filter(
        (c) => c.rating !== undefined,
      );
      const averageRating =
        ratingsWithValues.length > 0
          ? ratingsWithValues.reduce((total, c) => total + (c.rating || 0), 0) /
            ratingsWithValues.length
          : 0;

      return ok({
        checkinCount: placeCheckins.length,
        averageRating,
      });
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
      const checkin = this.checkins.find((c) => c.id === id);
      return ok(checkin ? checkin.userId === userId : false);
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
      const hasCheckedIn = this.checkins.some(
        (c) => c.userId === userId && c.placeId === placeId,
      );
      return ok(hasCheckedIn);
    } catch (error) {
      return err(
        new CheckinRepositoryError(
          "Failed to check if user has checked in",
          error,
        ),
      );
    }
  }

  // Add a method to set up test checkins
  addTestCheckin(checkin: CheckinWithDetails): void {
    this.checkins.push(checkin);
  }

  reset(): void {
    this.checkins = [];
  }
}

export class MockCheckinPhotoRepository implements CheckinPhotoRepository {
  private photos: CheckinPhoto[] = [];

  async add(
    params: UploadCheckinPhotosParams,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>> {
    try {
      const newPhotos: CheckinPhoto[] = params.photos.map((photo, index) => ({
        id: uuidv4(),
        checkinId: params.checkinId,
        url: photo.url,
        caption: photo.caption,
        displayOrder: index,
        createdAt: new Date(),
      }));

      this.photos.push(...newPhotos);
      return ok(newPhotos);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to add photos", error));
    }
  }

  async findByCheckin(
    checkinId: string,
  ): Promise<Result<CheckinPhoto[], CheckinRepositoryError>> {
    try {
      const checkinPhotos = this.photos.filter(
        (p) => p.checkinId === checkinId,
      );
      return ok(checkinPhotos);
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
      const photo = this.photos.find((p) => p.id === id);
      return ok(photo || null);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to find photo", error));
    }
  }

  async delete(id: string): Promise<Result<void, CheckinRepositoryError>> {
    try {
      const photoIndex = this.photos.findIndex((p) => p.id === id);
      if (photoIndex === -1) {
        return err(new CheckinRepositoryError("Photo not found"));
      }

      this.photos.splice(photoIndex, 1);
      return ok(undefined);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to delete photo", error));
    }
  }

  async deleteByCheckin(
    checkinId: string,
  ): Promise<Result<void, CheckinRepositoryError>> {
    try {
      this.photos = this.photos.filter((p) => p.checkinId !== checkinId);
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
      const photo = this.photos.find((p) => p.id === id);
      if (!photo) {
        return err(new CheckinRepositoryError("Photo not found"));
      }

      photo.caption = caption;
      return ok(photo);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to update caption", error));
    }
  }

  async reorderPhotos(
    checkinId: string,
    photoIds: string[],
  ): Promise<Result<void, CheckinRepositoryError>> {
    try {
      const checkinPhotos = this.photos.filter(
        (p) => p.checkinId === checkinId,
      );

      for (let i = 0; i < photoIds.length; i++) {
        const photo = checkinPhotos.find((p) => p.id === photoIds[i]);
        if (photo) {
          photo.displayOrder = i;
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(new CheckinRepositoryError("Failed to reorder photos", error));
    }
  }

  reset(): void {
    this.photos = [];
  }
}
