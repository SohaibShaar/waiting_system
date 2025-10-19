# تحديث نظام التعامل مع الرقم الوطني المكرر

## التاريخ
2025-10-19

## الملخص
تم تحديث النظام لعرض modal تحذيري احترافي بدلاً من رسالة alert عند إدخال رقم وطني مكرر في صفحة الاستقبال.

---

## التغييرات المنفذة

### 1. Backend - Service Layer
**الملف:** `src/services/reception.service.ts`

#### التعديلات:
- إضافة فحص للرقم الوطني المكرر قبل إنشاء المراجع
- فحص الرقم الوطني للزوج والزوجة من قاعدة البيانات
- رمي خطأ مخصص `DUPLICATE_NATIONAL_ID` يحتوي على:
  - الرقم الوطني المكرر
  - اسم المراجع الموجود مسبقاً
  - الجنس (ذكر/أنثى)

```typescript
// فحص الرقم الوطني المكرر
const duplicateNationalIds: Array<{
  nationalId: string;
  name: string;
  gender: string;
}> = [];

// فحص الرقم الوطني للزوج
if (data.maleNationalId) {
  const existingMalePatient = await prisma.patient.findUnique({
    where: { nationalId: data.maleNationalId },
    select: { id: true, name: true, nationalId: true },
  });

  if (existingMalePatient) {
    duplicateNationalIds.push({
      nationalId: data.maleNationalId,
      name: existingMalePatient.name,
      gender: "male",
    });
  }
}

// فحص الرقم الوطني للزوجة
if (data.femaleNationalId) {
  const existingFemalePatient = await prisma.patient.findUnique({
    where: { nationalId: data.femaleNationalId },
    select: { id: true, name: true, nationalId: true },
  });

  if (existingFemalePatient) {
    duplicateNationalIds.push({
      nationalId: data.femaleNationalId,
      name: existingFemalePatient.name,
      gender: "female",
    });
  }
}

// إذا وجدنا أرقام وطنية مكررة، نرمي خطأ خاص
if (duplicateNationalIds.length > 0) {
  const error: any = new Error("DUPLICATE_NATIONAL_ID");
  error.code = "DUPLICATE_NATIONAL_ID";
  error.duplicates = duplicateNationalIds;
  throw error;
}
```

---

### 2. Backend - Controller Layer
**الملف:** `src/controllers/reception.controller.ts`

#### التعديلات:
- معالجة خطأ `DUPLICATE_NATIONAL_ID` في catch block
- إرجاع status code 409 (Conflict) مع تفاصيل التكرار

```typescript
} catch (error: any) {
  // التعامل مع خطأ الرقم الوطني المكرر
  if (error.code === "DUPLICATE_NATIONAL_ID") {
    return res.status(409).json({
      success: false,
      error: "DUPLICATE_NATIONAL_ID",
      message: "يوجد رقم وطني مكرر",
      duplicates: error.duplicates,
    });
  }

  res.status(500).json({
    success: false,
    error: error.message,
  });
}
```

---

### 3. Frontend - React Component
**الملف:** `web/src/pages/ReceptionPage.tsx`

#### التعديلات:

##### أ. إضافة State للـ Modal:
```typescript
// Duplicate National ID Modal
const [showDuplicateModal, setShowDuplicateModal] = useState(false);
const [duplicateData, setDuplicateData] = useState<
  Array<{
    nationalId: string;
    name: string;
    gender: string;
  }>
>([]);
```

##### ب. تعديل معالج الأخطاء في `handleSubmit`:
```typescript
} catch (error: unknown) {
  // التحقق من خطأ الرقم الوطني المكرر
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "error" in error.response.data &&
    error.response.data.error === "DUPLICATE_NATIONAL_ID" &&
    "duplicates" in error.response.data
  ) {
    // عرض modal التحذير
    setDuplicateData(error.response.data.duplicates as Array<{
      nationalId: string;
      name: string;
      gender: string;
    }>);
    setShowDuplicateModal(true);
  } else {
    // معالجة الأخطاء الأخرى بـ alert
    const errorMessage = ...;
    alert("❌ خطأ: " + errorMessage);
  }
}
```

