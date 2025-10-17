import {
  PrismaClient,
  OverallQueueStatus,
  QueueStatus,
  SpouseStatus,
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
 * إضافة بيانات الاستقبال مع إنشاء مراجع ودور جديد تلقائياً
 * هذه هي نقطة البداية في النظام
 */
async function createReceptionData(data: {
  // حالة الزوجين
  maleStatus: SpouseStatus;
  femaleStatus: SpouseStatus;
  // بيانات الزوج (اختيارية حسب الحالة)
  maleName?: string;
  maleLastName?: string;
  maleFatherName?: string;
  maleBirthDate?: Date;
  maleNationalId?: string;
  maleAge?: number;
  maleBirthPlace?: string;
  maleRegistration?: string;
  maleCountry?: string;
  // بيانات الزوجة (اختيارية حسب الحالة)
  femaleName?: string;
  femaleLastName?: string;
  femaleFatherName?: string;
  femaleBirthDate?: Date;
  femaleNationalId?: string;
  femaleAge?: number;
  femaleBirthPlace?: string;
  femaleRegistration?: string;
  femaleCountry?: string;
  // بيانات عامة
  phoneNumber?: string;
  notes?: string;
  priority?: number;
}) {
  // 1. تحديد الاسم والرقم الوطني للمراجع بناءً على الحالة
  let patientName = "";
  let patientNationalId = "";

  if (data.maleStatus === SpouseStatus.NORMAL) {
    // حالة عادية - نستخدم بيانات الزوج
    patientName = `${data.maleName} ${data.maleLastName}`;
    patientNationalId = data.maleNationalId || "";
  } else if (
    data.maleStatus === SpouseStatus.LEGAL_INVITATION &&
    data.maleName
  ) {
    // دعوة شرعية للزوج فقط
    patientName = `${data.maleName} ${data.maleLastName}`;
    patientNationalId = data.maleNationalId || "";
  } else if (
    data.femaleStatus === SpouseStatus.LEGAL_INVITATION &&
    data.femaleName
  ) {
    // دعوة شرعية للزوجة فقط
    patientName = `${data.femaleName} ${data.femaleLastName}`;
    patientNationalId = data.femaleNationalId || "";
  } else if (data.maleName && data.maleLastName) {
    // استخدام بيانات الزوج إذا كانت موجودة
    patientName = `${data.maleName} ${data.maleLastName}`;
    patientNationalId = data.maleNationalId || "";
  } else if (data.femaleName && data.femaleLastName) {
    // استخدام بيانات الزوجة إذا كانت موجودة
    patientName = `${data.femaleName} ${data.femaleLastName}`;
    patientNationalId = data.femaleNationalId || "";
  }

  // 2. إنشاء المراجع
  const patient = await prisma.patient.create({
    data: {
      name: patientName,
      nationalId: patientNationalId || null,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    },
  });

  console.log(
    `✅ تم إنشاء المراجع: ${patient.name} - رقم وطني: ${patient.nationalId}`
  );

  // 3. الحصول على رقم الدور التالي
  const lastNumber = await getLastQueueNumber();
  const newQueueNumber = lastNumber + 1;

  // 4. الحصول على أول محطة نشطة (الاستقبال)
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
      // لا نضع calledAt لأن المراجع لم يتم مناداته بعد
    },
  });

  // 8. تحديث آخر رقم دور
  await updateLastQueueNumber(newQueueNumber);

  console.log(`✅ تم إنشاء الدور #${newQueueNumber} للمراجع ${patient.name}`);

  // 9. إنشاء بيانات الاستقبال
  const receptionData = await prisma.receptionData.create({
    data: {
      queueId: queue.id,
      patientId: patient.id,
      // حالة الزوجين
      maleStatus: data.maleStatus,
      femaleStatus: data.femaleStatus,
      // بيانات الزوج
      maleName: data.maleName || null,
      maleLastName: data.maleLastName || null,
      maleFatherName: data.maleFatherName || null,
      maleBirthDate: data.maleBirthDate || null,
      maleNationalId: data.maleNationalId || null,
      maleAge: data.maleAge !== undefined ? data.maleAge : null,
      maleBirthPlace: data.maleBirthPlace || null,
      maleRegistration: data.maleRegistration || null,
      maleCountry: data.maleCountry || null,
      // بيانات الزوجة
      femaleName: data.femaleName || null,
      femaleLastName: data.femaleLastName || null,
      femaleFatherName: data.femaleFatherName || null,
      femaleBirthDate: data.femaleBirthDate || null,
      femaleNationalId: data.femaleNationalId || null,
      femaleAge: data.femaleAge !== undefined ? data.femaleAge : null,
      femaleBirthPlace: data.femaleBirthPlace || null,
      femaleRegistration: data.femaleRegistration || null,
      femaleCountry: data.femaleCountry || null,
      // بيانات عامة
      phoneNumber: data.phoneNumber || null,
      notes: data.notes || null,
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
 * يتم عرض فقط البيانات المرتبطة بأدوار نشطة أو مكتملة (وليس الملغاة)
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
      queue: {
        status: {
          in: [OverallQueueStatus.ACTIVE, OverallQueueStatus.COMPLETED],
        },
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
    maleStatus: SpouseStatus;
    femaleStatus: SpouseStatus;
    maleName: string;
    maleLastName: string;
    maleFatherName: string;
    maleBirthDate: Date;
    maleNationalId: string;
    maleAge: number;
    maleBirthPlace: string;
    maleRegistration: string;
    maleCountry: string;
    femaleName: string;
    femaleLastName: string;
    femaleFatherName: string;
    femaleBirthDate: Date;
    femaleNationalId: string;
    femaleAge: number;
    femaleBirthPlace: string;
    femaleRegistration: string;
    femaleCountry: string;
    phoneNumber: string;
    notes: string;
  }>
) {
  // تحويل القيم الفارغة إلى null
  const cleanedData: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined) {
      cleanedData[key] = null;
    } else {
      cleanedData[key] = value;
    }
  }

  return await prisma.receptionData.update({
    where: { queueId },
    data: cleanedData,
  });
}

export {
  createReceptionData,
  getReceptionDataByQueueId,
  getTodayReceptionData,
  updateReceptionData,
};
