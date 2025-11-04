import { Request, Response } from "express";
import {
  saveBloodType,
  getBloodTypeByQueueId,
} from "../services/bloodType.service";
import { emitQueueUpdate, emitScreenDataUpdate } from "..";

/**
 * حفظ فصيلة الدم
 * POST /api/blood-type
 */
export async function addBloodType(req: Request, res: Response) {
  try {
    const { queueId, patientId, maleBloodType, femaleBloodType } = req.body;

    // التحقق من البيانات المطلوبة
    if (!queueId || !patientId) {
      return res.status(400).json({
        success: false,
        error: "البيانات الأساسية مطلوبة (queueId, patientId)",
      });
    }

    // التحقق من وجود فصيلة دم واحدة على الأقل
    if (!maleBloodType && !femaleBloodType) {
      return res.status(400).json({
        success: false,
        error: "يجب إدخال فصيلة دم واحدة على الأقل",
      });
    }

    // حفظ فصيلة الدم
    const result = await saveBloodType({
      queueId,
      patientId,
      ...(maleBloodType && { maleBloodType }),
      ...(femaleBloodType && { femaleBloodType }),
    });

    // إرسال إشعارات WebSocket
    emitQueueUpdate({
      type: "BLOOD_TYPE_COMPLETED",
      queueId,
      patientId,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      data: result,
      message: "تم حفظ فصيلة الدم بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على فصيلة الدم
 * GET /api/blood-type/:queueId
 */
export async function getBloodType(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const bloodType = await getBloodTypeByQueueId(queueId);

    if (!bloodType) {
      return res.status(404).json({
        success: false,
        error: "بيانات فصيلة الدم غير موجودة",
      });
    }

    res.json({
      success: true,
      data: bloodType,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

