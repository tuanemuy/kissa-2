import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
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

export class MockRegionRepository implements RegionRepository {
  private regions = new Map<string, Region>();

  constructor(initialRegions: Region[] = []) {
    for (const region of initialRegions) {
      this.regions.set(region.id, region);
    }
  }

  reset(): void {
    this.regions.clear();
  }

  addRegion(region: Region): void {
    this.regions.set(region.id, region);
  }

  async create(
    createdBy: string,
    params: CreateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>> {
    const region: Region = {
      id: uuidv7(),
      name: params.name,
      description: params.description,
      shortDescription: params.shortDescription,
      coordinates: params.coordinates,
      address: params.address,
      status: "draft",
      createdBy,
      coverImage: params.coverImage,
      images: params.images || [],
      tags: params.tags || [],
      visitCount: 0,
      favoriteCount: 0,
      placeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.regions.set(region.id, region);
    return ok(region);
  }

  async findById(
    id: string,
    _userId?: string,
  ): Promise<Result<RegionWithStats | null, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return ok(null);
    }

    const regionWithStats: RegionWithStats = {
      ...region,
      isFavorited: false, // TODO: Implement with favorites mock
      isPinned: false, // TODO: Implement with pins mock
      pinDisplayOrder: undefined,
    };

    return ok(regionWithStats);
  }

