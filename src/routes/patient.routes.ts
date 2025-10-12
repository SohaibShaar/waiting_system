import { Router } from "express";
import {
  createOrUpdatePatient,
  getPatientById,
  searchPatient,
  getPatientVisitHistory,
} from "../controllers/patient.controller";

const router = Router();

/**
 * POST /api/patients
 * إنشاء أو تحديث مراجع
 */
router.post("/", createOrUpdatePatient);

/**
 * GET /api/patients/search?phone=xxx&nationalId=xxx
 * البحث عن مراجع برقم الهاتف أو الهوية
 */
router.get("/search", searchPatient);

/**
 * GET /api/patients/:id
 * الحصول على بيانات مراجع معين
 */
router.get("/:id", getPatientById);

/**
 * GET /api/patients/:id/history
 * تاريخ زيارات المراجع
 */
router.get("/:id/history", getPatientVisitHistory);

export default router;
