import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function seedPasswords() {
  try {
    console.log("🌱 بدء seed لكلمات المرور...");

    // إضافة كلمة المرور العامة
    const masterPassword = await prisma.masterPassword.upsert({
      where: { id: 1 },
      update: {},
      create: {
        password: "admin123",
        isActive: true,
      },
    });
    console.log("✅ تم إضافة كلمة المرور العامة:", masterPassword.password);

    // إضافة كلمات مرور الصفحات
    const pages = [
      { pageName: "reception", password: "r123" },
      { pageName: "accounting", password: "a123" },
      { pageName: "lab", password: "l123" },
      { pageName: "blood-draw", password: "b123" },
      { pageName: "doctor", password: "d123" },
    ];

    for (const page of pages) {
      const pagePassword = await prisma.pagePassword.upsert({
        where: { pageName: page.pageName },
        update: {},
        create: {
          pageName: page.pageName,
          password: page.password,
          isActive: true,
        },
      });
      console.log(
        `✅ تم إضافة كلمة مرور صفحة ${page.pageName}:`,
        pagePassword.password
      );
    }

    console.log("✅ تم الانتهاء من seed كلمات المرور بنجاح!");
  } catch (error) {
    console.error("❌ خطأ في seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedPasswords();
