import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة بيانات سحب الدم (بدون استدعاء تلقائي)
 */
async function createBloodDrawData(data: {
  queueId: number;
  patientId: number;
  notes?: string;
}) {
  // إنشاء بيانات سحب الدم
  const bloodDrawData = await prisma.bloodDrawData.create({
    data: {
      queueId: data.queueId,
      patientId: data.patientId,
      ...(data.notes && { notes: data.notes }),
    },
    include: {
      queue: {
        include: {
          currentStation: true,
          patient: true,
        },
      },
    },
  });

  console.log(`✅ تم تسجيل سحب الدم للدور #${bloodDrawData.queue.queueNumber}`);

  // لا يتم استدعاء المراجع التالي تلقائياً
  // يجب الاستدعاء يدوياً من واجهة المستخدم

  return {
    bloodDrawData,
    nextPatient: null,
  };
}

/**
 * الحصول على بيانات سحب الدم حسب queueId
 */
async function getBloodDrawDataByQueueId(queueId: number) {
  return await prisma.bloodDrawData.findUnique({
    where: { queueId },
    include: {
      patient: true,
      queue: {
        include: {
          currentStation: true,
        },
      },
    },
  });
}

export { createBloodDrawData, getBloodDrawDataByQueueId };
