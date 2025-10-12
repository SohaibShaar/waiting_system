import {
  PrismaClient,
  OverallQueueStatus,
  QueueStatus,
} from "../generated/prisma";

const prisma = new PrismaClient();

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
 * إضافة بيانات الاستقبال مع إنشاء مريض ودور جديد تلقائياً
 * هذه هي نقطة البداية في النظام
 */
async function createReceptionData(data: {
  maleName: string;
  maleLastName: string;
  maleFatherName: string;
  maleBirthDate: Date;
  maleNationalId: string;
  maleAge: number;
  femaleName: string;
  femaleLastName: string;
  femaleFatherName: string;
  femaleBirthDate: Date;
  femaleNationalId: string;
  femaleAge: number;
  phoneNumber?: string;
  notes?: string;
  priority?: number;
}) {
  // 1. إنشاء المريض باسم الذكر ورقمه الوطني
  const patient = await prisma.patient.create({
    data: {
      name: `${data.maleName} ${data.maleLastName}`,
      nationalId: data.maleNationalId,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    },
  });

  console.log(
    `✅ تم إنشاء المريض: ${patient.name} - رقم وطني: ${patient.nationalId}`
  );

  // 2. الحصول على رقم الدور التالي
  const lastNumber = await getLastQueueNumber();
  const newQueueNumber = lastNumber + 1;

  // 3. الحصول على أول محطة نشطة (الاستقبال)
  const receptionStation = await prisma.station.findFirst({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (!receptionStation) {
    throw new Error("❌ لا توجد محطات نشطة في النظام");
  }

  // 4. الحصول على المحطة التالية (المحطة الفعلية للخدمة)
  const nextStation = await prisma.station.findFirst({
    where: {
      isActive: true,
      order: { gt: receptionStation.order },
    },
    orderBy: { order: "asc" },
  });

  if (!nextStation) {
    throw new Error("❌ لا توجد محطة خدمة تالية في النظام");
  }

  // 5. إنشاء الدور (المحطة الحالية هي المحطة التالية، ليس الاستقبال)
  const queue = await prisma.queue.create({
    data: {
      queueNumber: newQueueNumber,
      patientId: patient.id,
      currentStationId: nextStation.id,
      status: OverallQueueStatus.ACTIVE,
      priority: data.priority || 0,
      ...(data.notes && { notes: data.notes }),
    },
    include: {
      patient: true,
      currentStation: true,
    },
  });

  // 6. إنشاء سجل في QueueHistory للاستقبال (مكتمل مباشرة)
  await prisma.queueHistory.create({
    data: {
      queueId: queue.id,
      stationId: receptionStation.id,
      status: QueueStatus.COMPLETED,
      calledAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  // 7. إنشاء سجل في QueueHistory للمحطة التالية (في انتظار المناداة)
  await prisma.queueHistory.create({
    data: {
      queueId: queue.id,
      stationId: nextStation.id,
      status: QueueStatus.WAITING,
      // لا نضع calledAt لأن المريض لم يتم مناداته بعد
    },
  });

  // 8. تحديث آخر رقم دور
  await updateLastQueueNumber(newQueueNumber);

  console.log(`✅ تم إنشاء الدور #${newQueueNumber} للمريض ${patient.name}`);

  // 9. إنشاء بيانات الاستقبال
  const receptionData = await prisma.receptionData.create({
    data: {
      queueId: queue.id,
      patientId: patient.id,
      maleName: data.maleName,
      maleLastName: data.maleLastName,
      maleFatherName: data.maleFatherName,
      maleBirthDate: data.maleBirthDate,
      maleNationalId: data.maleNationalId,
      maleAge: data.maleAge,
      femaleName: data.femaleName,
      femaleLastName: data.femaleLastName,
      femaleFatherName: data.femaleFatherName,
      femaleBirthDate: data.femaleBirthDate,
      femaleNationalId: data.femaleNationalId,
      femaleAge: data.femaleAge,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
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

  console.log(`✅ تم حفظ بيانات الاستقبال للدور #${newQueueNumber}`);

  return {
    receptionData,
    patient,
    queue,
    queueNumber: newQueueNumber,
    displayNumber: nextStation.displayNumber,
  };
}

/**
 * الحصول على بيانات الاستقبال حسب queueId
 */
async function getReceptionDataByQueueId(queueId: number) {
  return await prisma.receptionData.findUnique({
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
 * الحصول على جميع بيانات الاستقبال لليوم الحالي
 */
async function getTodayReceptionData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.receptionData.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      queue: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * تحديث بيانات الاستقبال
 */
async function updateReceptionData(
  queueId: number,
  data: Partial<{
    maleName: string;
    maleLastName: string;
    maleFatherName: string;
    maleBirthDate: Date;
    maleNationalId: string;
    maleAge: number;
    femaleName: string;
    femaleLastName: string;
    femaleFatherName: string;
    femaleBirthDate: Date;
    femaleNationalId: string;
    femaleAge: number;
    phoneNumber: string;
    notes: string;
  }>
) {
  return await prisma.receptionData.update({
    where: { queueId },
    data,
  });
}

export {
  createReceptionData,
  getReceptionDataByQueueId,
  getTodayReceptionData,
  updateReceptionData,
};
