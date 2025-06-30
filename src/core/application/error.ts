import { AnyError } from "@/lib/error";

export class ApplicationServiceError extends AnyError {
  public readonly name = "ApplicationServiceError";

  constructor(
    public readonly usecase: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, undefined, cause);
  }
}
