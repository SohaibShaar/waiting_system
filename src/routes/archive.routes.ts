import { Router } from "express";
import {
  getArchivedQueuesHandler,
  getArchiveStatsHandler,
  performArchiveHandler,
} from "../controllers/archive.controller";

const router = Router();

/**
 * GET /api/archive/queues
 * جلب البيانات المؤرشفة مع الفلترة والبحث
 */
router.get("/queues", getArchivedQueuesHandler);

/**
 * GET /api/archive/stats
 * الحصول على إحصائيات الأرشيف
 */
router.get("/stats", getArchiveStatsHandler);

/**
 * POST /api/archive/perform
 * تشغيل عملية الأرشفة يدوياً
 */
router.post("/perform", performArchiveHandler);

export default router;

