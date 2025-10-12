import { Request, Response } from "express";
import {
  createReceptionData,
  getReceptionDataByQueueId,
  getTodayReceptionData,
  updateReceptionData,
} from "../services/reception.service";
import { emitScreenDataUpdate, emitNewQueue, emitQueueUpdate } from "..";

/**
 * إضافة بيانات الاستقبال - نقطة البداية في النظام
 * يتم إنشاء مريض جديد ودور جديد تلقائياً
 * POST /api/reception
 */
export async function addReceptionData(req: Request, res: Response) {
  try {
    const {
      maleName,
      maleLastName,
      maleFatherName,
      maleBirthDate,
      maleNationalId,
      maleAge,
      femaleName,
      femaleLastName,
      femaleFatherName,
      femaleBirthDate,
      femaleNationalId,
      femaleAge,
      phoneNumber,
      notes,
      priority,
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (
      !maleName ||
      !maleLastName ||
      !maleFatherName ||
      !maleBirthDate ||
      !maleNationalId ||
      maleAge === undefined ||
      !femaleName ||
      !femaleLastName ||
      !femaleFatherName ||
      !femaleBirthDate ||
      !femaleNationalId ||
      femaleAge === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "جميع بيانات الزوجين مطلوبة",
      });
    }

    // إنشاء مريض ودور جديد مع بيانات الاستقبال
    const result = await createReceptionData({
      maleName,
      maleLastName,
      maleFatherName,
      maleBirthDate: new Date(maleBirthDate),
      maleNationalId,
      maleAge,
      femaleName,
      femaleLastName,
      femaleFatherName,
      femaleBirthDate: new Date(femaleBirthDate),
      femaleNationalId,
      femaleAge,
      ...(phoneNumber && { phoneNumber }),
      ...(notes && { notes }),
      ...(priority !== undefined && { priority }),
    });

    // إرسال إشعارات WebSocket
    emitNewQueue({
      queueId: result.queue.id,
      queueNumber: result.queueNumber,
      patient: result.patient,
    });

    emitQueueUpdate({
      type: "NEW",
      queueId: result.queue.id,
      queueNumber: result.queueNumber,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      message: "تم إنشاء المريض والدور وحفظ بيانات الاستقبال بنجاح",
      patient: result.patient,
      queue: result.queue,
      queueNumber: result.queueNumber,
      receptionData: result.receptionData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات الاستقبال
 * GET /api/reception/:queueId
 */
export async function getReceptionData(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const receptionData = await getReceptionDataByQueueId(queueId);

    if (!receptionData) {
      return res.status(404).json({
        success: false,
        error: "بيانات الاستقبال غير موجودة",
      });
    }

    res.json({
      success: true,
      receptionData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على جميع بيانات الاستقبال لليوم الحالي
 * GET /api/reception/today
 */
export async function getTodayReception(req: Request, res: Response) {
  try {
    const receptionData = await getTodayReceptionData();

    res.json({
      success: true,
      count: receptionData.length,
      receptionData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات الاستقبال
 * PUT /api/reception/:queueId
 */
export async function updateReceptionDataController(
  req: Request,
  res: Response
) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    // إزالة priority لأنه ليس جزء من ReceptionData
    const { priority, ...receptionFields } = req.body;

    // تحويل التواريخ إذا كانت موجودة
    const dataToUpdate = {
      ...receptionFields,
      ...(req.body.maleBirthDate && {
        maleBirthDate: new Date(req.body.maleBirthDate),
      }),
      ...(req.body.femaleBirthDate && {
        femaleBirthDate: new Date(req.body.femaleBirthDate),
      }),
    };

    const updatedData = await updateReceptionData(queueId, dataToUpdate);

    res.json({
      success: true,
      receptionData: updatedData,
      message: "تم تحديث بيانات الاستقبال",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
