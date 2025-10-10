# 📚 دليل منطق نظام إدارة الأدوار

## 📊 هيكل قاعدة البيانات

تم تصميم 6 جداول رئيسية:

### 1️⃣ **Patient** (المريض)
- معلومات المريض الأساسية
- يمكن للمريض أن يكون له أدوار متعددة في أوقات مختلفة
- يحفظ سجل كامل لجميع زياراته

### 2️⃣ **Station** (المحطة/الجهاز)
- كل جهاز في العيادة
- له رقم شاشة خاص وترتيب في السير
- مثال: محطة 1 = الاستقبال، محطة 2 = الفحص، محطة 3 = الطبيب

### 3️⃣ **Queue** (الدور النشط)
- يمثل دور المريض الحالي
- يتتبع المحطة الحالية
- ينتهي عند إكمال جميع المحطات

### 4️⃣ **QueueHistory** (سجل التحركات)
- يسجل كل خطوة في كل محطة
- يحفظ أوقات الاستدعاء، البدء، والانتهاء
- يتيح حساب الإحصائيات

### 5️⃣ **CompletedVisit** (الزيارات المكتملة)
- أرشيف للمرضى الذين أنهوا رحلتهم
- يحفظ الإحصائيات والبيانات

### 6️⃣ **SystemSettings** (إعدادات النظام)
- حفظ آخر رقم دور
- إعدادات عامة للنظام

---

## 🔄 سير العمل التفصيلي

### **المرحلة 1: الاستقبال - إنشاء دور جديد**

```typescript
// عند وصول مريض جديد للاستقبال

async function createNewQueue(patientData: {name: string, phone?: string}) {
  // 1. إنشاء أو إيجاد المريض
  const patient = await prisma.patient.upsert({
    where: { phoneNumber: patientData.phone },
    create: { name: patientData.name, phoneNumber: patientData.phone },
    update: { name: patientData.name }
  });

  // 2. الحصول على رقم الدور التالي
  const lastQueueNumber = await getLastQueueNumber();
  const newQueueNumber = lastQueueNumber + 1;

  // 3. الحصول على أول محطة
  const firstStation = await prisma.station.findFirst({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  // 4. إنشاء الدور
  const queue = await prisma.queue.create({
    data: {
      queueNumber: newQueueNumber,
      patientId: patient.id,
      currentStationId: firstStation.id,
      status: 'ACTIVE'
    }
  });

  // 5. إنشاء أول سجل في QueueHistory
  await prisma.queueHistory.create({
    data: {
      queueId: queue.id,
      stationId: firstStation.id,
      status: 'WAITING'
    }
  });

  // النتيجة: المريض الآن في قائمة انتظار المحطة 1
  return { queue, queueNumber: newQueueNumber };
}
```

**ماذا يحدث؟**
- ✅ مريض جديد يُسجل
- ✅ يُعطى رقم دور (مثلاً: 5)
- ✅ يُضاف لقائمة انتظار المحطة 1
- ✅ يظهر في شاشة الجهاز 1

---

### **المرحلة 2: الجهاز 1 - عرض قائمة المرضى**

```typescript
// ما يراه الجهاز 1 في قائمته

async function getStationWaitingList(stationId: number) {
  return await prisma.queue.findMany({
    where: {
      currentStationId: stationId,
      status: 'ACTIVE',
      history: {
        some: {
          stationId: stationId,
          status: 'WAITING'
        }
      }
    },
    include: {
      patient: true,
      currentStation: true
    },
    orderBy: [
      { priority: 'desc' },  // الأولوية أولاً
      { queueNumber: 'asc' } // ثم حسب رقم الدور
    ]
  });
}
```

**مثال على النتيجة:**
```
قائمة انتظار الجهاز 1:
- الدور 3 - أحمد محمد
- الدور 4 - فاطمة علي  
- الدور 5 - خالد حسن
```

---

### **المرحلة 3: الجهاز 1 - استدعاء المريض التالي**

```typescript
async function callNextPatient(stationId: number, calledBy?: string) {
  // 1. الحصول على التالي في القائمة
  const nextQueue = await prisma.queue.findFirst({
    where: {
      currentStationId: stationId,
      status: 'ACTIVE',
      history: {
        some: {
          stationId: stationId,
          status: 'WAITING'
        }
      }
    },
    include: { patient: true, currentStation: true },
    orderBy: [
      { priority: 'desc' },
      { queueNumber: 'asc' }
    ]
  });

  if (!nextQueue) return null;

  // 2. تحديث حالة QueueHistory إلى CALLED
  await prisma.queueHistory.updateMany({
    where: {
      queueId: nextQueue.id,
      stationId: stationId,
      status: 'WAITING'
    },
    data: {
      status: 'CALLED',
      calledAt: new Date(),
      calledBy: calledBy
    }
  });

  // 3. إرسال إلى الشاشة العامة
  // emit to display screen: {queueNumber, stationNumber}

  return nextQueue;
}
```

