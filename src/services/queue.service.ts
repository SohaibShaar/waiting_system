import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";
import { upsertPatient } from "./patient.service";

const prisma = new PrismaClient();
// ============================================
// 2️⃣ إدارة أرقام الأدوار
// ============================================

/**
 * الحصول على آخر رقم دور
 */
async function getLastQueueNumber(): Promise<number> {
  const setting = await prisma.systemSettings.findUnique({
    where: { key: "LAST_QUEUE_NUMBER" },
  });

  return setting ? parseInt(setting.value) : 0;
}

/**
 * تحديث رقم الدور الأخير
 */
async function updateLastQueueNumber(number: number): Promise<void> {
  await prisma.systemSettings.update({
    where: { key: "LAST_QUEUE_NUMBER" },
    data: { value: number.toString() },
  });
}

/**
 * إعادة تعيين أرقام الأدوار (يومياً)
 */
async function resetQueueNumbers(): Promise<void> {
  await prisma.systemSettings.update({
    where: { key: "LAST_QUEUE_NUMBER" },
    data: { value: "0" },
  });
  console.log("🔄 تم إعادة تعيين أرقام الأدوار");
}

// ============================================
// 4️⃣ إدارة الأدوار - الإنشاء
// ============================================

/**
 * إنشاء دور جديد للمريض
 */
