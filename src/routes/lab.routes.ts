import { Router } from "express";
import {
  addLabData,
  getLabData,
  updateLabDataController,
  getAllLabDataController,
} from "../controllers/lab.controller";

const router = Router();

/**
 * GET /api/lab/all
 * جلب جميع سجلات المختبر (للأرشيف)
 */
router.get("/all", getAllLabDataController);

/**
 * POST /api/lab
 * إضافة بيانات المختبر مع الاستدعاء التلقائي للتالي
 */
router.post("/", addLabData);

/**
 * GET /api/lab/:queueId
 * الحصول على بيانات المختبر
 */
router.get("/:queueId", getLabData);

/**
 * PUT /api/lab/:queueId
 * تحديث بيانات المختبر
 */
router.put("/:queueId", updateLabDataController);

export default router;
