import { err, ok, type Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";

export class SendReportNotificationError extends AnyError {
  override readonly name = "SendReportNotificationError";
}

export interface SendReportNotificationInput {
  reportId: string;
  reporterName: string;
  entityType: string;
  entityName: string;
  reportType: string;
  reason: string;
}

/**
 * Send email notifications to all active admin users when a new report is created
 */
export async function sendReportNotification(
  context: Context,
  input: SendReportNotificationInput,
): Promise<Result<void, SendReportNotificationError>> {
  try {
    // Get all active admin users
    const adminUsersResult = await context.userRepository.list({
      pagination: {
        page: 1,
        limit: 1000, // Large limit to get all admins
        order: "desc",
        orderBy: "createdAt",
      },
      filter: {
        role: "admin",
        status: "active",
      },
    });

    if (adminUsersResult.isErr()) {
      return err(
        new SendReportNotificationError(
          "Failed to get admin users",
          ERROR_CODES.INTERNAL_ERROR,
          adminUsersResult.error,
        ),
      );
    }

    const adminUsers = adminUsersResult.value.items;

    if (adminUsers.length === 0) {
      // No active admins to notify - log this but don't fail
      console.warn("No active admin users found to notify about report");
      return ok(undefined);
    }

    // Send email notifications to all active admins
    const emailPromises = adminUsers.map(async (admin) => {
      const emailResult = await context.emailService.sendReportNotification(
        admin.email,
        admin.name,
        input.reporterName,
        input.entityType,
        input.entityName,
        input.reportType,
        input.reason,
        input.reportId,
      );

      if (emailResult.isErr()) {
        // Log error but don't fail the entire operation
        console.error(
          `Failed to send report notification to admin ${admin.email}:`,
          emailResult.error,
        );
      }

      return emailResult;
    });

    // Wait for all email sends to complete
    await Promise.all(emailPromises);

    return ok(undefined);
  } catch (error) {
    return err(
      new SendReportNotificationError(
        "Unexpected error sending report notification",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
