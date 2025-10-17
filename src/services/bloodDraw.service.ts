import { PrismaClient, SpouseStatus } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * توليد أرقام أنابيب الدم الفريدة
 */
function generateBloodTubeNumbers(
  patientId: number,
  maleStatus: SpouseStatus,
  femaleStatus: SpouseStatus
) {
  const tubes: {
    maleBloodTube1: string | null;
    maleBloodTube2: string | null;
    femaleBloodTube1: string | null;
    femaleBloodTube2: string | null;
  } = {
    maleBloodTube1: null,
    maleBloodTube2: null,
    femaleBloodTube1: null,
    femaleBloodTube2: null,
  };

  // توليد أرقام الزوج (إذا كان موجود)
  if (
    maleStatus === SpouseStatus.NORMAL ||
    maleStatus === SpouseStatus.LEGAL_INVITATION
  ) {
    tubes.maleBloodTube1 = `11${patientId}`;
    tubes.maleBloodTube2 = `12${patientId}`;
  }

  // توليد أرقام الزوجة (إذا كانت موجودة)
  if (
    femaleStatus === SpouseStatus.NORMAL ||
    femaleStatus === SpouseStatus.LEGAL_INVITATION
  ) {
    tubes.femaleBloodTube1 = `21${patientId}`;
    tubes.femaleBloodTube2 = `22${patientId}`;
  }

  return tubes;
}

/**
 * إضافة بيانات سحب الدم (بدون استدعاء تلقائي)
 */
async function createBloodDrawData(data: {
  queueId: number;
  patientId: number;
  notes?: string;
  maleBloodTube1?: string;
  maleBloodTube2?: string;
  femaleBloodTube1?: string;
  femaleBloodTube2?: string;
}) {
  // إنشاء بيانات سحب الدم مع أرقام الأنابيب
  const bloodDrawData = await prisma.bloodDrawData.create({
    data: {
      queueId: data.queueId,
      patientId: data.patientId,
      ...(data.notes && { notes: data.notes }),
      ...(data.maleBloodTube1 && { maleBloodTube1: data.maleBloodTube1 }),
      ...(data.maleBloodTube2 && { maleBloodTube2: data.maleBloodTube2 }),
      ...(data.femaleBloodTube1 && { femaleBloodTube1: data.femaleBloodTube1 }),
      ...(data.femaleBloodTube2 && { femaleBloodTube2: data.femaleBloodTube2 }),
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

/**
 * توليد أرقام أنابيب الدم للمراجع (يُستدعى عند النداء)
 */
async function generateTubeNumbersForQueue(queueId: number) {
  // جلب بيانات الدور مع بيانات الاستقبال
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      ReceptionData: true,
    },
  });

  if (!queue) {
    throw new Error("الدور غير موجود");
  }

  if (!queue.ReceptionData) {
    throw new Error("بيانات الاستقبال غير موجودة لهذا الدور");
  }

  // توليد الأرقام
  const tubes = generateBloodTubeNumbers(
    queue.patientId,
    queue.ReceptionData.maleStatus,
    queue.ReceptionData.femaleStatus
  );

  return tubes;
}

export {
  createBloodDrawData,
  getBloodDrawDataByQueueId,
  generateTubeNumbersForQueue,
};
