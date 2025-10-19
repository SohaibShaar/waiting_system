# تنفيذ إضافة حقل اسم الأم وتعديل سلوك الحقول

## ✅ التغييرات المُنفذة

### 1. قاعدة البيانات
- ✅ إضافة حقل `maleMotherName` في جدول `ReceptionData`
- ✅ إضافة حقل `femaleMotherName` في جدول `ReceptionData`
- ✅ إنشاء Migration: `20251019000000_add_mother_name_fields`
- ✅ تطبيق Migration على قاعدة البيانات

### 2. Backend - Services
**ملف:** `src/services/reception.service.ts`
- ✅ إضافة `maleMotherName?: string` في دالة `createReceptionData`
- ✅ إضافة `femaleMotherName?: string` في دالة `createReceptionData`
- ✅ إضافة الحقول في دالة `updateReceptionData`
- ✅ تحديث عملية حفظ البيانات لتشمل الحقول الجديدة

### 3. Backend - Controllers
**ملف:** `src/controllers/reception.controller.ts`
- ✅ إضافة `maleMotherName` و `femaleMotherName` في استقبال البيانات من `req.body`
- ✅ تحديث التحققات (validations) لضمان إلزامية حقول اسم الأم للحالات:
  - `NORMAL`
  - `LEGAL_INVITATION`
  - `OUT_OF_COUNTRY` (جديد)
  - `OUT_OF_PROVINCE` (جديد)
- ✅ إضافة الحقول في عملية الإرسال إلى Service

### 4. Frontend - TypeScript Interfaces
**ملف:** `web/src/pages/ReceptionPage.tsx`
- ✅ إضافة `maleMotherName?: string` في واجهة `ReceptionData`
- ✅ إضافة `femaleMotherName?: string` في واجهة `ReceptionData`
- ✅ إضافة الحقول في `formData` state
- ✅ إضافة الحقول في `resetForm()`
- ✅ إضافة الحقول في `handleEdit()`

### 5. Frontend - Logic
**ملف:** `web/src/pages/ReceptionPage.tsx`
- ✅ تعديل `handleInputChange` لإزالة منطق مسح البيانات عند اختيار `OUT_OF_COUNTRY` أو `OUT_OF_PROVINCE`
- ✅ الآن فقط حالة `NOT_EXIST` تقوم بمسح البيانات
- ✅ إضافة `maleMotherName` و `femaleMotherName` في منطق مسح البيانات عند الحاجة

### 6. Frontend - UI Components
**ملف:** `web/src/pages/ReceptionPage.tsx`
- ✅ تعديل شرط إظهار حقول الزوج من:
  ```tsx
  {(formData.maleStatus === "NORMAL" || formData.maleStatus === "LEGAL_INVITATION") && (
  ```
  إلى:
  ```tsx
  {formData.maleStatus !== "NOT_EXIST" && (
  ```
- ✅ تعديل شرط إظهار حقول الزوجة من:
  ```tsx
  {(formData.femaleStatus === "NORMAL" || formData.femaleStatus === "LEGAL_INVITATION") && (
  ```
  إلى:
  ```tsx
  {formData.femaleStatus !== "NOT_EXIST" && (
  ```
- ✅ إضافة حقل input لـ "اسم الأم" للزوج بعد حقل "اسم العائلة"
- ✅ إضافة حقل input لـ "اسم الأم" للزوجة بعد حقل "اسم العائلة"
- ✅ جعل حقول "اسم الأم" إلزامية (required) في الفرونت إند

## 📋 السلوك الجديد

### حالات الزوج/الزوجة:

1. **NORMAL (الحالة العادية)**
   - ✅ جميع الحقول ظاهرة ومطلوبة
   - ✅ يشمل حقل "اسم الأم" الجديد

2. **LEGAL_INVITATION (دعوة شرعية)**
   - ✅ جميع الحقول ظاهرة ومطلوبة
   - ✅ يشمل حقل "اسم الأم" الجديد
   - ✅ عند اختيار دعوة شرعية للزوج، يتم تلقائياً جعل حالة الزوجة "لا يوجد"
   - ✅ عند اختيار دعوة شرعية للزوجة، يتم تلقائياً جعل حالة الزوج "لا يوجد"

3. **OUT_OF_COUNTRY (خارج القطر)** - تغيير جديد ✨
   - ✅ جميع الحقول ظاهرة ومطلوبة (مثل الحالة العادية تماماً)
   - ✅ يشمل حقل "اسم الأم" الجديد
   - ✅ لا يتم مسح البيانات عند الاختيار

4. **OUT_OF_PROVINCE (خارج المحافظة)** - تغيير جديد ✨
   - ✅ جميع الحقول ظاهرة ومطلوبة (مثل الحالة العادية تماماً)
   - ✅ يشمل حقل "اسم الأم" الجديد
   - ✅ لا يتم مسح البيانات عند الاختيار

5. **NOT_EXIST (لا يوجد)**
   - ✅ جميع الحقول مخفية
   - ✅ يتم مسح جميع البيانات عند الاختيار

## 🎯 الحقول الإلزامية

عند ظهور نموذج الإدخال (أي حالة غير NOT_EXIST)، الحقول الإلزامية هي:
- ✅ الاسم الأول
- ✅ اسم الأب
- ✅ **اسم الأم** (جديد)
- ✅ اسم العائلة
- ✅ تاريخ الميلاد
- ✅ الرقم الوطني
- ✅ العمر (يُحسب تلقائياً)

الحقول الاختيارية:
- مكان الولادة
- البلد
- القيد

## 📝 ملاحظات مهمة

1. **حقل اسم الأم لن يُطبع في الإيصال** - كما طلب المستخدم
2. **Backend Validation** - يتحقق الـ Backend من وجود حقل اسم الأم لجميع الحالات ما عدا `NOT_EXIST`
3. **Frontend Validation** - حقل اسم الأم إلزامي (required attribute) في الفرونت إند
4. **Database Migration** - تم تطبيق Migration بنجاح على قاعدة البيانات

## ⚠️ تنبيهات

- يجب إيقاف Backend Server قبل تشغيل `npx prisma generate` لتجنب مشاكل Permission
- بعد إعادة تشغيل Backend، سيتم استخدام Prisma Client الجديد تلقائياً

## 🔄 لإكمال التنفيذ

1. أوقف Backend Server إذا كان قيد التشغيل
2. شغّل الأمر: `npx prisma generate`
3. أعد تشغيل Backend Server
4. اختبر النظام بجميع الحالات المختلفة

## ✅ الاختبارات المطلوبة

- [ ] إضافة مراجع جديد بحالة NORMAL مع اسم الأم
- [ ] إضافة مراجع جديد بحالة OUT_OF_COUNTRY مع اسم الأم
- [ ] إضافة مراجع جديد بحالة OUT_OF_PROVINCE مع اسم الأم
- [ ] إضافة مراجع جديد بحالة LEGAL_INVITATION مع اسم الأم
- [ ] التحقق من أن حقل اسم الأم يظهر ويُحفظ بشكل صحيح
- [ ] تعديل بيانات مراجع موجود وإضافة اسم الأم
- [ ] التحقق من عدم طباعة اسم الأم في الإيصال

