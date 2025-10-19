# تنفيذ إمكانية تعديل جميع بيانات الطبيب

## الملخص
تم تنفيذ نظام كامل لتعديل جميع بيانات الطبيب في صفحة تفاصيل المريض، بما في ذلك:
- فصائل الدم
- نتائج الفحوصات (HIV, HBS, HBC) وقيمها
- الزمر الدموية الشاذة (Hemoglobin) وجميع قيمها
- الملاحظات (للخطيب والخطيبة والملاحظات العامة)
- التقرير النهائي والتوصيات

**ملاحظة:** البيانات المالية غير قابلة للتعديل كما هو مطلوب.

---

## التعديلات المنفذة

### 1. Frontend - صفحة تفاصيل المريض (`web/src/pages/PatientDetailsPage.tsx`)

#### التعديلات الرئيسية:

##### أ. إضافة State لتحرير بيانات الطبيب:
```typescript
const [editedDoctor, setEditedDoctor] = useState<any>({});
```

##### ب. تحميل البيانات:
```typescript
const loadPatientData = async () => {
  // ...
  setEditedDoctor(response.data.data.DoctorData || {});
};
```

##### ج. تحديث دالة الحفظ:
```typescript
const handleSave = async () => {
  if (activeTab === "reception") {
    await axios.put(`${API_URL}/doctor/completed/${id}`, editedReception);
  } else if (activeTab === "doctor") {
    await axios.put(`${API_URL}/doctor/completed/${id}/doctor`, editedDoctor);
  }
};
```

##### د. تحديث مكون DoctorTab ليكون قابلاً للتعديل بالكامل:

**فصائل الدم:**
- تحويل العرض من نص ثابت إلى قائمة منسدلة (dropdown)
- القيم المتاحة: A+, A-, B+, B-, AB+, AB-, O+, O-

**الفحوصات الطبية (HIV, HBS, HBC):**
- قائمة منسدلة لاختيار الحالة (سلبي/إيجابي)
- حقل نصي للقيمة الرقمية (يظهر فقط عند اختيار "إيجابي")

**الخضاب الشاذة (Hemoglobin):**
- checkbox لتفعيل/تعطيل الفورم
- 8 حقول قابلة للتعديل:
  - HbS
  - HbF
  - HbA1c
  - HbA2
  - HbSc
  - HbD
  - HbE
  - HbC

**الملاحظات:**
- textarea للملاحظات الخاصة بالخطيب
- textarea للملاحظات الخاصة بالخطيبة
- textarea للتقرير النهائي والتوصيات

##### هـ. تحديث Interface لإضافة الحقول الناقصة:
```typescript
DoctorData: {
  // ...
  maleHbSc: string;
  maleHbD: string;
  maleHbE: string;
  maleHbC: string;
  femaleHbSc: string;
  femaleHbD: string;
  femaleHbE: string;
  femaleHbC: string;
  // ...
}
```

##### و. عرض زر الحفظ في تبويب الطبيب:
```typescript
{(activeTab === "reception" || activeTab === "doctor") && (
  <button onClick={handleSave}>💾 حفظ التعديلات</button>
)}
```

---

### 2. Backend - الخدمات (`src/services/doctor.service.ts`)

#### إضافة دالة جديدة لتحديث بيانات الطبيب:

```typescript
async function updateCompletedPatientDoctorData(
  id: number,
  doctorData: {
    maleBloodType?: string;
    femaleBloodType?: string;
    maleHIVstatus?: DiseasesStatus;
    femaleHIVstatus?: DiseasesStatus;
    maleHBSstatus?: DiseasesStatus;
    femaleHBSstatus?: DiseasesStatus;
    maleHBCstatus?: DiseasesStatus;
    femaleHBCstatus?: DiseasesStatus;
    maleHIVvalue?: string;
    femaleHIVvalue?: string;
    maleHBSvalue?: string;
    femaleHBSvalue?: string;
    maleHBCvalue?: string;
    femaleHBCvalue?: string;
    maleHemoglobinEnabled?: boolean;
    maleHbS?: string;
    maleHbF?: string;
    maleHbA1c?: string;
    maleHbA2?: string;
    maleHbSc?: string;
    maleHbD?: string;
    maleHbE?: string;
    maleHbC?: string;
    femaleHemoglobinEnabled?: boolean;
    femaleHbS?: string;
    femaleHbF?: string;
    femaleHbA1c?: string;
    femaleHbA2?: string;
    femaleHbSc?: string;
    femaleHbD?: string;
    femaleHbE?: string;
    femaleHbC?: string;
    maleNotes?: string;
    femaleNotes?: string;
    notes?: string;
  }
) {
  // جلب البيانات الموجودة
  const existing = await prisma.completedPatientData.findUnique({
    where: { id },
  });

  // Parse البيانات الحالية ودمجها مع البيانات الجديدة
  const existingDoctor = JSON.parse(existing.doctorData);
  const updatedDoctor = {
    ...existingDoctor,
    ...doctorData,
  };

  // تحديث البيانات
  const updated = await prisma.completedPatientData.update({
    where: { id },
    data: {
      doctorData: JSON.stringify(updatedDoctor),
    },
  });

  return {
    ...updated,
    DoctorData: updatedDoctor,
  };
}
```

