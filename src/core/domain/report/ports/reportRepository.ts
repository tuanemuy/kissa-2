import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type {
  Report,
  CreateReportParams,
  ReviewReportParams,
  ListReportsQuery,
  ReportWithDetails,
  ReportStats,
  ReportStatus,
} from "../types";

export class ReportRepositoryError extends AnyError {
  override readonly name = "ReportRepositoryError";

  constructor(message: string, code?: string, cause?: unknown) {
    super(message, code, cause);
  }
}

export interface ReportRepository {
  create(
    reporterUserId: string,
    params: CreateReportParams
  ): Promise<Result<Report, ReportRepositoryError>>;

  findById(id: string): Promise<Result<Report | null, ReportRepositoryError>>;

  findByEntity(
    entityType: string,
    entityId: string
  ): Promise<Result<Report[], ReportRepositoryError>>;

  findByReporter(
    reporterUserId: string,
    pagination?: { page: number; size: number }
  ): Promise<Result<{ items: Report[]; count: number }, ReportRepositoryError>>;

  checkDuplicateReport(
    reporterUserId: string,
    entityType: string,
    entityId: string
  ): Promise<Result<boolean, ReportRepositoryError>>;

  updateStatus(
    id: string,
    status: ReportStatus,
    reviewedBy?: string,
    reviewNotes?: string
  ): Promise<Result<Report, ReportRepositoryError>>;

  list(
    query: ListReportsQuery
  ): Promise<Result<{ items: Report[]; count: number }, ReportRepositoryError>>;

  listWithDetails(
    query: ListReportsQuery
  ): Promise<Result<{ items: ReportWithDetails[]; count: number }, ReportRepositoryError>>;

  getStats(): Promise<Result<ReportStats, ReportRepositoryError>>;

  delete(id: string): Promise<Result<void, ReportRepositoryError>>;
}