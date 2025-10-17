import { Router } from "express";
import {
  createQueue,
  getActiveQueues,
  getQueueById,
  updateQueuePriority,
  cancelQueueById,
  completeQueueById,
  getCancelledQueues,
  reinstateQueueById,
} from "../controllers/queue.controller";

const router = Router();

/**
 * POST /api/queue/create
 * إنشاء دور جديد
 */
router.post("/create", createQueue);

/**
 * GET /api/queue/active
 * الحصول على جميع الأدوار النشطة
 */
router.get("/active", getActiveQueues);

/**
 * GET /api/queue/:id
 * الحصول على تفاصيل دور معين
 */
router.get("/:id", getQueueById);

/**
 * PUT /api/queue/:id/priority
 * تغيير أولوية دور
 */
router.put("/:id/priority", updateQueuePriority);

/**
 * DELETE /api/queue/:id/cancel
 * إلغاء دور
 */
router.delete("/:id/cancel", cancelQueueById);

/**
 * POST /api/queue/:id/complete
 * إنهاء دور بالكامل
 */
router.post("/:id/complete", completeQueueById);

/**
 * GET /api/queue/cancelled/today
 * الحصول على الأدوار الملغاة لليوم الحالي
 */
router.get("/cancelled/today", getCancelledQueues);

/**
 * POST /api/queue/:id/reinstate
 * إعادة تفعيل دور ملغى
 */
router.post("/:id/reinstate", reinstateQueueById);

export default router;
