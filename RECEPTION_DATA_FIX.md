# إصلاح خطأ إنشاء بيانات الاستقبال

## المشكلة
كان النظام يتعرض لخطأ عند محاولة إنشاء بيانات استقبال جديدة:
```
Invalid 'prisma.receptionData.create()' invocation
```

## السبب
1. **إرسال نصوص فارغة بدلاً من `null`**: كانت الواجهة الأمامية ترسل نصوص فارغة `""` للحقول الاختيارية عندما لا تكون مطلوبة (مثل حالة "لا يوجد زوج" أو "دعوة شرعية").
2. **عدم تنظيف البيانات**: كان المتحكم (controller) يمرر النصوص الفارغة إلى الخدمة دون تنظيفها.
3. **تواريخ غير صالحة**: كانت حقول التاريخ تُرسل كنصوص فارغة مما يسبب خطأ عند تحويلها إلى كائن `Date`.

## الحلول المطبقة

### 1. تنظيف البيانات في المتحكم (Controller)
📄 `src/controllers/reception.controller.ts`

تم إضافة دالتي تنظيف للبيانات:
- `cleanString()`: تحول النصوص الفارغة إلى `undefined` وتزيل المسافات الزائدة
- `cleanNumber()`: تتعامل مع الأرقام بشكل صحيح وتحول القيم الفارغة إلى `undefined`

```typescript
const cleanString = (val: any) => (val && val.trim() !== "" ? val.trim() : undefined);
const cleanNumber = (val: any) => (val !== undefined && val !== null && val !== "" ? Number(val) : undefined);
```

### 2. تبسيط إنشاء البيانات في الخدمة (Service)
📄 `src/services/reception.service.ts`

بدلاً من استخدام spread operator الشرطي، تم تحديد جميع الحقول بشكل صريح مع استخدام `|| null`:

```typescript
const receptionData = await prisma.receptionData.create({
  data: {
    queueId: queue.id,
    patientId: patient.id,
    maleStatus: data.maleStatus,
    femaleStatus: data.femaleStatus,
    maleName: data.maleName || null,
    maleLastName: data.maleLastName || null,
    // ... باقي الحقول
  }
});
```

### 3. مسح الحقول تلقائياً في الواجهة
📄 `web/src/pages/ReceptionPage.tsx`

عند تغيير حالة الزوج/الزوجة إلى "لا يوجد" أو "خارج القطر" أو "خارج المحافظة"، يتم مسح جميع الحقول المتعلقة تلقائياً:

```typescript
else if (value === "NOT_EXIST" || value === "OUT_OF_COUNTRY" || value === "OUT_OF_PROVINCE") {
  setFormData((prev) => ({
    ...prev,
    [name]: value,
    maleName: "",
    maleLastName: "",
    // ... مسح جميع البيانات
  }));
}
```

## النتيجة
✅ الآن النظام يعمل بشكل صحيح في جميع الحالات:
- ✅ حالة عادية (الزوجان موجودان)
- ✅ دعوة شرعية (شخص واحد فقط)
- ✅ لا يوجد زوج/زوجة
- ✅ خارج القطر
- ✅ خارج المحافظة

## الملفات المعدلة
1. `src/controllers/reception.controller.ts` - إضافة تنظيف البيانات
2. `src/services/reception.service.ts` - تبسيط إنشاء البيانات
3. `web/src/pages/ReceptionPage.tsx` - مسح الحقول تلقائياً

## ملاحظات
- لا حاجة لإجراء migration جديد للقاعدة
- التغييرات متوافقة مع البيانات الموجودة
- تم الحفاظ على جميع التحققات من صحة البيانات

