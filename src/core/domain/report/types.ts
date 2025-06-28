import { z } from "zod/v4";
import { paginationSchema } from "@/lib/pagination";

export const reportStatusSchema = z.enum([
  "pending",
  "under_review",
  "resolved",
  "dismissed",
]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportTypeSchema = z.enum([
  "spam",
  "inappropriate_content",
  "harassment",
  "false_information",
  "copyright_violation",
  "other",
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportEntityTypeSchema = z.enum([
  "user",
  "place",
  "region",
  "checkin",
]);
export type ReportEntityType = z.infer<typeof reportEntityTypeSchema>;

export const reportSchema = z.object({
  id: z.string().uuid(),
  reporterUserId: z.string().uuid(),
  entityType: reportEntityTypeSchema,
  entityId: z.string().uuid(),
  type: reportTypeSchema,
  reason: z.string().min(1).max(1000),
  status: reportStatusSchema.default("pending"),
  reviewedBy: z.string().uuid().optional(),
  reviewedAt: z.date().optional(),
  reviewNotes: z.string().max(1000).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Report = z.infer<typeof reportSchema>;

export const createReportSchema = z.object({
  entityType: reportEntityTypeSchema,
  entityId: z.string().uuid(),
  type: reportTypeSchema,
  reason: z.string().min(10).max(1000),
});
export type CreateReportParams = z.infer<typeof createReportSchema>;

export const reviewReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  reviewNotes: z.string().max(1000).optional(),
});
export type ReviewReportParams = z.infer<typeof reviewReportSchema>;

export const listReportsQuerySchema = z.object({
  pagination: paginationSchema,
  filter: z
    .object({
      status: reportStatusSchema.optional(),
      type: reportTypeSchema.optional(),
      entityType: reportEntityTypeSchema.optional(),
      reporterUserId: z.string().uuid().optional(),
      entityId: z.string().uuid().optional(),
      dateRange: z
        .object({
          from: z.date(),
          to: z.date(),
        })
        .optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z.enum(["createdAt", "updatedAt", "status"]),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export const reportWithDetailsSchema = reportSchema.extend({
  reporterName: z.string(),
  reporterEmail: z.string().email(),
  entityDetails: z
    .object({
      name: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  reviewerName: z.string().optional(),
});
export type ReportWithDetails = z.infer<typeof reportWithDetailsSchema>;

export const reportStatsSchema = z.object({
  totalReports: z.number().int().min(0),
  pendingReports: z.number().int().min(0),
  underReviewReports: z.number().int().min(0),
  resolvedReports: z.number().int().min(0),
  dismissedReports: z.number().int().min(0),
  reportsThisWeek: z.number().int().min(0),
  reportsThisMonth: z.number().int().min(0),
  topReportTypes: z.array(
    z.object({
      type: reportTypeSchema,
      count: z.number().int().min(0),
    }),
  ),
});
export type ReportStats = z.infer<typeof reportStatsSchema>;
