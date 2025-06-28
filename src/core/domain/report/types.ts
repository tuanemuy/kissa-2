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

// Subscription Analytics Types
export const subscriptionPlanEnum = z.enum(["free", "standard", "premium"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanEnum>;

export const subscriptionStatusEnum = z.enum([
  "none",
  "trial",
  "active",
  "expired",
  "cancelled",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export const subscriptionAnalyticsSchema = z.object({
  totalSubscribers: z.number().int().min(0),
  activeSubscribers: z.number().int().min(0),
  trialSubscribers: z.number().int().min(0),
  expiredSubscribers: z.number().int().min(0),
  cancelledSubscribers: z.number().int().min(0),
  newSubscribersThisMonth: z.number().int().min(0),
  newSubscribersThisWeek: z.number().int().min(0),
  churnRate: z.number().min(0).max(100), // Percentage
  conversionRate: z.number().min(0).max(100), // Trial to paid conversion
  averageLifetimeValue: z.number().min(0),
  totalRevenue: z.number().min(0),
  monthlyRecurringRevenue: z.number().min(0),
  planDistribution: z.array(
    z.object({
      plan: subscriptionPlanEnum,
      count: z.number().int().min(0),
      percentage: z.number().min(0).max(100),
    }),
  ),
  statusDistribution: z.array(
    z.object({
      status: subscriptionStatusEnum,
      count: z.number().int().min(0),
      percentage: z.number().min(0).max(100),
    }),
  ),
});
export type SubscriptionAnalytics = z.infer<typeof subscriptionAnalyticsSchema>;

export const subscriptionTrendDataSchema = z.object({
  date: z.date(),
  newSubscriptions: z.number().int().min(0),
  cancellations: z.number().int().min(0),
  revenue: z.number().min(0),
  activeSubscribers: z.number().int().min(0),
});
export type SubscriptionTrendData = z.infer<typeof subscriptionTrendDataSchema>;

export const subscriptionReportQuerySchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  plan: subscriptionPlanEnum.optional(),
  status: subscriptionStatusEnum.optional(),
  granularity: z.enum(["daily", "weekly", "monthly"]).default("daily"),
});
export type SubscriptionReportQuery = z.infer<
  typeof subscriptionReportQuerySchema
>;

export const userActivityAnalyticsSchema = z.object({
  totalUsers: z.number().int().min(0),
  activeUsers: z.number().int().min(0),
  inactiveUsers: z.number().int().min(0),
  newUsersThisMonth: z.number().int().min(0),
  newUsersThisWeek: z.number().int().min(0),
  totalCheckins: z.number().int().min(0),
  checkinsThisMonth: z.number().int().min(0),
  totalPlaces: z.number().int().min(0),
  placesThisMonth: z.number().int().min(0),
  totalRegions: z.number().int().min(0),
  regionsThisMonth: z.number().int().min(0),
  averageCheckinsPerUser: z.number().min(0),
  topActiveUsers: z.array(
    z.object({
      userId: z.string().uuid(),
      userName: z.string(),
      checkinCount: z.number().int().min(0),
      placeCount: z.number().int().min(0),
    }),
  ),
});
export type UserActivityAnalytics = z.infer<typeof userActivityAnalyticsSchema>;

export const contentAnalyticsSchema = z.object({
  totalRegions: z.number().int().min(0),
  publishedRegions: z.number().int().min(0),
  draftRegions: z.number().int().min(0),
  archivedRegions: z.number().int().min(0),
  totalPlaces: z.number().int().min(0),
  publishedPlaces: z.number().int().min(0),
  draftPlaces: z.number().int().min(0),
  archivedPlaces: z.number().int().min(0),
  totalCheckins: z.number().int().min(0),
  checkinsWithPhotos: z.number().int().min(0),
  checkinsWithRatings: z.number().int().min(0),
  averageRating: z.number().min(0).max(5),
  topCategories: z.array(
    z.object({
      category: z.string(),
      count: z.number().int().min(0),
    }),
  ),
  topRegions: z.array(
    z.object({
      regionId: z.string().uuid(),
      regionName: z.string(),
      placeCount: z.number().int().min(0),
      checkinCount: z.number().int().min(0),
    }),
  ),
});
export type ContentAnalytics = z.infer<typeof contentAnalyticsSchema>;
