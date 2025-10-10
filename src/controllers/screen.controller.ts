import {
  getRecentCalls,
  getDisplayScreenData,
  getDisplayScreenDataCalled,
} from "../services/screen.service";
import { Request, Response } from "express";

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

/**
 * بيانات الشاشة العامة منسقة للاستدعاءات الحالية
 * GET /api/display/screen-data-called
 */
export async function getScreenDataCalled(req: Request, res: Response) {
  try {
    const display = await getDisplayScreenDataCalled();

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
