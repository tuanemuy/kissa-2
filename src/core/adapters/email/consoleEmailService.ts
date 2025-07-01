import { ok, type Result } from "neverthrow";
import type {
  EmailService,
  EmailServiceError,
} from "@/core/domain/user/ports/emailService";

export interface ConsoleEmailConfig {
  fromEmail: string;
  fromName: string;
  baseUrl: string;
}

/**
 * Console-based email service for development and testing
 * Logs all email content to console instead of sending actual emails
 */
export class ConsoleEmailService implements EmailService {
  constructor(private readonly config: ConsoleEmailConfig) {}

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    const verificationUrl = `${this.config.baseUrl}/auth/verify-email?token=${verificationToken}`;

    console.log("📧 EMAIL: Verification Email");
    console.log("─".repeat(50));
    console.log(`To: ${email} (${name})`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log("Subject: Verify your email address");
    console.log("");
    console.log("Body:");
    console.log(`Hi ${name},`);
    console.log("");
    console.log(
      "Welcome to Kissa! Please verify your email address by clicking the link below:",
    );
    console.log("");
    console.log(`🔗 ${verificationUrl}`);
    console.log("");
    console.log("This link will expire in 24 hours.");
    console.log("");
    console.log("If you didn't create this account, please ignore this email.");
    console.log("");
    console.log("Best regards,");
    console.log("The Kissa Team");
    console.log("─".repeat(50));
    console.log("");

    return ok(undefined);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    const resetUrl = `${this.config.baseUrl}/auth/reset-password?token=${resetToken}`;

    console.log("📧 EMAIL: Password Reset");
    console.log("─".repeat(50));
    console.log(`To: ${email} (${name})`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log("Subject: Reset your password");
    console.log("");
    console.log("Body:");
    console.log(`Hi ${name},`);
    console.log("");
    console.log(
      "You requested to reset your password for your Kissa account. Click the link below to set a new password:",
    );
    console.log("");
    console.log(`🔗 ${resetUrl}`);
    console.log("");
    console.log("This link will expire in 1 hour.");
    console.log("");
    console.log(
      "If you didn't request this password reset, please ignore this email and your password will remain unchanged.",
    );
    console.log("");
    console.log("Best regards,");
    console.log("The Kissa Team");
    console.log("─".repeat(50));
    console.log("");

    return ok(undefined);
  }

  async sendEditorInvitationEmail(
    email: string,
    inviterName: string,
    placeName: string,
    invitationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    const invitationUrl = `${this.config.baseUrl}/places/invitation?token=${invitationToken}`;

    console.log("📧 EMAIL: Editor Invitation");
    console.log("─".repeat(50));
    console.log(`To: ${email}`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log(`Subject: You've been invited to edit "${placeName}"`);
    console.log("");
    console.log("Body:");
    console.log("Hi there,");
    console.log("");
    console.log(
      `${inviterName} has invited you to be an editor for "${placeName}" on Kissa.`,
    );
    console.log("");
    console.log("As an editor, you'll be able to:");
    console.log("• Edit place details and information");
    console.log("• Manage place photos and content");
    console.log("• Moderate reviews and check-ins");
    console.log("");
    console.log("To accept this invitation, click the link below:");
    console.log("");
    console.log(`🔗 ${invitationUrl}`);
    console.log("");
    console.log("This invitation will expire in 7 days.");
    console.log("");
    console.log(
      "If you don't want to be an editor for this place, you can safely ignore this email.",
    );
    console.log("");
    console.log("Best regards,");
    console.log("The Kissa Team");
    console.log("─".repeat(50));
    console.log("");

    return ok(undefined);
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<Result<void, EmailServiceError>> {
    console.log("📧 EMAIL: Welcome");
    console.log("─".repeat(50));
    console.log(`To: ${email} (${name})`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log("Subject: Welcome to Kissa!");
    console.log("");
    console.log("Body:");
    console.log(`Hi ${name},`);
    console.log("");
    console.log("Welcome to Kissa! 🎉");
    console.log("");
    console.log(
      "We're excited to have you join our community of travelers and local explorers.",
    );
    console.log("");
    console.log("Here's what you can do with Kissa:");
    console.log("🗺️  Discover amazing places in your area and around the world");
    console.log("📍 Check in to places you visit and share your experiences");
    console.log("📸 Upload photos and write reviews to help others");
    console.log("⭐ Save your favorite places and create your own travel map");
    console.log("");
    console.log(`Ready to explore? Visit: ${this.config.baseUrl}`);
    console.log("");
    console.log("Happy travels!");
    console.log("The Kissa Team");
    console.log("─".repeat(50));
    console.log("");

    return ok(undefined);
  }

  async sendReportNotification(
    adminEmail: string,
    adminName: string,
    reporterName: string,
    entityType: string,
    entityName: string,
    reportType: string,
    reason: string,
    reportId: string,
  ): Promise<Result<void, EmailServiceError>> {
    const reviewUrl = `${this.config.baseUrl}/admin/reports/${reportId}`;

    console.log("📧 EMAIL: Report Notification");
    console.log("─".repeat(50));
    console.log(`To: ${adminEmail} (${adminName})`);
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
    console.log("Subject: New Content Report Received");
    console.log("");
    console.log("Body:");
    console.log(`Hi ${adminName},`);
    console.log("");
    console.log(
      "A new content report has been submitted and requires your review.",
    );
    console.log("");
    console.log("Report Details:");
    console.log(`📋 Report ID: ${reportId}`);
    console.log(`👤 Reporter: ${reporterName}`);
    console.log(`📍 Content Type: ${entityType}`);
    console.log(`📄 Content: ${entityName}`);
    console.log(`🏷️  Report Type: ${reportType}`);
    console.log("");
    console.log("Reason:");
    console.log(`"${reason}"`);
    console.log("");
    console.log("To review this report, click the link below:");
    console.log("");
    console.log(`🔗 ${reviewUrl}`);
    console.log("");
    console.log("Please review this report as soon as possible.");
    console.log("");
    console.log("Best regards,");
    console.log("The Kissa System");
    console.log("─".repeat(50));
    console.log("");

    return ok(undefined);
  }
}
