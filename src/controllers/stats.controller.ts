import { Request, Response } from "express";
import {
  getTodayStats,
  getStationStats,
  getPatientHistory,
} from "../services/stats.service";
import { PrismaClient, OverallQueueStatus } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إحصائيات اليوم
 * GET /api/stats/today
 */
export async function getTodayStatistics(req: Request, res: Response) {
  try {
    const stats = await getTodayStats();

    res.json({
      success: true,
      date: stats.date.toISOString().split("T")[0],
      stats: {
        completedToday: stats.completedToday,
        activeNow: stats.activeNow,
        totalToday: stats.totalToday,
        avgWaitingTime: stats.avgWaitingTime,
        avgServiceTime: stats.avgServiceTime,
        avgTotalDuration: stats.avgTotalDuration,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إحصائيات جميع المحطات
 * GET /api/stats/stations
 */
export async function getAllStationsStats(req: Request, res: Response) {
  try {
    const stationsStats = await getStationStats();

    // الحصول على المراجع الحالي لكل محطة
    const stationsWithCurrent = await Promise.all(
      stationsStats.map(async (station) => {
        const currentQueue = await prisma.queue.findFirst({
          where: {
            currentStationId: station.id,
            status: OverallQueueStatus.ACTIVE,
            history: {
              some: {
                stationId: station.id,
                status: {
                  in: ["CALLED", "IN_PROGRESS"],
                },
              },
            },
          },
          include: {
            patient: true,
          },
        });

        return {
          id: station.id,
          name: station.name,
          displayNumber: station.displayNumber,
          waitingCount: station.waitingCount,
          currentPatient: currentQueue
            ? {
                queueNumber: currentQueue.queueNumber,
                name: currentQueue.patient.name,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      stations: stationsWithCurrent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إحصائيات محطة معينة
 * GET /api/stats/station/:stationId
 */
export async function getStationStatistics(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    const stationStats = await getStationStats(stationId);

    if (stationStats.length === 0) {
      return res.status(404).json({
        success: false,
        error: "المحطة غير موجودة",
      });
    }

    const station = stationStats[0];

    if (!station) {
      return res.status(404).json({
        success: false,
        error: "المحطة غير موجودة",
      });
    }

    // حساب عدد المراجعون الذين تمت خدمتهم اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const servedToday = await prisma.queueHistory.count({
      where: {
        stationId: stationId,
        status: "COMPLETED",
        completedAt: {
          gte: today,
        },
      },
    });

    // حساب متوسط وقت الخدمة يدوياً
    const completedHistories = await prisma.queueHistory.findMany({
      where: {
        stationId: stationId,
        status: "COMPLETED",
        completedAt: {
          gte: today,
        },
        startedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    let totalServiceTime = 0;
    completedHistories.forEach((h) => {
      if (h.startedAt && h.completedAt) {
        totalServiceTime += Math.floor(
          (h.completedAt.getTime() - h.startedAt.getTime()) / 60000
        );
      }
    });

    const avgService =
      completedHistories.length > 0
        ? Math.round(totalServiceTime / completedHistories.length)
        : 0;

    res.json({
      success: true,
      station: {
        id: station.id,
        name: station.name,
        displayNumber: station.displayNumber,
        waitingCount: station.waitingCount,
        servedToday: servedToday,
        avgServiceTime: avgService,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * نظرة عامة شاملة
 * GET /api/stats/overview
 */
export async function getOverviewStats(req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // إحصائيات اليوم
    const todayStats = await getTodayStats();

    // إحصائيات هذا الأسبوع
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    const completedThisWeek = await prisma.completedVisit.count({
      where: {
        completedAt: {
          gte: weekStart,
        },
      },
    });

    const cancelledToday = await prisma.queue.count({
      where: {
        status: OverallQueueStatus.CANCELLED,
        createdAt: {
          gte: today,
        },
      },
    });

    const daysInWeek = Math.ceil(
      (Date.now() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      success: true,
      overview: {
        today: {
          completed: todayStats.completedToday,
          active: todayStats.activeNow,
          cancelled: cancelledToday,
        },
        thisWeek: {
          completed: completedThisWeek,
          avgPerDay: Math.round(completedThisWeek / daysInWeek),
        },
        avgTimes: {
          waiting: todayStats.avgWaitingTime,
          service: todayStats.avgServiceTime,
          total: todayStats.avgTotalDuration,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
