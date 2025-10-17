import { Request, Response } from "express";
import {
  createBloodDrawData,
  getBloodDrawDataByQueueId,
} from "../services/bloodDraw.service";
import { emitQueueUpdate, emitScreenDataUpdate } from "..";

/**
 * إضافة بيانات سحب الدم
 * POST /api/blood-draw
 */
export async function addBloodDrawData(req: Request, res: Response) {
  try {
    const { queueId, patientId, notes } = req.body;

    // التحقق من البيانات المطلوبة
    if (!queueId || !patientId) {
      return res.status(400).json({
        success: false,
        error: "البيانات الأساسية مطلوبة (queueId, patientId)",
      });
    }

    // إنشاء بيانات سحب الدم (بدون استدعاء تلقائي)
    const result = await createBloodDrawData({
      queueId,
      patientId,
      ...(notes && { notes }),
    });

    // إرسال إشعارات WebSocket
    emitQueueUpdate({
      type: "BLOOD_DRAW_COMPLETED",
      queueId,
      patientId,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      bloodDrawData: result.bloodDrawData,
      message: "تم تسجيل سحب الدم بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات سحب الدم
 * GET /api/blood-draw/:queueId
 */
export async function getBloodDrawData(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const bloodDrawData = await getBloodDrawDataByQueueId(queueId);

    if (!bloodDrawData) {
      return res.status(404).json({
        success: false,
        error: "بيانات سحب الدم غير موجودة",
      });
    }

    res.json({
      success: true,
      bloodDrawData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
