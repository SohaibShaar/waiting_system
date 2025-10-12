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
  maleNotes?: string;
  femaleNotes?: string;
  notes?: string;
}) {
  // إنشاء بيانات الطبيب
  const doctorData = await prisma.doctorData.create({
    data: {
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

  console.log(`✅ تم حفظ بيانات الطبيب للدور #${doctorData.queue.queueNumber}`);

  // لا يتم استدعاء المريض التالي تلقائياً
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

export { createDoctorData, getDoctorDataByQueueId, updateDoctorData };
