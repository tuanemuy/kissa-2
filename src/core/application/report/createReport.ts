import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { Report, CreateReportParams } from "@/core/domain/report/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";

export class CreateReportError extends AnyError {
  override readonly name = "CreateReportError";
  
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
  }
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
  input: CreateReportInput
): Promise<Result<Report, CreateReportError>> {
  try {
    // Verify reporter exists and is active
    const userResult = await context.userRepository.findById(reporterUserId);
    if (userResult.isErr()) {
      return err(new CreateReportError("Failed to find reporter user", ERROR_CODES.INTERNAL_ERROR, userResult.error));
    }

    const user = userResult.value;
    if (!user) {
      return err(new CreateReportError("Reporter user not found", ERROR_CODES.USER_NOT_FOUND));
    }

    if (user.status !== "active") {
      return err(new CreateReportError("Reporter account is not active", ERROR_CODES.USER_INACTIVE));
    }

    // Verify the entity being reported exists
    const entityExists = await verifyEntityExists(context, input.entityType, input.entityId);
    if (entityExists.isErr()) {
      return err(entityExists.error);
    }

    if (!entityExists.value) {
      return err(new CreateReportError("Entity to report not found", ERROR_CODES.NOT_FOUND));
    }

    // Check if user is trying to report their own content
    const isOwnContent = await checkIfOwnContent(context, reporterUserId, input.entityType, input.entityId);
    if (isOwnContent.isErr()) {
      return err(new CreateReportError("Failed to verify content ownership", ERROR_CODES.INTERNAL_ERROR, isOwnContent.error));
    }

    if (isOwnContent.value) {
      return err(new CreateReportError("Cannot report your own content", ERROR_CODES.CANNOT_REPORT_OWN_CONTENT));
    }

    // Check for duplicate reports
    const isDuplicate = await context.reportRepository.checkDuplicateReport(
      reporterUserId,
      input.entityType,
      input.entityId
    );

    if (isDuplicate.isErr()) {
      return err(new CreateReportError("Failed to check for duplicate reports", ERROR_CODES.INTERNAL_ERROR, isDuplicate.error));
    }

    if (isDuplicate.value) {
      return err(new CreateReportError("You have already reported this content", ERROR_CODES.REPORT_ALREADY_EXISTS));
    }

    // Create the report
    const reportResult = await context.reportRepository.create(reporterUserId, {
      entityType: input.entityType,
      entityId: input.entityId,
      type: input.type,
      reason: input.reason,
    });

    if (reportResult.isErr()) {
      return err(new CreateReportError("Failed to create report", ERROR_CODES.INTERNAL_ERROR, reportResult.error));
    }

    return reportResult;
  } catch (error) {
    return err(new CreateReportError("Unexpected error during report creation", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

async function verifyEntityExists(
  context: Context,
  entityType: string,
  entityId: string
): Promise<Result<boolean, CreateReportError>> {
  try {
    switch (entityType) {
      case "user": {
        const result = await context.userRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to verify user exists", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        return ok(result.value !== null);
      }
      case "place": {
        const result = await context.placeRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to verify place exists", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        return ok(result.value !== null);
      }
      case "region": {
        const result = await context.regionRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to verify region exists", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        return ok(result.value !== null);
      }
      case "checkin": {
        const result = await context.checkinRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to verify checkin exists", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        return ok(result.value !== null);
      }
      default:
        return err(new CreateReportError("Invalid entity type", ERROR_CODES.VALIDATION_ERROR));
    }
  } catch (error) {
    return err(new CreateReportError("Unexpected error verifying entity", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

async function checkIfOwnContent(
  context: Context,
  userId: string,
  entityType: string,
  entityId: string
): Promise<Result<boolean, CreateReportError>> {
  try {
    switch (entityType) {
      case "user":
        return ok(userId === entityId);
      case "place": {
        const result = await context.placeRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to check place ownership", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        const place = result.value;
        return ok(place?.createdBy === userId);
      }
      case "region": {
        const result = await context.regionRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to check region ownership", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        const region = result.value;
        return ok(region?.createdBy === userId);
      }
      case "checkin": {
        const result = await context.checkinRepository.findById(entityId);
        if (result.isErr()) {
          return err(new CreateReportError("Failed to check checkin ownership", ERROR_CODES.INTERNAL_ERROR, result.error));
        }
        const checkin = result.value;
        return ok(checkin?.userId === userId);
      }
      default:
        return err(new CreateReportError("Invalid entity type", ERROR_CODES.VALIDATION_ERROR));
    }
  } catch (error) {
    return err(new CreateReportError("Unexpected error checking content ownership", ERROR_CODES.INTERNAL_ERROR, error));
  }
}