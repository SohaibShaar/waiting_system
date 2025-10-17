import { Router } from "express";
import {
  addFavoritePriceController,
  deleteFavoritePriceController,
  getFavoritePricesController,
  updateFavoritePriceController,
} from "../controllers/favPrices.controller";

const router = Router();

/**
 * إضافة سعر مفضل
 * POST /api/favPrices
 */
router.post("/", addFavoritePriceController);

/**
 * حذف سعر مفضل
 * DELETE /api/favPrices/:id
 */
router.delete("/:id", deleteFavoritePriceController);

/**
 * الحصول على جميع سعر مفضل
 * GET /api/favPrices
 */
router.get("/", getFavoritePricesController);

/**
 * تعديل سعر مفضل
 * PUT /api/favPrices/:id
 */
router.put("/:id", updateFavoritePriceController);

export default router;