#### تصدير الدالة:
```typescript
export {
  // ...
  updateCompletedPatientDoctorData,
};
```

---

### 3. Backend - Controllers (`src/controllers/doctor.controller.ts`)

#### إضافة Controller جديد:

```typescript
/**
 * تحديث بيانات الطبيب في البيانات المكتملة
 * PUT /api/doctor/completed/:id/doctor
 */
export async function updateCompletedDoctorDataController(
  req: Request,
  res: Response
) {
  try {
    const id = parseInt(req.params.id as string);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "المعرف غير صالح",
      });
    }

    const updatedData = await updateCompletedPatientDoctorData(id, req.body);

    res.json({
      success: true,
      data: updatedData,
      message: "تم تحديث بيانات الطبيب بنجاح",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
```

---

### 4. Backend - Routes (`src/routes/doctor.routes.ts`)

#### إضافة Route جديد:

```typescript
import {
  // ...
  updateCompletedDoctorDataController,
} from "../controllers/doctor.controller";

/**
 * PUT /api/doctor/completed/:id/doctor
 * تحديث بيانات الطبيب في البيانات المكتملة
 */
router.put("/completed/:id/doctor", updateCompletedDoctorDataController);
```

---

## API Endpoints

### تحديث بيانات الطبيب
- **Method:** PUT
- **URL:** `/api/doctor/completed/:id/doctor`
- **Parameters:** 
  - `id` (path): معرف البيانات المكتملة
- **Body:** جميع الحقول المذكورة أعلاه (اختيارية)
- **Response:**
  ```json
  {
    "success": true,
    "data": { /* البيانات المحدثة */ },
    "message": "تم تحديث بيانات الطبيب بنجاح"
  }
  ```

---

## كيفية الاستخدام

1. من صفحة الطبيب، اضغط على "📋 عرض قائمة الحالات المكتملة"
2. اختر مريضاً من القائمة واضغط على "👁️ عرض"
3. انتقل إلى تبويب "👩‍⚕️ الطبيبة"
4. قم بتعديل أي من البيانات:
   - فصائل الدم من القوائم المنسدلة
   - حالات الفحوصات (سلبي/إيجابي)
   - القيم الرقمية للفحوصات الإيجابية
   - تفعيل/تعطيل الخضاب الشاذة
   - إدخال قيم الخضاب الشاذة
   - تعديل الملاحظات
   - تعديل التقرير النهائي
5. اضغط على "💾 حفظ التعديلات"
6. سيتم حفظ التعديلات وإعادة تحميل البيانات تلقائياً

---

## الملاحظات الفنية

### الحقول القابلة للتعديل:
✅ فصائل الدم (الخطيب والخطيبة)
✅ حالات الفحوصات (HIV, HBS, HBC) للخطيب والخطيبة
✅ القيم الرقمية للفحوصات الإيجابية
✅ تفعيل/تعطيل الخضاب الشاذة
✅ جميع قيم الخضاب الشاذة (8 حقول لكل شخص)
✅ الملاحظات الخاصة بالخطيب
✅ الملاحظات الخاصة بالخطيبة
✅ التقرير النهائي والتوصيات

### الحقول غير القابلة للتعديل:
❌ البيانات المالية (كما هو مطلوب)

### الأمان:
- التحقق من صحة المعرف في الـ Controller
- معالجة الأخطاء في جميع الطبقات
- دمج البيانات الجديدة مع القديمة (Merge) وليس الاستبدال الكامل

### تجربة المستخدم:
- واجهة سهلة الاستخدام مع حقول واضحة
- إظهار/إخفاء ديناميكي للحقول حسب الاختيارات
- رسائل تأكيد عند الحفظ
- إعادة تحميل البيانات بعد الحفظ لضمان العرض الصحيح

---

## الاختبار

للتحقق من عمل النظام بشكل صحيح:

1. ✅ عرض صفحة تفاصيل المريض
2. ✅ الانتقال إلى تبويب الطبيبة
3. ✅ تعديل فصيلة الدم
4. ✅ تغيير حالة فحص من سلبي إلى إيجابي وإدخال قيمة
5. ✅ تفعيل الخضاب الشاذة وإدخال القيم
6. ✅ تعديل الملاحظات
7. ✅ حفظ التعديلات والتحقق من نجاح العملية
8. ✅ إعادة فتح الصفحة والتأكد من حفظ التعديلات

---

## التحديثات المستقبلية المحتملة

- إضافة تاريخ آخر تعديل
- إضافة سجل التعديلات (Audit Log)
- إضافة صلاحيات للتعديل
- إضافة تصدير البيانات المعدلة

---

**تاريخ التنفيذ:** 19 أكتوبر 2025
**الحالة:** ✅ مكتمل وجاهز للاستخدام

