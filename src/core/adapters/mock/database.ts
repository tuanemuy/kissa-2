import { err, ok, type Result } from "neverthrow";
import type { Context } from "@/core/application/context";

export class MockDatabase {
  private transactionDepth = 0;
  private shouldFailTransaction = false;

  setShouldFailTransaction(shouldFail: boolean): void {
    this.shouldFailTransaction = shouldFail;
  }

  async withTransaction<T>(
    context: Context,
    fn: (txContext: Context) => Promise<Result<T, Error>>,
  ): Promise<Result<T, Error>> {
    if (this.shouldFailTransaction) {
      return err(new Error("Transaction failed"));
    }

    this.transactionDepth++;

    try {
      const result = await fn(context);
      this.transactionDepth--;
      return result;
    } catch (error) {
      this.transactionDepth--;
      return err(
        error instanceof Error ? error : new Error("Unknown transaction error"),
      );
    }
  }

  isInTransaction(): boolean {
    return this.transactionDepth > 0;
  }

  reset(): void {
    this.transactionDepth = 0;
    this.shouldFailTransaction = false;
  }
}
