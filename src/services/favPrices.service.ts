import { PrismaClient, DiseasesStatus } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة سعر مفضل
 */
export async function addFavoritePrice(label: string, value: number) {
  return await prisma.favoritePrice.create({
    data: { label, value },
  });
}

/**
 * حذف سعر مفضل
 */
export async function deleteFavoritePrice(id: number) {
  return await prisma.favoritePrice.delete({
    where: { id },
  });
}

/**
 * الحصول على جميع سعر مفضل
 */
export async function getFavoritePrices() {
  return await prisma.favoritePrice.findMany();
}

/**
 * تعديل سعر مفضل
 */
export async function updateFavoritePrice(
  id: number,
  label: string,
  value: number
) {
  return await prisma.favoritePrice.update({
    where: { id },
    data: { label, value },
  });
}


