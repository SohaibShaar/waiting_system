# إصلاح مشاكل قائمة الأدوار الملغاة وقائمة المضافون اليوم

## 📋 المشاكل المحددة

### المشكلة الأولى: عدم تحديث قائمة الملغيين بعد الطباعة
**الوصف**: عند فتح قائمة الأدوار الملغاة وطباعة أحدهم، كانت القائمة لا تُحدّث ويبقى الدور في قائمة الملغيين حتى بعد إعادة طباعته بنجاح.

**السبب**: 
- كان هناك سطر `setLoadingCancelled(true)` في بداية دالة `handleReinstateQueue`
- هذا يؤدي إلى تفعيل حالة التحميل وإخفاء القائمة بينما يتم إعادة الطباعة
- القائمة لم تكن تُحدث بشكل صحيح بعد العملية

**الحل**:
تم إزالة `setLoadingCancelled(true)` من داخل دالة `handleReinstateQueue`. الآن:
- الدور يُزال من القائمة فوراً بعد نجاح الطباعة عبر: `setCancelledQueues((prev) => prev.filter((q) => q.id !== queueId))`
- قائمة المرضى تُحدث تلقائياً عبر: `fetchTodayPatients()`
- لا يوجد تأخير أو عدم استجابة في واجهة المستخدم

### المشكلة الثانية: عرض الأدوار الملغاة في قائمة "المضافون اليوم"
**الوصف**: 
- في قائمة "المضافون اليوم" بصفحة الاستقبال، كانت تظهر الأدوار الملغاة
- عند إعادة طباعة دور ملغى، كان يظهر الدور مرتين:
  - مرة بحالة "ملغاة" والدور القديم
  - ومرة بحالة "نشط" والدور الجديد

**السبب**:
- دالة `getTodayReceptionData()` كانت تجلب **جميع** سجلات `ReceptionData` المنشأة اليوم
- لم تكن هناك فلترة حسب حالة الـ `Queue` المرتبط
- عند إعادة تفعيل دور ملغى، يتم إنشاء:
  - `Queue` جديد بحالة `ACTIVE`
  - `ReceptionData` جديدة مرتبطة بالـ `Queue` الجديد
- لكن الـ `ReceptionData` القديمة المرتبطة بالـ `Queue` الملغى كانت لا تزال تظهر في القائمة

**الحل**:
تم تعديل query في دالة `getTodayReceptionData()` لتفلتر فقط البيانات المرتبطة بأدوار نشطة أو مكتملة:

```typescript
return await prisma.receptionData.findMany({
  where: {
    createdAt: {
      gte: today,
      lt: tomorrow,
    },
    queue: {
      status: {
        in: [OverallQueueStatus.ACTIVE, OverallQueueStatus.COMPLETED],
      },
    },
  },
  // ... rest of query
});
```

الآن:
- ✅ فقط الأدوار النشطة والمكتملة تظهر في القائمة
- ✅ الأدوار الملغاة لا تظهر في قائمة "المضافون اليوم"
- ✅ عند إعادة طباعة دور ملغى، يظهر فقط الدور الجديد النشط
- ✅ بيانات الدور تكون صحيحة (الدور الجديد وليس القديم)

## 🔧 الملفات المعدلة

### 1. `web/src/pages/ReceptionPage.tsx`
**التعديل**: إزالة `setLoadingCancelled(true)` من دالة `handleReinstateQueue`

```typescript
const handleReinstateQueue = async (queueId: number, queueNumber: number) => {
  if (!confirm(`هل تريد إعادة طباعة الدور #${queueNumber}؟`)) {
    return;
  }
  // ❌ تم إزالة: setLoadingCancelled(true);

  try {
    const response = await axios.post(
      `${API_URL}/queue/${queueId}/reinstate`
    );
    if (response.data.success) {
      alert(`✅ تم إنشاء الدور الجديد #${response.data.queueNumber}`);
      
      printQueueNumber(
        response.data.queueNumber,
        response.data.newQueue.patientId
      );
      
      // ✅ إزالة الدور من القائمة مباشرة
      setCancelledQueues((prev) => prev.filter((q) => q.id !== queueId));
      
      // ✅ تحديث قائمة المرضى
      fetchTodayPatients();
    }
  } catch (error: unknown) {
    // ... error handling
  }
};
```

### 2. `src/services/reception.service.ts`
**التعديل**: إضافة فلترة لحالة Queue في `getTodayReceptionData()`

```typescript
async function getTodayReceptionData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await prisma.receptionData.findMany({
    where: {
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
      // ✅ فلترة جديدة: فقط الأدوار النشطة أو المكتملة
      queue: {
        status: {
          in: [OverallQueueStatus.ACTIVE, OverallQueueStatus.COMPLETED],
        },
      },
    },
    include: {
      queue: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
```

## ✅ النتائج المتوقعة

### قبل الإصلاح:
❌ قائمة الملغيين لا تُحدّث بعد إعادة الطباعة  
❌ الأدوار الملغاة تظهر في قائمة "المضافون اليوم"  
❌ الدور يظهر مرتين بعد إعادة الطباعة (مرة ملغى ومرة نشط)  
❌ الدور القديم يظهر بدلاً من الجديد  
❌ الدور المُعاد طباعته يظهر مرة أخرى عند إعادة فتح modal الملغيين  

### بعد الإصلاح:
✅ قائمة الملغيين تُحدّث فوراً بعد إعادة الطباعة  
✅ فقط الأدوار النشطة والمكتملة تظهر في "المضافون اليوم"  
✅ الدور الجديد فقط يظهر بعد إعادة الطباعة  
✅ رقم الدور والحالة صحيحة (الدور الجديد النشط)  
✅ الدور المُعاد طباعته لا يظهر في modal الملغيين (تم حذفه من قاعدة البيانات)  

## 🧪 كيفية الاختبار

1. **اختبار قائمة الملغيين**:
   - افتح صفحة الاستقبال
   - أضف مراجع جديد
   - ألغِ الدور من أي محطة
   - افتح قائمة الأدوار الملغاة (زر "الملغاة" الأحمر)
   - اضغط "إعادة طباعة" لأحد الأدوار
   - ✅ تحقق أن الدور اختفى من القائمة مباشرة

2. **اختبار قائمة المضافون اليوم**:
   - أضف مراجع جديد (سيظهر في القائمة)
   - ألغِ الدور
   - ✅ تحقق أن الدور اختفى من قائمة "المضافون اليوم"
   - افتح قائمة الملغيين وأعد طباعة الدور
   - ✅ تحقق أن الدور الجديد فقط يظهر في القائمة
   - ✅ تحقق أن رقم الدور الجديد صحيح
   - ✅ تحقق أن الحالة "نشط" وليست "ملغاة"

## 📝 ملاحظات تقنية

- استخدمنا Prisma relation filtering لفلترة البيانات على مستوى قاعدة البيانات
- هذا أكثر كفاءة من الفلترة على مستوى التطبيق
- الـ WebSocket hooks الموجودة ستستمر في العمل بشكل صحيح
- لا تأثير على الأدوار المكتملة - ستستمر في الظهور في القائمة

## 🎯 الخلاصة

تم حل المشكلتين بنجاح:
1. ✅ تحديث قائمة الملغيين يعمل فوراً بعد إعادة الطباعة
2. ✅ قائمة "المضافون اليوم" تعرض فقط الأدوار النشطة والمكتملة (بدون الملغاة)

النظام الآن يعمل بشكل متسق ومنطقي لتجربة مستخدم أفضل.

