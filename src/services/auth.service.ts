import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

export class AuthService {
  /**
   * التحقق من كلمة المرور العامة
   */
  async verifyMasterPassword(password: string): Promise<boolean> {
    try {
      const masterPassword = await prisma.masterPassword.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!masterPassword) {
        return false;
      }

      return masterPassword.password === password;
    } catch (error) {
      console.error("خطأ في التحقق من كلمة المرور العامة:", error);
      return false;
    }
  }

  /**
   * التحقق من كلمة مرور صفحة محددة
   */
  async verifyPagePassword(
    pageName: string,
    password: string
  ): Promise<boolean> {
    try {
      const pagePassword = await prisma.pagePassword.findUnique({
        where: {
          pageName,
        },
      });

      if (!pagePassword || !pagePassword.isActive) {
        return false;
      }

      return pagePassword.password === password;
    } catch (error) {
      console.error("خطأ في التحقق من كلمة مرور الصفحة:", error);
      return false;
    }
  }

  /**
   * التحقق من كلمة المرور (عامة أو خاصة بصفحة)
   */
  async verifyPassword(
    pageName: string,
    password: string
  ): Promise<{ success: boolean; isMaster: boolean }> {
    try {
      // أولاً: التحقق من كلمة المرور العامة
      const isMasterValid = await this.verifyMasterPassword(password);
      if (isMasterValid) {
        return { success: true, isMaster: true };
      }

      // ثانياً: التحقق من كلمة مرور الصفحة المحددة
      const isPageValid = await this.verifyPagePassword(pageName, password);
      if (isPageValid) {
        return { success: true, isMaster: false };
      }

      return { success: false, isMaster: false };
    } catch (error) {
      console.error("خطأ في التحقق من كلمة المرور:", error);
      return { success: false, isMaster: false };
    }
  }

  /**
   * جلب جميع كلمات مرور الصفحات
   */
  async getAllPagePasswords() {
    try {
      const pagePasswords = await prisma.pagePassword.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          pageName: true,
          password: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return pagePasswords;
    } catch (error) {
      console.error("خطأ في جلب كلمات المرور:", error);
      throw error;
    }
  }

  /**
   * تحديث كلمة مرور صفحة
   */
  async updatePagePassword(pageName: string, newPassword: string) {
    try {
      const updatedPassword = await prisma.pagePassword.update({
        where: {
          pageName,
        },
        data: {
          password: newPassword,
        },
      });

      return updatedPassword;
    } catch (error) {
      console.error("خطأ في تحديث كلمة المرور:", error);
      throw error;
    }
  }

  /**
   * تحديث كلمة المرور العامة
   */
  async updateMasterPassword(newPassword: string) {
    try {
      const masterPassword = await prisma.masterPassword.findFirst({
        where: {
          isActive: true,
        },
      });

      if (!masterPassword) {
        throw new Error("كلمة المرور العامة غير موجودة");
      }

      const updatedPassword = await prisma.masterPassword.update({
        where: {
          id: masterPassword.id,
        },
        data: {
          password: newPassword,
        },
      });

      return updatedPassword;
    } catch (error) {
      console.error("خطأ في تحديث كلمة المرور العامة:", error);
      throw error;
    }
  }
}

export default new AuthService();
