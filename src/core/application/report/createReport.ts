import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { Report } from "@/core/domain/report/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { sendReportNotification } from "./sendReportNotification";

export class CreateReportError extends AnyError {
  override readonly name = "CreateReportError";
}

export const createReportInputSchema = z.object({
  entityType: z.enum(["user", "place", "region", "checkin"]),
  entityId: z.string().uuid(),
  type: z.enum([
    "spam",
    "inappropriate_content",
    "harassment",
    "false_information",
    "copyright_violation",
    "other",
  ]),
  reason: z.string().min(10).max(1000),
});
export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export async function createReport(
  context: Context,
  reporterUserId: string,
  input: CreateReportInput,
): Promise<Result<Report, CreateReportError>> {
  try {
    // Verify reporter exists and is active
    const userResult = await context.userRepository.findById(reporterUserId);
    if (userResult.isErr()) {
      return err(
        new CreateReportError(
          "Failed to find reporter user",
          ERROR_CODES.USER_NOT_FOUND,
          userResult.error,
        ),
      );
    }

    const user = userResult.value;
    if (!user) {
      return err(
        new CreateReportError(
          "Reporter user not found",
          ERROR_CODES.USER_NOT_FOUND,
        ),
      );
    }

    if (user.status !== "active") {
      return err(
        new CreateReportError(
          "Reporter account is not active",
          ERROR_CODES.USER_INACTIVE,
        ),
      );
    }

    // Verify the entity being reported exists
    const entityExists = await verifyEntityExists(
      context,
      input.entityType,
      input.entityId,
    );
    if (entityExists.isErr()) {
      return err(entityExists.error);
    }

    if (!entityExists.value) {
      return err(
        new CreateReportError(
          "Entity to report not found",
          ERROR_CODES.NOT_FOUND,
        ),
      );
    }

    // Check if user is trying to report their own content
    const isOwnContent = await checkIfOwnContent(
      context,
      reporterUserId,
      input.entityType,
      input.entityId,
    );
    if (isOwnContent.isErr()) {
      return err(
        new CreateReportError(
          "Failed to verify content ownership",
          ERROR_CODES.INTERNAL_ERROR,
          isOwnContent.error,
        ),
      );
    }

    if (isOwnContent.value) {
      return err(
        new CreateReportError(
          "Cannot report your own content",
          ERROR_CODES.CANNOT_REPORT_OWN_CONTENT,
        ),
      );
    }

    // Check for duplicate reports
    const isDuplicate = await context.reportRepository.checkDuplicateReport(
      reporterUserId,
      input.entityType,
      input.entityId,
    );

    if (isDuplicate.isErr()) {
      return err(
        new CreateReportError(
          "Failed to check for duplicate reports",
          ERROR_CODES.INTERNAL_ERROR,
          isDuplicate.error,
        ),
      );
    }

    if (isDuplicate.value) {
      return err(
        new CreateReportError(
          "You have already reported this content",
          ERROR_CODES.REPORT_ALREADY_EXISTS,
        ),
      );
    }

    // Create the report
    const reportResult = await context.reportRepository.create(reporterUserId, {
      entityType: input.entityType,
      entityId: input.entityId,
      type: input.type,
      reason: input.reason,
    });

    if (reportResult.isErr()) {
      // Check if this is a duplicate report error from the repository
      if (
        reportResult.error.code === "REPORT_ALREADY_EXISTS" ||
        reportResult.error.message?.includes("already exists")
      ) {
        return err(
          new CreateReportError(
            "You have already reported this content",
            ERROR_CODES.REPORT_ALREADY_EXISTS,
            reportResult.error,
          ),
        );
      }

      return err(
        new CreateReportError(
          "Failed to create report",
          ERROR_CODES.INTERNAL_ERROR,
          reportResult.error,
        ),
      );
    }

    const report = reportResult.value;

    // Send notification emails to admins (async, don't fail if emails fail)
    const entityName = await getEntityName(
      context,
      input.entityType,
      input.entityId,
    );

    const notificationResult = await sendReportNotification(context, {
      reportId: report.id,
      reporterName: user.name,
      entityType: input.entityType,
      entityName: entityName.isOk()
        ? entityName.value
        : `${input.entityType} (ID: ${input.entityId})`,
      reportType: input.type,
      reason: input.reason,
    });

    if (notificationResult.isErr()) {
      // Log error but don't fail report creation
      console.error(
        "Failed to send report notification emails:",
        notificationResult.error,
      );
    }

    return ok(report);
  } catch (error) {
    return err(
      new CreateReportError(
        "Unexpected error during report creation",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

async function verifyEntityExists(
  context: Context,
  entityType: string,
  entityId: string,
): Promise<Result<boolean, CreateReportError>> {
  try {
    switch (entityType) {
      case "user": {
        const result = await context.userRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to verify entity exists",
              ERROR_CODES.NOT_FOUND,
              result.error,
            ),
          );
        }
        return ok(result.value !== null);
      }
      case "place": {
        const result = await context.placeRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to verify entity exists",
              ERROR_CODES.NOT_FOUND,
              result.error,
            ),
          );
        }
        return ok(result.value !== null);
      }
      case "region": {
        const result = await context.regionRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to verify entity exists",
              ERROR_CODES.NOT_FOUND,
              result.error,
            ),
          );
        }
        return ok(result.value !== null);
      }
      case "checkin": {
        const result = await context.checkinRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to verify entity exists",
              ERROR_CODES.NOT_FOUND,
              result.error,
            ),
          );
        }
        return ok(result.value !== null);
      }
      default:
        return err(
          new CreateReportError(
            "Invalid entity type",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
    }
  } catch (error) {
    return err(
      new CreateReportError(
        "Unexpected error verifying entity",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

async function checkIfOwnContent(
  context: Context,
  userId: string,
  entityType: string,
  entityId: string,
): Promise<Result<boolean, CreateReportError>> {
  try {
    switch (entityType) {
      case "user":
        return ok(userId === entityId);
      case "place": {
        const result = await context.placeRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to check place ownership",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        const place = result.value;
        return ok(place?.createdBy === userId);
      }
      case "region": {
        const result = await context.regionRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to check region ownership",
              ERROR_CODES.REGION_NOT_FOUND,
              result.error,
            ),
          );
        }
        const region = result.value;
        return ok(region?.createdBy === userId);
      }
      case "checkin": {
        const result = await context.checkinRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to check checkin ownership",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        const checkin = result.value;
        return ok(checkin?.userId === userId);
      }
      default:
        return err(
          new CreateReportError(
            "Invalid entity type",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
    }
  } catch (error) {
    return err(
      new CreateReportError(
        "Unexpected error checking content ownership",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

async function getEntityName(
  context: Context,
  entityType: string,
  entityId: string,
): Promise<Result<string, CreateReportError>> {
  try {
    switch (entityType) {
      case "user": {
        const result = await context.userRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to get entity name",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        return ok(result.value?.name || "Unknown User");
      }
      case "place": {
        const result = await context.placeRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to get entity name",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        return ok(result.value?.name || "Unknown Place");
      }
      case "region": {
        const result = await context.regionRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to get entity name",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        return ok(result.value?.name || "Unknown Region");
      }
      case "checkin": {
        const result = await context.checkinRepository.findById(entityId);
        if (result.isErr()) {
          return err(
            new CreateReportError(
              "Failed to get entity name",
              ERROR_CODES.INTERNAL_ERROR,
              result.error,
            ),
          );
        }
        const checkin = result.value;
        if (checkin) {
          // Try to get the place name for better context
          const placeResult = await context.placeRepository.findById(
            checkin.placeId,
          );
          if (placeResult.isOk() && placeResult.value) {
            return ok(`Check-in at ${placeResult.value.name}`);
          }
          return ok(`Check-in (ID: ${entityId})`);
        }
        return ok("Unknown Check-in");
      }
      default:
        return ok(`${entityType} (ID: ${entityId})`);
    }
  } catch (error) {
    return err(
      new CreateReportError(
        "Unexpected error getting entity name",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}
