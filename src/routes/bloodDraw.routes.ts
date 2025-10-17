import { Router } from "express";
import {
  addBloodDrawData,
  getBloodDrawData,
} from "../controllers/bloodDraw.controller";

const router = Router();

/**
 * POST /api/blood-draw
 * إضافة بيانات سحب الدم
 */
router.post("/", addBloodDrawData);

/**
 * GET /api/blood-draw/:queueId
 * الحصول على بيانات سحب الدم
 */
router.get("/:queueId", getBloodDrawData);

export default router;
