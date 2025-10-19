import { Router } from "express";
import {
  addDoctorData,
  getDoctorData,
  updateDoctorDataController,
  getCompletedData,
  getCompletedDataById,
} from "../controllers/doctor.controller";

const router = Router();

/**
 * POST /api/doctor
 * إضافة بيانات الطبيب مع الاستدعاء التلقائي للتالي
 */
router.post("/", addDoctorData);

/**
 * GET /api/doctor/completed
 * الحصول على جميع البيانات المكتملة
 */
router.get("/completed", getCompletedData);

/**
 * GET /api/doctor/completed/:id
 * الحصول على البيانات المكتملة لمريض معين
 */
router.get("/completed/:id", getCompletedDataById);

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
