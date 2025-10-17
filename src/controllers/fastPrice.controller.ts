import { Request, Response } from "express";
import {
  addFastAddValue,
  getFastAddValue,
  updateFastAddValue,
} from "../services/fastPrice.service";
import { emitFastPriceUpdate } from "../websocket/socket";

/**
 * إضافة قيمة الإضافة السريعة
 * POST /api/favPrices/fast-add-value
 */
export async function addFastAddValueController(req: Request, res: Response) {
  const { value } = req.body;
  const result = await addFastAddValue(Number(value));
  res.status(201).json({
    success: true,

    result,
  });
}

/**
 * الحصول على قيمة الإضافة السريعة
 * GET /api/favPrices/fast-add-value
 */
export async function getFastAddValueController(req: Request, res: Response) {
  const result = await getFastAddValue();
  res.status(201).json({
    success: true,
    result,
  });
}

/**
 * تعديل سعر مفضل
 * PUT /api/favPrices/:id
 */
export async function updateFastAddValueController(
  req: Request,
  res: Response
) {
  const { value } = req.body;
  const result = await updateFastAddValue(value);
  emitFastPriceUpdate({ value: result.value });
  res.status(201).json({
    success: true,
    result,
  });
}
