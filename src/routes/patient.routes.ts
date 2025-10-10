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
 * إنشاء أو تحديث مريض
 */
router.post("/", createOrUpdatePatient);

/**
 * GET /api/patients/search?phone=xxx&nationalId=xxx
 * البحث عن مريض برقم الهاتف أو الهوية
 */
router.get("/search", searchPatient);

/**
 * GET /api/patients/:id
 * الحصول على بيانات مريض معين
 */
router.get("/:id", getPatientById);

/**
 * GET /api/patients/:id/history
 * تاريخ زيارات المريض
 */
router.get("/:id/history", getPatientVisitHistory);

export default router;
