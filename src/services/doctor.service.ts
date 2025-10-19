import { PrismaClient, DiseasesStatus } from "../generated/prisma";

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

  // حفظ البيانات الكاملة
  const completedData = await prisma.completedPatientData.create({
    data: {
      queueId,
      patientId,
      receptionData: receptionData ? JSON.stringify(receptionData) : null,
      accountingData: accountingData ? JSON.stringify(accountingData) : null,
      bloodDrawData: bloodDrawData ? JSON.stringify(bloodDrawData) : null,
      labData: labData ? JSON.stringify(labData) : null,
      doctorData: doctorData ? JSON.stringify(doctorData) : null,
    },
  });

  console.log(`💾 تم حفظ البيانات الكاملة للدور #${queueId}`);

  return completedData;
}

/**
 * الحصول على جميع البيانات المكتملة
 */
async function getAllCompletedPatientData() {
  const data = await prisma.completedPatientData.findMany({
    include: {
      patient: true,
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  // تحويل البيانات من JSON strings
  return data.map((item) => ({
    ...item,
    ReceptionData: item.receptionData ? JSON.parse(item.receptionData) : null,
    AccountingData: item.accountingData
      ? JSON.parse(item.accountingData)
      : null,
    BloodDrawData: item.bloodDrawData ? JSON.parse(item.bloodDrawData) : null,
    LabData: item.labData ? JSON.parse(item.labData) : null,
    DoctorData: item.doctorData ? JSON.parse(item.doctorData) : null,
  }));
}

/**
 * الحصول على البيانات المكتملة لمريض معين
 */
async function getCompletedPatientDataById(id: number) {
  return await prisma.completedPatientData.findUnique({
    where: { id },
    include: {
      patient: true,
    },
  });
}

export {
  createDoctorData,
  getDoctorDataByQueueId,
  updateDoctorData,
  saveCompletedPatientData,
  getAllCompletedPatientData,
  getCompletedPatientDataById,
};
