import { Router } from "express";
import {
  addReceptionData,
  getReceptionData,
  getTodayReception,
  updateReceptionDataController,
} from "../controllers/reception.controller";

const router = Router();

/**
 * POST /api/reception
 * إضافة بيانات الاستقبال مع الاستدعاء التلقائي للتالي
 */
router.post("/", addReceptionData);

/**
 * GET /api/reception/today
 * الحصول على جميع بيانات الاستقبال لليوم الحالي
 */
router.get("/today", getTodayReception);

/**
 * GET /api/reception/:queueId
 * الحصول على بيانات الاستقبال
 */
router.get("/:queueId", getReceptionData);

/**
 * PUT /api/reception/:queueId
 * تحديث بيانات الاستقبال
 */
router.put("/:queueId", updateReceptionDataController);

export default router;
