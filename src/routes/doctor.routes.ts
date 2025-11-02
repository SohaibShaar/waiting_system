import { Router } from "express";
import {
  addDoctorData,
  getDoctorData,
  updateDoctorDataController,
  getCompletedData,
  getCompletedDataById,
  updateCompletedDataController,
  updateCompletedDoctorDataController,
  getCompletedDataByRange,
  getCompletedDataBulk,
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
 * GET /api/doctor/completed/range
 * الحصول على السجلات المكتملة حسب نطاق أرقام الدور
 */
router.get("/completed/range", getCompletedDataByRange);

/**
 * POST /api/doctor/completed/bulk
 * الحصول على عدة سجلات مكتملة حسب IDs
 */
router.post("/completed/bulk", getCompletedDataBulk);

/**
 * GET /api/doctor/completed/:id
 * الحصول على البيانات المكتملة لمريض معين
 */
router.get("/completed/:id", getCompletedDataById);

/**
 * PUT /api/doctor/completed/:id
 * تحديث البيانات المكتملة (ReceptionData)
 */
router.put("/completed/:id", updateCompletedDataController);

/**
 * PUT /api/doctor/completed/:id/doctor
 * تحديث بيانات الطبيب في البيانات المكتملة
 */
router.put("/completed/:id/doctor", updateCompletedDoctorDataController);

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
