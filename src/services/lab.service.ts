import { PrismaClient, Status } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة بيانات المختبر (بدون استدعاء تلقائي)
 */
async function createLabData(data: {
  queueId: number;
  patientId: number;
  doctorName?: string;
  isMaleHealthy: Status;
  isFemaleHealthy: Status;
  maleNotes?: string;
  femaleNotes?: string;
  notes?: string;
}) {
  // إنشاء بيانات المختبر
  const labData = await prisma.labData.create({
    data: {
      queueId: data.queueId,
      patientId: data.patientId,
      ...(data.doctorName && { doctorName: data.doctorName }),
      isMaleHealthy: data.isMaleHealthy,
      isFemaleHealthy: data.isFemaleHealthy,
      ...(data.maleNotes && { maleNotes: data.maleNotes }),
      ...(data.femaleNotes && { femaleNotes: data.femaleNotes }),
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

  console.log(`✅ تم حفظ بيانات المختبر للدور #${labData.queue.queueNumber}`);

  // لا يتم استدعاء المراجع التالي تلقائياً
  // يجب الاستدعاء يدوياً من واجهة المستخدم

  return {
    labData,
    nextPatient: null,
  };
}

/**
 * الحصول على بيانات المختبر حسب queueId
 */
async function getLabDataByQueueId(queueId: number) {
  return await prisma.labData.findUnique({
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

/**
 * تحديث بيانات المختبر
 */
async function updateLabData(
  queueId: number,
  data: Partial<{
    doctorName: string;
    isMaleHealthy: Status;
    isFemaleHealthy: Status;
    maleNotes: string;
    femaleNotes: string;
    notes: string;
  }>
) {
  return await prisma.labData.update({
    where: { queueId },
    data,
  });
}

/**
 * جلب جميع سجلات المختبر (للأرشيف)
 */
async function getAllLabData() {
  return await prisma.labData.findMany({
    include: {
      patient: true,
      queue: {
        include: {
          ReceptionData: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export { createLabData, getLabDataByQueueId, updateLabData, getAllLabData };
