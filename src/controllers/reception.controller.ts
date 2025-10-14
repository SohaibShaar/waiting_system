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
 * يتم إنشاء مراجع جديد ودور جديد تلقائياً
 * POST /api/reception
 */
export async function addReceptionData(req: Request, res: Response) {
  try {
    const {
      maleStatus,
      femaleStatus,
      maleName,
      maleLastName,
      maleFatherName,
      maleBirthDate,
      maleNationalId,
      maleAge,
      maleBirthPlace,
      maleRegistration,
      maleCountry,
      femaleName,
      femaleLastName,
      femaleFatherName,
      femaleBirthDate,
      femaleNationalId,
      femaleAge,
      femaleBirthPlace,
      femaleRegistration,
      femaleCountry,
      phoneNumber,
      notes,
      priority,
    } = req.body;

    // التحقق من وجود الحالة
    if (!maleStatus || !femaleStatus) {
      return res.status(400).json({
        success: false,
        error: "حالة الزوج والزوجة مطلوبة",
      });
    }

    // التحقق من البيانات المطلوبة بناءً على الحالة
    // إذا كانت الحالة NORMAL، يجب أن تكون جميع البيانات موجودة
    if (maleStatus === "NORMAL" && femaleStatus === "NORMAL") {
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
          error: "في الحالة العادية، جميع بيانات الزوجين مطلوبة",
        });
      }
    }

    // التحقق من وجود بيانات الزوج إذا كانت حالته NORMAL أو LEGAL_INVITATION
    if (maleStatus === "NORMAL" || maleStatus === "LEGAL_INVITATION") {
      if (
        !maleName ||
        !maleLastName ||
        !maleFatherName ||
        !maleBirthDate ||
        !maleNationalId ||
        maleAge === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: "بيانات الزوج مطلوبة عندما تكون حالته عادية أو دعوة شرعية",
        });
      }
    }

    // التحقق من وجود بيانات الزوجة إذا كانت حالتها NORMAL أو LEGAL_INVITATION
    if (femaleStatus === "NORMAL" || femaleStatus === "LEGAL_INVITATION") {
      if (
        !femaleName ||
        !femaleLastName ||
        !femaleFatherName ||
        !femaleBirthDate ||
        !femaleNationalId ||
        femaleAge === undefined
      ) {
        return res.status(400).json({
          success: false,
          error: "بيانات الزوجة مطلوبة عندما تكون حالتها عادية أو دعوة شرعية",
        });
      }
    }

    // إنشاء مراجع ودور جديد مع بيانات الاستقبال
    // تنظيف البيانات: تحويل النصوص الفارغة إلى undefined
    const cleanString = (val: any) =>
      val && val.trim() !== "" ? val.trim() : undefined;
    const cleanNumber = (val: any) =>
      val !== undefined && val !== null && val !== "" ? Number(val) : undefined;

    const result = await createReceptionData({
      maleStatus,
      femaleStatus,
      ...(cleanString(maleName) && { maleName: cleanString(maleName) }),
      ...(cleanString(maleLastName) && {
        maleLastName: cleanString(maleLastName),
      }),
      ...(cleanString(maleFatherName) && {
        maleFatherName: cleanString(maleFatherName),
      }),
      ...(cleanString(maleBirthDate) && {
        maleBirthDate: new Date(maleBirthDate),
      }),
      ...(cleanString(maleNationalId) && {
        maleNationalId: cleanString(maleNationalId),
      }),
      ...(cleanNumber(maleAge) !== undefined && {
        maleAge: cleanNumber(maleAge),
      }),
      ...(cleanString(maleBirthPlace) && {
        maleBirthPlace: cleanString(maleBirthPlace),
      }),
      ...(cleanString(maleRegistration) && {
        maleRegistration: cleanString(maleRegistration),
      }),
      ...(cleanString(maleCountry) && {
        maleCountry: cleanString(maleCountry),
      }),
      ...(cleanString(femaleName) && { femaleName: cleanString(femaleName) }),
      ...(cleanString(femaleLastName) && {
        femaleLastName: cleanString(femaleLastName),
      }),
      ...(cleanString(femaleFatherName) && {
        femaleFatherName: cleanString(femaleFatherName),
      }),
      ...(cleanString(femaleBirthDate) && {
        femaleBirthDate: new Date(femaleBirthDate),
      }),
      ...(cleanString(femaleNationalId) && {
        femaleNationalId: cleanString(femaleNationalId),
      }),
      ...(cleanNumber(femaleAge) !== undefined && {
        femaleAge: cleanNumber(femaleAge),
      }),
      ...(cleanString(femaleBirthPlace) && {
        femaleBirthPlace: cleanString(femaleBirthPlace),
      }),
      ...(cleanString(femaleRegistration) && {
        femaleRegistration: cleanString(femaleRegistration),
      }),
      ...(cleanString(femaleCountry) && {
        femaleCountry: cleanString(femaleCountry),
      }),
      ...(cleanString(phoneNumber) && {
        phoneNumber: cleanString(phoneNumber),
      }),
      ...(cleanString(notes) && { notes: cleanString(notes) }),
      ...(cleanNumber(priority) !== undefined && {
        priority: cleanNumber(priority),
      }),
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
      message: "تم إنشاء المراجع والدور وحفظ بيانات الاستقبال بنجاح",
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
