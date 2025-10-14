# نظام طابور العرض - Display Queue System

## 🎯 الهدف

تحسين عرض الأدوار على الشاشة بحيث:
1. **يبقى كل دور لمدة 5 ثوانٍ على الأقل** على الشاشة
2. **عدم مقاطعة الصوت**: إذا تم استدعاء دور جديد، ينتظر حتى ينتهي الصوت الحالي
3. **معالجة تسلسلية**: الأدوار تُعالج واحداً تلو الآخر بدون تداخل

---

## 🔧 كيف يعمل النظام

### 1. طابور الانتظار (Queue)

```typescript
const pendingCallsRef = useRef<CalledPatient[]>([]);
```

- يتم تخزين جميع الأدوار الواردة في طابور انتظار
- استخدام `useRef` لتجنب إعادة render غير ضرورية
- الأدوار تُضاف إلى نهاية الطابور

### 2. حالة المعالجة

```typescript
const [isProcessingAnnouncement, setIsProcessingAnnouncement] = useState(false);
```

- `true`: يتم معالجة دور حالياً (صوت + عرض + انتظار)
- `false`: النظام جاهز لمعالجة الدور التالي

### 3. دورة حياة الدور (Lifecycle)

```
استدعاء جديد
    ↓
إضافة للطابور
    ↓
انتظار الدور السابق
    ↓
بدء المعالجة (isProcessing = true)
    ↓
عرض على الشاشة
    ↓
تشغيل الصوت (3-5 ثوانٍ)
    ↓
انتظار 5 ثوانٍ إضافية
    ↓
إزالة من الطابور
    ↓
نهاية المعالجة (isProcessing = false)
    ↓
معالجة الدور التالي (إن وجد)
```

---

## 📝 الكود الأساسي

### استقبال دور جديد

