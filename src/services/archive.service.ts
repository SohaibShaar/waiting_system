import { PrismaClient, OverallQueueStatus } from "../generated/prisma";
import { resetQueueNumbers } from "./queue.service";

const prisma = new PrismaClient();

/**
 * نقل جميع الأدوار المكتملة والملغاة إلى الأرشيف
 */
async function archiveCompletedQueues() {
  console.log("🔄 بدء عملية الأرشفة...");

  // 1. جلب جميع الأدوار المكتملة والملغاة
  const queuesToArchive = await prisma.queue.findMany({
    where: {
      status: {
        in: [OverallQueueStatus.COMPLETED, OverallQueueStatus.CANCELLED],
      },
    },
    include: {
      patient: true,
      currentStation: true,
      history: {
        include: {
          station: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      ReceptionData: true,
      AccountingData: true,
      BloodDrawData: true,
      LabData: true,
      DoctorData: true,
    },
  });

  console.log(`📦 تم العثور على ${queuesToArchive.length} دور للأرشفة`);

  if (queuesToArchive.length === 0) {
    return {
      success: true,
      archivedCount: 0,
      message: "لا توجد أدوار للأرشفة",
    };
  }

  const archivedAt = new Date();

  // 2. نقل البيانات في transaction واحدة
  const result = await prisma.$transaction(async (tx) => {
    const archivedQueueIds: number[] = [];
    const archivedPatientIds: Set<number> = new Set();
    const patientIdMap = new Map<number, number>(); // Map من original patientId إلى archived patientId
    const queueIdMap = new Map<number, number>(); // Map من original queueId إلى archived queueId

    // نقل كل دور
    for (const queue of queuesToArchive) {
      let archivedPatientId: number;

      // نقل المريض إذا لم يتم نقله من قبل
      if (!archivedPatientIds.has(queue.patientId)) {
        const archivedPatient = await tx.archivePatient.create({
          data: {
            name: queue.patient.name,
            phoneNumber: queue.patient.phoneNumber || null,
            nationalId: queue.patient.nationalId || null,
            createdAt: queue.patient.createdAt,
            updatedAt: queue.patient.updatedAt,
            archivedAt,
          },
        });
        archivedPatientId = archivedPatient.id;
        archivedPatientIds.add(queue.patientId);
        patientIdMap.set(queue.patientId, archivedPatientId);
      } else {
        // إذا كان المريض مؤرشف بالفعل، احصل على archivedPatientId من الـ map
        archivedPatientId = patientIdMap.get(queue.patientId)!;
      }

      // نقل الدور باستخدام archivedPatientId
      const archivedQueue = await tx.archiveQueue.create({
        data: {
          queueNumber: queue.queueNumber,
          patientId: archivedPatientId, // استخدام archivedPatientId بدلاً من queue.patientId
          currentStationId: queue.currentStationId,
          currentStationName: queue.currentStation.name,
          status: queue.status,
          priority: queue.priority,
          notes: queue.notes || null,
          createdAt: queue.createdAt,
          completedAt: queue.completedAt || null,
          archivedAt,
        },
      });

      archivedQueueIds.push(queue.id);
      queueIdMap.set(queue.id, archivedQueue.id); // حفظ مرجع الـ queue

      // نقل QueueHistory
      for (const history of queue.history) {
        await tx.archiveQueueHistory.create({
          data: {
            queueId: archivedQueue.id,
            stationId: history.stationId,
            stationName: history.station.name,
            status: history.status,
            calledAt: history.calledAt || null,
            startedAt: history.startedAt || null,
            completedAt: history.completedAt || null,
            notes: history.notes || null,
            calledBy: history.calledBy || null,
            createdAt: history.createdAt,
            archivedAt,
          },
        });
      }

      // نقل ReceptionData
      if (queue.ReceptionData) {
        await tx.archiveReceptionData.create({
          data: {
            patientId: archivedPatientId, // استخدام archivedPatientId
            queueId: archivedQueue.id,
            maleName: queue.ReceptionData.maleName || null,
            maleLastName: queue.ReceptionData.maleLastName || null,
            maleFatherName: queue.ReceptionData.maleFatherName || null,
            maleMotherName: queue.ReceptionData.maleMotherName || null,
            maleBirthDate: queue.ReceptionData.maleBirthDate || null,
            maleNationalId: queue.ReceptionData.maleNationalId || null,
            maleAge: queue.ReceptionData.maleAge || null,
            femaleName: queue.ReceptionData.femaleName || null,
            femaleLastName: queue.ReceptionData.femaleLastName || null,
            femaleFatherName: queue.ReceptionData.femaleFatherName || null,
            femaleMotherName: queue.ReceptionData.femaleMotherName || null,
            femaleBirthDate: queue.ReceptionData.femaleBirthDate || null,
            femaleNationalId: queue.ReceptionData.femaleNationalId || null,
            femaleAge: queue.ReceptionData.femaleAge || null,
            notes: queue.ReceptionData.notes || null,
            createdAt: queue.ReceptionData.createdAt,
            updatedAt: queue.ReceptionData.updatedAt,
            phoneNumber: queue.ReceptionData.phoneNumber || null,
            maleStatus: queue.ReceptionData.maleStatus,
            femaleStatus: queue.ReceptionData.femaleStatus,
            maleBirthPlace: queue.ReceptionData.maleBirthPlace || null,
            maleRegistration: queue.ReceptionData.maleRegistration || null,
            maleCountry: queue.ReceptionData.maleCountry || null,
            femaleBirthPlace: queue.ReceptionData.femaleBirthPlace || null,
            femaleRegistration: queue.ReceptionData.femaleRegistration || null,
            femaleCountry: queue.ReceptionData.femaleCountry || null,
            archivedAt,
          },
        });
      }

      // نقل AccountingData
      if (queue.AccountingData) {
        await tx.archiveAccountingData.create({
          data: {
            patientId: archivedPatientId, // استخدام archivedPatientId
            queueId: archivedQueue.id,
            totalAmount: queue.AccountingData.totalAmount || null,
            isPaid: queue.AccountingData.isPaid,
            notes: queue.AccountingData.notes || null,
            createdAt: queue.AccountingData.createdAt,
            updatedAt: queue.AccountingData.updatedAt,
            archivedAt,
          },
        });
      }

      // نقل BloodDrawData
      if (queue.BloodDrawData) {
        await tx.archiveBloodDrawData.create({
          data: {
            patientId: archivedPatientId, // استخدام archivedPatientId
            queueId: archivedQueue.id,
            maleBloodTube1: queue.BloodDrawData.maleBloodTube1 || null,
            maleBloodTube2: queue.BloodDrawData.maleBloodTube2 || null,
            femaleBloodTube1: queue.BloodDrawData.femaleBloodTube1 || null,
            femaleBloodTube2: queue.BloodDrawData.femaleBloodTube2 || null,
            notes: queue.BloodDrawData.notes || null,
            createdAt: queue.BloodDrawData.createdAt,
            updatedAt: queue.BloodDrawData.updatedAt,
            archivedAt,
          },
        });
      }

      // نقل LabData
      if (queue.LabData) {
        await tx.archiveLabData.create({
          data: {
            patientId: archivedPatientId, // استخدام archivedPatientId
            queueId: archivedQueue.id,
            doctorName: queue.LabData.doctorName || null,
            isMaleHealthy: queue.LabData.isMaleHealthy,
            isFemaleHealthy: queue.LabData.isFemaleHealthy,
            maleNotes: queue.LabData.maleNotes || null,
            femaleNotes: queue.LabData.femaleNotes || null,
            notes: queue.LabData.notes || null,
            createdAt: queue.LabData.createdAt,
            updatedAt: queue.LabData.updatedAt,
            archivedAt,
          },
        });
      }

      // نقل DoctorData
      if (queue.DoctorData) {
        await tx.archiveDoctorData.create({
          data: {
            patientId: archivedPatientId, // استخدام archivedPatientId
            queueId: archivedQueue.id,
            maleBloodType: queue.DoctorData.maleBloodType || null,
            femaleBloodType: queue.DoctorData.femaleBloodType || null,
            maleHIVstatus: queue.DoctorData.maleHIVstatus,
            femaleHIVstatus: queue.DoctorData.femaleHIVstatus,
            maleHBSstatus: queue.DoctorData.maleHBSstatus,
            femaleHBSstatus: queue.DoctorData.femaleHBSstatus,
            maleHBCstatus: queue.DoctorData.maleHBCstatus,
            femaleHBCstatus: queue.DoctorData.femaleHBCstatus,
            maleHIVvalue: queue.DoctorData.maleHIVvalue || null,
            femaleHIVvalue: queue.DoctorData.femaleHIVvalue || null,
            maleHBSvalue: queue.DoctorData.maleHBSvalue || null,
            femaleHBSvalue: queue.DoctorData.femaleHBSvalue || null,
            maleHBCvalue: queue.DoctorData.maleHBCvalue || null,
            femaleHBCvalue: queue.DoctorData.femaleHBCvalue || null,
            maleHemoglobinEnabled: queue.DoctorData.maleHemoglobinEnabled,
            maleHbS: queue.DoctorData.maleHbS || null,
            maleHbF: queue.DoctorData.maleHbF || null,
            maleHbA1c: queue.DoctorData.maleHbA1c || null,
            maleHbA2: queue.DoctorData.maleHbA2 || null,
            maleHbSc: queue.DoctorData.maleHbSc || null,
            maleHbD: queue.DoctorData.maleHbD || null,
            maleHbE: queue.DoctorData.maleHbE || null,
            maleHbC: queue.DoctorData.maleHbC || null,
            femaleHemoglobinEnabled: queue.DoctorData.femaleHemoglobinEnabled,
            femaleHbS: queue.DoctorData.femaleHbS || null,
            femaleHbF: queue.DoctorData.femaleHbF || null,
            femaleHbA1c: queue.DoctorData.femaleHbA1c || null,
            femaleHbA2: queue.DoctorData.femaleHbA2 || null,
            femaleHbSc: queue.DoctorData.femaleHbSc || null,
            femaleHbD: queue.DoctorData.femaleHbD || null,
            femaleHbE: queue.DoctorData.femaleHbE || null,
            femaleHbC: queue.DoctorData.femaleHbC || null,
            maleNotes: queue.DoctorData.maleNotes || null,
            femaleNotes: queue.DoctorData.femaleNotes || null,
            notes: queue.DoctorData.notes || null,
            createdAt: queue.DoctorData.createdAt,
            updatedAt: queue.DoctorData.updatedAt,
            archivedAt,
          },
        });
      }
    }

    // نقل CompletedVisit
    const completedVisits = await tx.completedVisit.findMany({
      where: {
        patientId: {
          in: Array.from(archivedPatientIds),
        },
      },
    });

    for (const visit of completedVisits) {
      // استخدام patientIdMap للحصول على archivedPatientId
      const archivedPatientId = patientIdMap.get(visit.patientId);
      if (archivedPatientId) {
        await tx.archiveCompletedVisit.create({
          data: {
            patientId: archivedPatientId,
            queueNumber: visit.queueNumber,
            totalDuration: visit.totalDuration || null,
            waitingTime: visit.waitingTime || null,
            serviceTime: visit.serviceTime || null,
            stationsCount: visit.stationsCount,
            visitData: visit.visitData || null,
            notes: visit.notes || null,
            completedAt: visit.completedAt,
            archivedAt,
          },
        });
      }
    }

    // نقل CompletedPatientData
    const completedPatientData = await tx.completedPatientData.findMany({
      where: {
        queueId: {
          in: Array.from(queueIdMap.keys()),
        },
      },
    });

    for (const data of completedPatientData) {
      const archivedQueueId = queueIdMap.get(data.queueId);
      const archivedPatientId = patientIdMap.get(data.patientId);

      if (archivedQueueId && archivedPatientId) {
        await tx.archiveCompletedPatientData.create({
          data: {
            queueId: archivedQueueId,
            patientId: archivedPatientId,
            receptionData: data.receptionData || null,
            accountingData: data.accountingData || null,
            bloodDrawData: data.bloodDrawData || null,
            labData: data.labData || null,
            doctorData: data.doctorData || null,
            completedAt: data.completedAt,
            archivedAt,
          },
        });
      }
    }

    return {
      archivedQueueIds,
      archivedPatientIds: Array.from(archivedPatientIds),
    };
  });

  console.log(`✅ تم نقل ${result.archivedQueueIds.length} دور إلى الأرشيف`);

  return {
    success: true,
    archivedCount: result.archivedQueueIds.length,
    archivedQueueIds: result.archivedQueueIds,
    archivedPatientIds: result.archivedPatientIds,
    message: `تم نقل ${result.archivedQueueIds.length} دور إلى الأرشيف بنجاح`,
  };
}

/**
 * حذف البيانات المؤرشفة من الجداول الأساسية
 */
async function resetMainDatabase(archivedQueueIds: number[], archivedPatientIds: number[]) {
  console.log("🗑️ بدء حذف البيانات المؤرشفة من الجداول الأساسية...");

  await prisma.$transaction(async (tx) => {
    // حذف QueueHistory
    const deletedHistory = await tx.queueHistory.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف ReceptionData
    const deletedReception = await tx.receptionData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف AccountingData
    const deletedAccounting = await tx.accountingData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف BloodDrawData
    const deletedBloodDraw = await tx.bloodDrawData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف LabData
    const deletedLab = await tx.labData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف DoctorData
    const deletedDoctor = await tx.doctorData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف CompletedPatientData
    const deletedCompletedData = await tx.completedPatientData.deleteMany({
      where: {
        queueId: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف CompletedVisit
    const deletedVisits = await tx.completedVisit.deleteMany({
      where: {
        patientId: {
          in: archivedPatientIds,
        },
      },
    });

    // حذف Queues
    const deletedQueues = await tx.queue.deleteMany({
      where: {
        id: {
          in: archivedQueueIds,
        },
      },
    });

    // حذف Patients الذين ليس لديهم أدوار نشطة
    const activePatientIds = await tx.queue
      .findMany({
        where: {
          status: OverallQueueStatus.ACTIVE,
        },
        select: {
          patientId: true,
        },
      })
      .then((queues) => new Set(queues.map((q) => q.patientId)));

    const patientsToDelete = archivedPatientIds.filter(
      (id) => !activePatientIds.has(id)
    );

    const deletedPatients = await tx.patient.deleteMany({
      where: {
        id: {
          in: patientsToDelete,
        },
      },
    });

    console.log(`✅ تم حذف ${deletedQueues.count} دور من الجداول الأساسية`);
    console.log(`✅ تم حذف ${deletedPatients.count} مريض من الجداول الأساسية`);
  });
}

/**
 * تحديث آخر تاريخ أرشفة
 */
async function updateLastArchiveDate() {
  const today: string = new Date().toISOString().split("T")[0]!;
  const description: string = "آخر تاريخ تم فيه تنفيذ عملية الأرشفة";

  await prisma.systemSettings.upsert({
    where: { key: "LAST_ARCHIVE_DATE" },
    update: {
      value: today,
      description: description,
    },
    create: {
      key: "LAST_ARCHIVE_DATE",
      value: today,
      description: description,
    },
  });
}

/**
 * الدالة الرئيسية لعملية الأرشفة اليومية
 */
async function performDailyArchive() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("🔄 بدء عملية الأرشفة اليومية...");
    console.log("═══════════════════════════════════════════");

    // 1. نقل البيانات إلى الأرشيف
    const archiveResult = await archiveCompletedQueues();

    if (!archiveResult.success || archiveResult.archivedCount === 0) {
      console.log("ℹ️ لا توجد بيانات للأرشفة");
      return {
        success: true,
        message: "لا توجد بيانات للأرشفة",
        archivedCount: 0,
      };
    }

    // 2. حذف البيانات المؤرشفة من الجداول الأساسية
    if (
      archiveResult.archivedQueueIds &&
      archiveResult.archivedQueueIds.length > 0 &&
      archiveResult.archivedPatientIds
    ) {
      await resetMainDatabase(
        archiveResult.archivedQueueIds,
        archiveResult.archivedPatientIds
      );
    }

    // 3. إعادة تعيين أرقام الأدوار
    await resetQueueNumbers();

    // 4. تحديث آخر تاريخ أرشفة
    await updateLastArchiveDate();

    console.log("═══════════════════════════════════════════");
    console.log("✅ تمت عملية الأرشفة بنجاح!");
    console.log(`📦 تم أرشفة ${archiveResult.archivedCount} دور`);
    console.log("🔄 تم إعادة تعيين أرقام الأدوار إلى 0");
    console.log("═══════════════════════════════════════════");

    return {
      success: true,
      archivedCount: archiveResult.archivedCount,
      message: `تمت عملية الأرشفة بنجاح! تم أرشفة ${archiveResult.archivedCount} دور`,
    };
  } catch (error: any) {
    console.error("❌ خطأ في عملية الأرشفة:", error);
    throw error;
  }
}

/**
 * جلب البيانات المؤرشفة مع الفلترة
 */
async function getArchivedQueues(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: OverallQueueStatus;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.startDate || filters?.endDate) {
    where.archivedAt = {};
    if (filters.startDate) {
      where.archivedAt.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.archivedAt.lte = new Date(filters.endDate);
    }
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  const [archivedQueues, totalCount] = await Promise.all([
    prisma.archiveQueue.findMany({
      where,
      include: {
        patient: true,
        ArchiveReceptionData: true,
        ArchiveAccountingData: true,
        ArchiveBloodDrawData: true,
        ArchiveLabData: true,
        ArchiveDoctorData: true,
        ArchiveQueueHistory: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        archivedAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.archiveQueue.count({ where }),
  ]);

  // تطبيق البحث على البيانات المستلمة
  let filteredQueues = archivedQueues;
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredQueues = archivedQueues.filter(
      (queue) =>
        queue.queueNumber.toString().includes(searchLower) ||
        queue.patient.name.toLowerCase().includes(searchLower) ||
        queue.patient.phoneNumber?.toLowerCase().includes(searchLower) ||
        queue.patient.nationalId?.toLowerCase().includes(searchLower) ||
        queue.ArchiveReceptionData?.maleName?.toLowerCase().includes(searchLower) ||
        queue.ArchiveReceptionData?.femaleName?.toLowerCase().includes(searchLower)
    );
  }

  return {
    queues: filteredQueues,
    total: totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * الحصول على إحصائيات الأرشيف
 */
async function getArchiveStats() {
  const totalArchived = await prisma.archiveQueue.count();

  const lastArchiveDate = await prisma.systemSettings.findUnique({
    where: { key: "LAST_ARCHIVE_DATE" },
  });

  const completedCount = await prisma.archiveQueue.count({
    where: {
      status: OverallQueueStatus.COMPLETED,
    },
  });

  const cancelledCount = await prisma.archiveQueue.count({
    where: {
      status: OverallQueueStatus.CANCELLED,
    },
  });

  return {
    totalArchived,
    completedCount,
    cancelledCount,
    lastArchiveDate: lastArchiveDate?.value || null,
  };
}

export {
  archiveCompletedQueues,
  resetMainDatabase,
  performDailyArchive,
  getArchivedQueues,
  getArchiveStats,
};

