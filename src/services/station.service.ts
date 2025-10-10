import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";
import { completeQueue } from "./queue.service";

const prisma = new PrismaClient();
// ============================================
// 7️⃣ إدارة الخدمة
// ============================================

/**
 * بدء تقديم الخدمة للمريض
 */
async function startService(queueId: number, stationId: number) {
  const updated = await prisma.queueHistory.updateMany({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: QueueStatus.CALLED,
    },
    data: {
      status: QueueStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return {
      success: false,
      message: "❌ لم يتم العثور على دور مُستدعى",
    };
  }

  console.log(`▶️ بدأت الخدمة للدور #${queueId}`);

  return { success: true };
}

/**
 * إنهاء الخدمة في المحطة الحالية والانتقال للتالية
 */
async function completeStationService(
  queueId: number,
  stationId: number,
  notes?: string
) {
  // 1. إنهاء الخدمة في المحطة الحالية
  await prisma.queueHistory.updateMany({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: QueueStatus.IN_PROGRESS,
    },
    data: {
      status: QueueStatus.COMPLETED,
      completedAt: new Date(),
      ...(notes && { notes }),
    },
  });

  // 2. الحصول على المحطة الحالية
  const currentStation = await prisma.station.findUnique({
    where: { id: stationId },
  });

  if (!currentStation) {
    throw new Error("❌ المحطة غير موجودة");
  }

  // 3. البحث عن المحطة التالية
  const nextStation = await prisma.station.findFirst({
    where: {
      order: { gt: currentStation.order },
      isActive: true,
    },
    orderBy: { order: "asc" },
  });

  if (nextStation) {
    // يوجد محطة تالية - الانتقال إليها
    await prisma.queue.update({
      where: { id: queueId },
      data: { currentStationId: nextStation.id },
    });

    // إنشاء سجل جديد في QueueHistory
    await prisma.queueHistory.create({
      data: {
        queueId: queueId,
        stationId: nextStation.id,
        status: QueueStatus.WAITING,
      },
    });

    console.log(`✅ انتهت الخدمة - انتقل للمحطة ${nextStation.name}`);

    return {
      success: true,
      moved: true,
      nextStation: nextStation,
      completed: false,
    };
  } else {
    // لا توجد محطات أخرى - إنهاء الدور الكلي
    await completeQueue(queueId);

    console.log(`🎉 انتهى الدور بالكامل`);

    return {
      success: true,
      moved: false,
      completed: true,
    };
  }
}

export { startService, completeStationService };
