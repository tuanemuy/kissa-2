import { and, count, desc, eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  type ReportRepository,
  ReportRepositoryError,
} from "@/core/domain/report/ports/reportRepository";
import type {
  CreateReportParams,
  ListReportsQuery,
  Report,
  ReportEntityType,
  ReportStats,
  ReportStatus,
  ReportWithDetails,
} from "@/core/domain/report/types";
import { reportSchema } from "@/core/domain/report/types";
import { validate } from "@/lib/validation";
import type { Database } from "./client";
import { reports } from "./schema";

export class DrizzlePgliteReportRepository implements ReportRepository {
  constructor(private readonly db: Database) {}

  async create(
    reporterUserId: string,
    params: CreateReportParams,
  ): Promise<Result<Report, ReportRepositoryError>> {
    try {
      const result = await this.db
        .insert(reports)
        .values({
          reporterUserId,
          entityType: params.entityType,
          entityId: params.entityId,
          type: params.type,
          reason: params.reason,
        })
        .returning();

      const report = result[0];
      if (!report) {
        return err(new ReportRepositoryError("Failed to create report"));
      }

      return validate(reportSchema, report).mapErr((error) => {
        return new ReportRepositoryError(
          "Invalid report data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new ReportRepositoryError("Failed to create report", undefined, error),
      );
    }
  }

  async findById(
    id: string,
  ): Promise<Result<Report | null, ReportRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return validate(reportSchema, result[0]).mapErr((error) => {
        return new ReportRepositoryError(
          "Invalid report data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new ReportRepositoryError("Failed to find report", undefined, error),
      );
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Result<Report[], ReportRepositoryError>> {
    try {
      const result = await this.db
        .select()
        .from(reports)
        .where(
          and(
            eq(reports.entityType, entityType as ReportEntityType),
            eq(reports.entityId, entityId),
          ),
        )
        .orderBy(desc(reports.createdAt));

      const validatedReports = result
        .map((report) => validate(reportSchema, report).unwrapOr(null))
        .filter((report) => report !== null);

      return ok(validatedReports);
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to find reports by entity",
          undefined,
          error,
        ),
      );
    }
  }

  async findByReporter(
    reporterUserId: string,
    pagination?: { page: number; size: number },
  ): Promise<
    Result<{ items: Report[]; count: number }, ReportRepositoryError>
  > {
    try {
      const limit = pagination?.size || 20;
      const offset = pagination ? (pagination.page - 1) * pagination.size : 0;

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(reports)
          .where(eq(reports.reporterUserId, reporterUserId))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(reports.createdAt)),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(eq(reports.reporterUserId, reporterUserId)),
      ]);

      const validatedItems = items
        .map((item) => validate(reportSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to find reports by reporter",
          undefined,
          error,
        ),
      );
    }
  }

  async checkDuplicateReport(
    reporterUserId: string,
    entityType: string,
    entityId: string,
  ): Promise<Result<boolean, ReportRepositoryError>> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(reports)
        .where(
          and(
            eq(reports.reporterUserId, reporterUserId),
            eq(reports.entityType, entityType as ReportEntityType),
            eq(reports.entityId, entityId),
          ),
        );

      const reportCount = Number(result[0]?.count || 0);
      return ok(reportCount > 0);
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to check duplicate report",
          undefined,
          error,
        ),
      );
    }
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    reviewedBy?: string,
    reviewNotes?: string,
  ): Promise<Result<Report, ReportRepositoryError>> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        reviewedAt: new Date(),
      };

      if (reviewedBy) {
        updateData.reviewedBy = reviewedBy;
      }

      if (reviewNotes) {
        updateData.reviewNotes = reviewNotes;
      }

      const result = await this.db
        .update(reports)
        .set(updateData)
        .where(eq(reports.id, id))
        .returning();

      const report = result[0];
      if (!report) {
        return err(new ReportRepositoryError("Report not found"));
      }

      return validate(reportSchema, report).mapErr((error) => {
        return new ReportRepositoryError(
          "Invalid report data",
          undefined,
          error,
        );
      });
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to update report status",
          undefined,
          error,
        ),
      );
    }
  }

  async list(
    query: ListReportsQuery,
  ): Promise<
    Result<{ items: Report[]; count: number }, ReportRepositoryError>
  > {
    try {
      const { pagination, filter, sort } = query;
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      const filters = [
        filter?.status ? eq(reports.status, filter.status) : undefined,
        filter?.type ? eq(reports.type, filter.type) : undefined,
        filter?.entityType
          ? eq(reports.entityType, filter.entityType)
          : undefined,
        filter?.reporterUserId
          ? eq(reports.reporterUserId, filter.reporterUserId)
          : undefined,
        filter?.entityId ? eq(reports.entityId, filter.entityId) : undefined,
        filter?.dateRange?.from
          ? sql`${reports.createdAt} >= ${filter.dateRange.from}`
          : undefined,
        filter?.dateRange?.to
          ? sql`${reports.createdAt} <= ${filter.dateRange.to}`
          : undefined,
      ].filter((filter) => filter !== undefined);

      const whereCondition = filters.length > 0 ? and(...filters) : sql`1=1`;

      const orderBy = sort?.field
        ? sort.direction === "desc"
          ? desc(reports[sort.field])
          : reports[sort.field]
        : desc(reports.createdAt);

      const [items, countResult] = await Promise.all([
        this.db
          .select()
          .from(reports)
          .where(whereCondition)
          .limit(limit)
          .offset(offset)
          .orderBy(orderBy),
        this.db.select({ count: count() }).from(reports).where(whereCondition),
      ]);

      const validatedItems = items
        .map((item) => validate(reportSchema, item).unwrapOr(null))
        .filter((item) => item !== null);

      return ok({
        items: validatedItems,
        count: Number(countResult[0]?.count || 0),
      });
    } catch (error) {
      return err(
        new ReportRepositoryError("Failed to list reports", undefined, error),
      );
    }
  }

  async listWithDetails(
    query: ListReportsQuery,
  ): Promise<
    Result<{ items: ReportWithDetails[]; count: number }, ReportRepositoryError>
  > {
    try {
      // This is a simplified implementation - in production you would join with
      // the related tables to get entity details
      const listResult = await this.list(query);

      if (listResult.isErr()) {
        return err(listResult.error);
      }

      const { items, count } = listResult.value;

      // Convert to ReportWithDetails format
      // In production, this would include joined data from user tables and entity tables
      const detailedItems: ReportWithDetails[] = items.map((report) => ({
        ...report,
        reporterName: "Unknown User", // Would be joined from users table
        reporterEmail: "unknown@example.com", // Would be joined from users table
        entityDetails: undefined, // Would be joined from entity tables
        reviewerName: report.reviewedBy ? "Unknown Reviewer" : undefined,
      }));

      return ok({
        items: detailedItems,
        count,
      });
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to list reports with details",
          undefined,
          error,
        ),
      );
    }
  }

  async getStats(): Promise<Result<ReportStats, ReportRepositoryError>> {
    try {
      const [
        totalResult,
        pendingResult,
        underReviewResult,
        resolvedResult,
        dismissedResult,
        weeklyResult,
        monthlyResult,
      ] = await Promise.all([
        this.db.select({ count: count() }).from(reports),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(eq(reports.status, "pending")),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(eq(reports.status, "under_review")),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(eq(reports.status, "resolved")),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(eq(reports.status, "dismissed")),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(sql`${reports.createdAt} >= NOW() - INTERVAL '7 days'`),
        this.db
          .select({ count: count() })
          .from(reports)
          .where(sql`${reports.createdAt} >= NOW() - INTERVAL '30 days'`),
      ]);

      // Get top report types
      const topTypesResult = await this.db
        .select({
          type: reports.type,
          count: count(),
        })
        .from(reports)
        .groupBy(reports.type)
        .orderBy(desc(count()))
        .limit(5);

      const stats: ReportStats = {
        totalReports: Number(totalResult[0]?.count || 0),
        pendingReports: Number(pendingResult[0]?.count || 0),
        underReviewReports: Number(underReviewResult[0]?.count || 0),
        resolvedReports: Number(resolvedResult[0]?.count || 0),
        dismissedReports: Number(dismissedResult[0]?.count || 0),
        reportsThisWeek: Number(weeklyResult[0]?.count || 0),
        reportsThisMonth: Number(monthlyResult[0]?.count || 0),
        topReportTypes: topTypesResult.map((item) => ({
          type: item.type,
          count: Number(item.count),
        })),
      };

      return ok(stats);
    } catch (error) {
      return err(
        new ReportRepositoryError(
          "Failed to get report stats",
          undefined,
          error,
        ),
      );
    }
  }

  async delete(id: string): Promise<Result<void, ReportRepositoryError>> {
    try {
      await this.db.delete(reports).where(eq(reports.id, id));
      return ok(undefined);
    } catch (error) {
      return err(
        new ReportRepositoryError("Failed to delete report", undefined, error),
      );
    }
  }
}
