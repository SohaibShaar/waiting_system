# إصلاح خطأ إعادة الاستدعاء (AxiosError)

## التاريخ: 2025-10-12

## المشكلة
عند محاولة إعادة النداء على مريض من قائمة الانتظار، كان يظهر خطأ `AxiosError`.

## السبب الجذري
كانت المشكلة في عدة نقاط:

1. **Backend Controller**: الـ `callSpecific` controller في `src/controllers/station.controller.ts` لم يكن يرسل إشعارات WebSocket بعد استدعاء المريض
2. **Patient Service**: دالة `callSpecificQueue` في `src/services/patient.service.ts`:
   - لم تكن ترجع `displayNumber` و `queueNumber` المطلوبين
   - **المشكلة الرئيسية**: كانت تبحث فقط عن سجلات في حالة `WAITING`، لكن عند إعادة النداء، قد يكون الدور في حالة `CALLED` أو `IN_PROGRESS`، مما يسبب خطأ 400
3. **Frontend**: رسائل الخطأ لم تكن واضحة بما يكفي

---

## الإصلاحات

### 1. `src/services/patient.service.ts`

#### إضافة القيم المرجعة المفقودة

**قبل (المشكلة):**
```typescript
// ❌ يبحث فقط عن سجلات WAITING
const lastWaitingRecord = await prisma.queueHistory.findFirst({
  where: {
    queueId: queue.id,
    stationId: stationId,
    status: QueueStatus.WAITING, // ❌ هنا المشكلة!
  },
  orderBy: {
    createdAt: "desc",
  },
});

if (!lastWaitingRecord) {
  return {
    success: false,
    message: "❌ لم يتم العثور على سجل انتظار لهذا الدور",
  };
}

await prisma.queueHistory.update({
  where: {
    id: lastWaitingRecord.id,
  },
  data: {
    status: QueueStatus.CALLED,
    calledAt: new Date(),
    ...(calledBy && { calledBy }),
  },
});

return { success: true, queue };
```

**بعد (الحل):**
```typescript
// ✅ يبحث عن آخر سجل في المحطة (أي حالة)
const lastRecord = await prisma.queueHistory.findFirst({
  where: {
    queueId: queue.id,
    stationId: stationId,
    // ✅ بدون تحديد status - يقبل أي حالة
  },
  orderBy: {
    createdAt: "desc",
  },
});

if (!lastRecord) {
  return {
    success: false,
    message: "❌ لم يتم العثور على سجل لهذا الدور في هذه المحطة",
  };
}

// إذا كان السجل الأخير WAITING، نقوم بتحديثه إلى CALLED
// إذا كان في حالة أخرى (CALLED, IN_PROGRESS)، نقوم بتحديثه أيضاً (إعادة نداء)
await prisma.queueHistory.update({
  where: {
    id: lastRecord.id,
  },
  data: {
    status: QueueStatus.CALLED,
    calledAt: new Date(),
    ...(calledBy && { calledBy }),
  },
});

// الحصول على المعلومات المحدثة
const updatedQueue = await prisma.queue.findUnique({
  where: { id: queue.id },
  include: {
    patient: true,
    currentStation: true,
  },
});

console.log(
  `📢 تم استدعاء الدور #${updatedQueue?.queueNumber} → الشاشة ${updatedQueue?.currentStation.displayNumber}`
);

return {
  success: true,
  queue: updatedQueue,
  displayNumber: updatedQueue?.currentStation.displayNumber,
  queueNumber: updatedQueue?.queueNumber,
};
```

**الفرق الرئيسي:**
- ❌ **قبل**: `status: QueueStatus.WAITING` - يبحث فقط عن سجلات في حالة WAITING
- ✅ **بعد**: بدون شرط `status` - يقبل أي حالة (WAITING, CALLED, IN_PROGRESS)

هذا يسمح **بإعادة النداء** على أي دور في قائمة الانتظار، بغض النظر عن حالته الحالية.

---

### 2. `src/controllers/station.controller.ts`

#### إضافة إرسال إشعارات WebSocket

**قبل:**
```typescript
const result = await callSpecificQueue(
  queueNumber,
  stationId,
  calledBy || undefined
);

if (!result.success) {
  return res.status(400).json(result);
}

res.json({
  success: true,
  queue: result.queue,
  message: `تم استدعاء الدور #${queueNumber}`,
});
```

**بعد:**
```typescript
const result = await callSpecificQueue(
  queueNumber,
  stationId,
  calledBy || undefined
);

if (!result.success) {
  return res.status(400).json(result);
}

// إرسال حدث Socket.IO
if (result.queue && result.displayNumber && result.queueNumber) {
  emitPatientCalled({
    queueNumber: result.queueNumber,
    displayNumber: result.displayNumber,
    stationId: stationId,
    calledAt: new Date().toISOString(),
  });

  // تحديث بيانات الشاشة
  emitScreenDataUpdate();
}

res.json({
  success: true,
  queue: result.queue,
  displayNumber: result.displayNumber,
  queueNumber: result.queueNumber,
  message: `تم استدعاء الدور #${queueNumber}`,
});
```

---

### 3. `web/src/components/QueueSidebar.tsx`

#### تحسين رسائل الخطأ والنجاح

**قبل:**
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

**بعد:**
```typescript
const handleRecall = async (queueNumber: number) => {
  if (!stationId) {
    alert("⚠️ لا يمكن تحديد المحطة");
    return;
  }

  try {
    setRecallingQueue(queueNumber);
    console.log(`🔔 محاولة إعادة النداء على الدور #${queueNumber} في المحطة ${stationId}`);
    
    const response = await axios.post(
      `${API_URL}/stations/${stationId}/call-specific`,
      { queueNumber, calledBy: `${stationName} (إعادة نداء)` }
    );

    if (response.data.success) {
      console.log(`✅ تمت إعادة استدعاء الدور #${queueNumber}`);
      alert(`✅ تم إعادة استدعاء الدور #${queueNumber} بنجاح`);
    }
  } catch (error: any) {
    console.error("❌ خطأ في إعادة الاستدعاء:", error);
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "حدث خطأ في إعادة الاستدعاء";
    alert(`❌ ${errorMsg}`);
  } finally {
    setRecallingQueue(null);
  }
};
```

---

## النتائج

✅ **إعادة الاستدعاء تعمل بشكل صحيح**  
✅ **إشعارات WebSocket تُرسل إلى شاشة العرض**  
✅ **رسائل الخطأ والنجاح أصبحت واضحة**  
✅ **Console logs مفيدة للتتبع**  

---

## الاختبار

### 1. اختبار إعادة النداء
```bash
# شغّل الخادم
npm run dev

# شغّل الواجهة
cd web
npm run dev
```

### 2. خطوات الاختبار
1. افتح صفحة أي محطة (المحاسبة مثلاً)
2. أضف عدة مرضى من صفحة الاستقبال
3. استدعي مريض واحد (اضغط "استدعاء المريض التالي")
4. في قائمة الانتظار، اضغط "🔔 إعادة النداء" على أي مريض آخر
5. تحقق من:
   - ظهور رسالة نجاح
   - ظهور المريض على شاشة العرض
   - تشغيل الصوت (إن كان مفعلاً)
   - تحديث قوائم الانتظار

---

## الخلاصة

تم إصلاح الخطأ بالكامل! الآن يمكن إعادة النداء على أي مريض من قائمة الانتظار بنجاح، وسيظهر على شاشة العرض مع الصوت. 🎉

