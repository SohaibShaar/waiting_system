# 🗄️ دليل إعداد قاعدة البيانات - Database Setup Guide

## المشكلة الحالية - Current Issue

النظام يحاول الاتصال بقاعدة بيانات MySQL على `localhost:3306` لكن:
- إما أن قاعدة البيانات غير مشغلة
- أو لم يتم إنشاء ملف `.env` بعد
- أو معلومات الاتصال غير صحيحة

The system is trying to connect to a MySQL database at `localhost:3306` but:
- Either the database is not running
- Or the `.env` file hasn't been created yet
- Or the connection details are incorrect

---

## ⚡ الحل السريع - Quick Solution

### الخطوة 1: إنشاء ملف `.env`

أنشئ ملف باسم `.env` في المجلد الرئيسي للمشروع واختر أحد الخيارات التالية:

#### الخيار 1: MySQL (إذا كان لديك MySQL مثبت)

```env
DATABASE_URL="mysql://root:@localhost:3306/waiting_system"
PORT=3003
NODE_ENV=development
```

**ملاحظة:** إذا كان لديك كلمة مرور لـ MySQL:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/waiting_system"
```

#### الخيار 2: SQLite (الأسهل - لا يحتاج تثبيت)

غيّر في ملف `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

ثم أنشئ ملف `.env`:
```env
DATABASE_URL="file:./dev.db"
PORT=3003
NODE_ENV=development
```

---

### الخطوة 2: إنشاء قاعدة البيانات

#### إذا اخترت MySQL:

1. **تشغيل MySQL:**
   - إذا كنت تستخدم XAMPP: شغّل Apache و MySQL من لوحة تحكم XAMPP
   - أو شغّل MySQL من services في Windows
   
2. **إنشاء قاعدة البيانات:**
   ```bash
   # افتح MySQL Command Line
   mysql -u root -p
   
   # أنشئ قاعدة البيانات
   CREATE DATABASE waiting_system;
   
   # اخرج
   exit;
   ```

   **أو استخدم phpMyAdmin:**
   - افتح http://localhost/phpmyadmin
   - انقر على "New" لإنشاء قاعدة بيانات جديدة
   - اكتب اسم `waiting_system`
   - اضغط Create

#### إذا اخترت SQLite:
لا تحتاج أي شيء! سيتم إنشاء الملف تلقائياً.

---

### الخطوة 3: تطبيق المايجريشن

بعد إنشاء ملف `.env` وتشغيل قاعدة البيانات:

```bash
# تطبيق المايجريشن
npx prisma migrate deploy

# أو إذا لم ينجح، استخدم:
npx prisma db push
```

---

### الخطوة 4: ملء البيانات الأولية

```bash
npx ts-node prisma/seed.ts
```

يجب أن ترى:
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

### الخطوة 5: تشغيل السيرفر

```bash
npm run dev
```

يجب أن ترى:
```
🚀 Server is running on http://localhost:3003
📡 WebSocket server is ready
```

---

### الخطوة 6: تشغيل الواجهة الأمامية

في نافذة terminal جديدة:

```bash
cd web
npm run dev
```

---

## 🔧 حل المشاكل الشائعة - Troubleshooting

### خطأ: Can't reach database server

**السبب:** قاعدة البيانات غير مشغلة

**الحل:**
- تأكد من تشغيل MySQL (XAMPP أو MySQL Service)
- أو استخدم SQLite بدلاً من MySQL (انظر الخيار 2 أعلاه)

---

### خطأ: Table doesn't exist

**السبب:** لم يتم تطبيق المايجريشن

**الحل:**
```bash
npx prisma migrate deploy
# أو
npx prisma db push
```

---

### خطأ: LAST_QUEUE_NUMBER not found

**السبب:** لم يتم ملء البيانات الأولية

**الحل:**
```bash
npx ts-node prisma/seed.ts
```

---

### خطأ: 500 Internal Server Error في الواجهة

**السبب:** أحد الأسباب التالية:
1. السيرفر غير مشغل
2. قاعدة البيانات غير متصلة
3. البيانات الأولية غير موجودة

**الحل:**
تأكد من إتمام جميع الخطوات من 1 إلى 5 أعلاه

---

## 📝 ملاحظات مهمة

1. **ملف `.env` يجب أن يكون في المجلد الرئيسي** (نفس مستوى `package.json`)

2. **لا تشارك ملف `.env`** - هذا الملف يحتوي على معلومات حساسة

3. **للتطوير السريع:** استخدم SQLite - لا يحتاج أي إعداد

4. **للإنتاج:** استخدم MySQL أو PostgreSQL

---

## 🎯 التحقق من نجاح الإعداد

بعد إتمام جميع الخطوات:

1. افتح http://localhost:3003
   - يجب أن ترى رسالة JSON بنجاح

2. افتح http://localhost:5173 (الواجهة)
   - يجب ألا ترى أخطاء في Console
   - يجب أن تعمل الصفحات بدون أخطاء 500

3. جرب إضافة مريض جديد من صفحة الاستقبال
   - يجب أن ينشأ الدور بنجاح
   - يجب أن يظهر رقم الدور الجديد

---

## 🆘 احتجت مساعدة إضافية؟

إذا استمرت المشاكل:

1. تحقق من ملف `.env` موجود ومكتوب بشكل صحيح
2. تحقق من تشغيل قاعدة البيانات
3. شغل الأوامر بالترتيب الصحيح
4. تحقق من console السيرفر لرؤية الأخطاء التفصيلية

