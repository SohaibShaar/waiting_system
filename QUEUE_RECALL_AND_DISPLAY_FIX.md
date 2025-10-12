# إصلاح إعادة النداء وشاشة العرض

## التاريخ: 2025-10-12

## المشاكل المعالجة

### 1. إضافة ميزة إعادة النداء في قائمة الانتظار
**المشكلة:** لم يكن هناك طريقة لإعادة استدعاء مريض من قائمة الانتظار.

**الحل:**
- إضافة زر "🔔 إعادة النداء" لكل دور في قائمة الانتظار
- الزر يظهر فقط عندما يكون `stationId` متاحاً
- عند النقر، يتم استدعاء نفس API endpoint للاستدعاء المحدد
- يتم تعطيل الزر أثناء المعالجة لتجنب النقر المتعدد

### 2. إزالة الانتظار 5 ثوانٍ من شاشة العرض
**المشكلة:** كانت شاشة العرض تنتظر 5 ثوانٍ بعد كل نداء، مما يسبب تأخيراً غير ضروري.

**الحل:**
- إزالة `await new Promise((resolve) => setTimeout(resolve, 5000))`
- النظام الآن ينتقل مباشرة إلى الدور التالي بعد انتهاء الصوت فقط
- السرعة في المعالجة تحسنت بشكل كبير

---

## التغييرات التفصيلية

### 1. `web/src/components/QueueSidebar.tsx`

#### إضافة Props جديد
```typescript
interface QueueSidebarProps {
  stationName: string;
  currentQueueId?: number;
  stationId?: number | null; // ✅ جديد
}
```

#### إضافة State للتتبع
```typescript
const [recallingQueue, setRecallingQueue] = useState<number | null>(null);
```

#### إضافة وظيفة إعادة النداء
```typescript
const handleRecall = async (queueNumber: number) => {
  if (!stationId) {
    alert("⚠️ لا يمكن تحديد المحطة");
    return;
  }

  try {
    setRecallingQueue(queueNumber);
    const response = await axios.post(
      `${API_URL}/stations/${stationId}/call-specific`,
      { queueNumber, calledBy: `${stationName} (إعادة نداء)` }
    );

    if (response.data.success) {
      console.log(`✅ تمت إعادة استدعاء الدور #${queueNumber}`);
    }
  } catch (error) {
    console.error("❌ خطأ في إعادة الاستدعاء:", error);
    alert("❌ حدث خطأ في إعادة الاستدعاء");
  } finally {
    setRecallingQueue(null);
  }
};
```

#### إضافة زر في UI
```typescript
{/* Recall Button */}
{stationId && (
  <button
    onClick={() => handleRecall(queue.queueNumber)}
    disabled={recallingQueue === queue.queueNumber}
    className='w-full mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition duration-200 hover:opacity-80 disabled:opacity-50'
    style={{
      backgroundColor: "var(--accent)",
      color: "var(--white)",
    }}>
    {recallingQueue === queue.queueNumber ? "⏳ جاري النداء..." : "🔔 إعادة النداء"}
  </button>
)}
```

---

### 2. `web/src/pages/DisplayScreen.tsx`

#### إزالة انتظار 5 ثوانٍ

**قبل:**
```typescript
// 3. الانتظار 5 ثوانٍ على الأقل (بعد الصوت)
console.log(`⏳ انتظار 5 ثوانٍ للدور #${nextCall.queueNumber}`);
await new Promise((resolve) => setTimeout(resolve, 5000));

// 4. إزالة الدور من الطابور
pendingCallsRef.current = pendingCallsRef.current.slice(1);
```

**بعد:**
```typescript
// 3. إزالة الدور من الطابور مباشرة (بدون انتظار)
pendingCallsRef.current = pendingCallsRef.current.slice(1);
console.log(`✅ تم الانتهاء من معالجة الدور #${nextCall.queueNumber}`);
console.log(`📋 الأدوار المتبقية: ${pendingCallsRef.current.length}`);
```

#### إصلاح أخطاء في الكود
- إصلاح `pendingCallsRef.current.length` (كانت مقسمة على سطرين)
- إصلاح `setRecentCalls` (كانت تالفة)
- إصلاح `console.log` (كانت تحتوي على أخطاء في الصيغة)

---

### 3. تحديث جميع صفحات المحطات

تم تمرير `stationId` إلى `QueueSidebar` في:
- `web/src/pages/AccountingPage.tsx`
- `web/src/pages/LabPage.tsx`
- `web/src/pages/DoctorPage.tsx`

**مثال:**
```typescript
<QueueSidebar
  stationName='المحاسبة'
  currentQueueId={currentPatient?.queueId}
  stationId={stationId} // ✅ جديد
/>
```

---

### 4. `web/src/components/Header.tsx`

إصلاح خطأ Linter:
```typescript
// قبل
import { Link, useNavigate } from "react-router-dom";

// بعد
import { useNavigate } from "react-router-dom";
```

---

## كيفية الاستخدام

### إعادة النداء على مريض
1. افتح أي صفحة محطة (محاسبة، مختبر، طبيبة)
2. في قائمة الانتظار على اليسار، ستجد جميع المرضى المنتظرين
3. اضغط على زر "🔔 إعادة النداء" بجانب أي مريض
4. سيتم إعادة استدعاء المريض وإرسال إشعار إلى شاشة العرض
5. الزر سيتحول إلى "⏳ جاري النداء..." أثناء المعالجة

### شاشة العرض المحسّنة
- عند استدعاء مريض جديد، سيظهر فوراً على الشاشة
- سيتم تشغيل الصوت (إن كان مفعلاً)
- بعد انتهاء الصوت مباشرة، سيتم الانتقال إلى الدور التالي (إن وجد)
- لا يوجد انتظار 5 ثوانٍ إضافية

---

## الفوائد

1. **سهولة إعادة النداء:** لا حاجة للبحث عن المريض، فقط اضغط زر
2. **سرعة أفضل:** إزالة الانتظار غير الضروري يسرّع العملية
3. **تجربة مستخدم أفضل:** تحديثات فورية وبدون تأخير
4. **مرونة أكثر:** يمكن إعادة النداء على أي مريض في قائمة الانتظار

---

## اختبار التغييرات

### 1. اختبار إعادة النداء
```bash
# شغّل الخادم
npm run dev

# شغّل الواجهة
cd web
npm run dev
```

1. افتح صفحة المحطة
2. أضف عدة مرضى من الاستقبال
3. استدعي مريض واحد
4. في قائمة الانتظار، اضغط "إعادة النداء" على أي مريض
5. تأكد من ظهوره على شاشة العرض

### 2. اختبار شاشة العرض
1. افتح شاشة العرض
2. استدعي عدة مرضى بسرعة
3. تأكد من:
   - ظهور كل دور على الشاشة
   - تشغيل الصوت (إن كان مفعلاً)
   - الانتقال السريع للدور التالي بعد انتهاء الصوت
   - عدم وجود انتظار 5 ثوانٍ

---

## الخلاصة

✅ تم إضافة ميزة إعادة النداء في جميع المحطات  
✅ تم إزالة الانتظار 5 ثوانٍ من شاشة العرض  
✅ تم إصلاح جميع أخطاء Linter  
✅ تم اختبار البناء بنجاح  

النظام الآن أسرع وأكثر مرونة! 🚀

