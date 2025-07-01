import type { Result } from "neverthrow";
import type { RepositoryError } from "@/lib/error";
import type {
  CreateSystemSettingParams,
  ListSystemSettingsQuery,
  SystemSetting,
  SystemSettingKey,
  UpdateSystemSettingParams,
} from "../types";

export interface SystemSettingsRepository {
  create(
    params: CreateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>>;

  findById(id: string): Promise<Result<SystemSetting | null, RepositoryError>>;

  findByKey(
    key: SystemSettingKey,
  ): Promise<Result<SystemSetting | null, RepositoryError>>;

  list(query: ListSystemSettingsQuery): Promise<
    Result<
      {
        items: SystemSetting[];
        count: number;
      },
      RepositoryError
    >
  >;

  update(
    params: UpdateSystemSettingParams,
  ): Promise<Result<SystemSetting, RepositoryError>>;

  delete(id: string): Promise<Result<void, RepositoryError>>;

  // システム設定値を直接取得するためのユーティリティメソッド
  getSettingValue(
    key: SystemSettingKey,
  ): Promise<Result<string | null, RepositoryError>>;

  // システム設定値を直接更新するためのユーティリティメソッド
  setSettingValue(
    key: SystemSettingKey,
    value: string,
  ): Promise<Result<SystemSetting, RepositoryError>>;
}
