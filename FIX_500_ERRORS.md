# 🔧 حل مشكلة الأخطاء 500 - Fix 500 Internal Server Errors

## 📋 ملخص المشكلة - Problem Summary

الواجهة الأمامية تظهر أخطاء 500 عند محاولة الاتصال بالسيرفر:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

### الأسباب الرئيسية:
1. ❌ **ملف `.env` غير موجود** - لا يوجد اتصال بقاعدة البيانات
2. ❌ **قاعدة البيانات غير مشغلة** - MySQL غير نشط
3. ❌ **البيانات الأولية غير موجودة** - الجداول فارغة أو غير موجودة
4. ❌ **ترتيب المحطات خاطئ** - المحطة الأولى يجب أن تكون "الاستقبال"

---

## ✅ الحل الكامل - Complete Solution

### المرحلة 1: إنشاء ملف `.env` 📝

أنشئ ملف جديد باسم `.env` في المجلد الرئيسي للمشروع:

**الطريقة الأسهل (SQLite - بدون MySQL):**
```env
DATABASE_URL="file:./dev.db"
PORT=3003
NODE_ENV=development
```

**إذا كنت تريد استخدام MySQL:**
```env
DATABASE_URL="mysql://root:@localhost:3306/waiting_system"
PORT=3003
NODE_ENV=development
```

> 💡 **نصيحة:** استخدم SQLite للتطوير السريع - لا يحتاج تثبيت أو إعداد!

---

### المرحلة 2: تعديل Prisma لـ SQLite (اختياري) 🔄

**⚠️ فقط إذا اخترت SQLite في المرحلة 1**

افتح `prisma/schema.prisma` وغيّر السطور 12-15:

**من:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

**إلى:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### المرحلة 3: إعداد قاعدة البيانات 🗄️

#### إذا اخترت SQLite:
```bash
# تطبيق المايجريشن
npx prisma db push

# ملء البيانات الأولية
npx ts-node prisma/seed.ts
```

#### إذا اخترت MySQL:
```bash
# 1. تأكد من تشغيل MySQL (XAMPP أو MySQL Service)

# 2. أنشئ قاعدة البيانات
mysql -u root -p
CREATE DATABASE waiting_system;
exit;

# 3. تطبيق المايجريشن
npx prisma db push

# 4. ملء البيانات الأولية
npx ts-node prisma/seed.ts
```

**النتيجة المتوقعة:**
```
🧹 جاري تنظيف قاعدة البيانات...
✅ تم تنظيف قاعدة البيانات
📍 جاري إنشاء المحطات...
✅ تم إنشاء المحطات بنجاح
⚙️ جاري إنشاء إعدادات النظام...
✅ تم إضافة البيانات الأولية بنجاح

📋 المحطات المنشأة:
   1. الاستقبال - شاشة رقم 1
   2. المحاسبة - شاشة رقم 2
   3. المخبر - شاشة رقم 3
   4. الدكتور - شاشة رقم 4
```

---

### المرحلة 4: تشغيل النظام 🚀

#### Terminal 1 - Backend:
```bash
npm run dev
```

**النتيجة المتوقعة:**
```
🚀 Server is running on http://localhost:3003
📡 WebSocket server is ready
```

#### Terminal 2 - Frontend:
```bash
cd web
npm run dev
```

**النتيجة المتوقعة:**
```
  ➜  Local:   http://localhost:5173/
```

---

## 🎯 التحقق من نجاح الحل

### 1. اختبار Backend API:
افتح المتصفح على: http://localhost:3003

**يجب أن ترى:**
```json
{
  "message": "🏥 نظام إدارة الأدوار - Queue Management System",
  "version": "1.0.0",
  "endpoints": {
    "patients": "/api/patients",
    "queue": "/api/queue",
    "stations": "/api/stations",
    ...
  }
}
```

### 2. اختبار Frontend:
افتح: http://localhost:5173

**Console يجب أن يكون نظيف بدون أخطاء 500!**

✅ **إذا رأيت:**
```
✅ متصل بالخادم
```

❌ **إذا رأيت:**
```
Failed to load resource: 500
❌ انقطع الاتصال
```
→ ارجع للمرحلة 1 وتأكد من جميع الخطوات

### 3. اختبار إضافة مريض:
1. افتح صفحة الاستقبال: http://localhost:5173 (ثم اختر Reception)
2. املأ بيانات الزوجين
3. اضغط "حفظ وإنشاء دور جديد"

**النتيجة المتوقعة:**
```
✅ تم إنشاء الدور #1 بنجاح!
```

---

## 🔍 التغييرات التي تمت

### ✅ تم تحديث `prisma/seed.ts`:
- ✅ إضافة محطة "الاستقبال" كأول محطة
- ✅ تصحيح ترتيب المحطات:
  1. الاستقبال (رقم شاشة 1)
  2. المحاسبة (رقم شاشة 2)
  3. المخبر (رقم شاشة 3)
  4. الدكتور (رقم شاشة 4)
- ✅ إضافة تنظيف تلقائي للبيانات القديمة
- ✅ إضافة رسائل توضيحية أفضل

---

## 🆘 لا يزال لديك مشاكل؟

### المشكلة: خطأ "Can't reach database server"
**الحل:**
- إذا كنت تستخدم MySQL: تأكد من تشغيله (XAMPP Control Panel → Start MySQL)
- الحل الأسهل: استخدم SQLite بدلاً من MySQL (المرحلة 1 و 2)

### المشكلة: خطأ "Table doesn't exist"
**الحل:**
```bash
npx prisma db push
```

### المشكلة: خطأ "LAST_QUEUE_NUMBER not found"
**الحل:**
```bash
npx ts-node prisma/seed.ts
```

### المشكلة: Frontend لا يزال يعرض 500 errors
**الحل:**
1. تأكد من أن Backend يعمل على port 3003
2. تحقق من Console في Backend للأخطاء
3. جرب إعادة تشغيل كلا السيرفرات (Ctrl+C ثم npm run dev)

---

## 📞 الخطوات السريعة (TL;DR)

```bash
# 1. أنشئ .env (اختر أحد الخيارين):
echo 'DATABASE_URL="file:./dev.db"
PORT=3003
NODE_ENV=development' > .env

# 2. إذا اخترت SQLite، عدل prisma/schema.prisma
# غيّر provider من "mysql" إلى "sqlite"

# 3. إعداد قاعدة البيانات
npx prisma db push
npx ts-node prisma/seed.ts

# 4. شغّل Backend
npm run dev

# 5. في terminal جديد، شغّل Frontend
cd web
npm run dev
```

**الآن افتح http://localhost:5173 ويجب أن يعمل كل شيء! 🎉**

---

## ✨ ملاحظة نهائية

تم تصحيح المشكلة الأساسية وهي أن نظام الاستقبال يتوقع محطة "الاستقبال" كأول محطة في النظام. الآن البيانات الأولية (seed data) تنشئ المحطات بالترتيب الصحيح.

فقط تأكد من:
1. ✅ وجود ملف `.env`
2. ✅ قاعدة البيانات متصلة وتعمل
3. ✅ تم تشغيل `seed.ts` بنجاح
4. ✅ Backend و Frontend يعملان معاً

**بالتوفيق! 🚀**

