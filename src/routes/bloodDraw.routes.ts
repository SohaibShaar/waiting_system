import { Router } from "express";
import {
  addBloodDrawData,
  getBloodDrawData,
  generateTubeNumbers,
} from "../controllers/bloodDraw.controller";

const router = Router();

/**
 * POST /api/blood-draw
 * إضافة بيانات سحب الدم
 */
router.post("/", addBloodDrawData);

/**
 * POST /api/blood-draw/generate-tubes/:queueId
 * توليد أرقام أنابيب الدم
 */
router.post("/generate-tubes/:queueId", generateTubeNumbers);

/**
 * GET /api/blood-draw/:queueId
 * الحصول على بيانات سحب الدم
 */
router.get("/:queueId", getBloodDrawData);

export default router;