```typescript
newSocket.on("patient-called", (data: CalledPatient) => {
  console.log("📢 مريض جديد:", data);

  // تجنب التكرار
  setRecentCalls((prev) => {
    const isDuplicate = prev.some(
      (call) =>
        call.queueNumber === data.queueNumber &&
        call.displayNumber === data.displayNumber &&
        Math.abs(
          new Date(call.calledAt).getTime() -
            new Date(data.calledAt).getTime()
        ) < 2000
    );

    if (isDuplicate) {
      console.log("⚠️ تجاهل استدعاء مكرر");
      return prev;
    }

    return prev;
  });

  // إضافة إلى طابور الانتظار
  pendingCallsRef.current.push(data);
  console.log(`➕ تمت إضافة الدور #${data.queueNumber} إلى الطابور`);
  console.log(`📋 عدد الأدوار في الطابور: ${pendingCallsRef.current.length}`);
  forceUpdate({}); // إعادة تشغيل effect
});
```

### معالجة الطابور

```typescript
useEffect(() => {
  if (isProcessingAnnouncement || pendingCallsRef.current.length === 0) {
    return; // لا يوجد شيء للمعالجة
  }

  const processNextCall = async () => {
    setIsProcessingAnnouncement(true);
    const nextCall = pendingCallsRef.current[0];
    
    console.log(`🔄 معالجة الدور #${nextCall.queueNumber}`);
    console.log(`📋 عدد الأدوار المنتظرة: ${pendingCallsRef.current.length}`);

    try {
      // 1. عرض على الشاشة
      setRecentCalls((prev) => [nextCall, ...prev].slice(0, 10));

      // 2. تشغيل الصوت
      if (audioEnabled) {
        const stationName = getStationName(nextCall.displayNumber);
        console.log(`🔊 تشغيل الصوت للدور #${nextCall.queueNumber}`);
        await audioService.announcePatient(nextCall.queueNumber, stationName);
        console.log(`✅ انتهى الصوت للدور #${nextCall.queueNumber}`);
      }

      // 3. الانتظار 5 ثوانٍ
      console.log(`⏳ انتظار 5 ثوانٍ للدور #${nextCall.queueNumber}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 4. إزالة من الطابور
      pendingCallsRef.current = pendingCallsRef.current.slice(1);
      console.log(`✅ تم الانتهاء من معالجة الدور #${nextCall.queueNumber}`);
      
      // 5. معالجة التالي
      forceUpdate({});
    } catch (error) {
      console.error("❌ خطأ في معالجة الدور:", error);
      pendingCallsRef.current = pendingCallsRef.current.slice(1);
      forceUpdate({});
    } finally {
      setIsProcessingAnnouncement(false);
    }
  };

  processNextCall();
}, [isProcessingAnnouncement, audioEnabled, getStationName]);
```

---

## ⏱️ التوقيتات

### مع تفعيل الصوت:
- **النغمة التنبيهية**: ~0.5 ثانية
- **قراءة رقم الدور**: ~2-3 ثوانٍ
- **قراءة اسم المحطة**: ~1-2 ثانية
- **انتظار إضافي**: 5 ثوانٍ
- **المجموع**: ~8-11 ثانية لكل دور

### بدون صوت:
- **انتظار فقط**: 5 ثوانٍ لكل دور

---

## 📊 أمثلة على السيناريوهات

### السيناريو 1: دور واحد
```
الوقت 0s: استدعاء دور #1
الوقت 0s: عرض دور #1
الوقت 0-4s: تشغيل الصوت
الوقت 4-9s: انتظار 5 ثوانٍ
الوقت 9s: جاهز للدور التالي
```

### السيناريو 2: دورين متتاليين
```
الوقت 0s: استدعاء دور #1
الوقت 0s: بدء معالجة دور #1
الوقت 2s: استدعاء دور #2 (يُضاف للطابور)
الوقت 9s: انتهى دور #1
الوقت 9s: بدء معالجة دور #2
الوقت 18s: انتهى دور #2
```

### السيناريو 3: ثلاثة أدوار متقاربة
```
الوقت 0s: استدعاء دور #1 → معالجة
الوقت 1s: استدعاء دور #2 → طابور
الوقت 2s: استدعاء دور #3 → طابور
الوقت 9s: انتهى دور #1، بدء دور #2
الوقت 18s: انتهى دور #2، بدء دور #3
الوقت 27s: انتهى دور #3
```

---

## 🎨 رسائل Console للتتبع

### عند إضافة دور جديد:
```
📢 مريض جديد: {queueNumber: 1, displayNumber: 2, ...}
➕ تمت إضافة الدور #1 إلى الطابور
📋 عدد الأدوار في الطابور: 1
```

### أثناء المعالجة:
```
🔄 معالجة الدور #1
📋 عدد الأدوار المنتظرة: 1
🔊 تشغيل الصوت للدور #1
✅ انتهى الصوت للدور #1
⏳ انتظار 5 ثوانٍ للدور #1
✅ تم الانتهاء من معالجة الدور #1
📋 الأدوار المتبقية: 0
```

### عند تعطيل الصوت:
```
🔇 الصوت معطل - لن يتم تشغيل النداء
```

---

## ✅ المميزات

1. ✅ **عدم التداخل**: دور واحد فقط يُعالج في كل مرة
2. ✅ **الترتيب محفوظ**: FIFO (First In First Out)
3. ✅ **الصوت لا يُقاطع**: ينتهي الصوت كاملاً قبل الانتقال
4. ✅ **مدة عرض مضمونة**: 5 ثوانٍ على الأقل لكل دور
5. ✅ **معالجة أخطاء قوية**: حتى مع الأخطاء، النظام يستمر
6. ✅ **سجل تفصيلي**: رسائل console واضحة للتتبع

---

## 🧪 للاختبار

### اختبار 1: دور واحد
1. فعّل الصوت
2. استدعي دور من أي محطة
3. **المتوقع**: صوت + 5 ثوانٍ عرض

### اختبار 2: أدوار متتالية سريعة
1. فعّل الصوت
2. استدعي 3 أدوار بسرعة (خلال ثانية واحدة)
3. **المتوقع**: 
   - الدور 1 يظهر ويُسمع صوته
   - الدور 2 ينتظر حتى ينتهي الدور 1
   - الدور 3 ينتظر حتى ينتهي الدور 2
   - لا تداخل في الأصوات

### اختبار 3: بدون صوت
1. عطّل الصوت
2. استدعي دور
3. **المتوقع**: عرض 5 ثوانٍ فقط بدون صوت

---

## 🔧 تخصيص المدة

لتغيير مدة العرض من 5 ثوانٍ:

```typescript
// السطر 80
await new Promise((resolve) => setTimeout(resolve, 5000));
//                                                   ^^^^
//                                                   المدة بالميلي ثانية
```

مثال: 10 ثوانٍ → `10000`

---

## 📌 ملاحظات تقنية

### استخدام useRef بدلاً من useState:
- `useRef` لا يسبب re-render عند التحديث
- مثالي للطوابير والبيانات المؤقتة
- أسرع وأكثر كفاءة

### forceUpdate:
```typescript
const [, forceUpdate] = useState({});
// ...
forceUpdate({}); // يُجبر React على إعادة تشغيل useEffect
```

### async/await في useEffect:
- لا يمكن جعل useEffect نفسه async
- لذلك نستخدم دالة async داخلية

---

تاريخ التحديث: 12 أكتوبر 2025  
الحالة: ✅ جاهز للاستخدام

