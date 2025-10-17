import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";
import { getStationWaitingList } from "./queue.service";

const prisma = new PrismaClient();

/**
 * إنشاء أو إيجاد مراجع
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

  // إنشاء مراجع جديد
  return await prisma.patient.create({
    data: {
      name: data.name,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.nationalId && { nationalId: data.nationalId }),
    },
  });
}

/**
 * البحث عن مراجع
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
// 6️⃣ استدعاء المراجعون
// ============================================

/**
 * استدعاء المراجع التالي في قائمة المحطة
 */
async function callNextPatient(stationId: number, calledBy?: string) {
  // 0. أولاً، تحقق من وجود مريض حالي (مستدعى أو قيد الخدمة)
  const currentPatient = await prisma.queue.findFirst({
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
    },
  });

  // إذا كان هناك مريض حالي، أعده بدلاً من استدعاء مريض جديد
  if (currentPatient) {
    console.log(`📋 يوجد مريض حالي: الدور #${currentPatient.queueNumber}`);
    return {
      success: true,
      queue: currentPatient,
      displayNumber: currentPatient.currentStation.displayNumber,
      queueNumber: currentPatient.queueNumber,
      message: `المريض الحالي: الدور #${currentPatient.queueNumber}`,
    };
  }

  // 1. الحصول على أول مراجع في قائمة الانتظار
  const waitingList = await getStationWaitingList(stationId);

  if (waitingList.length === 0) {
    return {
      success: false,
      message: "⚠️ لا يوجد مراجعين في قائمة الانتظار",
    };
  }

  const nextQueue = waitingList[0];

  if (!nextQueue) {
    return {
      success: false,
      message: "⚠️ لا يوجد مراجعين في قائمة الانتظار",
    };
  }

  // 2. الحصول على أقدم سجل WAITING فقط
  const lastWaitingRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: nextQueue.id,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
    orderBy: {
      createdAt: "asc", // الأقدم أولاً
    },
  });

  if (!lastWaitingRecord) {
    return {
      success: false,
      message: "⚠️ لم يتم العثور على سجل انتظار",
    };
  }

  // 3. تحديث السجل المحدد فقط إلى CALLED
  await prisma.queueHistory.update({
    where: {
      id: lastWaitingRecord.id,
    },
    data: {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
      ...(calledBy && { calledBy }),
    },
  });

  // 4. الحصول على المعلومات المحدثة
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

  // الحصول على أقدم سجل في هذه المحطة (أي حالة)
  const lastRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: queue.id,
      stationId: stationId,
    },
    orderBy: {
      createdAt: "asc", // الأقدم أولاً
    },
  });

  if (!lastRecord) {
    return {
      success: false,
      message: "❌ لم يتم العثور على سجل لهذا الدور في هذه المحطة",
    };
  }

  // إذا كان السجل الأخير WAITING، نقوم بتحديثه إلى CALLED
  // إذا كان في حالة أخرى (CALLED, IN_PROGRESS)، نقوم بتحديثه أيضاً (إعادة نداء)
  await prisma.queueHistory.update({
    where: {
      id: lastRecord.id,
    },
    data: {
      status: QueueStatus.CALLED,
      calledAt: new Date(),
      ...(calledBy && { calledBy }),
    },
  });

  // الحصول على المعلومات المحدثة
  const updatedQueue = await prisma.queue.findUnique({
    where: { id: queue.id },
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

export { upsertPatient, findPatient, callNextPatient, callSpecificQueue };
