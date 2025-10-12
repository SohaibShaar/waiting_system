import { Request, Response } from "express";
import {
  createAccountingData,
  getAccountingDataByQueueId,
  updateAccountingData,
} from "../services/accounting.service";
import { emitQueueUpdate, emitScreenDataUpdate } from "..";

/**
 * إضافة بيانات المحاسبة
 * POST /api/accounting
 */
export async function addAccountingData(req: Request, res: Response) {
  try {
    const { queueId, patientId, totalAmount, isPaid, notes } = req.body;

    // التحقق من البيانات المطلوبة
    if (
      !queueId ||
      !patientId ||
      totalAmount === undefined ||
      isPaid === undefined
    ) {
      return res.status(400).json({
        success: false,
        error:
          "البيانات الأساسية مطلوبة (queueId, patientId, totalAmount, isPaid)",
      });
    }

    // إنشاء بيانات المحاسبة (بدون استدعاء تلقائي)
    const result = await createAccountingData({
      queueId,
      patientId,
      totalAmount: parseFloat(totalAmount),
      isPaid: Boolean(isPaid),
      ...(notes && { notes }),
    });

    // إرسال إشعارات WebSocket
    emitQueueUpdate({
      type: "ACCOUNTING_COMPLETED",
      queueId,
      patientId,
    });

    // تحديث بيانات الشاشة العامة
    emitScreenDataUpdate();

    res.status(201).json({
      success: true,
      accountingData: result.accountingData,
      message: "تم حفظ بيانات المحاسبة بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات المحاسبة
 * GET /api/accounting/:queueId
 */
export async function getAccountingData(req: Request, res: Response) {
  try {
    const queueId = parseInt(req.params.queueId as string);

    if (isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const accountingData = await getAccountingDataByQueueId(queueId);

    if (!accountingData) {
      return res.status(404).json({
        success: false,
        error: "بيانات المحاسبة غير موجودة",
      });
    }

    res.json({
      success: true,
      accountingData,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات المحاسبة
 * PUT /api/accounting/:queueId
 */
export async function updateAccountingDataController(
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

    const updatedData = await updateAccountingData(queueId, req.body);

    res.json({
      success: true,
      accountingData: updatedData,
      message: "تم تحديث بيانات المحاسبة",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