  async update(
    id: string,
    params: UpdateRegionParams,
  ): Promise<Result<Region, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return err(new RegionRepositoryError("Region not found"));
    }

    const updatedRegion: Region = {
      ...region,
      ...params,
      updatedAt: new Date(),
    };

    this.regions.set(id, updatedRegion);
    return ok(updatedRegion);
  }

  async updateStatus(
    id: string,
    status: RegionStatus,
  ): Promise<Result<Region, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return err(new RegionRepositoryError("Region not found"));
    }

    const updatedRegion: Region = {
      ...region,
      status,
      updatedAt: new Date(),
    };

    this.regions.set(id, updatedRegion);
    return ok(updatedRegion);
  }

  async delete(id: string): Promise<Result<void, RegionRepositoryError>> {
    if (!this.regions.has(id)) {
      return err(new RegionRepositoryError("Region not found"));
    }

    this.regions.delete(id);
    return ok(undefined);
  }

  async list(
    query: ListRegionsQuery,
    _userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  > {
    let regions = Array.from(this.regions.values());

    // Apply filters
    if (query.filter) {
      if (query.filter.status) {
        regions = regions.filter((r) => r.status === query.filter?.status);
      }
      if (query.filter.createdBy) {
        regions = regions.filter(
          (r) => r.createdBy === query.filter?.createdBy,
        );
      }
      if (query.filter.keyword) {
        const keyword = query.filter.keyword.toLowerCase();
        regions = regions.filter(
          (r) =>
            r.name.toLowerCase().includes(keyword) ||
            r.description?.toLowerCase().includes(keyword) ||
            r.shortDescription?.toLowerCase().includes(keyword),
        );
      }
      if (query.filter.tags && query.filter.tags.length > 0) {
        regions = regions.filter((r) =>
          query.filter?.tags?.some((tag) => r.tags.includes(tag)),
        );
      }
    }

    // Apply sorting
    if (query.sort) {
      const { field, direction } = query.sort;
      regions.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (field) {
          case "name":
            aValue = a.name;
            bValue = b.name;
            break;
          case "createdAt":
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
            break;
          case "updatedAt":
            aValue = a.updatedAt.getTime();
            bValue = b.updatedAt.getTime();
            break;
          case "visitCount":
            aValue = a.visitCount;
            bValue = b.visitCount;
            break;
          case "favoriteCount":
            aValue = a.favoriteCount;
            bValue = b.favoriteCount;
            break;
          default:
            aValue = a.createdAt.getTime();
            bValue = b.createdAt.getTime();
        }

        if (direction === "desc") {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      });
    }

    const count = regions.length;
    const { page, limit } = query.pagination;
    const offset = (page - 1) * limit;
    const items = regions.slice(offset, offset + limit).map((region) => ({
      ...region,
      isFavorited: false,
      isPinned: false,
      pinDisplayOrder: undefined,
    }));

    return ok({ items, count });
  }

  async search(
    query: SearchRegionsQuery,
    _userId?: string,
  ): Promise<
    Result<{ items: RegionWithStats[]; count: number }, RegionRepositoryError>
  > {
    let regions = Array.from(this.regions.values());

    // Filter by keyword
    const keyword = query.keyword.toLowerCase();
    regions = regions.filter(
      (r) =>
        r.name.toLowerCase().includes(keyword) ||
        r.description?.toLowerCase().includes(keyword) ||
        r.shortDescription?.toLowerCase().includes(keyword) ||
        r.tags.some((tag) => tag.toLowerCase().includes(keyword)),
    );

    // TODO: Implement location-based filtering if needed

    const count = regions.length;
    const { page, limit } = query.pagination;
    const offset = (page - 1) * limit;
    const items = regions.slice(offset, offset + limit).map((region) => ({
      ...region,
      isFavorited: false,
      isPinned: false,
      pinDisplayOrder: undefined,
    }));

    return ok({ items, count });
  }

  async getFeatured(
    limit: number,
    _userId?: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    const regions = Array.from(this.regions.values())
      .filter((r) => r.status === "published")
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit)
      .map((region) => ({
        ...region,
        isFavorited: false,
        isPinned: false,
        pinDisplayOrder: undefined,
      }));

    return ok(regions);
  }

  async getByCreator(
    createdBy: string,
    status?: RegionStatus,
  ): Promise<Result<Region[], RegionRepositoryError>> {
    let regions = Array.from(this.regions.values()).filter(
      (r) => r.createdBy === createdBy,
    );

    if (status) {
      regions = regions.filter((r) => r.status === status);
    }

    return ok(regions);
  }

  async incrementVisitCount(
    id: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return err(new RegionRepositoryError("Region not found"));
    }

    const updatedRegion: Region = {
      ...region,
      visitCount: region.visitCount + 1,
      updatedAt: new Date(),
    };

    this.regions.set(id, updatedRegion);
    return ok(undefined);
  }

  async updatePlaceCount(
    id: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return err(new RegionRepositoryError("Region not found"));
    }

    // In a real implementation, this would count places in the region
    const updatedRegion: Region = {
      ...region,
      placeCount: region.placeCount + 1,
      updatedAt: new Date(),
    };

    this.regions.set(id, updatedRegion);
    return ok(undefined);
  }

  async checkOwnership(
    id: string,
    userId: string,
  ): Promise<Result<boolean, RegionRepositoryError>> {
    const region = this.regions.get(id);
    if (!region) {
      return ok(false);
    }

    return ok(region.createdBy === userId);
  }
}

export class MockRegionFavoriteRepository implements RegionFavoriteRepository {
  private favorites = new Map<string, RegionFavorite>();

  constructor(initialFavorites: RegionFavorite[] = []) {
    for (const favorite of initialFavorites) {
      this.favorites.set(favorite.id, favorite);
    }
  }

  reset(): void {
    this.favorites.clear();
  }

  async add(
    params: AddRegionToFavoritesParams,
  ): Promise<Result<RegionFavorite, RegionRepositoryError>> {
    // Check if already exists
    const existing = Array.from(this.favorites.values()).find(
      (f) => f.userId === params.userId && f.regionId === params.regionId,
    );

    if (existing) {
      return err(new RegionRepositoryError("Region already favorited"));
    }

    const favorite: RegionFavorite = {
      id: uuidv7(),
      userId: params.userId,
      regionId: params.regionId,
      createdAt: new Date(),
    };

    this.favorites.set(favorite.id, favorite);
    return ok(favorite);
  }

  async remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    const favorite = Array.from(this.favorites.values()).find(
      (f) => f.userId === userId && f.regionId === regionId,
    );

