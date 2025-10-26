# دليل التشغيل التلقائي - Auto-Start Guide

## نظرة عامة
هذا النظام يسمح بتشغيل المشروع تلقائياً عند بدء تشغيل Windows وفتح المتصفح في وضع ملء الشاشة.

## الملفات المستخدمة

### 1. `start-system.bat`
الملف الرئيسي الذي يقوم بـ:
- تشغيل Backend Server (المنفذ 3000)
- تشغيل Frontend Server (المنفذ 5173)
- فتح Chrome في وضع ملء الشاشة على http://localhost:5173

### 2. `start-system.vbs`
ملف VBScript يقوم بتشغيل `start-system.bat` في الخلفية بدون إظهار نوافذ موجه الأوامر الإضافية.

### 3. `setup-autostart.bat`
ملف الإعداد الذي يقوم بإضافة المشروع إلى قائمة التشغيل التلقائي في Windows.

### 4. `remove-autostart.bat`
ملف لإزالة المشروع من قائمة التشغيل التلقائي.

## طريقة الاستخدام

### الخطوة 1: تثبيت التشغيل التلقائي
```cmd
# قم بتشغيل هذا الملف (يفضل كمسؤول)
setup-autostart.bat
```

سيقوم الملف بإنشاء اختصار في مجلد Startup في Windows.

### الخطوة 2: اختبار التشغيل
يمكنك اختبار التشغيل بدون إعادة تشغيل Windows:
```cmd
start-system.bat
```

### الخطوة 3: إعادة تشغيل Windows
أعد تشغيل الجهاز وسيتم تشغيل المشروع تلقائياً!

## إزالة التشغيل التلقائي

إذا أردت إيقاف التشغيل التلقائي:
```cmd
remove-autostart.bat
```

## التخصيص

### تغيير وقت الانتظار
في ملف `start-system.bat`، يمكنك تعديل الأوقات:
```batch
timeout /t 10 /nobreak >nul  # وقت انتظار Backend (10 ثواني)
timeout /t 15 /nobreak >nul  # وقت انتظار Frontend (15 ثانية)
```

### تغيير المتصفح
لاستخدام متصفح آخر غير Chrome:
```batch
# Edge
start msedge.exe --start-fullscreen --app=http://localhost:5173

# Firefox
start firefox.exe -kiosk http://localhost:5173
```

### تغيير المنفذ
إذا كان Frontend يعمل على منفذ مختلف، عدل السطر:
```batch
start chrome.exe --start-fullscreen --app=http://localhost:YOUR_PORT
```

## معلومات مهمة

### المتطلبات
- ✅ Node.js مثبت
- ✅ npm مثبت
- ✅ Google Chrome مثبت
- ✅ جميع dependencies مثبتة (`npm install` في المجلد الرئيسي و `web/`)

### نصائح
1. **تأكد من تثبيت جميع الحزم قبل تفعيل التشغيل التلقائي**
   ```cmd
   npm install
   cd web
   npm install
   ```

2. **إذا لم يفتح Chrome**:
   - تأكد من تثبيت Chrome
   - أضف Chrome إلى PATH في Windows
   - أو عدل المسار في `start-system.bat`:
     ```batch
     start "C:\Program Files\Google\Chrome\Application\chrome.exe" --start-fullscreen --app=http://localhost:5173
     ```

3. **إذا كانت الأوقات غير كافية**:
   - زد وقت الانتظار في `start-system.bat`
   - جهاز بطيء؟ جرب 15-20 ثانية للـ Backend و 20-30 للـ Frontend

4. **للخروج من وضع ملء الشاشة**:
   - اضغط `F11` في Chrome
   - أو `Alt + F4` لإغلاق النافذة

### استكشاف الأخطاء

#### المشكلة: لا يبدأ النظام عند تشغيل Windows
**الحل:**
1. تحقق من وجود الاختصار في:
   ```
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
   ```
2. شغل `setup-autostart.bat` مرة أخرى كمسؤول

#### المشكلة: يظهر خطأ "npm not found"
**الحل:**
- تأكد من إضافة Node.js إلى PATH
- أعد تشغيل الجهاز بعد تثبيت Node.js

#### المشكلة: Chrome لا يفتح
**الحل:**
- عدل `start-system.bat` واستخدم المسار الكامل لـ Chrome

#### المشكلة: الصفحة تظهر "Cannot connect"
**الحل:**
- زد وقت الانتظار في `start-system.bat`
- تحقق من أن المنافذ 3000 و 5173 غير مستخدمة

## البنية التقنية

```
start-system.vbs (Hidden)
    ↓
start-system.bat
    ↓
    ├─→ Backend Server (npm run dev) - Port 3000
    ├─→ Frontend Server (npm run dev) - Port 5173
    └─→ Chrome Fullscreen (http://localhost:5173)
```

## الأمان

- ⚠️ هذا النظام يفتح servers على المنافذ 3000 و 5173
- ⚠️ تأكد من إعدادات الجدار الناري (Firewall)
- ⚠️ لا تستخدم في بيئة إنتاج بدون تأمين إضافي

## الخلاصة

بعد تشغيل `setup-autostart.bat`:
- ✅ سيبدأ النظام تلقائياً عند تشغيل Windows
- ✅ سيفتح Chrome في وضع ملء الشاشة
- ✅ سيكون جاهزاً للاستخدام خلال 25-30 ثانية

---

**تم الإنشاء بواسطة:** Queue Management System
**التاريخ:** October 2025

