import { Router } from "express";
import {
  addAccountingData,
  getAccountingData,
  updateAccountingDataController,
} from "../controllers/accounting.controller";

const router = Router();

/**
 * POST /api/accounting
 * إضافة بيانات المحاسبة مع الاستدعاء التلقائي للتالي
 */
router.post("/", addAccountingData);

/**
 * GET /api/accounting/:queueId
 * الحصول على بيانات المحاسبة
 */
router.get("/:queueId", getAccountingData);

/**
 * PUT /api/accounting/:queueId
 * تحديث بيانات المحاسبة
 */
router.put("/:queueId", updateAccountingDataController);

export default router;
