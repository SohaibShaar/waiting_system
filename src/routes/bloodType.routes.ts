import { Router } from "express";
import { addBloodType, getBloodType } from "../controllers/bloodType.controller";

const router = Router();

// POST /api/blood-type - حفظ فصيلة الدم
router.post("/", addBloodType);

// GET /api/blood-type/:queueId - الحصول على فصيلة الدم
router.get("/:queueId", getBloodType);

export default router;

