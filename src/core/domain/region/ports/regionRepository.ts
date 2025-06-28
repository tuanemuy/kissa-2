import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
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
} from "../types";

export class RegionRepositoryError extends AnyError {
  override readonly name = "RegionRepositoryError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

export interface RegionRepository {
  create(
    createdBy: string,
    params: CreateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>>;

  findById(
    id: string,
    userId?: string,
  ): Promise<Result<RegionWithStats | null, RegionRepositoryError>>;

  update(
    id: string,
    params: UpdateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>>;

  updateStatus(
    id: string,
    status: RegionStatus,
  ): Promise<Result<Region, RegionRepositoryError>>;

  delete(id: string): Promise<Result<void, RegionRepositoryError>>;

  list(
    query: ListRegionsQuery,
    userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  >;

  search(
    query: SearchRegionsQuery,
    userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  >;

  getFeatured(
    limit: number,
    userId?: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>>;

  getByCreator(
    createdBy: string,
    status?: RegionStatus,
  ): Promise<Result<Region[], RegionRepositoryError>>;

  incrementVisitCount(id: string): Promise<Result<void, RegionRepositoryError>>;

  updatePlaceCount(id: string): Promise<Result<void, RegionRepositoryError>>;

  checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, RegionRepositoryError>>;
}

export interface RegionFavoriteRepository {
  add(
    params: AddRegionToFavoritesParams,
  ): Promise<Result<RegionFavorite, RegionRepositoryError>>;

  remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>>;

  findByUser(
    userId: string,
  ): Promise<Result<RegionFavorite[], RegionRepositoryError>>;

  findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionFavorite | null, RegionRepositoryError>>;

  getRegionsWithFavorites(
    userId: string,
    limit?: number,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>>;

  updateFavoriteCount(
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>>;
}

export interface RegionPinRepository {
  add(
    params: PinRegionParams,
  ): Promise<Result<RegionPin, RegionRepositoryError>>;

  remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>>;

  findByUser(
    userId: string,
  ): Promise<Result<RegionPin[], RegionRepositoryError>>;

  findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionPin | null, RegionRepositoryError>>;

  reorder(
    params: ReorderPinnedRegionsParams,
  ): Promise<Result<void, RegionRepositoryError>>;

  getRegionsWithPins(
    userId: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>>;

  getMaxDisplayOrder(
    userId: string,
  ): Promise<Result<number, RegionRepositoryError>>;
}
