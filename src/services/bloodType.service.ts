import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * حفظ فصيلة دم الزوج والزوجة
 * يتم الحفظ في جدول DoctorData (حقلي maleBloodType و femaleBloodType)
 */
async function saveBloodType(data: {
  queueId: number;
  patientId: number;
  maleBloodType?: string;
  femaleBloodType?: string;
}) {
  // التحقق من وجود بيانات سابقة في DoctorData
  const existing = await prisma.doctorData.findUnique({
    where: { queueId: data.queueId },
  });

  if (existing) {
    // تحديث فصيلة الدم فقط
    const updated = await prisma.doctorData.update({
      where: { queueId: data.queueId },
      data: {
        ...(data.maleBloodType && { maleBloodType: data.maleBloodType }),
        ...(data.femaleBloodType && { femaleBloodType: data.femaleBloodType }),
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

    console.log(`✅ تم تحديث فصيلة الدم للدور #${updated.queue.queueNumber}`);
    return updated;
  } else {
    // إنشاء سجل جديد بفصيلة الدم فقط (باقي الحقول ستملأ في صفحة Doctor)
    const created = await prisma.doctorData.create({
      data: {
        queueId: data.queueId,
        patientId: data.patientId,
        ...(data.maleBloodType && { maleBloodType: data.maleBloodType }),
        ...(data.femaleBloodType && { femaleBloodType: data.femaleBloodType }),
        // القيم الافتراضية للحقول الإلزامية
        maleHIVstatus: "NEGATIVE",
        femaleHIVstatus: "NEGATIVE",
        maleHBSstatus: "NEGATIVE",
        femaleHBSstatus: "NEGATIVE",
        maleHBCstatus: "NEGATIVE",
        femaleHBCstatus: "NEGATIVE",
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

    console.log(`✅ تم حفظ فصيلة الدم للدور #${created.queue.queueNumber}`);
    return created;
  }
}

/**
 * الحصول على فصيلة الدم حسب queueId
 */
async function getBloodTypeByQueueId(queueId: number) {
  const doctorData = await prisma.doctorData.findUnique({
    where: { queueId },
    select: {
      id: true,
      queueId: true,
      patientId: true,
      maleBloodType: true,
      femaleBloodType: true,
      createdAt: true,
      updatedAt: true,
    },
    // include: {
    //   patient: true,
    //   queue: {
    //     include: {
    //       currentStation: true,
    //     },
    //   },
    // },
  });

  return doctorData;
}

export { saveBloodType, getBloodTypeByQueueId };
