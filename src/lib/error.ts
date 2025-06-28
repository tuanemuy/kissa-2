export class AnyError extends Error {
  override readonly name: string = "AnyError";
  override readonly cause?: AnyError | Error;
  readonly code?: string;

  constructor(message: string, code?: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.cause = isError(cause) ? cause : undefined;
  }
}

export function isError(error: unknown): error is AnyError | Error {
  return error instanceof Error || error instanceof AnyError;
}

export function fromUnknown(error: unknown): AnyError {
  if (error instanceof Error) {
    if (error instanceof AnyError) {
      return error;
    }

    return new AnyError(error.message, "UNKNOWN_ERROR", error);
  }

  if (typeof error === "string") {
    return new AnyError(error, "STRING_ERROR");
  }

  return new AnyError("Unknown error occurred", "UNKNOWN_ERROR", error);
}
