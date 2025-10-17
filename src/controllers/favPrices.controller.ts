import { Request, Response } from "express";
import {
  addFavoritePrice,
  deleteFavoritePrice,
  getFavoritePrices,
  updateFavoritePrice,
} from "../services/favPrices.service";

/**
 * إضافة سعر مفضل
 * POST /api/favPrices
 */
export async function addFavoritePriceController(req: Request, res: Response) {
  const { label, value } = req.body;
  const result = await addFavoritePrice(label, parseFloat(value));
  res.status(201).json({
    success: true,
    result,
  });
}

/**
 * حذف سعر مفضل
 * DELETE /api/favPrices/:id
 */
export async function deleteFavoritePriceController(
  req: Request,
  res: Response
) {
  const { id } = req.params;
  const result = await deleteFavoritePrice(Number(id));
  res.status(201).json({
    success: true,
    result,
  });
}

/**
 * الحصول على جميع سعر مفضل
 * GET /api/favPrices
 */
export async function getFavoritePricesController(req: Request, res: Response) {
  const result = await getFavoritePrices();
  res.status(201).json({
    success: true,
    result,
  });
}

/**
 * تعديل سعر مفضل
 * PUT /api/favPrices/:id
 */
export async function updateFavoritePriceController(
  req: Request,
  res: Response
) {
  const { id } = req.params;
  const { label, value } = req.body;
  const result = await updateFavoritePrice(Number(id), label, value);
  res.status(201).json({
    success: true,
    result,
  });
}
