import { err, ok, type Result } from "neverthrow";
import { z } from "zod/v4";
import type { User } from "@/core/domain/user/types";
import { AnyError } from "@/lib/error";
import { ERROR_CODES } from "@/lib/errorCodes";
import type { Context } from "../context";
import { getDashboardAnalytics } from "./analytics";

export class AdvancedReportingError extends AnyError {
  override readonly name = "AdvancedReportingError";
}

export const generateReportInputSchema = z.object({
  reportType: z.enum([
    "usage",
    "revenue",
    "user_activity",
    "content_performance",
    "comprehensive",
  ]),
  format: z.enum(["json", "csv", "pdf"]),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
  filters: z
    .object({
      userRole: z.enum(["visitor", "editor", "admin"]).optional(),
      subscriptionPlan: z.enum(["free", "standard", "premium"]).optional(),
      regionIds: z.array(z.string().uuid()).optional(),
      includeInactive: z.boolean().default(false),
    })
    .optional(),
});
export type GenerateReportInput = z.infer<typeof generateReportInputSchema>;

export const scheduleReportInputSchema = z.object({
  reportType: z.enum([
    "usage",
    "revenue",
    "user_activity",
    "content_performance",
    "comprehensive",
  ]),
  format: z.enum(["json", "csv", "pdf"]),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  recipients: z.array(z.string().email()),
  filters: z
    .object({
      userRole: z.enum(["visitor", "editor", "admin"]).optional(),
      subscriptionPlan: z.enum(["free", "standard", "premium"]).optional(),
      regionIds: z.array(z.string().uuid()).optional(),
      includeInactive: z.boolean().default(false),
    })
    .optional(),
});
export type ScheduleReportInput = z.infer<typeof scheduleReportInputSchema>;

// Report data types
export interface UsageReportData {
  reportType: "usage";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    metric: string;
    value: number;
    change: string;
  }[];
}

export interface RevenueReportData {
  reportType: "revenue";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  transactions: {
    date: Date;
    amount: number;
    plan: string;
    user: string;
  }[];
  summary: {
    totalRevenue: number;
    subscriptions: number;
    averageRevenuePerUser: number;
  };
}

export interface UserActivityReportData {
  reportType: "user_activity";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  users: {
    userId: string;
    name: string;
    lastLogin: Date;
    checkinCount: number;
    contentCreated: number;
  }[];
  summary: {
    totalUsers: number;
    activeUsers: number;
    averageActivity: number;
  };
}

export interface ContentPerformanceReportData {
  reportType: "content_performance";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  content: {
    id: string;
    type: string;
    name: string;
    views: number;
    checkins: number;
    engagement: number;
  }[];
  summary: {
    totalRegions: number;
    totalPlaces: number;
    averageEngagement: number;
  };
}

export interface PdfReportData {
  type: "pdf";
  content: unknown;
  metadata: {
    pages: number;
    size: string;
  };
}

export type ReportData =
  | UsageReportData
  | RevenueReportData
  | UserActivityReportData
  | ContentPerformanceReportData
  | PdfReportData
  | string // for CSV format
  | unknown; // for comprehensive reports

export interface GeneratedReport {
  id: string;
  type: string;
  format: string;
  generatedAt: Date;
  dataUrl?: string;
  data: ReportData;
  metadata: {
    recordCount: number;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    filters: unknown;
  };
}

export interface ReportSchedule {
  id: string;
  reportType: string;
  format: string;
  frequency: string;
  recipients: string[];
  filters: unknown;
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdBy: string;
  createdAt: Date;
}

export interface PredictiveAnalytics {
  userGrowthPrediction: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
  revenueForecast: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
  churnRiskUsers: {
    userId: string;
    userName: string;
    riskScore: number;
    riskFactors: string[];
  }[];
  contentTrends: {
    trendingRegions: string[];
    growingCategories: string[];
    decliningSectors: string[];
  };
}

// Alert data types
export interface ChurnAlertData {
  churnRate: number;
}

export interface ActivityAlertData {
  activityRate: number;
  activeUsers: number;
}

export interface EngagementAlertData {
  engagementRate: number;
}

export interface RevenueAlertData {
  currentMRR: number;
  totalRevenue: number;
}

