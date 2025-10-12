import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";

const prisma = new PrismaClient();

// ============================================
// 🔟 الإحصائيات
// ============================================

/**
 * إحصائيات اليوم
 */
async function getTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // عدد الأدوار المكتملة
  const completedCount = await prisma.completedVisit.count({
    where: { completedAt: { gte: today } },
  });

  // عدد الأدوار النشطة
  const activeCount = await prisma.queue.count({
    where: {
      status: OverallQueueStatus.ACTIVE,
      createdAt: { gte: today },
    },
  });

  // متوسط أوقات الانتظار والخدمة
  const avgTimes = await prisma.completedVisit.aggregate({
    where: { completedAt: { gte: today } },
    _avg: {
      waitingTime: true,
      serviceTime: true,
      totalDuration: true,
    },
  });

  return {
    date: today,
    completedToday: completedCount,
    activeNow: activeCount,
    totalToday: completedCount + activeCount,
    avgWaitingTime: Math.round(avgTimes._avg.waitingTime || 0),
    avgServiceTime: Math.round(avgTimes._avg.serviceTime || 0),
    avgTotalDuration: Math.round(avgTimes._avg.totalDuration || 0),
  };
}

/**
 * إحصائيات كل محطة
 */
async function getStationStats(stationId?: number) {
  const where = stationId ? { id: stationId } : { isActive: true };

  const stations = await prisma.station.findMany({
    where,
    include: {
      _count: {
        select: {
          queues: {
            where: { status: OverallQueueStatus.ACTIVE },
          },
        },
      },
    },
  });

  return stations.map((station) => ({
    id: station.id,
    name: station.name,
    displayNumber: station.displayNumber,
    waitingCount: station._count.queues,
  }));
}

/**
 * تاريخ زيارات مراجع معين
 */
async function getPatientHistory(patientId: number) {
  return await prisma.completedVisit.findMany({
    where: { patientId },
    orderBy: { completedAt: "desc" },
    take: 10,
  });
}

export { getTodayStats, getStationStats, getPatientHistory };
