import { Router } from "express";
import {
  addDoctorData,
  getDoctorData,
  updateDoctorDataController,
} from "../controllers/doctor.controller";

const router = Router();

/**
 * POST /api/doctor
 * إضافة بيانات الطبيب مع الاستدعاء التلقائي للتالي
 */
router.post("/", addDoctorData);

/**
 * GET /api/doctor/:queueId
 * الحصول على بيانات الطبيب
 */
router.get("/:queueId", getDoctorData);

/**
 * PUT /api/doctor/:queueId
 * تحديث بيانات الطبيب
 */
router.put("/:queueId", updateDoctorDataController);

export default router;
