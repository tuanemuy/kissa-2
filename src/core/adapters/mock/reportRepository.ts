import { err, ok, type Result } from "neverthrow";
import { v7 as uuidv7 } from "uuid";
import {
  type ReportRepository,
  ReportRepositoryError,
} from "@/core/domain/report/ports/reportRepository";
import type {
  CreateReportParams,
  ListReportsQuery,
  Report,
  ReportStats,
  ReportStatus,
  ReportType,
  ReportWithDetails,
} from "@/core/domain/report/types";

export class MockReportRepository implements ReportRepository {
  private reports = new Map<string, Report>();
  private nextId = 1;

  constructor(initialReports: Report[] = []) {
    for (const report of initialReports) {
      this.reports.set(report.id, report);
    }
  }

  reset(): void {
    this.reports.clear();
    this.nextId = 1;
  }

  addReport(report: Report): void {
    this.reports.set(report.id, report);
  }

  async create(
    reporterUserId: string,
    params: CreateReportParams,
  ): Promise<Result<Report, ReportRepositoryError>> {
    const now = new Date();
    const report: Report = {
      id: uuidv7(),
      reporterUserId,
      entityType: params.entityType,
      entityId: params.entityId,
      type: params.type,
      reason: params.reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    this.reports.set(report.id, report);
    return ok(report);
  }

  async findById(
    id: string,
  ): Promise<Result<Report | null, ReportRepositoryError>> {
    const report = this.reports.get(id) || null;
    return ok(report);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<Result<Report[], ReportRepositoryError>> {
    const reports = Array.from(this.reports.values()).filter(
      (r) => r.entityType === entityType && r.entityId === entityId,
    );
    return ok(reports);
  }

  async findByReporter(
    reporterUserId: string,
    pagination?: { page: number; size: number },
  ): Promise<
    Result<{ items: Report[]; count: number }, ReportRepositoryError>
  > {
    const reports = Array.from(this.reports.values()).filter(
      (r) => r.reporterUserId === reporterUserId,
    );

    if (pagination) {
      const start = (pagination.page - 1) * pagination.size;
      const end = start + pagination.size;
      const items = reports.slice(start, end);
      return ok({ items, count: reports.length });
    }

    return ok({ items: reports, count: reports.length });
  }

  async checkDuplicateReport(
    reporterUserId: string,
    entityType: string,
    entityId: string,
  ): Promise<Result<boolean, ReportRepositoryError>> {
    const duplicate = Array.from(this.reports.values()).some(
      (r) =>
        r.reporterUserId === reporterUserId &&
        r.entityType === entityType &&
        r.entityId === entityId,
    );
    return ok(duplicate);
  }

  async updateStatus(
    id: string,
    status: ReportStatus,
    reviewedBy?: string,
    reviewNotes?: string,
  ): Promise<Result<Report, ReportRepositoryError>> {
    const report = this.reports.get(id);
    if (!report) {
      return err(
        new ReportRepositoryError("Report not found", "REPORT_NOT_FOUND"),
      );
    }

    const updatedReport: Report = {
      ...report,
      status,
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes,
      updatedAt: new Date(),
    };

    this.reports.set(id, updatedReport);
    return ok(updatedReport);
  }

  async list(
    query: ListReportsQuery,
  ): Promise<
    Result<{ items: Report[]; count: number }, ReportRepositoryError>
  > {
    let reports = Array.from(this.reports.values());

    // Apply filters
    if (query.filter) {
      if (query.filter.status) {
        reports = reports.filter((r) => r.status === query.filter?.status);
      }
      if (query.filter.type) {
        reports = reports.filter((r) => r.type === query.filter?.type);
      }
      if (query.filter.entityType) {
        reports = reports.filter(
          (r) => r.entityType === query.filter?.entityType,
        );
      }
      if (query.filter.reporterUserId) {
        reports = reports.filter(
          (r) => r.reporterUserId === query.filter?.reporterUserId,
        );
      }
      if (query.filter.entityId) {
        reports = reports.filter((r) => r.entityId === query.filter?.entityId);
      }
      if (query.filter.dateRange) {
        reports = reports.filter(
          (r) =>
            query.filter?.dateRange?.from &&
            query.filter?.dateRange?.to &&
            r.createdAt >= query.filter.dateRange.from &&
            r.createdAt <= query.filter.dateRange.to,
        );
      }
    }

    // Apply sorting
    if (query.sort?.field) {
      const { field, direction } = query.sort;
      reports.sort((a, b) => {
        const aValue = a[field as keyof Report];
        const bValue = b[field as keyof Report];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === "asc" ? -1 : 1;
        if (bValue == null) return direction === "asc" ? 1 : -1;
        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const { page, limit } = query.pagination;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = reports.slice(start, end);

    return ok({ items, count: reports.length });
  }

  async listWithDetails(
    query: ListReportsQuery,
  ): Promise<
    Result<{ items: ReportWithDetails[]; count: number }, ReportRepositoryError>
  > {
    const listResult = await this.list(query);
    if (listResult.isErr()) {
      return err(listResult.error);
    }

    const { items: reports, count } = listResult.value;
    const itemsWithDetails: ReportWithDetails[] = reports.map((report) => ({
      ...report,
      reporterName: `Reporter ${report.reporterUserId.slice(0, 8)}`,
      reporterEmail: `reporter${report.reporterUserId.slice(0, 8)}@example.com`,
      entityDetails: {
        name: `Entity ${report.entityId.slice(0, 8)}`,
        title: `Entity Title ${report.entityId.slice(0, 8)}`,
      },
      reviewerName: report.reviewedBy
        ? `Reviewer ${report.reviewedBy.slice(0, 8)}`
        : undefined,
    }));

    return ok({ items: itemsWithDetails, count });
  }

  async getStats(): Promise<Result<ReportStats, ReportRepositoryError>> {
    const reports = Array.from(this.reports.values());
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: ReportStats = {
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === "pending").length,
      underReviewReports: reports.filter((r) => r.status === "under_review")
        .length,
      resolvedReports: reports.filter((r) => r.status === "resolved").length,
      dismissedReports: reports.filter((r) => r.status === "dismissed").length,
      reportsThisWeek: reports.filter((r) => r.createdAt >= oneWeekAgo).length,
      reportsThisMonth: reports.filter((r) => r.createdAt >= oneMonthAgo)
        .length,
      topReportTypes: [],
    };

    // Calculate top report types
    const typeCounts = new Map<string, number>();
    for (const report of reports) {
      typeCounts.set(report.type, (typeCounts.get(report.type) || 0) + 1);
    }

    stats.topReportTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type: type as ReportType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return ok(stats);
  }

  async delete(id: string): Promise<Result<void, ReportRepositoryError>> {
    if (!this.reports.has(id)) {
      return err(
        new ReportRepositoryError("Report not found", "REPORT_NOT_FOUND"),
      );
    }

    this.reports.delete(id);
    return ok(undefined);
  }
}
