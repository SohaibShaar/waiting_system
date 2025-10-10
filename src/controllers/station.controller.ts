import { Request, Response } from "express";
import {
  getStationWaitingList,
  getCurrentPatientInStation,
  skipPatient,
} from "../services/queue.service";
import {
  startService,
  completeStationService,
  getRecentCalls,
  getDisplayScreenData,
} from "../services/station.service";
import {
  callNextPatient,
  callSpecificQueue,
} from "../services/patient.service";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * الحصول على قائمة جميع المحطات
 * GET /api/stations
 */
export async function getAllStations(req: Request, res: Response) {
  try {
    const stations = await prisma.station.findMany({
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      stations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إنشاء محطة جديدة
 * POST /api/stations
 */
export async function createStation(req: Request, res: Response) {
  try {
    const { name, displayNumber, order, description } = req.body;

    if (!name || !displayNumber || !order) {
      return res.status(400).json({
        success: false,
        error: "الاسم ورقم العرض والترتيب مطلوبة",
      });
    }

    const station = await prisma.station.create({
      data: {
        name,
        displayNumber,
        order,
        ...(description && { description }),
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      station,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تحديث بيانات محطة
 * PUT /api/stations/:id
 */
export async function updateStation(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { name, displayNumber, order, description, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    const station = await prisma.station.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(displayNumber && { displayNumber }),
        ...(order && { order }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      station,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * حذف محطة
 * DELETE /api/stations/:id
 */
export async function deleteStation(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    // التحقق من عدم وجود أدوار نشطة في المحطة
    const activeQueuesCount = await prisma.queue.count({
      where: {
        currentStationId: id,
        status: "ACTIVE",
      },
    });

    if (activeQueuesCount > 0) {
      return res.status(400).json({
        success: false,
        error: "لا يمكن حذف محطة تحتوي على أدوار نشطة",
      });
    }

    await prisma.station.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "تم حذف المحطة",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * قائمة المرضى المنتظرين لمحطة معينة
 * GET /api/stations/:stationId/waiting-list
 */
export async function getWaitingList(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        error: "المحطة غير موجودة",
      });
    }

    const waitingList = await getStationWaitingList(stationId);

    // حساب وقت الانتظار لكل مريض
    const waitingListWithTime = waitingList.map((queue) => {
      const history = queue.history[0];
      const waitingTime = history
        ? Math.floor((Date.now() - history.createdAt.getTime()) / 60000)
        : 0;

      return {
        queueNumber: queue.queueNumber,
        patient: queue.patient,
        priority: queue.priority,
        waitingTime,
        notes: queue.notes,
      };
    });

    res.json({
      success: true,
      station: {
        id: station.id,
        name: station.name,
        displayNumber: station.displayNumber,
      },
      waiting: waitingListWithTime,
      count: waitingListWithTime.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * المريض الحالي في المحطة
 * GET /api/stations/:stationId/current
 */
export async function getCurrentPatient(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    const currentQueue = await getCurrentPatientInStation(stationId);

    if (!currentQueue) {
      return res.json({
        success: true,
        current: null,
      });
    }

    const history = currentQueue.history[0];

    res.json({
      success: true,
      current: {
        queueId: currentQueue.id,
        queueNumber: currentQueue.queueNumber,
        patient: currentQueue.patient,
        status: history?.status,
        startedAt: history?.startedAt,
        calledAt: history?.calledAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * استدعاء المريض التالي
 * POST /api/stations/:stationId/call-next
 */
export async function callNext(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);
    const { calledBy } = req.body;

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    const result = await callNextPatient(stationId, calledBy || undefined);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      queue: result.queue,
      displayNumber: result.displayNumber,
      queueNumber: result.queueNumber,
      message: `تم استدعاء الدور #${result.queueNumber}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * استدعاء دور محدد بالرقم
 * POST /api/stations/:stationId/call-specific
 */
export async function callSpecific(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);
    const { queueNumber, calledBy } = req.body;

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    if (!queueNumber) {
      return res.status(400).json({
        success: false,
        error: "رقم الدور مطلوب",
      });
    }

    const result = await callSpecificQueue(
      queueNumber,
      stationId,
      calledBy || undefined
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      queue: result.queue,
      message: `تم استدعاء الدور #${queueNumber}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * بدء تقديم الخدمة
 * POST /api/stations/:stationId/start-service
 */
export async function startStationService(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);
    const queueId = parseInt(req.body.queueId);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    if (!req.body.queueId || isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور مطلوب ويجب أن يكون رقماً",
      });
    }

    const result = await startService(queueId, stationId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: "بدأت الخدمة",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * إنهاء الخدمة والانتقال للمحطة التالية
 * POST /api/stations/:stationId/complete-service
 */
export async function completeService(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);
    const queueId = parseInt(req.body.queueId);
    const { notes } = req.body;

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    if (!req.body.queueId || isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور مطلوب ويجب أن يكون رقماً",
      });
    }

    const result = await completeStationService(
      queueId,
      stationId,
      notes || undefined
    );

    if (result.moved) {
      res.json({
        success: true,
        moved: true,
        nextStation: result.nextStation,
        completed: false,
        message: `انتهت الخدمة - انتقل للمحطة ${result.nextStation?.name}`,
      });
    } else if (result.completed) {
      res.json({
        success: true,
        moved: false,
        completed: true,
        message: "انتهى الدور بالكامل",
      });
    } else {
      res.json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * تخطي المريض الحالي
 * POST /api/stations/:stationId/skip-patient
 */
export async function skipCurrentPatient(req: Request, res: Response) {
  try {
    const stationId = parseInt(req.params.stationId as string);
    const queueId = parseInt(req.body.queueId);

    if (isNaN(stationId)) {
      return res.status(400).json({
        success: false,
        error: "معرف المحطة غير صالح",
      });
    }

    if (!req.body.queueId || isNaN(queueId)) {
      return res.status(400).json({
        success: false,
        error: "معرف الدور مطلوب ويجب أن يكون رقماً",
      });
    }

    await skipPatient(queueId, stationId);

    res.json({
      success: true,
      message: "تم تخطي المريض",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * آخر الاستدعاءات للشاشة العامة
 * GET /api/display/recent-calls
 */
export async function getRecentCallsForDisplay(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const calls = await getRecentCalls(limit);

    const formattedCalls = calls.map((call) => ({
      queueNumber: call.queue.queueNumber,
      displayNumber: call.station.displayNumber,
      stationName: call.station.name,
      calledAt: call.calledAt,
      status: call.status,
    }));

    res.json({
      success: true,
      calls: formattedCalls,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * بيانات الشاشة العامة منسقة
 * GET /api/display/screen-data
 */
export async function getScreenData(req: Request, res: Response) {
  try {
    const display = await getDisplayScreenData();

    res.json({
      success: true,
      display,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
