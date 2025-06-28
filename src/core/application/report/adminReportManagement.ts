import { z } from "zod/v4";
import { err, ok, type Result } from "neverthrow";
import type { Report, ReportWithDetails, ReportStats, ListReportsQuery } from "@/core/domain/report/types";
import type { User } from "@/core/domain/user/types";
import type { Context } from "../context";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";

export class AdminReportManagementError extends AnyError {
  override readonly name = "AdminReportManagementError";
  
  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
  }
}

export const reviewReportInputSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["resolved", "dismissed"]),
  reviewNotes: z.string().max(1000).optional(),
});
export type ReviewReportInput = z.infer<typeof reviewReportInputSchema>;

export const adminListReportsInputSchema = z.object({
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    size: z.number().int().min(1).max(100).default(20),
  }).default({ page: 1, size: 20 }),
  filter: z.object({
    status: z.enum(["pending", "under_review", "resolved", "dismissed"]).optional(),
    type: z.enum([
      "spam",
      "inappropriate_content",
      "harassment", 
      "false_information",
      "copyright_violation",
      "other",
    ]).optional(),
    entityType: z.enum(["user", "place", "region", "checkin"]).optional(),
    reporterUserId: z.string().uuid().optional(),
    entityId: z.string().uuid().optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(["createdAt", "updatedAt", "status"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
});
export type AdminListReportsInput = z.infer<typeof adminListReportsInputSchema>;

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string
): Promise<Result<User, AdminReportManagementError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(new AdminReportManagementError("Failed to find admin user", ERROR_CODES.INTERNAL_ERROR, adminResult.error));
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(new AdminReportManagementError("Admin user not found", ERROR_CODES.USER_NOT_FOUND));
  }

  if (admin.role !== "admin") {
    return err(new AdminReportManagementError("Insufficient permissions: admin role required", ERROR_CODES.ADMIN_PERMISSION_REQUIRED));
  }

  if (admin.status !== "active") {
    return err(new AdminReportManagementError("Admin account is not active", ERROR_CODES.USER_INACTIVE));
  }

  return ok(admin);
}

/**
 * List all reports with admin-level details
 */
export async function adminListReports(
  context: Context,
  adminUserId: string,
  input: AdminListReportsInput
): Promise<Result<{ items: ReportWithDetails[]; count: number }, AdminReportManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Build query
    const query: ListReportsQuery = {
      pagination: input.pagination,
      filter: input.filter,
      sort: input.sort,
    };

    // List reports with details
    const reportsResult = await context.reportRepository.listWithDetails(query);
    if (reportsResult.isErr()) {
      return err(new AdminReportManagementError("Failed to list reports", ERROR_CODES.INTERNAL_ERROR, reportsResult.error));
    }

    return reportsResult;
  } catch (error) {
    return err(new AdminReportManagementError("Unexpected error during report listing", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

/**
 * Review and resolve a report
 */
export async function reviewReport(
  context: Context,
  adminUserId: string,
  input: ReviewReportInput
): Promise<Result<Report, AdminReportManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify report exists
    const reportResult = await context.reportRepository.findById(input.reportId);
    if (reportResult.isErr()) {
      return err(new AdminReportManagementError("Failed to find report", ERROR_CODES.INTERNAL_ERROR, reportResult.error));
    }

    const report = reportResult.value;
    if (!report) {
      return err(new AdminReportManagementError("Report not found", ERROR_CODES.REPORT_NOT_FOUND));
    }

    // Check if report is already resolved
    if (report.status === "resolved" || report.status === "dismissed") {
      return err(new AdminReportManagementError("Report has already been reviewed", ERROR_CODES.REPORT_RESOLVED));
    }

    // Update report status
    const updateResult = await context.reportRepository.updateStatus(
      input.reportId,
      input.status,
      adminUserId,
      input.reviewNotes
    );

    if (updateResult.isErr()) {
      return err(new AdminReportManagementError("Failed to update report status", ERROR_CODES.INTERNAL_ERROR, updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new AdminReportManagementError("Unexpected error during report review", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

/**
 * Get report statistics for admin dashboard
 */
export async function getReportStatistics(
  context: Context,
  adminUserId: string
): Promise<Result<ReportStats, AdminReportManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get report statistics
    const statsResult = await context.reportRepository.getStats();
    if (statsResult.isErr()) {
      return err(new AdminReportManagementError("Failed to get report statistics", ERROR_CODES.INTERNAL_ERROR, statsResult.error));
    }

    return statsResult;
  } catch (error) {
    return err(new AdminReportManagementError("Unexpected error getting report statistics", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

/**
 * Update report status to under review
 */
export async function markReportUnderReview(
  context: Context,
  adminUserId: string,
  reportId: string
): Promise<Result<Report, AdminReportManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Verify report exists
    const reportResult = await context.reportRepository.findById(reportId);
    if (reportResult.isErr()) {
      return err(new AdminReportManagementError("Failed to find report", ERROR_CODES.INTERNAL_ERROR, reportResult.error));
    }

    const report = reportResult.value;
    if (!report) {
      return err(new AdminReportManagementError("Report not found", ERROR_CODES.REPORT_NOT_FOUND));
    }

    // Update to under review status
    const updateResult = await context.reportRepository.updateStatus(
      reportId,
      "under_review",
      adminUserId
    );

    if (updateResult.isErr()) {
      return err(new AdminReportManagementError("Failed to mark report under review", ERROR_CODES.INTERNAL_ERROR, updateResult.error));
    }

    return updateResult;
  } catch (error) {
    return err(new AdminReportManagementError("Unexpected error marking report under review", ERROR_CODES.INTERNAL_ERROR, error));
  }
}

/**
 * Get reports for a specific entity
 */
export async function getEntityReports(
  context: Context,
  adminUserId: string,
  entityType: string,
  entityId: string
): Promise<Result<Report[], AdminReportManagementError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get reports for entity
    const reportsResult = await context.reportRepository.findByEntity(entityType, entityId);
    if (reportsResult.isErr()) {
      return err(new AdminReportManagementError("Failed to get entity reports", ERROR_CODES.INTERNAL_ERROR, reportsResult.error));
    }

    return reportsResult;
  } catch (error) {
    return err(new AdminReportManagementError("Unexpected error getting entity reports", ERROR_CODES.INTERNAL_ERROR, error));
  }
}