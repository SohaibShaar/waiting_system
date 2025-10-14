# إصلاح مشاكل صفحة الاستقبال

## المشاكل التي تم حلها:

### 1. عدم ظهور المرضى المضافين اليوم
**المشكلة:** عند إضافة دور جديد في صفحة الاستقبال، لا يظهر ضمن قائمة "المرضى المضافون اليوم"

**الحل:**
- ✅ إضافة API endpoint جديد: `GET /api/reception/today`
- ✅ تحديث دالة `fetchTodayPatients()` لاستخدام الـ API الصحيح
- ✅ إضافة service جديد `getTodayReceptionData()` لجلب بيانات اليوم الحالي

### 2. عدم القدرة على تعديل البيانات
**المشكلة:** لا يمكن تعديل بيانات المريض بعد إضافته

**الحل:**
- ✅ إضافة حالة `editingId` لتتبع المريض الذي يتم تعديله
- ✅ إضافة دالة `handleEdit()` لتحميل بيانات المريض في النموذج
- ✅ إضافة دالة `handleCancelEdit()` لإلغاء التعديل
- ✅ تحديث دالة `handleSubmit()` للتمييز بين الإضافة والتعديل
- ✅ إضافة زر "إلغاء التعديل" في النموذج
- ✅ تغيير نص الزر بين "حفظ وإنشاء دور جديد" و "حفظ التعديلات"
- ✅ ربط زر "تعديل" في الجدول مع دالة `handleEdit()`

### 3. إضافة حقل رقم الهاتف
**المشكلة:** حقل `phoneNumber` موجود في النموذج ولكن لا يتم حفظه في جدول `ReceptionData`

**الحل:**
- ✅ تحديث `schema.prisma` لإضافة حقل `phoneNumber` إلى جدول `ReceptionData`
- ✅ إنشاء migration لإضافة الحقل إلى قاعدة البيانات
- ✅ تحديث الـ service لحفظ `phoneNumber` عند الإضافة والتعديل

## الملفات المعدلة:

### Backend:
1. **src/services/reception.service.ts**
   - إضافة دالة `getTodayReceptionData()`
   - تحديث دالة `createReceptionData()` لحفظ `phoneNumber`
   - تحديث دالة `updateReceptionData()` لدعم تعديل `phoneNumber`

2. **src/controllers/reception.controller.ts**
   - إضافة controller `getTodayReception()`

3. **src/routes/reception.routes.ts**
   - إضافة route: `GET /api/reception/today`

4. **prisma/schema.prisma**
   - إضافة حقل `phoneNumber VARCHAR(20)` إلى `ReceptionData`

5. **prisma/migrations/20251012102054_add_phone_number_to_reception_data/migration.sql**
   - migration جديد لإضافة حقل `phoneNumber`

### Frontend:
1. **web/src/pages/ReceptionPage.tsx**
   - تحديث `fetchTodayPatients()` لاستخدام `/api/reception/today`
   - إضافة state `editingId`
   - إضافة دالة `handleEdit()`
   - إضافة دالة `handleCancelEdit()`
   - إضافة دالة `resetForm()`
   - تحديث `handleSubmit()` للتمييز بين الإضافة والتعديل
   - تحديث واجهة النموذج لعرض حالة التعديل
   - تحديث `handleInputChange()` لدعم `HTMLSelectElement`
   - إصلاح أخطاء الـ linter

## الاستخدام:

### إضافة مريض جديد:
1. املأ جميع الحقول المطلوبة
2. اضغط "حفظ وإنشاء دور جديد"
3. سيظهر المريض فوراً في قائمة "المرضى المضافون اليوم"

### تعديل بيانات مريض:
1. في قائمة "المرضى المضافون اليوم"، اضغط زر "✏️ تعديل"
2. سيتم تحميل بيانات المريض في النموذج
3. عدّل البيانات المطلوبة
4. اضغط "💾 حفظ التعديلات"
5. أو اضغط "✖ إلغاء التعديل" للإلغاء

## API Endpoints:

### GET /api/reception/today
جلب جميع بيانات الاستقبال لليوم الحالي

**Response:**
```json
{
  "success": true,
  "count": 5,
  "receptionData": [...]
}
```

### PUT /api/reception/:queueId
تحديث بيانات الاستقبال

**Request Body:**
```json
{
  "maleName": "أحمد",
  "maleLastName": "محمد",
  ...
  "phoneNumber": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث بيانات الاستقبال",
  "receptionData": {...}
}
```

## ملاحظات:
- تم إصلاح جميع أخطاء الـ linter
- تم اختبار الـ migration وتطبيقها بنجاح على قاعدة البيانات
- جميع التغييرات متوافقة مع الكود الموجود
- الواجهة تدعم الآن RTL (right-to-left) للنصوص العربية

