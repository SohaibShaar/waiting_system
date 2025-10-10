import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";
import { completeQueue } from "./queue.service";

const prisma = new PrismaClient();
// ============================================
// 9️⃣ الشاشة العامة
// ============================================

/**
 * الحصول على آخر الاستدعاءات للشاشة العامة
 */
async function getRecentCalls(limit: number = 10) {
  return await prisma.queueHistory.findMany({
    where: {
      status: { in: [QueueStatus.CALLED, QueueStatus.IN_PROGRESS] },
      calledAt: { not: null },
    },
    include: {
      queue: {
        include: { patient: true },
      },
      station: true,
    },
    orderBy: { calledAt: "desc" },
    take: limit,
  });
}

/**
 * تنسيق البيانات للعرض على الشاشة
 */
async function getDisplayScreenData() {
  const recentCalls = await getRecentCalls(10);

  return recentCalls.map((call) => ({
    queueNumber: call.queue.queueNumber,
    displayNumber: call.station.displayNumber,
    stationName: call.station.name,
    calledAt: call.calledAt,
    status: call.status,
  }));
}

/**
 * تنسيق البيانات للعرض على الشاشة للاستدعاءات المستدعية
 */

async function getDisplayScreenDataCalled() {
  const recentCalls = await getRecentCalls(10);
  const recentCallsInProgress = recentCalls.filter(
    (call) => call.status === QueueStatus.CALLED
  );

  return recentCallsInProgress.map((call) => ({
    queueNumber: call.queue.queueNumber,
    displayNumber: call.station.displayNumber,
    stationName: call.station.name,
    calledAt: call.calledAt,
    status: call.status,
  }));
}

export { getRecentCalls, getDisplayScreenData, getDisplayScreenDataCalled };
