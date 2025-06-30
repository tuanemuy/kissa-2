import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { EXTERNAL_SERVICE_ERROR_CODES } from "@/lib/errorCodes";

export class EmailServiceError extends AnyError {
  override readonly name: string = "EmailServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, EXTERNAL_SERVICE_ERROR_CODES.EMAIL_SERVICE_FAILED, cause);
  }
}

export interface EmailService {
  sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<Result<void, EmailServiceError>>;

  sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<Result<void, EmailServiceError>>;

  sendEditorInvitationEmail(
    email: string,
    inviterName: string,
    placeName: string,
    invitationToken: string,
  ): Promise<Result<void, EmailServiceError>>;

  sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<Result<void, EmailServiceError>>;
}
