import { err, ok, type Result } from "neverthrow";
import nodemailer from "nodemailer";
import {
  type EmailService,
  EmailServiceError,
} from "@/core/domain/user/ports/emailService";

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  fromEmail: string;
  fromName: string;
  baseUrl: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * SMTP-based email service for production use
 * Can be adapted to work with any SMTP provider (SendGrid, Mailgun, etc.)
 */
export class SMTPEmailService implements EmailService {
  constructor(private readonly config: SMTPConfig) {}

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    try {
      const verificationUrl = `${this.config.baseUrl}/auth/verify-email?token=${verificationToken}`;

      const template = this.createVerificationEmailTemplate(
        name,
        verificationUrl,
      );

      return await this.sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
      );
    } catch (error) {
      return err(
        new EmailServiceError("Failed to send verification email", error),
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    try {
      const resetUrl = `${this.config.baseUrl}/auth/reset-password?token=${resetToken}`;

      const template = this.createPasswordResetEmailTemplate(name, resetUrl);

      return await this.sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
      );
    } catch (error) {
      return err(
        new EmailServiceError("Failed to send password reset email", error),
      );
    }
  }

  async sendEditorInvitationEmail(
    email: string,
    inviterName: string,
    placeName: string,
    invitationToken: string,
  ): Promise<Result<void, EmailServiceError>> {
    try {
      const invitationUrl = `${this.config.baseUrl}/places/invitation?token=${invitationToken}`;

      const template = this.createEditorInvitationEmailTemplate(
        inviterName,
        placeName,
        invitationUrl,
      );

      return await this.sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
      );
    } catch (error) {
      return err(
        new EmailServiceError("Failed to send editor invitation email", error),
      );
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ): Promise<Result<void, EmailServiceError>> {
    try {
      const template = this.createWelcomeEmailTemplate(name);

      return await this.sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
      );
    } catch (error) {
      return err(new EmailServiceError("Failed to send welcome email", error));
    }
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
    try {
      const template = this.createReportNotificationEmailTemplate(
        adminName,
        reporterName,
        entityType,
        entityName,
        reportType,
        reason,
        reportId,
      );

      return await this.sendEmail(
        adminEmail,
        template.subject,
        template.html,
        template.text,
      );
    } catch (error) {
      return err(
        new EmailServiceError(
          "Failed to send report notification email",
          error,
        ),
      );
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<Result<void, EmailServiceError>> {
    try {
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
      });

      const emailData = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to,
        subject,
        html,
        text,
      };

      await transporter.sendMail(emailData);

      return ok(undefined);
    } catch (error) {
      return err(new EmailServiceError("SMTP send failed", error));
    }
  }

  private createVerificationEmailTemplate(
    name: string,
    verificationUrl: string,
  ): EmailTemplate {
    const subject = "Verify your email address";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Welcome to Kissa!</h1>
            <p>Hi ${name},</p>
            <p>Thank you for signing up for Kissa. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Kissa Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hi ${name},

Welcome to Kissa! Please verify your email address by visiting the following link:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The Kissa Team
    `;

    return { subject, html, text };
  }

  private createPasswordResetEmailTemplate(
    name: string,
    resetUrl: string,
  ): EmailTemplate {
    const subject = "Reset your password";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Password Reset Request</h1>
            <p>Hi ${name},</p>
            <p>You requested to reset your password for your Kissa account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Kissa Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hi ${name},

You requested to reset your password for your Kissa account. Visit the following link to set a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The Kissa Team
    `;

    return { subject, html, text };
  }

  private createEditorInvitationEmailTemplate(
    inviterName: string,
    placeName: string,
    invitationUrl: string,
  ): EmailTemplate {
    const subject = `You've been invited to edit "${placeName}"`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Editor Invitation</h1>
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to be an editor for <strong>"${placeName}"</strong> on Kissa.</p>
            <p>As an editor, you'll be able to:</p>
            <ul>
              <li>Edit place details and information</li>
              <li>Manage place photos and content</li>
              <li>Moderate reviews and check-ins</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            <p>This invitation will expire in 7 days.</p>
            <p>If you don't want to be an editor for this place, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Kissa Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hi there,

${inviterName} has invited you to be an editor for "${placeName}" on Kissa.

As an editor, you'll be able to:
• Edit place details and information
• Manage place photos and content
• Moderate reviews and check-ins

To accept this invitation, visit: ${invitationUrl}

This invitation will expire in 7 days.

If you don't want to be an editor for this place, you can safely ignore this email.

Best regards,
The Kissa Team
    `;

    return { subject, html, text };
  }

  private createWelcomeEmailTemplate(name: string): EmailTemplate {
    const subject = "Welcome to Kissa!";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Welcome to Kissa! 🎉</h1>
            <p>Hi ${name},</p>
            <p>We're excited to have you join our community of travelers and local explorers.</p>
            <p>Here's what you can do with Kissa:</p>
            <ul>
              <li>🗺️ Discover amazing places in your area and around the world</li>
              <li>📍 Check in to places you visit and share your experiences</li>
              <li>📸 Upload photos and write reviews to help others</li>
              <li>⭐ Save your favorite places and create your own travel map</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.config.baseUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Start Exploring
              </a>
            </div>
            <p>Happy travels!</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Kissa Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Hi ${name},

Welcome to Kissa! 🎉

We're excited to have you join our community of travelers and local explorers.

Here's what you can do with Kissa:
🗺️  Discover amazing places in your area and around the world
📍 Check in to places you visit and share your experiences  
📸 Upload photos and write reviews to help others
⭐ Save your favorite places and create your own travel map

Ready to explore? Visit: ${this.config.baseUrl}

Happy travels!
The Kissa Team
    `;

    return { subject, html, text };
  }

  private createReportNotificationEmailTemplate(
    adminName: string,
    reporterName: string,
    entityType: string,
    entityName: string,
    reportType: string,
    reason: string,
    reportId: string,
  ): EmailTemplate {
    const subject = "New Content Report Received";
    const reviewUrl = `${this.config.baseUrl}/admin/reports/${reportId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">⚠️ Content Report Alert</h1>
            <p>Hi ${adminName},</p>
            <p>A new content report has been submitted and requires your immediate review.</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Report Details</h3>
              <p><strong>Report ID:</strong> ${reportId}</p>
              <p><strong>Reporter:</strong> ${reporterName}</p>
              <p><strong>Content Type:</strong> ${entityType}</p>
              <p><strong>Content:</strong> ${entityName}</p>
              <p><strong>Report Type:</strong> ${reportType}</p>
              
              <h4 style="color: #374151;">Reported Reason:</h4>
              <div style="background-color: #fff; padding: 15px; border-left: 4px solid #dc2626; border-radius: 4px;">
                <p style="margin: 0; font-style: italic;">"${reason}"</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Report
              </a>
            </div>
            
            <p><strong>Action Required:</strong> Please review this report as soon as possible to maintain community standards.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              The Kissa System
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Content Report Alert

Hi ${adminName},

A new content report has been submitted and requires your immediate review.

Report Details:
- Report ID: ${reportId}
- Reporter: ${reporterName}
- Content Type: ${entityType}
- Content: ${entityName}
- Report Type: ${reportType}

Reported Reason:
"${reason}"

To review this report, visit: ${reviewUrl}

Action Required: Please review this report as soon as possible to maintain community standards.

Best regards,
The Kissa System
    `;

    return { subject, html, text };
  }
}
