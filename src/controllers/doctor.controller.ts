import { Request, Response } from "express";
import { DiseasesStatus } from "../generated/prisma";
import {
  createDoctorData,
  getDoctorDataByQueueId,
  updateDoctorData,
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
      ...(maleNotes && { maleNotes }),
      ...(femaleNotes && { femaleNotes }),
      ...(notes && { notes }),
    });

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
