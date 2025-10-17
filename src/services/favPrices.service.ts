import { PrismaClient, DiseasesStatus } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة سعر مفضل
 */
export async function addFavoritePrice(label: string, value: number) {
  return await prisma.favoriteprice.create({
    data: { label, value, updatedAt: new Date() },
  });
}

/**
 * حذف سعر مفضل
 */
export async function deleteFavoritePrice(id: number) {
  return await prisma.favoriteprice.delete({
    where: { id },
  });
}

/**
 * الحصول على جميع سعر مفضل
 */
export async function getFavoritePrices() {
  return await prisma.favoriteprice.findMany();
}

/**
 * تعديل سعر مفضل
 */
export async function updateFavoritePrice(
  id: number,
  label: string,
  value: number
) {
  return await prisma.favoriteprice.update({
    where: { id },
    data: { label, value },
  });
}
