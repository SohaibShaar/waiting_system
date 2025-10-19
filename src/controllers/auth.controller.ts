import { Request, Response } from "express";
import authService from "../services/auth.service";
import crypto from "crypto";

export class AuthController {
  /**
   * التحقق من كلمة مرور الصفحة
   * POST /api/auth/verify-page
   */
  async verifyPage(req: Request, res: Response) {
    try {
      const { pageName, password } = req.body;

      if (!pageName || !password) {
        return res.status(400).json({
          success: false,
          error: "يجب توفير اسم الصفحة وكلمة المرور",
        });
      }

      const result = await authService.verifyPassword(pageName, password);

      if (result.success) {
        // إنشاء token بسيط (يمكن تحسينه لاحقاً)
        const token = crypto.randomBytes(32).toString("hex");

        return res.json({
          success: true,
          token,
          isMaster: result.isMaster,
          message: result.isMaster
            ? "تم التحقق بكلمة المرور العامة"
            : "تم التحقق بنجاح",
        });
      } else {
        return res.status(401).json({
          success: false,
          error: "كلمة المرور غير صحيحة",
        });
      }
    } catch (error) {
      console.error("خطأ في التحقق من كلمة المرور:", error);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ في الخادم",
      });
    }
  }

  /**
   * جلب جميع كلمات المرور (للإدارة)
   * GET /api/auth/passwords
   */
  async getAllPasswords(req: Request, res: Response) {
    try {
      const passwords = await authService.getAllPagePasswords();

      return res.json({
        success: true,
        passwords,
      });
    } catch (error) {
      console.error("خطأ في جلب كلمات المرور:", error);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ في الخادم",
      });
    }
  }

  /**
   * تحديث كلمة مرور صفحة
   * PUT /api/auth/page-password/:pageName
   */
  async updatePagePassword(req: Request, res: Response) {
    try {
      const { pageName } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: "يجب توفير كلمة المرور الجديدة",
        });
      }

      const updatedPassword = await authService.updatePagePassword(
        pageName as string,
        newPassword
      );

      return res.json({
        success: true,
        message: "تم تحديث كلمة المرور بنجاح",
        password: updatedPassword,
      });
    } catch (error) {
      console.error("خطأ في تحديث كلمة المرور:", error);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ في الخادم",
      });
    }
  }

  /**
   * تحديث كلمة المرور العامة
   * PUT /api/auth/master-password
   */
  async updateMasterPassword(req: Request, res: Response) {
    try {
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: "يجب توفير كلمة المرور الجديدة",
        });
      }

      const updatedPassword = await authService.updateMasterPassword(
        newPassword
      );

      return res.json({
        success: true,
        message: "تم تحديث كلمة المرور العامة بنجاح",
        password: updatedPassword,
      });
    } catch (error) {
      console.error("خطأ في تحديث كلمة المرور العامة:", error);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ في الخادم",
      });
    }
  }
}

export default new AuthController();
