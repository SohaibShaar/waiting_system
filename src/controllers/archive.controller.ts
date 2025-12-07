import { Request, Response } from "express";
import {
  getArchivedQueues,
  getArchiveStats,
  performDailyArchive,
} from "../services/archive.service";
import { OverallQueueStatus } from "../generated/prisma";

/**
 * جلب البيانات المؤرشفة
 * GET /api/archive/queues
 */
export async function getArchivedQueuesHandler(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const search = req.query.search as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const status = req.query.status as OverallQueueStatus | undefined;

    const filters: {
      page: number;
      limit: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      status?: OverallQueueStatus;
    } = {
      page,
      limit,
    };

    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const result = await getArchivedQueues(filters);

    res.json({
      success: true,
      data: result.queues,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("❌ خطأ في جلب البيانات المؤرشفة:", error);
    res.status(500).json({
      success: false,
      error: error.message || "حدث خطأ في جلب البيانات المؤرشفة",
    });
  }
}

/**
 * الحصول على إحصائيات الأرشيف
 * GET /api/archive/stats
 */
export async function getArchiveStatsHandler(req: Request, res: Response) {
  try {
    const stats = await getArchiveStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("❌ خطأ في جلب إحصائيات الأرشيف:", error);
    res.status(500).json({
      success: false,
      error: error.message || "حدث خطأ في جلب إحصائيات الأرشيف",
    });
  }
}

/**
 * تشغيل عملية الأرشفة يدوياً
 * POST /api/archive/perform
 */
export async function performArchiveHandler(req: Request, res: Response) {
  try {
    const result = await performDailyArchive();

    res.json({
      success: result.success,
      message: result.message,
      archivedCount: result.archivedCount,
    });
  } catch (error: any) {
    console.error("❌ خطأ في عملية الأرشفة:", error);
    res.status(500).json({
      success: false,
      error: error.message || "حدث خطأ في عملية الأرشفة",
    });
  }
}

