import { PrismaClient, DiseasesStatus } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * إضافة قيمة الإضافة السريعة
 */
export async function addFastAddValue(value: number) {
  return await prisma.fastaddvalue.create({
    data: { value, updatedAt: new Date() },
  });
}

/**
 * الحصول على قيمة الإضافة السريعة
 */
export async function getFastAddValue() {
  return await prisma.fastaddvalue.findUnique({
    where: { id: 1 },
    select: { id: true, value: true },
  });
}

/**
 * تعديل قيمة الإضافة السريعة
 */
export async function updateFastAddValue(value: string) {
  return await prisma.fastaddvalue.update({
    where: { id: 1 },
    data: { value: parseInt(value) },
  });
}