async function createNewQueue(patientData: {
  name: string;
  phoneNumber?: string;
  nationalId?: string;
  priority?: number;
  notes?: string;
}) {
  // 1. إنشاء/إيجاد المريض
  const patient = await upsertPatient({
    name: patientData.name,
    ...(patientData.phoneNumber && { phoneNumber: patientData.phoneNumber }),
    ...(patientData.nationalId && { nationalId: patientData.nationalId }),
  });

  // 2. الحصول على رقم الدور التالي
  const lastNumber = await getLastQueueNumber();
  const newQueueNumber = lastNumber + 1;

  // 3. الحصول على أول محطة نشطة
  const firstStation = await prisma.station.findFirst({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (!firstStation) {
    throw new Error("❌ لا توجد محطات نشطة في النظام");
  }

  // 4. إنشاء الدور
  const queue = await prisma.queue.create({
    data: {
      queueNumber: newQueueNumber,
      patientId: patient.id,
      currentStationId: firstStation.id,
      status: OverallQueueStatus.ACTIVE,
      priority: patientData.priority || 0,
      ...(patientData.notes && { notes: patientData.notes }),
    },
    include: {
      patient: true,
      currentStation: true,
    },
  });

  // 5. إنشاء أول سجل في QueueHistory
  await prisma.queueHistory.create({
    data: {
      queueId: queue.id,
      stationId: firstStation.id,
      status: QueueStatus.WAITING,
    },
  });

  // 6. تحديث آخر رقم دور
  await updateLastQueueNumber(newQueueNumber);

  console.log(`✅ تم إنشاء الدور #${newQueueNumber} للمريض ${patient.name}`);

  return {
    queue,
    queueNumber: newQueueNumber,
    patient,
    station: firstStation,
  };
}

// ============================================
// 5️⃣ عرض قوائم الأدوار
// ============================================

/**
 * الحصول على قائمة المرضى المنتظرين لمحطة معينة
 */
async function getStationWaitingList(stationId: number) {
  const queues = await prisma.queue.findMany({
    where: {
      currentStationId: stationId,
      status: OverallQueueStatus.ACTIVE,
    },
    include: {
      patient: true,
      currentStation: true,
      history: {
        where: {
          stationId: stationId,
          status: QueueStatus.WAITING,
        },
      },
    },
    orderBy: [
      { priority: "desc" }, // الأولوية أولاً
      { queueNumber: "asc" }, // ثم حسب رقم الدور
    ],
  });

  // فلترة فقط الذين لديهم حالة WAITING في هذه المحطة
  return queues.filter((q) => q.history.length > 0);
}

/**
 * الحصول على المريض الحالي في المحطة
 */
async function getCurrentPatientInStation(stationId: number) {
  return await prisma.queue.findFirst({
    where: {
      currentStationId: stationId,
      status: OverallQueueStatus.ACTIVE,
      history: {
        some: {
          stationId: stationId,
          status: {
            in: [QueueStatus.CALLED, QueueStatus.IN_PROGRESS],
          },
        },
      },
    },
    include: {
      patient: true,
      currentStation: true,
      history: {
        where: { stationId: stationId },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

/**
 * الحصول على جميع الأدوار النشطة
 */
async function getAllActiveQueues() {
  return await prisma.queue.findMany({
    where: { status: OverallQueueStatus.ACTIVE },
    include: {
      patient: true,
      currentStation: true,
    },
    orderBy: { queueNumber: "asc" },
  });
}

// ============================================
// 8️⃣ إنهاء الدور وأرشفته
// ============================================

/**
 * إنهاء الدور الكلي وحفظه في الأرشيف
 */
async function completeQueue(queueId: number) {
  // 1. الحصول على الدور مع جميع السجلات
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      history: {
        orderBy: { createdAt: "asc" },
        include: { station: true },
      },
    },
  });

  if (!queue) {
    throw new Error("❌ الدور غير موجود");
  }

  // 2. حساب الإحصائيات
  const firstHistory = queue.history[0];
  const lastHistory = queue.history[queue.history.length - 1];

  if (!firstHistory || !lastHistory) {
    throw new Error("❌ لا توجد سجلات للدور");
  }

  // المدة الكلية (بالدقائق)
  const totalDuration = lastHistory.completedAt
    ? Math.floor(
        (lastHistory.completedAt.getTime() - firstHistory.createdAt.getTime()) /
          60000
      )
    : null;

  // حساب أوقات الانتظار والخدمة
  let waitingTime = 0;
  let serviceTime = 0;

  queue.history.forEach((h) => {
    if (h.startedAt && h.createdAt) {
      waitingTime += Math.floor(
        (h.startedAt.getTime() - h.createdAt.getTime()) / 60000
      );
    }
    if (h.completedAt && h.startedAt) {
      serviceTime += Math.floor(
        (h.completedAt.getTime() - h.startedAt.getTime()) / 60000
      );
    }
  });

  // 3. إنشاء سجل في CompletedVisit
  const completedVisit = await prisma.completedVisit.create({
    data: {
      patientId: queue.patientId,
      queueNumber: queue.queueNumber,
      totalDuration,
      waitingTime,
      serviceTime,
      stationsCount: queue.history.length,
      visitData: {
        history: queue.history,
        patient: queue.patient,
      },
      notes: queue.notes,
    },
  });

  // 4. تحديث حالة الدور
  await prisma.queue.update({
    where: { id: queueId },
    data: {
      status: OverallQueueStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  console.log(`💾 تم حفظ الدور #${queue.queueNumber} في الأرشيف`);
  console.log(`📊 الإحصائيات:`);
  console.log(`   - المدة الكلية: ${totalDuration} دقيقة`);
  console.log(`   - وقت الانتظار: ${waitingTime} دقيقة`);
  console.log(`   - وقت الخدمة: ${serviceTime} دقيقة`);

  return { completedVisit, queue };
}

// ============================================
// 1️⃣1️⃣ عمليات إضافية
// ============================================

/**
 * إلغاء دور
 */
async function cancelQueue(queueId: number, reason?: string) {
  await prisma.queue.update({
    where: { id: queueId },
    data: {
      status: OverallQueueStatus.CANCELLED,
      notes: reason ? `ملغي: ${reason}` : "تم الإلغاء",
    },
  });

  console.log(`❌ تم إلغاء الدور #${queueId}`);
}

/**
 * تخطي مريض (يعود لآخر القائمة)
 */
async function skipPatient(queueId: number, stationId: number) {
  await prisma.queueHistory.updateMany({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: QueueStatus.CALLED,
    },
    data: {
      status: QueueStatus.SKIPPED,
    },
  });

  // إعادة إلى حالة الانتظار
  await prisma.queueHistory.create({
    data: {
      queueId: queueId,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
  });

  console.log(`⏭️ تم تخطي الدور #${queueId}`);
}

/**
 * تغيير أولوية دور
 */
async function changeQueuePriority(queueId: number, priority: number) {
  await prisma.queue.update({
    where: { id: queueId },
    data: { priority },
  });

  console.log(`🔝 تم تغيير أولوية الدور #${queueId} إلى ${priority}`);
}

export {
  getLastQueueNumber,
  updateLastQueueNumber,
  resetQueueNumbers,
  createNewQueue,
  getStationWaitingList,
  getCurrentPatientInStation,
  getAllActiveQueues,
  completeQueue,
  cancelQueue,
  skipPatient,
  changeQueuePriority,
};
