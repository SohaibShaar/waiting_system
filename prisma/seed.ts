import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // إنشاء المحطات
  await prisma.station.createMany({
    data: [
      { name: "الاستقبال", displayNumber: 1, order: 1 },
      { name: "الفحص الأولي", displayNumber: 2, order: 2 },
      { name: "الطبيب", displayNumber: 3, order: 3 },
    ],
  });

  // إعدادات النظام
  await prisma.systemSettings.createMany({
    data: [{ key: "LAST_QUEUE_NUMBER", value: "0" }],
  });

  console.log("✅ تم إضافة البيانات الأولية");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