    if (!favorite) {
      return err(new RegionRepositoryError("Favorite not found"));
    }

    this.favorites.delete(favorite.id);
    return ok(undefined);
  }

  async findByUser(
    userId: string,
  ): Promise<Result<RegionFavorite[], RegionRepositoryError>> {
    const favorites = Array.from(this.favorites.values()).filter(
      (f) => f.userId === userId,
    );

    return ok(favorites);
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionFavorite | null, RegionRepositoryError>> {
    const favorite = Array.from(this.favorites.values()).find(
      (f) => f.userId === userId && f.regionId === regionId,
    );

    return ok(favorite || null);
  }

  async getRegionsWithFavorites(
    _userId: string,
    _limit?: number,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    // This would typically join with regions table
    // For mock, return empty array
    return ok([]);
  }

  async updateFavoriteCount(
    _regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    // In real implementation, this would update the region's favorite count
    return ok(undefined);
  }
}

export class MockRegionPinRepository implements RegionPinRepository {
  private pins = new Map<string, RegionPin>();

  constructor(initialPins: RegionPin[] = []) {
    for (const pin of initialPins) {
      this.pins.set(pin.id, pin);
    }
  }

  reset(): void {
    this.pins.clear();
  }

  async add(
    params: PinRegionParams,
  ): Promise<Result<RegionPin, RegionRepositoryError>> {
    // Check if already exists
    const existing = Array.from(this.pins.values()).find(
      (p) => p.userId === params.userId && p.regionId === params.regionId,
    );

    if (existing) {
      return err(new RegionRepositoryError("Region already pinned"));
    }

    // Get next display order
    const maxOrderResult = await this.getMaxDisplayOrder(params.userId);
    const displayOrder =
      params.displayOrder ||
      (maxOrderResult.isOk() ? maxOrderResult.value + 1 : 0);

    const pin: RegionPin = {
      id: uuidv7(),
      userId: params.userId,
      regionId: params.regionId,
      displayOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.pins.set(pin.id, pin);
    return ok(pin);
  }

  async remove(
    userId: string,
    regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    const pin = Array.from(this.pins.values()).find(
      (p) => p.userId === userId && p.regionId === regionId,
    );

    if (!pin) {
      return err(new RegionRepositoryError("Pin not found"));
    }

    this.pins.delete(pin.id);
    return ok(undefined);
  }

  async findByUser(
    userId: string,
  ): Promise<Result<RegionPin[], RegionRepositoryError>> {
    const pins = Array.from(this.pins.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return ok(pins);
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionPin | null, RegionRepositoryError>> {
    const pin = Array.from(this.pins.values()).find(
      (p) => p.userId === userId && p.regionId === regionId,
    );

    return ok(pin || null);
  }

  async reorder(
    params: ReorderPinnedRegionsParams,
  ): Promise<Result<void, RegionRepositoryError>> {
    const userPins = Array.from(this.pins.values()).filter(
      (p) => p.userId === params.userId,
    );

    // Update display orders based on the new order
    for (let i = 0; i < params.regionIds.length; i++) {
      const regionId = params.regionIds[i];
      const pin = userPins.find((p) => p.regionId === regionId);

      if (pin) {
        const updatedPin: RegionPin = {
          ...pin,
          displayOrder: i,
          updatedAt: new Date(),
        };
        this.pins.set(pin.id, updatedPin);
      }
    }

    return ok(undefined);
  }

  async getRegionsWithPins(
    _userId: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    // This would typically join with regions table
    // For mock, return empty array
    return ok([]);
  }

  async getMaxDisplayOrder(
    userId: string,
  ): Promise<Result<number, RegionRepositoryError>> {
    const userPins = Array.from(this.pins.values()).filter(
      (p) => p.userId === userId,
    );

    const maxOrder = userPins.reduce(
      (max, pin) => Math.max(max, pin.displayOrder),
      -1,
    );

    return ok(maxOrder);
  }
}
