import { Request, Response } from "express";
import { Status } from "../generated/prisma";
import {
  createLabData,
  getLabDataByQueueId,
  updateLabData,
  getAllLabData,
} from "../services/lab.service";
import { emitQueueUpdate, emitScreenDataUpdate } from "..";

/**
 * إضافة بيانات المختبر
 * POST /api/lab
 */
export async function addLabData(req: Request, res: Response) {
  try {
    const {
      queueId,
      patientId,
      doctorName,
      isMaleHealthy,
      isFemaleHealthy,
      maleNotes,
      femaleNotes,
      notes,
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!queueId || !patientId || !isMaleHealthy || !isFemaleHealthy) {
      return res.status(400).json({
        success: false,
        error:
          "البيانات الأساسية مطلوبة (queueId, patientId, isMaleHealthy, isFemaleHealthy)",
      });
    }

    // التحقق من صحة قيم الحالة الصحية
    if (
      !Object.values(Status).includes(isMaleHealthy) ||
      !Object.values(Status).includes(isFemaleHealthy)
    ) {
      return res.status(400).json({
        success: false,
        error: "قيم الحالة الصحية غير صحيحة. يجب أن تكون HEALTHY أو UNHEALTHY",
      });
    }

    // إنشاء بيانات المختبر (بدون استدعاء تلقائي)
    const result = await createLabData({
      queueId,
      patientId,
      ...(doctorName && { doctorName }),
      isMaleHealthy,
      isFemaleHealthy,
      ...(maleNotes && { maleNotes }),
      ...(femaleNotes && { femaleNotes }),
      ...(notes && { notes }),
    });

    // إرسال إشعارات WebSocket
    emitQueueUpdate({
      type: "LAB_COMPLETED",
      queueId,
      patientId,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      labData: result.labData,
      message: "تم حفظ بيانات المختبر بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات المختبر
 * GET /api/lab/:queueId
 */
export async function getLabData(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const labData = await getLabDataByQueueId(queueId);

    if (!labData) {
      return res.status(404).json({
        success: false,
        error: "بيانات المختبر غير موجودة",
      });
    }

    res.json({
      success: true,
      labData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات المختبر
 * PUT /api/lab/:queueId
 */
export async function updateLabDataController(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const updatedData = await updateLabData(queueId, req.body);

    // إرسال إشعارات WebSocket بعد التحديث
    emitQueueUpdate({
      type: "LAB_UPDATED",
      queueId,
    });

    emitScreenDataUpdate();

    res.json({
      success: true,
      labData: updatedData,
      message: "تم تحديث بيانات المختبر",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * جلب جميع سجلات المختبر (للأرشيف)
 * GET /api/lab
 */
export async function getAllLabDataController(req: Request, res: Response) {
  try {
    const allData = await getAllLabData();

    res.json({
      success: true,
      data: allData,
      count: allData.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
