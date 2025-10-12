import { Router } from "express";
import {
  getAllStations,
  createStation,
  updateStation,
  deleteStation,
  getWaitingList,
  getCurrentPatient,
  callNext,
  callSpecific,
  startStationService,
  completeService,
  skipCurrentPatient,
} from "../controllers/station.controller";

const router = Router();

/**
 * GET /api/stations
 * الحصول على قائمة جميع المحطات
 */
router.get("/", getAllStations);

/**
 * POST /api/stations
 * إنشاء محطة جديدة
 */
router.post("/", createStation);

/**
 * PUT /api/stations/:id
 * تحديث بيانات محطة
 */
router.put("/:id", updateStation);

/**
 * DELETE /api/stations/:id
 * حذف محطة
 */
router.delete("/:id", deleteStation);

/**
 * GET /api/stations/:stationId/waiting-list
 * قائمة المراجعون المنتظرين لمحطة معينة
 */
router.get("/:stationId/waiting-list", getWaitingList);

/**
 * GET /api/stations/:stationId/current
 * المراجع الحالي في المحطة
 */
router.get("/:stationId/current", getCurrentPatient);

/**
 * POST /api/stations/:stationId/call-next
 * استدعاء المراجع التالي
 */
router.post("/:stationId/call-next", callNext);

/**
 * POST /api/stations/:stationId/call-specific
 * استدعاء دور محدد بالرقم
 */
router.post("/:stationId/call-specific", callSpecific);

/**
 * POST /api/stations/:stationId/start-service
 * بدء تقديم الخدمة
 */
router.post("/:stationId/start-service", startStationService);

/**
 * POST /api/stations/:stationId/complete-service
 * إنهاء الخدمة والانتقال للمحطة التالية
 */
router.post("/:stationId/complete-service", completeService);

/**
 * POST /api/stations/:stationId/skip-patient
 * تخطي المراجع الحالي
 */
router.post("/:stationId/skip-patient", skipCurrentPatient);

export default router;
