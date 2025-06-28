import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { err, ok, type Result } from "neverthrow";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>> & {
  $client: PGlite;
};

export function getDatabase(directory: string) {
  const client = new PGlite(directory);
  const db = drizzle({
    client,
    schema,
  });
  return Object.assign(db, { $client: client });
}

export class TransactionError extends Error {
  override readonly name = "TransactionError";

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Execute a function within a database transaction
 */
export async function withTransaction<T>(
  db: Database,
  fn: (tx: Omit<Database, "$client">) => Promise<Result<T, Error>>,
): Promise<Result<T, TransactionError>> {
  try {
    return await db.transaction(async (tx) => {
      const result = await fn(tx);
      if (result.isErr()) {
        // Rollback by throwing an error
        throw result.error;
      }
      return ok(result.value);
    });
  } catch (error) {
    return err(new TransactionError("Transaction failed", error));
  }
}

interface DatabaseError {
  code: string;
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if ("code" in value) {
    return true;
  }

  return false;
}
