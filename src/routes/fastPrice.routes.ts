import { Router } from "express";
import {
  addFastAddValueController,
  getFastAddValueController,
  updateFastAddValueController,
} from "../controllers/fastPrice.controller";

const router = Router();

/**
 * إضافة قيمة الإضافة السريعة
 * POST /api/favPrices/fast-add-value
 */
router.post("/fast-add-value", addFastAddValueController);

/**
 * الحصول على قيمة الإضافة السريعة
 * GET /api/favPrices/fast-add-value
 */
router.get("/fast-add-value", getFastAddValueController);

/**
 * تعديل قيمة الإضافة السريعة
 * PUT /api/favPrices/fast-add-value
 */
router.put("/fast-add-value", updateFastAddValueController);

export default router;