**ماذا يحدث؟**
- 🔊 يُستدعى المريض رقم 3 (أحمد محمد)
- 📺 يظهر على الشاشة: "الدور 3 - الشاشة 1"
- ⏰ يُسجل وقت الاستدعاء

---

### **المرحلة 4: الجهاز 1 - بدء الخدمة**

```typescript
async function startService(queueId: number, stationId: number) {
  await prisma.queueHistory.updateMany({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: 'CALLED'
    },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }
  });
}
```

**ماذا يحدث؟**
- ✅ المريض دخل للخدمة
- ⏱️ بدأ مؤقت الخدمة

---

### **المرحلة 5: الجهاز 1 - إنهاء الخدمة والانتقال للمحطة التالية**

```typescript
async function completeStationService(queueId: number, stationId: number) {
  // 1. إنهاء الخدمة في المحطة الحالية
  await prisma.queueHistory.updateMany({
    where: {
      queueId: queueId,
      stationId: stationId,
      status: 'IN_PROGRESS'
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  // 2. الحصول على المحطة التالية
  const currentStation = await prisma.station.findUnique({
    where: { id: stationId }
  });

  const nextStation = await prisma.station.findFirst({
    where: {
      order: { gt: currentStation.order },
      isActive: true
    },
    orderBy: { order: 'asc' }
  });

  if (nextStation) {
    // 3. تحديث الدور للمحطة التالية
    await prisma.queue.update({
      where: { id: queueId },
      data: { currentStationId: nextStation.id }
    });

    // 4. إنشاء سجل جديد في QueueHistory
    await prisma.queueHistory.create({
      data: {
        queueId: queueId,
        stationId: nextStation.id,
        status: 'WAITING'
      }
    });

    return { moved: true, nextStation };
  } else {
    // لا توجد محطات أخرى - انتهى الدور
    await completeQueue(queueId);
    return { moved: false, completed: true };
  }
}
```

**ماذا يحدث؟**
- ✅ انتهى المريض من الجهاز 1
- ➡️ انتقل تلقائياً للجهاز 2
- 📋 ظهر في قائمة انتظار الجهاز 2

---

### **المرحلة 6: الجهاز 2 والجهاز 3**

نفس المنطق تماماً! كل جهاز:
1. يعرض قائمته الخاصة
2. يستدعي المرضى
3. يقدم الخدمة
4. ينقل للمحطة التالية

---

### **المرحلة 7: إنهاء الرحلة الكاملة (بعد آخر محطة)**

```typescript
async function completeQueue(queueId: number) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      patient: true,
      history: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  // 1. حساب الإحصائيات
  const firstHistory = queue.history[0];
  const lastHistory = queue.history[queue.history.length - 1];
  
  const totalDuration = Math.floor(
    (lastHistory.completedAt.getTime() - firstHistory.createdAt.getTime()) / 60000
  );

  let waitingTime = 0;
  let serviceTime = 0;

  queue.history.forEach(h => {
    if (h.calledAt && h.startedAt) {
      waitingTime += Math.floor(
        (h.startedAt.getTime() - h.createdAt.getTime()) / 60000
      );
    }
    if (h.startedAt && h.completedAt) {
      serviceTime += Math.floor(
        (h.completedAt.getTime() - h.startedAt.getTime()) / 60000
      );
    }
  });

  // 2. حفظ في CompletedVisit
  await prisma.completedVisit.create({
    data: {
      patientId: queue.patientId,
      queueNumber: queue.queueNumber,
      totalDuration,
      waitingTime,
      serviceTime,
      stationsCount: queue.history.length,
      visitData: {
        history: queue.history
      }
    }
  });

  // 3. تحديث حالة الدور
  await prisma.queue.update({
    where: { id: queueId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date()
    }
  });

  return { completed: true };
}
```

**ماذا يحدث؟**
- ✅ انتهى المريض من جميع المحطات
- 📊 حُسبت جميع الإحصائيات
- 💾 حُفظت البيانات في الأرشيف
- 🗑️ أُزيل من القوائم النشطة

---

## 📺 الشاشة العامة (Display Screen)

```typescript
async function getRecentCalls(limit: number = 10) {
  return await prisma.queueHistory.findMany({
    where: {
      status: { in: ['CALLED', 'IN_PROGRESS'] }
    },
    include: {
      queue: true,
      station: true
    },
    orderBy: { calledAt: 'desc' },
    take: limit
  });
}
```

**ماذا تعرض؟**
```
╔════════════════════════════════╗
║   الدور 5 → الشاشة 1         ║
║   الدور 3 → الشاشة 2         ║
║   الدور 2 → الشاشة 3         ║
╚════════════════════════════════╝
```

---

## 📊 استعلامات مهمة إضافية

### **1. المريض الحالي في الجهاز**
```typescript
async function getCurrentPatient(stationId: number) {
  return await prisma.queue.findFirst({
    where: {
      currentStationId: stationId,
      status: 'ACTIVE',
      history: {
        some: {
          stationId: stationId,
          status: { in: ['CALLED', 'IN_PROGRESS'] }
        }
      }
    },
    include: { patient: true }
  });
}
```

