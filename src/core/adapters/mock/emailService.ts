import { err, ok, type Result } from "neverthrow";
import {
  type EmailService,
  EmailServiceError,
} from "@/core/domain/user/ports/emailService";

interface SentEmail {
  type: "verification" | "passwordReset" | "editorInvitation" | "welcome";
  to: string;
  name: string;
  token?: string;
  inviterName?: string;
  placeName?: string;
  sentAt: Date;
}

export class MockEmailService implements EmailService {
  private sentEmails: SentEmail[] = [];
  private shouldFail = false;

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  getSentEmails(): SentEmail[] {
    return [...this.sentEmails];
  }

  getLastSentEmail(): SentEmail | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  reset(): void {
    this.sentEmails = [];
    this.shouldFail = false;
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    if (this.shouldFail) {
      return Promise.resolve(
        err(new EmailServiceError("Failed to send verification email")),
      );
    }

    this.sentEmails.push({
      type: "verification",
      to: email,
      name,
      token: verificationToken,
      sentAt: new Date(),
    });

    return ok(undefined);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    if (this.shouldFail) {
      return Promise.resolve(
        err(new EmailServiceError("Failed to send password reset email")),
      );
    }

    this.sentEmails.push({
      type: "passwordReset",
      to: email,
      name,
      token: resetToken,
      sentAt: new Date(),
    });

    return ok(undefined);
  }

  async sendEditorInvitationEmail(
    email: string,
    inviterName: string,
    placeName: string,
    invitationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    if (this.shouldFail) {
      return Promise.resolve(
        err(new EmailServiceError("Failed to send editor invitation email")),
      );
    }

    this.sentEmails.push({
      type: "editorInvitation",
      to: email,
      name: "",
      token: invitationToken,
      inviterName,
      placeName,
      sentAt: new Date(),
    });

    return ok(undefined);
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<Result<void, EmailServiceError>> {
    if (this.shouldFail) {
      return Promise.resolve(
        err(new EmailServiceError("Failed to send welcome email")),
      );
    }

    this.sentEmails.push({
      type: "welcome",
      to: email,
      name,
      sentAt: new Date(),
    });

    return ok(undefined);
  }
}
