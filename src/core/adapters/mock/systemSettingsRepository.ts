import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import type { SystemSettingsRepository } from "@/core/domain/systemSettings/ports/systemSettingsRepository";
import type {
  CreateSystemSettingParams,
  ListSystemSettingsQuery,
  SystemSetting,
  SystemSettingKey,
  UpdateSystemSettingParams,
} from "@/core/domain/systemSettings/types";
import { RepositoryError } from "@/lib/error";

export class MockSystemSettingsRepository implements SystemSettingsRepository {
  private settings: Map<string, SystemSetting> = new Map();

  reset(): void {
    this.settings.clear();
  }

  async create(
    params: CreateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    // Check if key already exists
    for (const setting of this.settings.values()) {
      if (setting.key === params.key) {
        return err(new RepositoryError("Setting with this key already exists"));
      }
    }

    const setting: SystemSetting = {
      id: uuidv7(),
      key: params.key,
      value: params.value,
      description: params.description,
      isActive: params.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.settings.set(setting.id, setting);
    return ok(setting);
  }

  async findById(
    id: string,
  ): Promise<Result<SystemSetting | null, RepositoryError>> {
    const setting = this.settings.get(id);
    return ok(setting || null);
  }

  async findByKey(
    key: SystemSettingKey,
  ): Promise<Result<SystemSetting | null, RepositoryError>> {
    for (const setting of this.settings.values()) {
      if (setting.key === key) {
        return ok(setting);
      }
    }
    return ok(null);
  }

  async list(query: ListSystemSettingsQuery): Promise<
    Result<
      {
        items: SystemSetting[];
        count: number;
      },
      RepositoryError
    >
  > {
    let items = Array.from(this.settings.values());

    // Apply filters
    if (query.filter?.key) {
      const filterKey = query.filter.key;
      items = items.filter((setting) => setting.key.includes(filterKey));
    }
    if (query.filter?.isActive !== undefined) {
      items = items.filter(
        (setting) => setting.isActive === query.filter?.isActive,
      );
    }

    // Sort by key
    items.sort((a, b) => a.key.localeCompare(b.key));

    const count = items.length;

    // Apply pagination
    const { page, limit } = query.pagination;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return ok({
      items: paginatedItems,
      count,
    });
  }

  async update(
    params: UpdateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    const existing = this.settings.get(params.id);
    if (!existing) {
      return err(new RepositoryError("System setting not found"));
    }

    const updated: SystemSetting = {
      ...existing,
      value: params.value ?? existing.value,
      description: params.description ?? existing.description,
      isActive: params.isActive ?? existing.isActive,
      updatedAt: new Date(),
    };

    this.settings.set(params.id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    if (!this.settings.has(id)) {
      return err(new RepositoryError("System setting not found"));
    }

    this.settings.delete(id);
    return ok(undefined);
  }

  async getSettingValue(
    key: SystemSettingKey,
  ): Promise<Result<string | null, RepositoryError>> {
    for (const setting of this.settings.values()) {
      if (setting.key === key && setting.isActive) {
        return ok(setting.value);
      }
    }
    return ok(null);
  }

  async setSettingValue(
    key: SystemSettingKey,
    value: string,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    // First, try to update existing setting
    for (const setting of this.settings.values()) {
      if (setting.key === key) {
        const updated: SystemSetting = {
          ...setting,
          value,
          isActive: true,
          updatedAt: new Date(),
        };
        this.settings.set(setting.id, updated);
        return ok(updated);
      }
    }

    // If no existing setting, create a new one
    return this.create({
      key,
      value,
      isActive: true,
    });
  }
}
