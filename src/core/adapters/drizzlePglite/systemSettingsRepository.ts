import { and, eq, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import type { SystemSettingsRepository } from "@/core/domain/systemSettings/ports/systemSettingsRepository";
import type {
  CreateSystemSettingParams,
  ListSystemSettingsQuery,
  SystemSetting,
  SystemSettingKey,
  UpdateSystemSettingParams,
} from "@/core/domain/systemSettings/types";
import { systemSettingSchema } from "@/core/domain/systemSettings/types";
import { RepositoryError } from "@/lib/error";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { systemSettings } from "./schema";

export class DrizzlePgliteSystemSettingsRepository
  implements SystemSettingsRepository
{
  constructor(private readonly db: Database) {}

  async create(
    params: CreateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    try {
      const result = await this.db
        .insert(systemSettings)
        .values({
          key: params.key,
          value: params.value,
          description: params.description,
          isActive: params.isActive,
        })
        .returning();

      const setting = result[0];
      if (!setting) {
        return err(new RepositoryError("Failed to create system setting"));
      }

      return validate(systemSettingSchema, setting).mapErr((error) => {
        return new RepositoryError("Invalid system setting data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to create system setting", error));
    }
  }

  async findById(
    id: string,
  ): Promise<Result<SystemSetting | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(systemSettingSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid system setting data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find system setting by id", error),
      );
    }
  }

  async findByKey(
    key: SystemSettingKey,
  ): Promise<Result<SystemSetting | null, RepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(systemSettingSchema, result[0]).mapErr((error) => {
        return new RepositoryError("Invalid system setting data", error);
      });
    } catch (error) {
      return err(
        new RepositoryError("Failed to find system setting by key", error),
      );
    }
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
    const { pagination, filter } = query;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    const filters = [
      filter?.key ? like(systemSettings.key, `%${filter.key}%`) : undefined,
      filter?.isActive !== undefined
        ? eq(systemSettings.isActive, filter.isActive)
        : undefined,
    ].filter((filter) => filter !== undefined);

    try {
      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(systemSettings)
          .where(filters.length > 0 ? and(...filters) : undefined)
          .limit(limit)
          .offset(offset)
          .orderBy(systemSettings.key),
        this.db
          .select({ count: sql`count(*)` })
          .from(systemSettings)
          .where(filters.length > 0 ? and(...filters) : undefined),
      ]);

      return ok({
        items: items
          .map((item) => validate(systemSettingSchema, item).unwrapOr(null))
          .filter((item) => item !== null),
        count: Number(countResult[0].count),
      });
    } catch (error) {
      return err(new RepositoryError("Failed to list system settings", error));
    }
  }

  async update(
    params: UpdateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    try {
      const updateData: Partial<CreateSystemSettingParams> = {};

      if (params.value !== undefined) {
        updateData.value = params.value;
      }
      if (params.description !== undefined) {
        updateData.description = params.description;
      }
      if (params.isActive !== undefined) {
        updateData.isActive = params.isActive;
      }

      const result = await this.db
        .update(systemSettings)
        .set(updateData)
        .where(eq(systemSettings.id, params.id))
        .returning();

      const setting = result[0];
      if (!setting) {
        return err(new RepositoryError("System setting not found"));
      }

      return validate(systemSettingSchema, setting).mapErr((error) => {
        return new RepositoryError("Invalid system setting data", error);
      });
    } catch (error) {
      return err(new RepositoryError("Failed to update system setting", error));
    }
  }

  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      const result = await this.db
        .delete(systemSettings)
        .where(eq(systemSettings.id, id))
        .returning();

      if (result.length === 0) {
        return err(new RepositoryError("System setting not found"));
      }

      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete system setting", error));
    }
  }

  async getSettingValue(
    key: SystemSettingKey,
  ): Promise<Result<string | null, RepositoryError>> {
    try {
      const result = await this.db
        .select({ value: systemSettings.value })
        .from(systemSettings)
        .where(
          and(eq(systemSettings.key, key), eq(systemSettings.isActive, true)),
        )
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return ok(result[0].value);
    } catch (error) {
      return err(new RepositoryError("Failed to get setting value", error));
    }
  }

  async setSettingValue(
    key: SystemSettingKey,
    value: string,
  ): Promise<Result<SystemSetting, RepositoryError>> {
    try {
      // First, try to update existing setting
      const existingResult = await this.db
        .update(systemSettings)
        .set({ value, isActive: true })
        .where(eq(systemSettings.key, key))
        .returning();

      if (existingResult.length > 0) {
        return validate(systemSettingSchema, existingResult[0]).mapErr(
          (error) => {
            return new RepositoryError("Invalid system setting data", error);
          },
        );
      }

      // If no existing setting, create a new one
      return this.create({
        key,
        value,
        isActive: true,
      });
    } catch (error) {
      return err(new RepositoryError("Failed to set setting value", error));
    }
  }
}
