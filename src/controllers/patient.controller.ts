import { Request, Response } from "express";
import { upsertPatient, findPatient } from "../services/patient.service";
import { getPatientHistory } from "../services/stats.service";

/**
 * إنشاء أو تحديث مريض
 * POST /api/patients
 */
export async function createOrUpdatePatient(req: Request, res: Response) {
  try {
    const { name, phoneNumber, nationalId } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "اسم المريض مطلوب",
      });
    }

    const patient = await upsertPatient({
      name,
      ...(phoneNumber && { phoneNumber }),
      ...(nationalId && { nationalId }),
    });

    res.status(201).json({
      success: true,
      patient,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على بيانات مريض معين
 * GET /api/patients/:id
 */
export async function getPatientById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف المريض غير صالح",
      });
    }

    const patient = await findPatient({ id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "المريض غير موجود",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * البحث عن مريض برقم الهاتف أو الهوية
 * GET /api/patients/search?phone=xxx&nationalId=xxx
 */
export async function searchPatient(req: Request, res: Response) {
  try {
    const { phone, nationalId } = req.query;

    if (!phone && !nationalId) {
      return res.status(400).json({
        success: false,
        error: "يجب توفير رقم الهاتف أو رقم الهوية",
      });
    }

    const patient = await findPatient({
      ...(phone && { phoneNumber: phone as string }),
      ...(nationalId && { nationalId: nationalId as string }),
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "المريض غير موجود",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تاريخ زيارات المريض
 * GET /api/patients/:id/history
 */
export async function getPatientVisitHistory(req: Request, res: Response) {
  try {
    const patientId = parseInt(req.params.id as string);

    if (isNaN(patientId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المريض غير صالح",
      });
    }

    const visits = await getPatientHistory(patientId);

    res.json({
      success: true,
      visits,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
