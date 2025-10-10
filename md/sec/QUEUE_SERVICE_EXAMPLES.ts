/**
 * 🎯 أمثلة كود TypeScript لنظام إدارة الأدوار
 *
 * هذا الملف يحتوي على أمثلة جاهزة للاستخدام
 * لتطبيق منطق نظام الأدوار
 */

import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "./generated/prisma";

const prisma = new PrismaClient();

// ============================================
// 1️⃣ دوال الإعداد الأولي
// ============================================

/**
 * إعداد النظام للمرة الأولى
 */
async function initializeSystem() {
  // إنشاء المحطات
  const stations = await prisma.station.createMany({
    data: [
      {
        name: "الاستقبال",
        displayNumber: 1,
        order: 1,
        description: "تسجيل بيانات المريض وإنشاء الدور",
        isActive: true,
      },
      {
        name: "الفحص الأولي",
        displayNumber: 2,
        order: 2,
        description: "قياس الضغط والحرارة والوزن",
        isActive: true,
      },
      {
        name: "الطبيب",
        displayNumber: 3,
        order: 3,
        description: "الفحص الطبي والتشخيص",
        isActive: true,
      },
    ],
  });

  // إعداد إعدادات النظام
  await prisma.systemSettings.createMany({
    data: [
      {
        key: "LAST_QUEUE_NUMBER",
        value: "0",
        description: "آخر رقم دور تم إنشاؤه",
      },
      {
        key: "DAILY_RESET_TIME",
        value: "00:00",
        description: "وقت إعادة تعيين أرقام الأدوار يومياً",
      },
    ],
  });

  console.log("✅ تم إعداد النظام بنجاح");
  return { stations };
}

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
// 3️⃣ إدارة المرضى
// ============================================

/**
 * إنشاء أو إيجاد مريض
 */
async function upsertPatient(data: {
  name: string;
  phoneNumber?: string;
  nationalId?: string;
}) {
  // إذا كان هناك رقم هاتف، ابحث به
  if (data.phoneNumber) {
    const existing = await prisma.patient.findFirst({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existing) {
      // تحديث البيانات
      return await prisma.patient.update({
        where: { id: existing.id },
        data: { name: data.name },
      });
    }
  }

  // إنشاء مريض جديد
  return await prisma.patient.create({
    data: {
      name: data.name,
      phoneNumber: data.phoneNumber,
      nationalId: data.nationalId,
    },
  });
}

/**
 * البحث عن مريض
 */
async function findPatient(criteria: {
  id?: number;
  phoneNumber?: string;
  nationalId?: string;
}) {
  return await prisma.patient.findFirst({
    where: {
      OR: [
        criteria.id ? { id: criteria.id } : {},
        criteria.phoneNumber ? { phoneNumber: criteria.phoneNumber } : {},
        criteria.nationalId ? { nationalId: criteria.nationalId } : {},
      ],
    },
    include: {
      queues: {
        where: { status: OverallQueueStatus.ACTIVE },
        include: { currentStation: true },
      },
    },
  });
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
    phoneNumber: patientData.phoneNumber,
    nationalId: patientData.nationalId,
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
      notes: patientData.notes,
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
// 6️⃣ استدعاء المرضى
// ============================================

/**
 * استدعاء المريض التالي في قائمة المحطة
 */
async function callNextPatient(stationId: number, calledBy?: string) {
  // 1. الحصول على أول مريض في قائمة الانتظار
  const waitingList = await getStationWaitingList(stationId);

  if (waitingList.length === 0) {
    return {
      success: false,
      message: "⚠️ لا يوجد مرضى في قائمة الانتظار",
    };
  }

  const nextQueue = waitingList[0];

  // 2. تحديث حالة QueueHistory إلى CALLED
  await prisma.queueHistory.updateMany({
    where: {
      queueId: nextQueue.id,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
    data: {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
      calledBy: calledBy,
    },
  });

  // 3. الحصول على المعلومات المحدثة
  const updatedQueue = await prisma.queue.findUnique({
    where: { id: nextQueue.id },
    include: {
      patient: true,
      currentStation: true,
    },
  });

  console.log(
    `📢 تم استدعاء الدور #${updatedQueue?.queueNumber} → الشاشة ${updatedQueue?.currentStation.displayNumber}`
  );

  return {
    success: true,
    queue: updatedQueue,
    displayNumber: updatedQueue?.currentStation.displayNumber,
    queueNumber: updatedQueue?.queueNumber,
  };
}

/**
 * استدعاء دور محدد (بالرقم)
 */
async function callSpecificQueue(
  queueNumber: number,
  stationId: number,
  calledBy?: string
) {
  const queue = await prisma.queue.findFirst({
    where: {
      queueNumber: queueNumber,
      currentStationId: stationId,
      status: OverallQueueStatus.ACTIVE,
    },
  });

  if (!queue) {
    return {
      success: false,
      message: "❌ الدور غير موجود أو ليس في هذه المحطة",
    };
  }

  await prisma.queueHistory.updateMany({
    where: {
      queueId: queue.id,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
    data: {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
      calledBy: calledBy,
    },
  });

  return { success: true, queue };
}

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
      notes: notes,
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
 * تاريخ زيارات مريض معين
 */
async function getPatientHistory(patientId: number) {
  return await prisma.completedVisit.findMany({
    where: { patientId },
    orderBy: { completedAt: "desc" },
    take: 10,
  });
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

// ============================================
// 📤 تصدير الدوال
// ============================================

export {
  // الإعداد
  initializeSystem,
  resetQueueNumbers,

  // المرضى
  upsertPatient,
  findPatient,

  // الأدوار
  createNewQueue,
  getStationWaitingList,
  getCurrentPatientInStation,
  getAllActiveQueues,

  // الاستدعاء
  callNextPatient,
  callSpecificQueue,

  // الخدمة
  startService,
  completeStationService,
  completeQueue,

  // الشاشة
  getRecentCalls,
  getDisplayScreenData,

  // الإحصائيات
  getTodayStats,
  getStationStats,
  getPatientHistory,

  // عمليات إضافية
  cancelQueue,
  skipPatient,
  changeQueuePriority,
};

// ============================================
// 🧪 أمثلة الاستخدام
// ============================================

/**
 * مثال 1: إنشاء دور جديد
 */
async function example1_CreateQueue() {
  const result = await createNewQueue({
    name: "أحمد محمد",
    phoneNumber: "0501234567",
    priority: 0,
  });

  console.log(`تم إنشاء الدور #${result.queueNumber}`);
}

/**
 * مثال 2: استدعاء المريض التالي
 */
async function example2_CallNext() {
  const stationId = 1; // الاستقبال
  const result = await callNextPatient(stationId, "موظف الاستقبال");

  if (result.success) {
    console.log(
      `استدعاء الدور #${result.queueNumber} للشاشة ${result.displayNumber}`
    );
  }
}

/**
 * مثال 3: إنهاء الخدمة والانتقال
 */
async function example3_CompleteService() {
  const queueId = 1;
  const stationId = 1;

  const result = await completeStationService(queueId, stationId);

  if (result.moved) {
    console.log(`انتقل للمحطة ${result.nextStation?.name}`);
  } else if (result.completed) {
    console.log("انتهى بالكامل");
  }
}

/**
 * مثال 4: عرض الإحصائيات
 */
async function example4_ShowStats() {
  const stats = await getTodayStats();
  console.log("إحصائيات اليوم:", stats);

  const stationStats = await getStationStats();
  console.log("إحصائيات المحطات:", stationStats);
}
