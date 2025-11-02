import { Request, Response } from "express";
import { DiseasesStatus } from "../generated/prisma";
import {
  createDoctorData,
  getDoctorDataByQueueId,
  updateDoctorData,
  saveCompletedPatientData,
  getAllCompletedPatientData,
  getCompletedPatientDataById,
  updateCompletedPatientData,
  updateCompletedPatientDoctorData,
} from "../services/doctor.service";
import { emitQueueUpdate, emitQueueCompleted, emitScreenDataUpdate } from "..";

/**
 * إضافة بيانات الطبيب
 * POST /api/doctor
 */
export async function addDoctorData(req: Request, res: Response) {
  try {
    const {
      queueId,
      patientId,
      maleBloodType,
      femaleBloodType,
      maleHIVstatus,
      femaleHIVstatus,
      maleHBSstatus,
      femaleHBSstatus,
      maleHBCstatus,
      femaleHBCstatus,
      maleHIVvalue,
      femaleHIVvalue,
      maleHBSvalue,
      femaleHBSvalue,
      maleHBCvalue,
      femaleHBCvalue,
      maleHemoglobinEnabled,
      maleHbS,
      maleHbF,
      maleHbA1c,
      maleHbA2,
      maleHbSc,
      maleHbD,
      maleHbE,
      maleHbC,
      femaleHemoglobinEnabled,
      femaleHbS,
      femaleHbF,
      femaleHbA1c,
      femaleHbA2,
      femaleHbSc,
      femaleHbD,
      femaleHbE,
      femaleHbC,
      maleNotes,
      femaleNotes,
      notes,
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (
      !queueId ||
      !patientId ||
      !maleHIVstatus ||
      !femaleHIVstatus ||
      !maleHBSstatus ||
      !femaleHBSstatus ||
      !maleHBCstatus ||
      !femaleHBCstatus
    ) {
      return res.status(400).json({
        success: false,
        error:
          "البيانات الأساسية مطلوبة (queueId, patientId, وجميع حالات الأمراض)",
      });
    }

    // التحقق من صحة قيم حالات الأمراض
    const diseaseStatuses = [
      maleHIVstatus,
      femaleHIVstatus,
      maleHBSstatus,
      femaleHBSstatus,
      maleHBCstatus,
      femaleHBCstatus,
    ];

    for (const status of diseaseStatuses) {
      if (!Object.values(DiseasesStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: "قيم حالة الأمراض غير صحيحة. يجب أن تكون POSITIVE أو NEGATIVE",
        });
      }
    }

    // إنشاء بيانات الطبيب (بدون استدعاء تلقائي)
    const result = await createDoctorData({
      queueId,
      patientId,
      ...(maleBloodType && { maleBloodType }),
      ...(femaleBloodType && { femaleBloodType }),
      maleHIVstatus,
      femaleHIVstatus,
      maleHBSstatus,
      femaleHBSstatus,
      maleHBCstatus,
      femaleHBCstatus,
      ...(maleHIVvalue && { maleHIVvalue }),
      ...(femaleHIVvalue && { femaleHIVvalue }),
      ...(maleHBSvalue && { maleHBSvalue }),
      ...(femaleHBSvalue && { femaleHBSvalue }),
      ...(maleHBCvalue && { maleHBCvalue }),
      ...(femaleHBCvalue && { femaleHBCvalue }),
      ...(maleHemoglobinEnabled !== undefined && { maleHemoglobinEnabled }),
      ...(maleHbS && { maleHbS }),
      ...(maleHbF && { maleHbF }),
      ...(maleHbA1c && { maleHbA1c }),
      ...(maleHbA2 && { maleHbA2 }),
      ...(maleHbSc && { maleHbSc }),
      ...(maleHbD && { maleHbD }),
      ...(maleHbE && { maleHbE }),
      ...(maleHbC && { maleHbC }),
      ...(femaleHemoglobinEnabled !== undefined && { femaleHemoglobinEnabled }),
      ...(femaleHbS && { femaleHbS }),
      ...(femaleHbF && { femaleHbF }),
      ...(femaleHbA1c && { femaleHbA1c }),
      ...(femaleHbA2 && { femaleHbA2 }),
      ...(femaleHbSc && { femaleHbSc }),
      ...(femaleHbD && { femaleHbD }),
      ...(femaleHbE && { femaleHbE }),
      ...(femaleHbC && { femaleHbC }),
      ...(maleNotes && { maleNotes }),
      ...(femaleNotes && { femaleNotes }),
      ...(notes && { notes }),
    });

    // حفظ البيانات الكاملة من جميع المحطات
    await saveCompletedPatientData(queueId, patientId);

    // إرسال إشعارات WebSocket
    emitQueueUpdate({
      type: "DOCTOR_COMPLETED",
      queueId,
      patientId,
    });

    emitQueueCompleted({
      queueId,
      patientId,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      doctorData: result.doctorData,
      message: "تم حفظ بيانات الطبيب بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات الطبيب
 * GET /api/doctor/:queueId
 */
export async function getDoctorData(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const doctorData = await getDoctorDataByQueueId(queueId);

    if (!doctorData) {
      return res.status(404).json({
        success: false,
        error: "بيانات الطبيب غير موجودة",
      });
    }

    res.json({
      success: true,
      doctorData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات الطبيب
 * PUT /api/doctor/:queueId
 */
export async function updateDoctorDataController(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const updatedData = await updateDoctorData(queueId, req.body);

    res.json({
      success: true,
      doctorData: updatedData,
      message: "تم تحديث بيانات الطبيب",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على جميع البيانات المكتملة مع الفلترة والـ pagination
 * GET /api/doctor/completed
 */
export async function getCompletedData(req: Request, res: Response) {
  try {
    const { page, limit, search, queueId, startDate, endDate } = req.query;

    const filters: {
      page?: number;
      limit?: number;
      search?: string;
      queueId?: number;
      startDate?: string;
      endDate?: string;
    } = {};

    if (page) filters.page = parseInt(page as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (search) filters.search = search as string;
    if (queueId) filters.queueId = parseInt(queueId as string);
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;

    const result = await getAllCompletedPatientData(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على البيانات المكتملة لمريض معين
 * GET /api/doctor/completed/:id
 */
export async function getCompletedDataById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "المعرف غير صالح",
      });
    }

    const completedData = await getCompletedPatientDataById(id);

    if (!completedData) {
      return res.status(404).json({
        success: false,
        error: "البيانات غير موجودة",
      });
    }

    res.json({
      success: true,
      data: completedData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث البيانات المكتملة (ReceptionData)
 * PUT /api/doctor/completed/:id
 */
export async function updateCompletedDataController(
  req: Request,
  res: Response
) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "المعرف غير صالح",
      });
    }

    const updatedData = await updateCompletedPatientData(id, req.body);

    res.json({
      success: true,
      data: updatedData,
      message: "تم تحديث البيانات بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات الطبيب في البيانات المكتملة
 * PUT /api/doctor/completed/:id/doctor
 */
export async function updateCompletedDoctorDataController(
  req: Request,
  res: Response
) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "المعرف غير صالح",
      });
    }

    const updatedData = await updateCompletedPatientDoctorData(id, req.body);

    res.json({
      success: true,
      data: updatedData,
      message: "تم تحديث بيانات الطبيب بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على السجلات المكتملة حسب نطاق أرقام الدور
 * GET /api/doctor/completed/range
 */
export async function getCompletedDataByRange(req: Request, res: Response) {
  try {
    const { queueIdStart, queueIdEnd, search, priority } = req.query;

    if (!queueIdStart || !queueIdEnd) {
      return res.status(400).json({
        success: false,
        error: "يجب تحديد نطاق أرقام الدور (queueIdStart و queueIdEnd)",
      });
    }

    const start = parseInt(queueIdStart as string);
    const end = parseInt(queueIdEnd as string);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        error: "أرقام الدور يجب أن تكون أرقام صحيحة",
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: "رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية",
      });
    }

    const filters: any = {
      queueIdStart: start,
      queueIdEnd: end,
    };

    if (search) filters.search = search as string;
    if (priority) filters.priority = parseInt(priority as string);

    const result = await getAllCompletedPatientData(filters);

    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على عدة سجلات مكتملة حسب IDs
 * POST /api/doctor/completed/bulk
 */
export async function getCompletedDataBulk(req: Request, res: Response) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "يجب تحديد مصفوفة من IDs",
      });
    }

    // التحقق من أن جميع IDs أرقام صحيحة
    const validIds = ids.filter((id) => Number.isInteger(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "لا توجد IDs صحيحة",
      });
    }

    const result = await getAllCompletedPatientData({
      ids: validIds,
      limit: validIds.length, // جلب جميع السجلات
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
