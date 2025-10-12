import { Router } from "express";
import {
  addLabData,
  getLabData,
  updateLabDataController,
} from "../controllers/lab.controller";

const router = Router();

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
