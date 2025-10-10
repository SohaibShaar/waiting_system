import { Router } from "express";
import {
  getRecentCallsForDisplay,
  getScreenData,
  getScreenDataCalled,
} from "../controllers/screen.controller";

const screenRouter = Router();

/**
 * GET /api/display/recent-calls
 * آخر الاستدعاءات للشاشة العامة
 */
screenRouter.get("/recent-calls", getRecentCallsForDisplay);

/**
 * GET /api/display/screen-data
 * بيانات الشاشة العامة منسقة
 */
screenRouter.get("/screen-data", getScreenData);

/**
 * GET /api/display/screen-data-in-progress
 * بيانات الشاشة العامة منسقة للاستدعاءات الحالية
 */
screenRouter.get("/screen-data-called", getScreenDataCalled);

export default screenRouter;
