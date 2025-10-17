import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // حذف البيانات القديمة أولاً
  console.log("🧹 جاري تنظيف قاعدة البيانات...");

  await prisma.queueHistory.deleteMany({});
  await prisma.completedVisit.deleteMany({});
  await prisma.accountingData.deleteMany({});
  await prisma.labData.deleteMany({});
  await prisma.bloodDrawData.deleteMany({});
  await prisma.doctorData.deleteMany({});
  await prisma.receptionData.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.systemSettings.deleteMany({});
  await prisma.favoritePrice.deleteMany({});
  await prisma.fastAddValue.deleteMany({});
  await prisma.$executeRawUnsafe(
    `ALTER TABLE queue_history AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE completed_visits AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE accounting_data AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE lab_data AUTO_INCREMENT = 1`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE blood_draw_data AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE doctor_data AUTO_INCREMENT = 1`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE reception_data AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE queues AUTO_INCREMENT = 1`);
  await prisma.$executeRawUnsafe(`ALTER TABLE patients AUTO_INCREMENT = 1`);
  await prisma.$executeRawUnsafe(`ALTER TABLE stations AUTO_INCREMENT = 1`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE system_settings AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE favoriteprice AUTO_INCREMENT = 1`
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE fastaddvalue AUTO_INCREMENT = 1`);
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
        name: "الفحص الطبي",
        displayNumber: 3,
        order: 3,
        description: "الفحوصات الأولية",
      },
      {
        name: "سحب الدم",
        displayNumber: 4,
        order: 4,
        description: "سحب الدم",
      },
      {
        name: "الدكتور",
        displayNumber: 5,
        order: 5,
        description: "الكشف الطبي",
      },
    ],
  });
  await prisma.favoritePrice.createMany({
    data: [
      {
        label: "الدعوة الشرعية",
        value: 200000,
      },
      {
        label: "السعر",
        value: 250000,
      },
    ],
  });
  await prisma.fastAddValue.createMany({
    data: [
      {
        value: 100000,
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