##### ج. إضافة Modal Component:
تم إضافة modal احترافي يعرض:
- رسالة تحذير واضحة
- معلومات عن الرقم الوطني المكرر
- اسم المراجع الموجود مسبقاً
- أيقونة تميز بين الزوج والزوجة
- ملاحظة توضيحية
- زر "فهمت" لإغلاق النافذة

---

## مميزات الحل الجديد

### 1. تجربة مستخدم محسنة:
- ❌ **القديم:** رسالة alert بسيطة وغير واضحة
- ✅ **الجديد:** modal احترافي مع معلومات تفصيلية

### 2. معلومات أكثر:
- عرض اسم المراجع الموجود مسبقاً
- عرض الرقم الوطني المكرر
- تمييز بين الزوج والزوجة

### 3. تصميم احترافي:
- ألوان تحذيرية مناسبة (برتقالي)
- أيقونات توضيحية
- تنسيق واضح ومنظم

### 4. سهولة الاستخدام:
- إغلاق Modal بالنقر خارجه
- زر "فهمت" واضح
- رسالة توضيحية عن الخطأ

---

## كيفية الاستخدام

1. **عند إدخال رقم وطني مكرر:**
   - يتم فحص الرقم الوطني في قاعدة البيانات
   - إذا كان موجوداً، يظهر modal تحذيري
   - يعرض المعلومات التفصيلية

2. **المستخدم يمكنه:**
   - قراءة معلومات المراجع الموجود
   - التحقق من البيانات المدخلة
   - إغلاق النافذة وتصحيح البيانات

3. **النظام لا يحفظ البيانات المكررة**
   - يمنع التكرار تماماً
   - يحافظ على نظافة قاعدة البيانات

---

## الاختبار

### خطوات الاختبار:
1. فتح صفحة الاستقبال
2. إدخال بيانات مراجع جديد
3. استخدام رقم وطني موجود مسبقاً
4. محاولة الحفظ
5. التحقق من ظهور Modal التحذيري بدلاً من alert

### الحالات المختبرة:
- ✅ رقم وطني مكرر للزوج
- ✅ رقم وطني مكرر للزوجة
- ✅ رقمين وطنيين مكررين (للزوج والزوجة)
- ✅ رقم وطني جديد (لا يوجد تكرار)

---

## الملاحظات

1. **الأداء:**
   - الفحص يتم قبل إنشاء المراجع
   - استعلامات سريعة (indexed على nationalId)

2. **الأمان:**
   - فحص من جانب Server
   - لا يمكن تجاوز الفحص من جانب Client

3. **التوافقية:**
   - يعمل مع جميع حالات الزوجين
   - متوافق مع باقي النظام

4. **قابلية التطوير:**
   - يمكن إضافة المزيد من المعلومات للـ Modal
   - يمكن إضافة خيار "تحديث البيانات الموجودة"

---

## الملفات المعدلة

1. `src/services/reception.service.ts` - إضافة فحص الرقم المكرر
2. `src/controllers/reception.controller.ts` - معالجة الخطأ الخاص
3. `web/src/pages/ReceptionPage.tsx` - إضافة Modal التحذير

---

## التحسينات المستقبلية (اختياري)

1. **إضافة خيار تحديث البيانات:**
   - زر "تحديث البيانات الموجودة" في Modal
   - نقل المستخدم لصفحة التعديل

2. **إضافة سجل التكرارات:**
   - حفظ محاولات الإدخال المكررة
   - عرض إحصائيات

3. **إشعارات أكثر:**
   - إشعار صوتي عند التكرار
   - تلوين حقل الرقم الوطني بالأحمر

---

## المطور
Sohaib Shaar

## التاريخ
19 أكتوبر 2025

