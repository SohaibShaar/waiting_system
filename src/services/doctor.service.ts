import { PrismaClient, DiseasesStatus } from "../generated/prisma";
import { completeQueue } from "./queue.service";

const prisma = new PrismaClient();

/**
 * إضافة بيانات الطبيب (بدون استدعاء تلقائي)
 */
async function createDoctorData(data: {
  queueId: number;
  patientId: number;
  maleBloodType?: string;
  femaleBloodType?: string;
  maleHIVstatus: DiseasesStatus;
  femaleHIVstatus: DiseasesStatus;
  maleHBSstatus: DiseasesStatus;
  femaleHBSstatus: DiseasesStatus;
  maleHBCstatus: DiseasesStatus;
  femaleHBCstatus: DiseasesStatus;
  maleHIVvalue?: string;
  femaleHIVvalue?: string;
  maleHBSvalue?: string;
  femaleHBSvalue?: string;
  maleHBCvalue?: string;
  femaleHBCvalue?: string;
  maleHemoglobinEnabled?: boolean;
  maleHbS?: string;
  maleHbF?: string;
  maleHbA1c?: string;
  maleHbA2?: string;
  maleHbSc?: string;
  maleHbD?: string;
  maleHbE?: string;
  maleHbC?: string;
  femaleHemoglobinEnabled?: boolean;
  femaleHbS?: string;
  femaleHbF?: string;
  femaleHbA1c?: string;
  femaleHbA2?: string;
  femaleHbSc?: string;
  femaleHbD?: string;
  femaleHbE?: string;
  femaleHbC?: string;
  maleNotes?: string;
  femaleNotes?: string;
  notes?: string;
}) {
  // التحقق من وجود بيانات سابقة
  const existing = await prisma.doctorData.findUnique({
    where: { queueId: data.queueId },
  });

  // إنشاء أو تحديث بيانات الطبيب
  const doctorData = await prisma.doctorData.upsert({
    where: { queueId: data.queueId },
    create: {
      queueId: data.queueId,
      patientId: data.patientId,
      ...(data.maleBloodType && { maleBloodType: data.maleBloodType }),
      ...(data.femaleBloodType && { femaleBloodType: data.femaleBloodType }),
      maleHIVstatus: data.maleHIVstatus,
      femaleHIVstatus: data.femaleHIVstatus,
      maleHBSstatus: data.maleHBSstatus,
      femaleHBSstatus: data.femaleHBSstatus,
      maleHBCstatus: data.maleHBCstatus,
      femaleHBCstatus: data.femaleHBCstatus,
      ...(data.maleHIVvalue && { maleHIVvalue: data.maleHIVvalue }),
      ...(data.femaleHIVvalue && { femaleHIVvalue: data.femaleHIVvalue }),
      ...(data.maleHBSvalue && { maleHBSvalue: data.maleHBSvalue }),
      ...(data.femaleHBSvalue && { femaleHBSvalue: data.femaleHBSvalue }),
      ...(data.maleHBCvalue && { maleHBCvalue: data.maleHBCvalue }),
      ...(data.femaleHBCvalue && { femaleHBCvalue: data.femaleHBCvalue }),
      maleHemoglobinEnabled: data.maleHemoglobinEnabled || false,
      ...(data.maleHbS && { maleHbS: data.maleHbS }),
      ...(data.maleHbF && { maleHbF: data.maleHbF }),
      ...(data.maleHbA1c && { maleHbA1c: data.maleHbA1c }),
      ...(data.maleHbA2 && { maleHbA2: data.maleHbA2 }),
      ...(data.maleHbSc && { maleHbSc: data.maleHbSc }),
      ...(data.maleHbD && { maleHbD: data.maleHbD }),
      ...(data.maleHbE && { maleHbE: data.maleHbE }),
      ...(data.maleHbC && { maleHbC: data.maleHbC }),
      femaleHemoglobinEnabled: data.femaleHemoglobinEnabled || false,
      ...(data.femaleHbS && { femaleHbS: data.femaleHbS }),
      ...(data.femaleHbF && { femaleHbF: data.femaleHbF }),
      ...(data.femaleHbA1c && { femaleHbA1c: data.femaleHbA1c }),
      ...(data.femaleHbA2 && { femaleHbA2: data.femaleHbA2 }),
      ...(data.femaleHbSc && { femaleHbSc: data.femaleHbSc }),
      ...(data.femaleHbD && { femaleHbD: data.femaleHbD }),
      ...(data.femaleHbE && { femaleHbE: data.femaleHbE }),
      ...(data.femaleHbC && { femaleHbC: data.femaleHbC }),
      ...(data.maleNotes && { maleNotes: data.maleNotes }),
      ...(data.femaleNotes && { femaleNotes: data.femaleNotes }),
      ...(data.notes && { notes: data.notes }),
    },
    update: {
      ...(data.maleBloodType && { maleBloodType: data.maleBloodType }),
      ...(data.femaleBloodType && { femaleBloodType: data.femaleBloodType }),
      maleHIVstatus: data.maleHIVstatus,
      femaleHIVstatus: data.femaleHIVstatus,
      maleHBSstatus: data.maleHBSstatus,
      femaleHBSstatus: data.femaleHBSstatus,
      maleHBCstatus: data.maleHBCstatus,
      femaleHBCstatus: data.femaleHBCstatus,
      ...(data.maleHIVvalue && { maleHIVvalue: data.maleHIVvalue }),
      ...(data.femaleHIVvalue && { femaleHIVvalue: data.femaleHIVvalue }),
      ...(data.maleHBSvalue && { maleHBSvalue: data.maleHBSvalue }),
      ...(data.femaleHBSvalue && { femaleHBSvalue: data.femaleHBSvalue }),
      ...(data.maleHBCvalue && { maleHBCvalue: data.maleHBCvalue }),
      ...(data.femaleHBCvalue && { femaleHBCvalue: data.femaleHBCvalue }),
      maleHemoglobinEnabled: data.maleHemoglobinEnabled || false,
      ...(data.maleHbS && { maleHbS: data.maleHbS }),
      ...(data.maleHbF && { maleHbF: data.maleHbF }),
      ...(data.maleHbA1c && { maleHbA1c: data.maleHbA1c }),
      ...(data.maleHbA2 && { maleHbA2: data.maleHbA2 }),
      ...(data.maleHbSc && { maleHbSc: data.maleHbSc }),
      ...(data.maleHbD && { maleHbD: data.maleHbD }),
      ...(data.maleHbE && { maleHbE: data.maleHbE }),
      ...(data.maleHbC && { maleHbC: data.maleHbC }),
      femaleHemoglobinEnabled: data.femaleHemoglobinEnabled || false,
      ...(data.femaleHbS && { femaleHbS: data.femaleHbS }),
      ...(data.femaleHbF && { femaleHbF: data.femaleHbF }),
      ...(data.femaleHbA1c && { femaleHbA1c: data.femaleHbA1c }),
      ...(data.femaleHbA2 && { femaleHbA2: data.femaleHbA2 }),
      ...(data.femaleHbSc && { femaleHbSc: data.femaleHbSc }),
      ...(data.femaleHbD && { femaleHbD: data.femaleHbD }),
      ...(data.femaleHbE && { femaleHbE: data.femaleHbE }),
      ...(data.femaleHbC && { femaleHbC: data.femaleHbC }),
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

  if (existing) {
    console.log(
      `✅ تم تحديث بيانات الطبيب للدور #${doctorData.queue.queueNumber}`
    );
  } else {
    console.log(
      `✅ تم حفظ بيانات الطبيب للدور #${doctorData.queue.queueNumber}`
    );
  }

  // لا يتم استدعاء المراجع التالي تلقائياً
  // يجب الاستدعاء يدوياً من واجهة المستخدم

  return {
    doctorData,
    nextPatient: null,
  };
}

/**
 * الحصول على بيانات الطبيب حسب queueId
 */
async function getDoctorDataByQueueId(queueId: number) {
  return await prisma.doctorData.findUnique({
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
 * تحديث بيانات الطبيب
 */
async function updateDoctorData(
  queueId: number,
  data: Partial<{
    maleBloodType: string;
    femaleBloodType: string;
    maleHIVstatus: DiseasesStatus;
    femaleHIVstatus: DiseasesStatus;
    maleHBSstatus: DiseasesStatus;
    femaleHBSstatus: DiseasesStatus;
    maleHBCstatus: DiseasesStatus;
    femaleHBCstatus: DiseasesStatus;
    maleNotes: string;
    femaleNotes: string;
    notes: string;
  }>
) {
  return await prisma.doctorData.update({
    where: { queueId },
    data,
  });
}

/**
 * حفظ البيانات الكاملة للمريض
 */
async function saveCompletedPatientData(queueId: number, patientId: number) {
  // جلب جميع البيانات من المحطات
  const receptionData = await prisma.receptionData.findUnique({
    where: { queueId },
  });

  const accountingData = await prisma.accountingData.findUnique({
    where: { queueId },
  });

  const bloodDrawData = await prisma.bloodDrawData.findUnique({
    where: { queueId },
  });

  const labData = await prisma.labData.findUnique({
    where: { queueId },
  });

  const doctorData = await prisma.doctorData.findUnique({
    where: { queueId },
  });

  // حفظ البيانات الكاملة (استخدام upsert للتعامل مع السجلات الموجودة)
  const completedData = await prisma.completedPatientData.upsert({
    where: { queueId },
    create: {
      queueId,
      patientId,
      receptionData: receptionData ? JSON.stringify(receptionData) : null,
      accountingData: accountingData ? JSON.stringify(accountingData) : null,
      bloodDrawData: bloodDrawData ? JSON.stringify(bloodDrawData) : null,
      labData: labData ? JSON.stringify(labData) : null,
      doctorData: doctorData ? JSON.stringify(doctorData) : null,
    },
    update: {
      patientId,
      receptionData: receptionData ? JSON.stringify(receptionData) : null,
      accountingData: accountingData ? JSON.stringify(accountingData) : null,
      bloodDrawData: bloodDrawData ? JSON.stringify(bloodDrawData) : null,
      labData: labData ? JSON.stringify(labData) : null,
      doctorData: doctorData ? JSON.stringify(doctorData) : null,
    },
  });

  console.log(`💾 تم حفظ البيانات الكاملة للدور #${queueId}`);

  // إنهاء الدور وتحويله إلى حالة COMPLETED
  await completeQueue(queueId);
  console.log(`✅ تم إنهاء الدور #${queueId} ونقله إلى الأرشيف`);

  return completedData;
}

/**
 * الحصول على جميع البيانات المكتملة مع الفلترة والـ pagination
 */
async function getAllCompletedPatientData(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  queueId?: number;
  startDate?: string;
  endDate?: string;
  priority?: number;
  queueIdStart?: number;
  queueIdEnd?: number;
  ids?: number[];
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 150;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (filters?.queueId) {
    where.queueId = filters.queueId;
  }

  if (filters?.ids && filters.ids.length > 0) {
    where.id = { in: filters.ids };
  }

  if (filters?.startDate || filters?.endDate) {
    where.completedAt = {};
    if (filters.startDate) {
      where.completedAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.completedAt.lte = new Date(filters.endDate);
    }
  }

  // Get all data first for search filtering (if needed)
  let allData = await prisma.completedPatientData.findMany({
    where,
    include: {
      patient: true,
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  // Get queue data for all completed patients to include priority
  const queueIds = allData.map((item) => item.queueId);
  const queues = await prisma.queue.findMany({
    where: {
      id: { in: queueIds },
    },
    select: {
      id: true,
      priority: true,
      queueNumber: true,
    },
  });

  // Create a map for quick lookup
  const queueMap = new Map(queues.map((q) => [q.id, q]));

  // Parse JSON and apply search filter
  let parsedData = allData.map((item) => {
    const queueData = queueMap.get(item.queueId);
    return {
      ...item,
      priority: queueData?.priority || 0,
      queueNumber: queueData?.queueNumber,
      ReceptionData: item.receptionData ? JSON.parse(item.receptionData) : null,
      AccountingData: item.accountingData
        ? JSON.parse(item.accountingData)
        : null,
      BloodDrawData: item.bloodDrawData ? JSON.parse(item.bloodDrawData) : null,
      LabData: item.labData ? JSON.parse(item.labData) : null,
      DoctorData: item.doctorData ? JSON.parse(item.doctorData) : null,
    };
  });

  // Apply priority filter
  if (filters?.priority !== undefined) {
    parsedData = parsedData.filter(
      (item) => item.priority === filters.priority
    );
  }

  // Apply queue ID range filter
  if (
    filters?.queueIdStart !== undefined ||
    filters?.queueIdEnd !== undefined
  ) {
    const start = filters.queueIdStart || 0;
    const end = filters.queueIdEnd || Number.MAX_SAFE_INTEGER;
    parsedData = parsedData.filter(
      (item) => item.queueId >= start && item.queueId <= end
    );
  }

  // Apply search filter on parsed data
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    parsedData = parsedData.filter((item) => {
      const reception = item.ReceptionData;

      // Search in queue ID, patient ID
      if (
        item.queueId.toString().includes(searchLower) ||
        item.patientId.toString().includes(searchLower) ||
        item.patient?.id.toString().includes(searchLower)
      ) {
        return true;
      }

      // Search in reception data if exists
      if (!reception) return false;

      return (
        reception.maleName?.toLowerCase().includes(searchLower) ||
        reception.maleLastName?.toLowerCase().includes(searchLower) ||
        reception.femaleName?.toLowerCase().includes(searchLower) ||
        reception.femaleLastName?.toLowerCase().includes(searchLower) ||
        reception.maleNationalId?.toLowerCase().includes(searchLower) ||
        reception.femaleNationalId?.toLowerCase().includes(searchLower)
      );
    });
  }

  const total = parsedData.length;
  const paginatedData = parsedData.slice(skip, skip + limit);

  return {
    data: paginatedData,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * الحصول على البيانات المكتملة لمريض معين
 */
async function getCompletedPatientDataById(id: number) {
  const data = await prisma.completedPatientData.findUnique({
    where: { id },
    include: {
      patient: true,
    },
  });

  if (!data) return null;

  // Parse JSON strings
  return {
    ...data,
    ReceptionData: data.receptionData ? JSON.parse(data.receptionData) : null,
    AccountingData: data.accountingData
      ? JSON.parse(data.accountingData)
      : null,
    BloodDrawData: data.bloodDrawData ? JSON.parse(data.bloodDrawData) : null,
    LabData: data.labData ? JSON.parse(data.labData) : null,
    DoctorData: data.doctorData ? JSON.parse(data.doctorData) : null,
  };
}

/**
 * تحديث البيانات المكتملة (ReceptionData فقط)
 */
async function updateCompletedPatientData(
  id: number,
  receptionData: {
    maleName?: string;
    maleLastName?: string;
    maleFatherName?: string;
    maleMotherName?: string;
    maleNationalId?: string;
    maleBirthPlace?: string;
    maleRegistration?: string;
    maleBirthDate?: string;
    maleAge?: number;
    femaleName?: string;
    femaleLastName?: string;
    femaleFatherName?: string;
    femaleMotherName?: string;
    femaleNationalId?: string;
    femaleBirthPlace?: string;
    femaleRegistration?: string;
    femaleBirthDate?: string;
    femaleAge?: number;
  }
) {
  // Get existing data
  const existing = await prisma.completedPatientData.findUnique({
    where: { id },
  });

  if (!existing || !existing.receptionData) {
    throw new Error("البيانات غير موجودة");
  }

  // Parse existing reception data
  const existingReception = JSON.parse(existing.receptionData);

  // Merge with new data
  const updatedReception = {
    ...existingReception,
    ...receptionData,
  };

  // Update
  const updated = await prisma.completedPatientData.update({
    where: { id },
    data: {
      receptionData: JSON.stringify(updatedReception),
    },
  });

  return {
    ...updated,
    ReceptionData: updatedReception,
  };
}

/**
 * تحديث بيانات الطبيب في CompletedPatientData
 */
async function updateCompletedPatientDoctorData(
  id: number,
  doctorData: {
    maleBloodType?: string;
    femaleBloodType?: string;
    maleHIVstatus?: DiseasesStatus;
    femaleHIVstatus?: DiseasesStatus;
    maleHBSstatus?: DiseasesStatus;
    femaleHBSstatus?: DiseasesStatus;
    maleHBCstatus?: DiseasesStatus;
    femaleHBCstatus?: DiseasesStatus;
    maleHIVvalue?: string;
    femaleHIVvalue?: string;
    maleHBSvalue?: string;
    femaleHBSvalue?: string;
    maleHBCvalue?: string;
    femaleHBCvalue?: string;
    maleHemoglobinEnabled?: boolean;
    maleHbS?: string;
    maleHbF?: string;
    maleHbA1c?: string;
    maleHbA2?: string;
    maleHbSc?: string;
    maleHbD?: string;
    maleHbE?: string;
    maleHbC?: string;
    femaleHemoglobinEnabled?: boolean;
    femaleHbS?: string;
    femaleHbF?: string;
    femaleHbA1c?: string;
    femaleHbA2?: string;
    femaleHbSc?: string;
    femaleHbD?: string;
    femaleHbE?: string;
    femaleHbC?: string;
    maleNotes?: string;
    femaleNotes?: string;
    notes?: string;
  }
) {
  // Get existing data
  const existing = await prisma.completedPatientData.findUnique({
    where: { id },
  });

  if (!existing || !existing.doctorData) {
    throw new Error("البيانات غير موجودة");
  }

  // Parse existing doctor data
  const existingDoctor = JSON.parse(existing.doctorData);

  // Merge with new data
  const updatedDoctor = {
    ...existingDoctor,
    ...doctorData,
  };

  // Update
  const updated = await prisma.completedPatientData.update({
    where: { id },
    data: {
      doctorData: JSON.stringify(updatedDoctor),
    },
  });

  return {
    ...updated,
    DoctorData: updatedDoctor,
  };
}

export {
  createDoctorData,
  getDoctorDataByQueueId,
  updateDoctorData,
  saveCompletedPatientData,
  getAllCompletedPatientData,
  getCompletedPatientDataById,
  updateCompletedPatientData,
  updateCompletedPatientDoctorData,
};
