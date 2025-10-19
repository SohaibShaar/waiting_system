import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة بيانات المحاسبة (بدون استدعاء تلقائي)
 */
async function createAccountingData(data: {
  queueId: number;
  patientId: number;
  totalAmount: number;
  isPaid: boolean;
  notes?: string;
}) {
  // إنشاء بيانات المحاسبة
  const accountingData = await prisma.accountingData.create({
    data: {
      queueId: data.queueId,
      patientId: data.patientId,
      totalAmount: data.totalAmount,
      isPaid: data.isPaid,
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

  console.log(
    `✅ تم حفظ بيانات المحاسبة للدور #${accountingData.queue?.queueNumber || 0}`
  );

  // لا يتم استدعاء المراجع التالي تلقائياً
  // يجب الاستدعاء يدوياً من واجهة المستخدم

  return {
    accountingData,
    nextPatient: null,
  };
}

/**
 * الحصول على بيانات المحاسبة حسب queueId
 */
async function getAccountingDataByQueueId(queueId: number) {
  return await prisma.accountingData.findUnique({
    where: { queueId },
    include: {
      patient: true,
      queue: {
        include: {
          currentStation: true,
          ReceptionData: true,
        },
      },
    },
  });
}

/**
 * تحديث بيانات المحاسبة
 */
async function updateAccountingData(
  queueId: number,
  data: Partial<{
    totalAmount: number;
    isPaid: boolean;
    notes: string;
  }>
) {
  return await prisma.accountingData.update({
    where: { queueId },
    data,
  });
}

/**
 * جلب جميع سجلات المحاسبة (للأرشيف)
 */
async function getAllAccountingData() {
  return await prisma.accountingData.findMany({
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

export {
  createAccountingData,
  getAccountingDataByQueueId,
  updateAccountingData,
  getAllAccountingData,
};
