import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // حذف البيانات القديمة أولاً
  console.log("🧹 جاري تنظيف قاعدة البيانات...");
  await prisma.queueHistory.deleteMany({});
  await prisma.completedVisit.deleteMany({});
  await prisma.accountingData.deleteMany({});
  await prisma.labData.deleteMany({});
  await prisma.doctorData.deleteMany({});
  await prisma.receptionData.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.systemSettings.deleteMany({});

  console.log("✅ تم تنظيف قاعدة البيانات");

  // إنشاء المحطات بالترتيب الصحيح
  console.log("📍 جاري إنشاء المحطات...");
  await prisma.station.createMany({
    data: [
      {
        name: "الاستقبال",
        displayNumber: 1,
        order: 1,
        description: "استقبال المرضى وتسجيل البيانات",
      },
      {
        name: "المحاسبة",
        displayNumber: 2,
        order: 2,
        description: "دفع الرسوم",
      },
      {
        name: "المخبر",
        displayNumber: 3,
        order: 3,
        description: "الفحوصات المخبرية",
      },
      {
        name: "الدكتور",
        displayNumber: 4,
        order: 4,
        description: "الكشف الطبي",
      },
    ],
  });

  console.log("✅ تم إنشاء المحطات بنجاح");

  // إعدادات النظام
  console.log("⚙️ جاري إنشاء إعدادات النظام...");
  await prisma.systemSettings.create({
    data: {
      key: "LAST_QUEUE_NUMBER",
      value: "0",
      description: "آخر رقم دور تم إنشاؤه",
    },
  });

  console.log("✅ تم إضافة البيانات الأولية بنجاح");

  // عرض المحطات المنشأة
  const stations = await prisma.station.findMany({ orderBy: { order: "asc" } });
  console.log("\n📋 المحطات المنشأة:");
  stations.forEach((station) => {
    console.log(
      `   ${station.order}. ${station.name} - شاشة رقم ${station.displayNumber}`
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
