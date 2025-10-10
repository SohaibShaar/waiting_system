import { Router } from "express";
import {
  getTodayStatistics,
  getAllStationsStats,
  getStationStatistics,
  getOverviewStats,
} from "../controllers/stats.controller";

const router = Router();

/**
 * GET /api/stats/today
 * إحصائيات اليوم
 */
router.get("/today", getTodayStatistics);

/**
 * GET /api/stats/stations
 * إحصائيات جميع المحطات
 */
router.get("/stations", getAllStationsStats);

/**
 * GET /api/stats/station/:stationId
 * إحصائيات محطة معينة
 */
router.get("/station/:stationId", getStationStatistics);

/**
 * GET /api/stats/overview
 * نظرة عامة شاملة
 */
router.get("/overview", getOverviewStats);

export default router;