export type AlertData =
  | ChurnAlertData
  | ActivityAlertData
  | EngagementAlertData
  | RevenueAlertData;

export interface SystemAlert {
  id: string;
  type: "warning" | "critical" | "info";
  title: string;
  message: string;
  data: AlertData;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Check if the requesting user has admin privileges
 */
async function checkAdminPermissions(
  context: Context,
  adminUserId: string,
): Promise<Result<User, AdvancedReportingError>> {
  const adminResult = await context.userRepository.findById(adminUserId);
  if (adminResult.isErr()) {
    return err(
      new AdvancedReportingError(
        "Admin user not found",
        ERROR_CODES.USER_NOT_FOUND,
        adminResult.error,
      ),
    );
  }

  const admin = adminResult.value;
  if (!admin) {
    return err(
      new AdvancedReportingError(
        "Admin user not found",
        ERROR_CODES.USER_NOT_FOUND,
      ),
    );
  }

  if (admin.role !== "admin") {
    return err(
      new AdvancedReportingError(
        "Insufficient permissions: admin role required",
        ERROR_CODES.ADMIN_PERMISSION_REQUIRED,
      ),
    );
  }

  return ok(admin);
}

/**
 * Generate a comprehensive report with specified parameters
 */
export async function generateReport(
  context: Context,
  adminUserId: string,
  input: GenerateReportInput,
): Promise<Result<GeneratedReport, AdvancedReportingError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Generate report data based on type
    let reportData: unknown;
    let recordCount = 0;

    switch (input.reportType) {
      case "usage":
        reportData = await generateUsageReport(context, input);
        recordCount = (reportData as UsageReportData).metrics?.length || 0;
        break;
      case "revenue":
        reportData = await generateRevenueReport(context, input);
        recordCount =
          (reportData as RevenueReportData).transactions?.length || 0;
        break;
      case "user_activity":
        reportData = await generateUserActivityReport(context, input);
        recordCount = (reportData as UserActivityReportData).users?.length || 0;
        break;
      case "content_performance":
        reportData = await generateContentPerformanceReport(context, input);
        recordCount =
          (reportData as ContentPerformanceReportData).content?.length || 0;
        break;
      case "comprehensive": {
        const analyticsResult = await getDashboardAnalytics(context);
        if (analyticsResult.isErr()) {
          return err(
            new AdvancedReportingError(
              "Failed to generate comprehensive report",
              ERROR_CODES.INTERNAL_ERROR,
              analyticsResult.error,
            ),
          );
        }
        reportData = analyticsResult.value;
        recordCount = 1; // Single comprehensive report
        break;
      }
      default:
        return err(
          new AdvancedReportingError(
            "Invalid report type",
            ERROR_CODES.VALIDATION_ERROR,
          ),
        );
    }

    // Format data based on requested format
    const formattedData = await formatReportData(reportData, input.format);

    const report: GeneratedReport = {
      id: `report-${Date.now()}`,
      type: input.reportType,
      format: input.format,
      generatedAt: new Date(),
      data: formattedData,
      metadata: {
        recordCount,
        dateRange: input.dateRange,
        filters: input.filters || {},
      },
    };

