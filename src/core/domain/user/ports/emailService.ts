import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";

export class EmailServiceError extends AnyError {
  override readonly name = "EmailServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
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