### **2. عدد المرضى المنتظرين لكل محطة**
```typescript
async function getStationStats() {
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          queues: {
            where: { status: 'ACTIVE' }
          }
        }
      }
    }
  });
  
  return stations.map(s => ({
    name: s.name,
    waiting: s._count.queues
  }));
}
```

### **3. إحصائيات اليوم**
```typescript
async function getTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completed = await prisma.completedVisit.count({
    where: { completedAt: { gte: today } }
  });

  const active = await prisma.queue.count({
    where: { 
      status: 'ACTIVE',
      createdAt: { gte: today }
    }
  });

  const avgWaitTime = await prisma.completedVisit.aggregate({
    where: { completedAt: { gte: today } },
    _avg: { waitingTime: true }
  });

  return {
    completedToday: completed,
    activeNow: active,
    avgWaitTime: avgWaitTime._avg.waitingTime
  };
}
```

---

## 🎯 سيناريو كامل - مثال عملي

### **المريض "أحمد محمد" يزور العيادة**

#### ⏰ 9:00 صباحاً - الاستقبال
```
✅ إنشاء دور رقم 5
📋 Queue { queueNumber: 5, currentStationId: 1, status: 'ACTIVE' }
📝 QueueHistory { stationId: 1, status: 'WAITING' }
```

#### ⏰ 9:05 - الجهاز 1 يستدعيه
```
📢 "الدور 5 - الشاشة 1"
📝 QueueHistory { stationId: 1, status: 'CALLED', calledAt: 9:05 }
```

#### ⏰ 9:06 - يدخل للخدمة
```
👨‍⚕️ بدء الخدمة
📝 QueueHistory { stationId: 1, status: 'IN_PROGRESS', startedAt: 9:06 }
```

#### ⏰ 9:15 - ينتهي من الجهاز 1
```
✅ انتهى من المحطة 1
📝 QueueHistory { stationId: 1, status: 'COMPLETED', completedAt: 9:15 }
➡️ انتقل للمحطة 2
📋 Queue { currentStationId: 2 }
📝 QueueHistory { stationId: 2, status: 'WAITING' }
```

#### ⏰ 9:20 - الجهاز 2 يستدعيه
```
📢 "الدور 5 - الشاشة 2"
... (نفس العملية)
```

#### ⏰ 9:40 - ينتهي من الجهاز 3 (آخر محطة)
```
✅ انتهى من جميع المحطات
📊 حساب الإحصائيات:
   - المدة الكلية: 40 دقيقة
   - وقت الانتظار: 15 دقيقة
   - وقت الخدمة: 25 دقيقة
💾 حفظ في CompletedVisit
📋 Queue { status: 'COMPLETED', completedAt: 9:40 }
```

---

## 🔧 إعدادات أولية للنظام

```typescript
// يجب تنفيذها مرة واحدة عند بدء النظام

async function initializeSystem() {
  // 1. إنشاء المحطات
  await prisma.station.createMany({
    data: [
      { name: 'الاستقبال', displayNumber: 1, order: 1 },
      { name: 'الفحص الأولي', displayNumber: 2, order: 2 },
      { name: 'الطبيب', displayNumber: 3, order: 3 }
    ]
  });

  // 2. إعداد آخر رقم دور
  await prisma.systemSettings.create({
    data: {
      key: 'LAST_QUEUE_NUMBER',
      value: '0',
      description: 'آخر رقم دور تم إنشاؤه'
    }
  });
}
```

---

## 🚀 الخطوات التالية للتنفيذ

1. ✅ تشغيل Migration لإنشاء الجداول
   ```bash
   npx prisma migrate dev --name init_queue_system
   ```

2. ✅ إنشاء API endpoints:
   - POST `/api/queue/create` - إنشاء دور جديد
   - GET `/api/queue/station/:id` - قائمة المرضى للمحطة
   - POST `/api/queue/call/:id` - استدعاء المريض
   - POST `/api/queue/start/:id` - بدء الخدمة
   - POST `/api/queue/complete/:id` - إنهاء الخدمة
   - GET `/api/display/recent` - الشاشة العامة

3. ✅ إنشاء واجهات المستخدم:
   - واجهة الاستقبال
   - واجهة كل محطة (1، 2، 3)
   - الشاشة العامة

4. ✅ WebSocket للتحديثات اللحظية
   - تحديث القوائم تلقائياً
   - تحديث الشاشة العامة

---

## 💡 ملاحظات مهمة

- 🔐 كل محطة تعرض فقط المرضى المخصصين لها
- 🔄 الانتقال بين المحطات تلقائي
- 📊 جميع الإحصائيات تُحسب تلقائياً
- 💾 الأرشفة تلقائية عند الانتهاء
- 🎯 نظام الأولويات جاهز للحالات الطارئة
- 📈 قابل للتوسع لإضافة محطات جديدة

---

**تم إعداد هذا الدليل بواسطة النظام** 🎉

