import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import type { Coordinates } from "../../region/types";
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
} from "../types";

export class PlaceRepositoryError extends AnyError {
  override readonly name = "PlaceRepositoryError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export interface PlaceRepository {
  create(
    createdBy: string,
    params: CreatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>>;

  findById(
    id: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats | null, PlaceRepositoryError>>;

  update(
    id: string,
    params: UpdatePlaceParams,
  ): Promise<Result<Place, PlaceRepositoryError>>;

  updateStatus(
    id: string,
    status: PlaceStatus,
  ): Promise<Result<Place, PlaceRepositoryError>>;

  delete(id: string): Promise<Result<void, PlaceRepositoryError>>;

  list(
    query: ListPlacesQuery,
    userId?: string,
  ): Promise<
    Result<{ items: PlaceWithStats[]; count: number }, PlaceRepositoryError>
  >;

  search(
    query: SearchPlacesQuery,
    userId?: string,
  ): Promise<
    Result<{ items: PlaceWithStats[]; count: number }, PlaceRepositoryError>
  >;

  getByRegion(
    regionId: string,
    userId?: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>>;

  getByCreator(
    createdBy: string,
    status?: PlaceStatus,
  ): Promise<Result<Place[], PlaceRepositoryError>>;

  getByPermission(
    userId: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>>;

  getMapLocations(regionId: string): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        coordinates: Coordinates;
        category: PlaceCategory;
      }>,
      PlaceRepositoryError
    >
  >;

  incrementVisitCount(id: string): Promise<Result<void, PlaceRepositoryError>>;

  updateCheckinCount(id: string): Promise<Result<void, PlaceRepositoryError>>;

  updateRating(
    id: string,
    averageRating: number,
  ): Promise<Result<void, PlaceRepositoryError>>;

  checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>>;

  checkEditPermission(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>>;

  checkDeletePermission(
    id: string,
    userId: string,
  ): Promise<Result<boolean, PlaceRepositoryError>>;
}

export interface PlaceFavoriteRepository {
  add(
    params: AddPlaceToFavoritesParams,
  ): Promise<Result<PlaceFavorite, PlaceRepositoryError>>;

  remove(
    userId: string,
    placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>>;

  findByUser(
    userId: string,
  ): Promise<Result<PlaceFavorite[], PlaceRepositoryError>>;

  findByUserAndPlace(
    userId: string,
    placeId: string,
  ): Promise<Result<PlaceFavorite | null, PlaceRepositoryError>>;

  getPlacesWithFavorites(
    userId: string,
    limit?: number,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>>;

  updateFavoriteCount(
    placeId: string,
  ): Promise<Result<void, PlaceRepositoryError>>;
}

export interface PlacePermissionRepository {
  invite(
    invitedBy: string,
    params: InviteEditorParams,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>>;

  accept(
    permissionId: string,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>>;

  update(
    id: string,
    params: UpdatePermissionParams,
  ): Promise<Result<PlacePermission, PlaceRepositoryError>>;

  remove(id: string): Promise<Result<void, PlaceRepositoryError>>;

  findByPlace(
    placeId: string,
  ): Promise<Result<PlacePermission[], PlaceRepositoryError>>;

  findByUser(
    userId: string,
  ): Promise<Result<PlacePermission[], PlaceRepositoryError>>;

  findByUserAndPlace(
    userId: string,
    placeId: string,
  ): Promise<Result<PlacePermission | null, PlaceRepositoryError>>;

  getSharedPlaces(
    userId: string,
  ): Promise<Result<PlaceWithStats[], PlaceRepositoryError>>;
}
