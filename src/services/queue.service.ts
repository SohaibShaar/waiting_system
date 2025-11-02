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

/**
 * الحصول على رقم دور متاح (إعادة استخدام أرقام الأدوار الملغاة)
 * يبحث عن أقل رقم دور ملغى في نفس اليوم، وإذا لم يجد يعطي رقم جديد
 */
async function getNextAvailableQueueNumber(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // البحث عن أقل رقم دور ملغى في نفس اليوم
  const cancelledQueue = await prisma.queue.findFirst({
    where: {
      status: OverallQueueStatus.CANCELLED,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: {
      queueNumber: "asc", // الأقل أولاً
    },
    select: {
      queueNumber: true,
    },
  });

  if (cancelledQueue) {
    console.log(
      `♻️ إعادة استخدام رقم الدور الملغى #${cancelledQueue.queueNumber}`
    );
    return cancelledQueue.queueNumber;
  }

  // إذا لم يوجد أرقام ملغاة، احصل على الرقم التالي
  const lastNumber = await getLastQueueNumber();
  return lastNumber + 1;
}

// ============================================
// 4️⃣ إدارة الأدوار - الإنشاء
// ============================================

/**
 * إنشاء دور جديد للمراجع
 */
async function createNewQueue(patientData: {
  name: string;
  phoneNumber?: string;
  nationalId?: string;
  priority?: number;
  notes?: string;
}) {
  // 1. إنشاء/إيجاد المراجع
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

  console.log(`✅ تم إنشاء الدور #${newQueueNumber} للمراجع ${patient.name}`);

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
 * الحصول على الأدوار الملغاة لليوم الحالي
 */
async function getCancelledQueuesForToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.queue.findMany({
    where: {
      status: OverallQueueStatus.CANCELLED,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      patient: true,
      currentStation: true,
      ReceptionData: true,
      history: {
        include: {
          station: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * إعادة تفعيل دور ملغى بإعادة استخدام نفس رقم الدور
 * يتم حذف الدور القديم من قاعدة البيانات بعد إنشاء الدور الجديد
 */
async function reinstateQueue(queueId: number) {
  // 1. جلب الدور الملغى مع بياناته
  const cancelledQueue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      currentStation: true,
      ReceptionData: true,
    },
  });

  if (!cancelledQueue) {
    throw new Error("❌ الدور غير موجود");
  }

  if (cancelledQueue.status !== OverallQueueStatus.CANCELLED) {
    throw new Error("❌ الدور ليس ملغياً");
  }

  if (!cancelledQueue.ReceptionData) {
    throw new Error("❌ لا توجد بيانات استقبال لهذا الدور");
  }

  // 2. إعادة استخدام نفس رقم الدور القديم
  const reusedQueueNumber = cancelledQueue.queueNumber;

  // 3. المحطة التي سيبدأ منها الدور الجديد
  const targetStation = cancelledQueue.currentStation;

  // 4. إنشاء Queue جديد بنفس رقم الدور
  const newQueue = await prisma.queue.create({
    data: {
      queueNumber: reusedQueueNumber, // ♻️ إعادة استخدام نفس الرقم
      patientId: cancelledQueue.patientId,
      currentStationId: targetStation.id,
      status: OverallQueueStatus.ACTIVE,
      priority: cancelledQueue.priority,
      notes: cancelledQueue.notes
        ? `${cancelledQueue.notes} | مُعاد تفعيله`
        : `مُعاد تفعيله`,
    },
    include: {
      patient: true,
      currentStation: true,
    },
  });

  // 5. نسخ بيانات ReceptionData إلى الدور الجديد
  const oldReceptionData = cancelledQueue.ReceptionData;
  await prisma.receptionData.create({
    data: {
      queueId: newQueue.id,
      patientId: newQueue.patientId,
      maleStatus: oldReceptionData.maleStatus,
      femaleStatus: oldReceptionData.femaleStatus,
      maleName: oldReceptionData.maleName,
      maleLastName: oldReceptionData.maleLastName,
      maleFatherName: oldReceptionData.maleFatherName,
      maleMotherName: oldReceptionData.maleMotherName,
      maleBirthDate: oldReceptionData.maleBirthDate,
      maleNationalId: oldReceptionData.maleNationalId,
      maleAge: oldReceptionData.maleAge,
      maleBirthPlace: oldReceptionData.maleBirthPlace,
      maleRegistration: oldReceptionData.maleRegistration,
      maleCountry: oldReceptionData.maleCountry,
      femaleName: oldReceptionData.femaleName,
      femaleLastName: oldReceptionData.femaleLastName,
      femaleFatherName: oldReceptionData.femaleFatherName,
      femaleMotherName: oldReceptionData.femaleMotherName,
      femaleBirthDate: oldReceptionData.femaleBirthDate,
      femaleNationalId: oldReceptionData.femaleNationalId,
      femaleAge: oldReceptionData.femaleAge,
      femaleBirthPlace: oldReceptionData.femaleBirthPlace,
      femaleRegistration: oldReceptionData.femaleRegistration,
      femaleCountry: oldReceptionData.femaleCountry,
      phoneNumber: oldReceptionData.phoneNumber,
      notes: oldReceptionData.notes,
    },
  });

  // 6. إنشاء QueueHistory بحالة WAITING للمحطة الحالية
  await prisma.queueHistory.create({
    data: {
      queueId: newQueue.id,
      stationId: targetStation.id,
      status: QueueStatus.WAITING,
      notes: "تم إعادة التفعيل",
    },
  });

  // 7. لا حاجة لتحديث LAST_QUEUE_NUMBER لأننا نعيد استخدام رقم قديم

  // 8. حذف الدور القديم الملغى من قاعدة البيانات
  // يجب حذف البيانات المرتبطة أولاً بسبب القيود الخارجية (foreign keys)

  // حذف ReceptionData القديمة
  await prisma.receptionData.delete({
    where: { queueId: cancelledQueue.id },
  });

  // حذف QueueHistory القديمة
  await prisma.queueHistory.deleteMany({
    where: { queueId: cancelledQueue.id },
  });

  // حذف الدور القديم
  await prisma.queue.delete({
    where: { id: cancelledQueue.id },
  });

  console.log(
    `✅ تم إعادة تفعيل الدور #${reusedQueueNumber} (إعادة استخدام نفس الرقم)`
  );
  console.log(
    `🗑️ تم حذف الدور القديم من قاعدة البيانات وإنشاء دور جديد بنفس الرقم`
  );

  return {
    newQueue,
    queueNumber: reusedQueueNumber,
    station: targetStation,
  };
}

/**
 * الحصول على قائمة المراجعون المنتظرين لمحطة معينة
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
 * الحصول على المراجع الحالي في المحطة
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
      ReceptionData: true, // Include reception data for patient info
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
      visitData: JSON.stringify({
        history: queue.history,
        patient: queue.patient,
      }),
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
 * تخطي مراجع (يعود لآخر القائمة)
 */
async function skipPatient(queueId: number, stationId: number) {
  // الحصول على أقدم سجل CALLED أو IN_PROGRESS فقط
  const lastActiveRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: {
        in: [QueueStatus.CALLED, QueueStatus.IN_PROGRESS],
      },
    },
    orderBy: {
      createdAt: "asc", // الأقدم أولاً
    },
  });

  if (!lastActiveRecord) {
    throw new Error("❌ لم يتم العثور على سجل نشط للتخطي");
  }

  // تحديث السجل المحدد فقط إلى SKIPPED
  await prisma.queueHistory.update({
    where: {
      id: lastActiveRecord.id,
    },
    data: {
      status: QueueStatus.SKIPPED,
    },
  });

  // إعادة إلى حالة الانتظار بسجل جديد
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
  getNextAvailableQueueNumber,
  createNewQueue,
  getCancelledQueuesForToday,
  reinstateQueue,
  getStationWaitingList,
  getCurrentPatientInStation,
  getAllActiveQueues,
  completeQueue,
  cancelQueue,
  skipPatient,
  changeQueuePriority,
};
