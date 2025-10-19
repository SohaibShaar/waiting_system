import { Router } from "express";
import authController from "../controllers/auth.controller";

const router = Router();

// التحقق من كلمة مرور الصفحة
router.post("/verify-page", authController.verifyPage);

// جلب جميع كلمات المرور (للإدارة)
router.get("/passwords", authController.getAllPasswords);

// تحديث كلمة مرور صفحة
router.put("/page-password/:pageName", authController.updatePagePassword);

// تحديث كلمة المرور العامة
router.put("/master-password", authController.updateMasterPassword);

export default router;
