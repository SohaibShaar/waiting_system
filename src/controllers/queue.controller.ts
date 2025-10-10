import { Request, Response } from "express";
import {
  createNewQueue,
  getAllActiveQueues,
  cancelQueue,
  changeQueuePriority,
  completeQueue,
} from "../services/queue.service";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إنشاء دور جديد
 * POST /api/queue/create
 */
export async function createQueue(req: Request, res: Response) {
  try {
    const { name, phoneNumber, nationalId, priority, notes } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "اسم المريض مطلوب",
      });
    }

    const result = await createNewQueue({
      name,
      ...(phoneNumber && { phoneNumber }),
      ...(nationalId && { nationalId }),
      priority: priority || 0,
      ...(notes && { notes }),
    });

    res.status(201).json({
      success: true,
      queue: result.queue,
      queueNumber: result.queueNumber,
      patient: result.patient,
      station: result.station,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على جميع الأدوار النشطة
 * GET /api/queue/active
 */
export async function getActiveQueues(req: Request, res: Response) {
  try {
    const queues = await getAllActiveQueues();

    res.json({
      success: true,
      queues,
      count: queues.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * الحصول على تفاصيل دور معين
 * GET /api/queue/:id
 */
export async function getQueueById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const queue = await prisma.queue.findUnique({
      where: { id },
      include: {
        patient: true,
        currentStation: true,
        history: {
          include: {
            station: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        error: "الدور غير موجود",
      });
    }

    res.json({
      success: true,
      queue,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تغيير أولوية دور
 * PUT /api/queue/:id/priority
 */
export async function updateQueuePriority(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { priority } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    if (priority === undefined || isNaN(priority)) {
      return res.status(400).json({
        success: false,
        error: "الأولوية مطلوبة ويجب أن تكون رقماً",
      });
    }

    await changeQueuePriority(id, priority);

    res.json({
      success: true,
      message: `تم تغيير الأولوية إلى ${priority}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إلغاء دور
 * DELETE /api/queue/:id/cancel
 */
export async function cancelQueueById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { reason } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    await cancelQueue(id, reason || undefined);

    res.json({
      success: true,
      message: "تم إلغاء الدور",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إنهاء دور بالكامل
 * POST /api/queue/:id/complete
 */
export async function completeQueueById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور غير صالح",
      });
    }

    const result = await completeQueue(id);

    res.json({
      success: true,
      message: "تم إنهاء الدور بالكامل",
      completedVisit: result.completedVisit,
      queue: result.queue,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
