import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const systemSettingSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(255),
  value: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SystemSetting = z.infer<typeof systemSettingSchema>;

export const createSystemSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type CreateSystemSettingParams = z.infer<
  typeof createSystemSettingSchema
>;

export const updateSystemSettingSchema = z.object({
  id: z.string().uuid(),
  value: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSystemSettingParams = z.infer<
  typeof updateSystemSettingSchema
>;

export const listSystemSettingsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      key: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
});

export type ListSystemSettingsQuery = z.infer<
  typeof listSystemSettingsQuerySchema
>;

// 定義済みのシステム設定キー
export const SystemSettingKeys = {
  TERMS_OF_SERVICE: "terms_of_service",
  PRIVACY_POLICY: "privacy_policy",
  MAINTENANCE_MODE: "maintenance_mode",
  MAINTENANCE_MESSAGE: "maintenance_message",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  MAX_UPLOAD_SIZE: "max_upload_size",
  ALLOWED_FILE_TYPES: "allowed_file_types",
} as const;

export type SystemSettingKey =
  (typeof SystemSettingKeys)[keyof typeof SystemSettingKeys];
