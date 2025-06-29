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
  private shouldFailDelete = false;
  private shouldThrowError = false;
  private shouldFailList = false;
  private shouldFailFeatured = false;
  private shouldFailGetByCreator = false;
  private shouldFailUpdate = false;
  private shouldFailSearch = false;
  private shouldFailFindById = false;

  constructor(initialRegions: Region[] = []) {
    for (const region of initialRegions) {
      this.regions.set(region.id, region);
    }
  }

  reset(): void {
    this.regions.clear();
    this.shouldFailDelete = false;
    this.shouldThrowError = false;
    this.shouldFailList = false;
    this.shouldFailFeatured = false;
    this.shouldFailGetByCreator = false;
    this.shouldFailUpdate = false;
    this.shouldFailSearch = false;
    this.shouldFailFindById = false;
  }

  setShouldFailDelete(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail;
  }

  setShouldThrowError(shouldThrow: boolean): void {
    this.shouldThrowError = shouldThrow;
  }

  setShouldFailList(shouldFail: boolean): void {
    this.shouldFailList = shouldFail;
  }

  setShouldFailFeatured(shouldFail: boolean): void {
    this.shouldFailFeatured = shouldFail;
  }

  setShouldFailGetByCreator(shouldFail: boolean): void {
    this.shouldFailGetByCreator = shouldFail;
  }

  setShouldFailUpdate(shouldFail: boolean): void {
    this.shouldFailUpdate = shouldFail;
  }

  setShouldFailSearch(shouldFail: boolean): void {
    this.shouldFailSearch = shouldFail;
  }

  setShouldFailFindById(shouldFail: boolean): void {
    this.shouldFailFindById = shouldFail;
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
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailFindById) {
      return err(new RegionRepositoryError("Failed to find region by ID"));
    }

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
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailUpdate) {
      return err(new RegionRepositoryError("Failed to update region"));
    }

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
    if (this.shouldFailDelete) {
      return err(new RegionRepositoryError("Failed to delete region"));
    }

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
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailList) {
      return err(new RegionRepositoryError("Failed to list regions"));
    }

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
            r.shortDescription?.toLowerCase().includes(keyword) ||
            r.address?.toLowerCase().includes(keyword),
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
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailSearch) {
      return err(new RegionRepositoryError("Failed to search regions"));
    }

    let regions = Array.from(this.regions.values());

    // Filter by keyword (skip filtering for wildcard searches)
    if (query.keyword && query.keyword !== "*") {
      const keyword = query.keyword.toLowerCase();
      regions = regions.filter(
        (r) =>
          r.name.toLowerCase().includes(keyword) ||
          r.description?.toLowerCase().includes(keyword) ||
          r.shortDescription?.toLowerCase().includes(keyword) ||
          r.tags.some((tag) => tag.toLowerCase().includes(keyword)),
      );
    }

    // Simple location-based filtering (basic distance check)
    if (query.location) {
      const targetLat = query.location.coordinates.latitude;
      const targetLng = query.location.coordinates.longitude;
      const radiusKm = query.location.radiusKm;

      regions = regions.filter((region) => {
        if (!region.coordinates) return false;

        // Simple distance calculation (Haversine formula approximation)
        const lat1 = (targetLat * Math.PI) / 180;
        const lat2 = (region.coordinates.latitude * Math.PI) / 180;
        const deltaLat =
          ((region.coordinates.latitude - targetLat) * Math.PI) / 180;
        const deltaLng =
          ((region.coordinates.longitude - targetLng) * Math.PI) / 180;

        const a =
          Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(deltaLng / 2) *
            Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // Earth's radius in km

        return distance <= radiusKm;
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

  async getFeatured(
    limit: number,
    _userId?: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailFeatured) {
      return err(new RegionRepositoryError("Failed to get featured regions"));
    }

    // Handle negative or zero limit
    if (limit <= 0) {
      return ok([]);
    }

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
    // Simulate unexpected error if configured - throw before try-catch
    if (this.shouldThrowError) {
      throw new Error("Simulated unexpected error");
    }

    if (this.shouldFailGetByCreator) {
      return err(new RegionRepositoryError("Failed to get regions by creator"));
    }

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
  private regionRepository?: MockRegionRepository;
  private shouldFailFindByUser = false;
  private shouldFailFindByUserAndRegion = false;
  private shouldFailAdd = false;
  private shouldFailRemove = false;
  private shouldFailGetRegionsWithFavorites = false;

  constructor(initialFavorites: RegionFavorite[] = []) {
    for (const favorite of initialFavorites) {
      this.favorites.set(favorite.id, favorite);
    }
  }

  setRegionRepository(regionRepository: MockRegionRepository): void {
    this.regionRepository = regionRepository;
  }

  setShouldFailFindByUser(shouldFail: boolean): void {
    this.shouldFailFindByUser = shouldFail;
  }

  setShouldFailFindByUserAndRegion(shouldFail: boolean): void {
    this.shouldFailFindByUserAndRegion = shouldFail;
  }

  setShouldFailAdd(shouldFail: boolean): void {
    this.shouldFailAdd = shouldFail;
  }

  setShouldFailRemove(shouldFail: boolean): void {
    this.shouldFailRemove = shouldFail;
  }

  setShouldFailGetRegionsWithFavorites(shouldFail: boolean): void {
    this.shouldFailGetRegionsWithFavorites = shouldFail;
  }

  reset(): void {
    this.favorites.clear();
    this.shouldFailFindByUser = false;
    this.shouldFailFindByUserAndRegion = false;
    this.shouldFailAdd = false;
    this.shouldFailRemove = false;
    this.shouldFailGetRegionsWithFavorites = false;
  }

  async add(
    params: AddRegionToFavoritesParams,
  ): Promise<Result<RegionFavorite, RegionRepositoryError>> {
    if (this.shouldFailAdd) {
      return err(new RegionRepositoryError("Failed to add favorite"));
    }

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
    if (this.shouldFailRemove) {
      return err(new RegionRepositoryError("Failed to remove favorite"));
    }

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
    if (this.shouldFailFindByUser) {
      return err(new RegionRepositoryError("Failed to find favorites by user"));
    }

    const favorites = Array.from(this.favorites.values()).filter(
      (f) => f.userId === userId,
    );

    return ok(favorites);
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionFavorite | null, RegionRepositoryError>> {
    if (this.shouldFailFindByUserAndRegion) {
      return err(
        new RegionRepositoryError("Failed to find favorite by user and region"),
      );
    }

    const favorite = Array.from(this.favorites.values()).find(
      (f) => f.userId === userId && f.regionId === regionId,
    );

    return ok(favorite || null);
  }

  async getRegionsWithFavorites(
    userId: string,
    limit?: number,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    if (this.shouldFailGetRegionsWithFavorites) {
      return err(
        new RegionRepositoryError("Failed to get regions with favorites"),
      );
    }

    try {
      // Validate user ID format
      if (!userId || !userId.match(/^[0-9a-f-]{36}$/i)) {
        return err(new RegionRepositoryError("Invalid user ID format"));
      }

      // Get user's favorites
      const userFavorites = Array.from(this.favorites.values()).filter(
        (f) => f.userId === userId,
      );

      // Sort by creation date (most recent first)
      userFavorites.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      // Apply limit if specified
      const limitedFavorites =
        limit && limit > 0
          ? userFavorites.slice(0, limit)
          : limit === 0
            ? []
            : userFavorites;

      // Get the corresponding regions
      const regionsWithStats: RegionWithStats[] = [];

      for (const favorite of limitedFavorites) {
        if (this.regionRepository) {
          const regionResult = await this.regionRepository.findById(
            favorite.regionId,
          );
          if (regionResult.isOk() && regionResult.value) {
            regionsWithStats.push({
              ...regionResult.value,
              isFavorited: true, // Mark as favorited since this is a favorites query
            });
          }
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
    _regionId: string,
  ): Promise<Result<void, RegionRepositoryError>> {
    // In real implementation, this would update the region's favorite count
    return ok(undefined);
  }
}

export class MockRegionPinRepository implements RegionPinRepository {
  private pins = new Map<string, RegionPin>();
  private regionRepository?: MockRegionRepository;
  private shouldFailFindByUser = false;
  private shouldFailFindByUserAndRegion = false;
  private shouldFailAdd = false;
  private shouldFailRemove = false;
  private shouldFailGetRegionsWithPins = false;
  private shouldFailReorder = false;

  constructor(initialPins: RegionPin[] = []) {
    for (const pin of initialPins) {
      this.pins.set(pin.id, pin);
    }
  }

  setRegionRepository(regionRepository: MockRegionRepository): void {
    this.regionRepository = regionRepository;
  }

  setShouldFailFindByUser(shouldFail: boolean): void {
    this.shouldFailFindByUser = shouldFail;
  }

  setShouldFailFindByUserAndRegion(shouldFail: boolean): void {
    this.shouldFailFindByUserAndRegion = shouldFail;
  }

  setShouldFailAdd(shouldFail: boolean): void {
    this.shouldFailAdd = shouldFail;
  }

  setShouldFailRemove(shouldFail: boolean): void {
    this.shouldFailRemove = shouldFail;
  }

  setShouldFailGetRegionsWithPins(shouldFail: boolean): void {
    this.shouldFailGetRegionsWithPins = shouldFail;
  }

  setShouldFailReorder(shouldFail: boolean): void {
    this.shouldFailReorder = shouldFail;
  }

  reset(): void {
    this.pins.clear();
    this.shouldFailFindByUser = false;
    this.shouldFailFindByUserAndRegion = false;
    this.shouldFailAdd = false;
    this.shouldFailRemove = false;
    this.shouldFailGetRegionsWithPins = false;
    this.shouldFailReorder = false;
  }

  async add(
    params: PinRegionParams,
  ): Promise<Result<RegionPin, RegionRepositoryError>> {
    if (this.shouldFailAdd) {
      return err(new RegionRepositoryError("Failed to add pin"));
    }

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
    if (this.shouldFailRemove) {
      return err(new RegionRepositoryError("Failed to remove pin"));
    }

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
    if (this.shouldFailFindByUser) {
      return err(new RegionRepositoryError("Failed to find pins by user"));
    }

    const pins = Array.from(this.pins.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return ok(pins);
  }

  async findByUserAndRegion(
    userId: string,
    regionId: string,
  ): Promise<Result<RegionPin | null, RegionRepositoryError>> {
    if (this.shouldFailFindByUserAndRegion) {
      return err(
        new RegionRepositoryError("Failed to find pin by user and region"),
      );
    }

    const pin = Array.from(this.pins.values()).find(
      (p) => p.userId === userId && p.regionId === regionId,
    );

    return ok(pin || null);
  }

  async reorder(
    params: ReorderPinnedRegionsParams,
  ): Promise<Result<void, RegionRepositoryError>> {
    if (this.shouldFailReorder) {
      return err(new RegionRepositoryError("Failed to reorder pins"));
    }

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
    userId: string,
  ): Promise<Result<RegionWithStats[], RegionRepositoryError>> {
    if (this.shouldFailGetRegionsWithPins) {
      return err(new RegionRepositoryError("Failed to get regions with pins"));
    }

    try {
      // Get user's pins
      const userPins = Array.from(this.pins.values())
        .filter((p) => p.userId === userId)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      // Get the corresponding regions
      const regionsWithStats: RegionWithStats[] = [];

      for (const pin of userPins) {
        if (this.regionRepository) {
          const regionResult = await this.regionRepository.findById(
            pin.regionId,
          );
          if (regionResult.isOk() && regionResult.value) {
            regionsWithStats.push({
              ...regionResult.value,
              isPinned: true,
              pinDisplayOrder: pin.displayOrder,
            });
          }
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
