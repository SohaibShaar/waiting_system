# إصلاح مشكلة السجلات المتعددة في QueueHistory

## 🔴 المشكلة

عند وجود **أكثر من سجل** بنفس الحالة لنفس الدور في نفس المحطة (مثلاً عدة سجلات `WAITING` بعد عملية `skip`)، كانت الدوال تستخدم `updateMany` مما يؤدي إلى تحديث **جميع السجلات** بدلاً من آخر سجل فقط.

### السيناريو الذي يسبب المشكلة:

1. إضافة مريض أول: الاستقبال → المحاسبة ✅ → المختبر ✅
2. إضافة مريض ثاني: الاستقبال → المحاسبة ✅ → المختبر ✅
3. في محطة الطبيبة: عند استدعاء "التالي" → **يتجاهل المريض الأول ويستدعي الثاني مباشرة!** ❌

### السبب:

كان `updateMany` يحدث **جميع** سجلات `WAITING` للدور في المحطة، مما يعني أن السجلات القديمة (من عمليات skip سابقة أو أي سبب آخر) كانت تُحدّث أيضاً.

---

## ✅ الحل

تم تغيير المنطق في جميع الدوال للحصول على **آخر سجل فقط** بناءً على `createdAt DESC`، ثم تحديث هذا السجل المحدد باستخدام `update` بدلاً من `updateMany`.

---

## 📝 التعديلات المنفذة

### 1. `callNextPatient` في `patient.service.ts`

**قبل:**
```typescript
await prisma.queueHistory.updateMany({
  where: {
    queueId: nextQueue.id,
    stationId: stationId,
    status: QueueStatus.WAITING,
  },
  data: {
    status: QueueStatus.CALLED,
    calledAt: new Date(),
    ...(calledBy && { calledBy }),
  },
});
```

**بعد:**
```typescript
// الحصول على آخر سجل WAITING فقط
const lastWaitingRecord = await prisma.queueHistory.findFirst({
  where: {
    queueId: nextQueue.id,
    stationId: stationId,
    status: QueueStatus.WAITING,
  },
  orderBy: {
    createdAt: "desc", // الأحدث أولاً
  },
});

if (!lastWaitingRecord) {
  return {
    success: false,
    message: "⚠️ لم يتم العثور على سجل انتظار",
  };
}

// تحديث السجل المحدد فقط إلى CALLED
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
```

---

### 2. `callSpecificQueue` في `patient.service.ts`

تم تطبيق نفس المنطق:
- جلب آخر سجل `WAITING` فقط
- تحديث السجل المحدد بـ `id`

---

### 3. `startService` في `station.service.ts`

**قبل:**
```typescript
const updated = await prisma.queueHistory.updateMany({
  where: {
    queueId: queueId,
    stationId: stationId,
    status: QueueStatus.CALLED,
  },
  data: {
    status: QueueStatus.IN_PROGRESS,
    startedAt: new Date(),
  },
});
```

**بعد:**
```typescript
// الحصول على آخر سجل CALLED فقط
const lastCalledRecord = await prisma.queueHistory.findFirst({
  where: {
    queueId: queueId,
    stationId: stationId,
    status: QueueStatus.CALLED,
  },
  orderBy: {
    createdAt: "desc",
  },
});

if (!lastCalledRecord) {
  return {
    success: false,
    message: "❌ لم يتم العثور على دور مُستدعى",
  };
}

// تحديث السجل المحدد فقط إلى IN_PROGRESS
await prisma.queueHistory.update({
  where: {
    id: lastCalledRecord.id,
  },
  data: {
    status: QueueStatus.IN_PROGRESS,
    startedAt: new Date(),
  },
});
```

---

### 4. `completeStationService` في `station.service.ts`

تم البحث عن آخر سجل `IN_PROGRESS` أو `CALLED` وتحديثه إلى `COMPLETED`.

---

### 5. `skipPatient` في `queue.service.ts`

**قبل:**
```typescript
await prisma.queueHistory.updateMany({
  where: {
    queueId: queueId,
    stationId: stationId,
    status: QueueStatus.CALLED,
  },
  data: {
    status: QueueStatus.SKIPPED,
  },
});
```

**بعد:**
```typescript
// الحصول على آخر سجل CALLED أو IN_PROGRESS فقط
const lastActiveRecord = await prisma.queueHistory.findFirst({
  where: {
    queueId: queueId,
    stationId: stationId,
    status: {
      in: [QueueStatus.CALLED, QueueStatus.IN_PROGRESS],
    },
  },
  orderBy: {
    createdAt: "desc",
  },
});

if (!lastActiveRecord) {
  throw new Error("❌ لم يتم العثور على سجل نشط للتخطي");
}

// تحديث السجل المحدد فقط إلى SKIPPED
await prisma.queueHistory.update({
  where: {
    id: lastActiveRecord.id,
  },
  data: {
    status: QueueStatus.SKIPPED,
  },
});
```

---

## 🎯 النتيجة

الآن، عند وجود **أكثر من سجل** لنفس الدور في نفس المحطة:

✅ يتم تحديث **آخر سجل فقط** (الأحدث زمنياً)  
✅ السجلات القديمة تبقى كما هي (للأرشفة والتحليل)  
✅ الترتيب الصحيح للمرضى يُحترم  
✅ لا يتم تجاوز أي مريض

---

## 🧪 الاختبار المطلوب

للتحقق من الإصلاح، اتبع هذا السيناريو:

1. **مريض 1:**
   - إضافة في الاستقبال
   - استدعاء في المحاسبة → دفع
   - استدعاء في المختبر → فحص

2. **مريض 2:**
   - إضافة في الاستقبال
   - استدعاء في المحاسبة → دفع
   - استدعاء في المختبر → فحص

3. **محطة الطبيبة:**
   - استدعاء التالي → **يجب أن يستدعي المريض 1** ✅
   - إنهاء خدمة المريض 1
   - استدعاء التالي → **يجب أن يستدعي المريض 2** ✅

---

## 📌 ملاحظات مهمة

1. **جميع الدوال** الآن تستخدم `orderBy: { createdAt: "desc" }` لضمان أخذ آخر سجل
2. **معالجة الأخطاء** محسّنة: إذا لم يُعثر على السجل، يتم إرجاع خطأ واضح
3. **السجلات القديمة** لا تُحذف - تبقى في القاعدة للأرشفة
4. **التوافق** مع جميع المحطات: الاستقبال، المحاسبة، المختبر، الطبيبة

---

## 🔧 الملفات المُعدلة

- ✅ `src/services/patient.service.ts` - دوال استدعاء المرضى
- ✅ `src/services/station.service.ts` - دوال بدء وإنهاء الخدمة
- ✅ `src/services/queue.service.ts` - دوال تخطي المرضى

---

تاريخ الإصلاح: 12 أكتوبر 2025

