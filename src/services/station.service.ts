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
  // الحصول على آخر سجل CALLED فقط
  const lastCalledRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: QueueStatus.CALLED,
    },
    orderBy: {
      createdAt: "desc", // الأحدث أولاً
    },
  });

  if (!lastCalledRecord) {
    return {
      success: false,
      message: "❌ لم يتم العثور على دور مُستدعى",
    };
  }

  // تحديث السجل المحدد فقط إلى IN_PROGRESS
  await prisma.queueHistory.update({
    where: {
      id: lastCalledRecord.id,
    },
    data: {
      status: QueueStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

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
  // 1. الحصول على آخر سجل IN_PROGRESS أو CALLED فقط
  const lastActiveRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: {
        in: [QueueStatus.IN_PROGRESS, QueueStatus.CALLED],
      },
    },
    orderBy: {
      createdAt: "desc", // الأحدث أولاً
    },
  });

  if (!lastActiveRecord) {
    throw new Error("❌ لم يتم العثور على سجل نشط للدور في هذه المحطة");
  }

  // 2. تحديث السجل المحدد فقط إلى COMPLETED
  await prisma.queueHistory.update({
    where: {
      id: lastActiveRecord.id,
    },
    data: {
      status: QueueStatus.COMPLETED,
      completedAt: new Date(),
      ...(notes && { notes }),
    },
  });

  // 3. الحصول على المحطة الحالية
  const currentStation = await prisma.station.findUnique({
    where: { id: stationId },
  });

  if (!currentStation) {
    throw new Error("❌ المحطة غير موجودة");
  }

  // 4. البحث عن المحطة التالية
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
