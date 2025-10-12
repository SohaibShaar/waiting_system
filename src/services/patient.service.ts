import {
  PrismaClient,
  QueueStatus,
  OverallQueueStatus,
} from "../generated/prisma";
import { getStationWaitingList } from "./queue.service";

const prisma = new PrismaClient();

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
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      ...(data.nationalId && { nationalId: data.nationalId }),
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

  if (!nextQueue) {
    return {
      success: false,
      message: "⚠️ لا يوجد مرضى في قائمة الانتظار",
    };
  }

  // 2. الحصول على آخر سجل WAITING فقط
  const lastWaitingRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: nextQueue.id,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
    orderBy: {
      createdAt: "desc", // الأحدث أولاً
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

  // الحصول على آخر سجل WAITING فقط
  const lastWaitingRecord = await prisma.queueHistory.findFirst({
    where: {
      queueId: queue.id,
      stationId: stationId,
      status: QueueStatus.WAITING,
    },
    orderBy: {
      createdAt: "desc", // الأحدث أولاً
    },
  });

  if (!lastWaitingRecord) {
    return {
      success: false,
      message: "❌ لم يتم العثور على سجل انتظار لهذا الدور",
    };
  }

  // تحديث السجل المحدد فقط إلى CALLED
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

  return { success: true, queue };
}

export { upsertPatient, findPatient, callNextPatient, callSpecificQueue };
