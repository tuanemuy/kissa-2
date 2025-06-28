import { z } from "zod/v4";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import type { Context } from "@/core/application/context";

export const envSchema = z.object({
  NEXT_PUBLIC_URL: z.string().url(),
  SQLITE_FILE_PATH: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.safeParse(process.env);
if (!env.success) {
  const errors = env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Environment validation failed: ${errors}`);
}

const db = getDatabase(env.data.SQLITE_FILE_PATH);
// const ${entity}Repository = new DrizzleSqlite${Entity}Repository(db);

export const context: Context = {
  publicUrl: env.data.NEXT_PUBLIC_URL,
  // ${entity}Repository,
};