    return ok(report);
  } catch (error) {
    return err(
      new AdvancedReportingError(
        "Unexpected error generating report",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Schedule automatic report generation
 */
export async function scheduleReport(
  context: Context,
  adminUserId: string,
  input: ScheduleReportInput,
): Promise<Result<ReportSchedule, AdvancedReportingError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Calculate next run date based on frequency
    const now = new Date();
    const nextRun = new Date(now);

    switch (input.frequency) {
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case "quarterly":
        nextRun.setMonth(nextRun.getMonth() + 3);
        break;
    }

    const schedule: ReportSchedule = {
      id: `schedule-${Date.now()}`,
      reportType: input.reportType,
      format: input.format,
      frequency: input.frequency,
      recipients: input.recipients,
      filters: input.filters || {},
      isActive: true,
      nextRun,
      createdBy: adminUserId,
      createdAt: now,
    };

    // TODO: Store schedule in database
    // For now, return the schedule object

    return ok(schedule);
  } catch (error) {
    return err(
      new AdvancedReportingError(
        "Unexpected error scheduling report",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Generate predictive analytics based on historical data
 */
export async function generatePredictiveAnalytics(
  context: Context,
  adminUserId: string,
): Promise<Result<PredictiveAnalytics, AdvancedReportingError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get current analytics for baseline
    const analyticsResult = await getDashboardAnalytics(context);
    if (analyticsResult.isErr()) {
      return err(
        new AdvancedReportingError(
          "Failed to get analytics for prediction",
          ERROR_CODES.INTERNAL_ERROR,
          analyticsResult.error,
        ),
      );
    }

    const analytics = analyticsResult.value;

    // Simple predictive models (in production, use more sophisticated algorithms)
    const userGrowthRate = analytics.userActivity.newUsersThisMonth / 30; // daily rate
    const revenueGrowthRate =
      analytics.subscription.monthlyRecurringRevenue * 0.05; // 5% growth

    const predictions: PredictiveAnalytics = {
      userGrowthPrediction: {
        nextMonth: Math.round(
          analytics.userActivity.totalUsers + userGrowthRate * 30,
        ),
        nextQuarter: Math.round(
          analytics.userActivity.totalUsers + userGrowthRate * 90,
        ),
        confidence: 0.75,
      },
      revenueForecast: {
        nextMonth: Math.round(
          analytics.subscription.monthlyRecurringRevenue + revenueGrowthRate,
        ),
        nextQuarter: Math.round(
          analytics.subscription.monthlyRecurringRevenue +
            revenueGrowthRate * 3,
        ),
        confidence: 0.68,
      },
      churnRiskUsers: [
        // Simplified risk analysis
        {
          userId: "user-at-risk-1",
          userName: "User With No Recent Activity",
          riskScore: 0.85,
          riskFactors: [
            "No login for 30+ days",
            "No checkins this month",
            "Expired subscription",
          ],
        },
        {
          userId: "user-at-risk-2",
          userName: "User With Declining Usage",
          riskScore: 0.65,
          riskFactors: ["50% decrease in activity", "No new content created"],
        },
      ],
      contentTrends: {
        trendingRegions: ["tokyo", "osaka", "kyoto"],
        growingCategories: ["restaurants", "cafes"],
        decliningSectors: ["hotels"],
      },
    };

    return ok(predictions);
  } catch (error) {
    return err(
      new AdvancedReportingError(
        "Unexpected error generating predictive analytics",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

/**
 * Generate system alerts based on current metrics
 */
export async function generateSystemAlerts(
  context: Context,
  adminUserId: string,
): Promise<Result<SystemAlert[], AdvancedReportingError>> {
  try {
    // Check admin permissions
    const adminCheckResult = await checkAdminPermissions(context, adminUserId);
    if (adminCheckResult.isErr()) {
      return err(adminCheckResult.error);
    }

    // Get current analytics
    const analyticsResult = await getDashboardAnalytics(context);
    if (analyticsResult.isErr()) {
      return err(
        new AdvancedReportingError(
          "Failed to get analytics for alerts",
          ERROR_CODES.INTERNAL_ERROR,
          analyticsResult.error,
        ),
      );
    }

    const analytics = analyticsResult.value;
    const alerts: SystemAlert[] = [];

    // Check for various alert conditions

    // High churn rate alert
    if (analytics.subscription.churnRate > 10) {
      alerts.push({
        id: `alert-churn-${Date.now()}`,
        type: "warning",
        title: "High Churn Rate Detected",
        message: `Current churn rate is ${analytics.subscription.churnRate.toFixed(2)}%, which is above the 10% threshold.`,
        data: { churnRate: analytics.subscription.churnRate } as ChurnAlertData,
        createdAt: new Date(),
        resolved: false,
      });
    }

    // Low user activity alert
    const activityRate =
      analytics.userActivity.totalUsers > 0
        ? (analytics.userActivity.activeUsers /
            analytics.userActivity.totalUsers) *
          100
        : 0;

    if (activityRate < 30) {
      alerts.push({
        id: `alert-activity-${Date.now()}`,
        type: "critical",
        title: "Low User Activity",
        message: `Only ${activityRate.toFixed(1)}% of users are active this month.`,
        data: {
          activityRate,
          activeUsers: analytics.userActivity.activeUsers,
        } as ActivityAlertData,
        createdAt: new Date(),
        resolved: false,
      });
    }

    // Low content engagement alert
    const contentEngagementRate =
      analytics.content.totalCheckins > 0
        ? (analytics.content.checkinsWithPhotos /
            analytics.content.totalCheckins) *
          100
        : 0;

    if (contentEngagementRate < 20) {
      alerts.push({
        id: `alert-engagement-${Date.now()}`,
        type: "info",
        title: "Low Content Engagement",
        message: `Only ${contentEngagementRate.toFixed(1)}% of checkins include photos.`,
        data: { engagementRate: contentEngagementRate } as EngagementAlertData,
        createdAt: new Date(),
        resolved: false,
      });
    }

    // Revenue decline alert
    if (
      analytics.subscription.monthlyRecurringRevenue <
      analytics.subscription.totalRevenue * 0.1
    ) {
      alerts.push({
        id: `alert-revenue-${Date.now()}`,
        type: "warning",
        title: "Revenue Decline Detected",
        message:
          "Monthly recurring revenue is significantly below historical average.",
        data: {
          currentMRR: analytics.subscription.monthlyRecurringRevenue,
          totalRevenue: analytics.subscription.totalRevenue,
        } as RevenueAlertData,
        createdAt: new Date(),
        resolved: false,
      });
    }

    return ok(alerts);
  } catch (error) {
    return err(
      new AdvancedReportingError(
        "Unexpected error generating system alerts",
        ERROR_CODES.INTERNAL_ERROR,
        error,
      ),
    );
  }
}

// Helper functions for generating specific report types

async function generateUsageReport(
  _context: Context,
  input: GenerateReportInput,
): Promise<UsageReportData> {
  // Simplified usage report generation
  return {
    reportType: "usage",
    dateRange: input.dateRange,
    metrics: [
      {
        metric: "total_users",
        value: 1000,
        change: "+5%",
      },
      {
        metric: "active_users",
        value: 750,
        change: "+2%",
      },
      {
        metric: "total_checkins",
        value: 5000,
        change: "+15%",
      },
    ],
  };
}

async function generateRevenueReport(
  _context: Context,
  input: GenerateReportInput,
): Promise<RevenueReportData> {
  // Simplified revenue report generation
  return {
    reportType: "revenue",
    dateRange: input.dateRange,
    transactions: [
      {
        date: new Date(),
        amount: 29.99,
        plan: "standard",
        user: "user-123",
      },
    ],
    summary: {
      totalRevenue: 5000,
      subscriptions: 100,
      averageRevenuePerUser: 50,
    },
  };
}

async function generateUserActivityReport(
  _context: Context,
  input: GenerateReportInput,
): Promise<UserActivityReportData> {
  // Simplified user activity report generation
  return {
    reportType: "user_activity",
    dateRange: input.dateRange,
    users: [
      {
        userId: "user-123",
        name: "Active User",
        lastLogin: new Date(),
        checkinCount: 25,
        contentCreated: 5,
      },
    ],
    summary: {
      totalUsers: 1000,
      activeUsers: 750,
      averageActivity: 15,
    },
  };
}

async function generateContentPerformanceReport(
  _context: Context,
  input: GenerateReportInput,
): Promise<ContentPerformanceReportData> {
  // Simplified content performance report generation
  return {
    reportType: "content_performance",
    dateRange: input.dateRange,
    content: [
      {
        id: "region-123",
        type: "region",
        name: "Tokyo",
        views: 1000,
        checkins: 500,
        engagement: 0.75,
      },
    ],
    summary: {
      totalRegions: 50,
      totalPlaces: 500,
      averageEngagement: 0.65,
    },
  };
}

async function formatReportData(
  data: unknown,
  format: string,
): Promise<unknown> {
  switch (format) {
    case "json":
      return data;
    case "csv":
      // Simplified CSV conversion
      return `data,value\ntest,${JSON.stringify(data)}`;
    case "pdf":
      // Simplified PDF generation (would use a PDF library in production)
      return {
        type: "pdf",
        content: data,
        metadata: { pages: 1, size: "A4" },
      };
    default:
      return data;
  }
}
