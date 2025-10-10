# 🗂️ مخطط قاعدة البيانات - نظام إدارة الأدوار

## 📐 العلاقات بين الجداول

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      Patient         │
│  (المريض)            │
├──────────────────────┤
│ • id (PK)            │
│ • name               │
│ • phoneNumber        │
│ • nationalId         │
│ • createdAt          │
│ • updatedAt          │
└──────┬───────────────┘
       │
       │ 1:N (يمكن للمريض أن يكون له أدوار متعددة)
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────────┐            ┌──────────────────────┐
│       Queue          │            │   CompletedVisit     │
│  (الدور النشط)       │            │  (الزيارات المكتملة) │
├──────────────────────┤            ├──────────────────────┤
│ • id (PK)            │            │ • id (PK)            │
│ • queueNumber        │            │ • patientId (FK)     │
│ • patientId (FK) ────┼────────────│ • queueNumber        │
│ • currentStationId───┼───┐        │ • totalDuration      │
│ • status             │   │        │ • waitingTime        │
│ • priority           │   │        │ • serviceTime        │
│ • notes              │   │        │ • stationsCount      │
│ • createdAt          │   │        │ • visitData (JSON)   │
│ • completedAt        │   │        │ • notes              │
└──────┬───────────────┘   │        │ • completedAt        │
       │                   │        └──────────────────────┘
       │ 1:N               │
       │                   │
       ▼                   │
┌──────────────────────┐   │
│   QueueHistory       │   │
│  (سجل التحركات)      │   │
├──────────────────────┤   │
│ • id (PK)            │   │
│ • queueId (FK) ──────┼───┘
│ • stationId (FK) ────┼───────┐
│ • status             │       │
│ • calledAt           │       │
│ • startedAt          │       │
│ • completedAt        │       │
│ • notes              │       │
│ • calledBy           │       │
│ • createdAt          │       │
└──────────────────────┘       │
                               │ N:1
                               │
                               ▼
                        ┌──────────────────────┐
                        │      Station         │
                        │  (المحطة/الجهاز)     │
                        ├──────────────────────┤
                        │ • id (PK)            │
                        │ • name               │
                        │ • displayNumber      │
                        │ • order              │
                        │ • isActive           │
                        │ • description        │
                        │ • createdAt          │
                        │ • updatedAt          │
                        └──────────────────────┘
                               ▲
                               │ N:1
                               │
                        (Queue.currentStationId)


┌──────────────────────┐
│  SystemSettings      │
│  (إعدادات النظام)    │
├──────────────────────┤
│ • id (PK)            │
│ • key                │
│ • value              │
│ • description        │
│ • updatedAt          │
└──────────────────────┘
(جدول مستقل - لا علاقات)
```

---

## 🔗 تفصيل العلاقات

### **1. Patient ← Queue (1:N)**
- كل مريض يمكن أن يكون له أدوار متعددة في أوقات مختلفة
- العلاقة: `Patient.id` → `Queue.patientId`
- مثال: المريض "أحمد" زار العيادة 3 مرات = 3 أدوار

### **2. Patient ← CompletedVisit (1:N)**
- كل مريض له أرشيف زيارات مكتملة
- العلاقة: `Patient.id` → `CompletedVisit.patientId`
- مثال: المريض "فاطمة" أكملت 10 زيارات

### **3. Queue ← QueueHistory (1:N)**
- كل دور له سجل تحركات متعدد (محطة لكل سجل)
- العلاقة: `Queue.id` → `QueueHistory.queueId`
- مثال: الدور #5 مر بـ 3 محطات = 3 سجلات

### **4. Station ← Queue (1:N)**
- كل محطة تستضيف أدوار متعددة (المحطة الحالية)
- العلاقة: `Station.id` → `Queue.currentStationId`
- مثال: المحطة "الاستقبال" لديها حالياً 5 مرضى منتظرين

### **5. Station ← QueueHistory (1:N)**
- كل محطة لها سجلات تحركات متعددة
- العلاقة: `Station.id` → `QueueHistory.stationId`
- مثال: محطة "الطبيب" خدمت اليوم 50 مريضاً

---

## 📊 حالات الـ Enums

### **QueueStatus** (حالة في المحطة)
```
┌─────────────┬──────────────────────────────────────┐
│   الحالة    │              الوصف                  │
├─────────────┼──────────────────────────────────────┤
│ WAITING     │ في الانتظار (في القائمة)            │
│ CALLED      │ تم الاستدعاء (ظهر على الشاشة)       │
│ IN_PROGRESS │ قيد الخدمة (داخل الغرفة)             │
│ COMPLETED   │ مكتمل (انتهى من هذه المحطة)          │
│ CANCELLED   │ ملغي                                 │
│ SKIPPED     │ تم التخطي                            │
└─────────────┴──────────────────────────────────────┘
```

### **OverallQueueStatus** (حالة الدور الكلية)
```
┌───────────┬───────────────────────────────────────┐
│  الحالة   │              الوصف                   │
├───────────┼───────────────────────────────────────┤
│ ACTIVE    │ نشط (يتنقل بين المحطات)              │
│ COMPLETED │ أنهى جميع المحطات                     │
│ CANCELLED │ ملغي                                  │
└───────────┴───────────────────────────────────────┘
```

---

## 🔄 دورة حياة الدور (Queue Lifecycle)

```
┌─────────────────────────────────────────────────────────────────┐
│                   QUEUE LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

1️⃣ الإنشاء (Creation)
   ↓
   Queue { status: ACTIVE, currentStationId: 1 }
   QueueHistory { stationId: 1, status: WAITING }
   
2️⃣ الاستدعاء (Called)
   ↓
   QueueHistory { stationId: 1, status: CALLED, calledAt: XX }
   
3️⃣ الخدمة (Service)
   ↓
   QueueHistory { stationId: 1, status: IN_PROGRESS, startedAt: XX }
   
4️⃣ الانتهاء من المحطة (Station Complete)
   ↓
   QueueHistory { stationId: 1, status: COMPLETED, completedAt: XX }
   Queue { currentStationId: 2 }  ← انتقال للمحطة التالية
   QueueHistory { stationId: 2, status: WAITING }  ← سجل جديد
   
5️⃣ تكرار 2-4 لكل محطة
   
6️⃣ الانتهاء الكلي (Full Completion)
   ↓
   Queue { status: COMPLETED, completedAt: XX }
   CompletedVisit { ...إحصائيات كاملة... }
```

---

## 📋 مثال بيانات واقعي

### **المريض "أحمد محمد" - الدور #5**

#### **جدول Patient:**
```sql
id | name         | phoneNumber  | nationalId
1  | أحمد محمد     | 0501234567   | 1234567890
```

#### **جدول Station:**
```sql
id | name          | displayNumber | order
1  | الاستقبال     | 1             | 1
2  | الفحص الأولي  | 2             | 2
3  | الطبيب        | 3             | 3
```

#### **جدول Queue:**
```sql
id | queueNumber | patientId | currentStationId | status  | createdAt
5  | 5           | 1         | 3                | ACTIVE  | 2025-01-15 09:00
```
*الحالة الحالية: في المحطة 3 (الطبيب)*

#### **جدول QueueHistory:**
```sql
id | queueId | stationId | status      | calledAt  | startedAt | completedAt
10 | 5       | 1         | COMPLETED   | 09:05     | 09:06     | 09:15
11 | 5       | 2         | COMPLETED   | 09:20     | 09:22     | 09:35
12 | 5       | 3         | IN_PROGRESS | 09:40     | 09:42     | NULL
```
*السجل: أنهى محطتين، الآن في الثالثة*

---

## 🎯 استعلامات SQL شائعة

### **1. قائمة انتظار محطة معينة:**
```sql
SELECT q.queueNumber, p.name
FROM queues q
JOIN patients p ON q.patientId = p.id
JOIN queue_history qh ON q.id = qh.queueId
WHERE q.currentStationId = 1
  AND q.status = 'ACTIVE'
  AND qh.stationId = 1
  AND qh.status = 'WAITING'
ORDER BY q.priority DESC, q.queueNumber ASC;
```

### **2. المريض الحالي في محطة:**
```sql
SELECT q.queueNumber, p.name, qh.status
FROM queues q
JOIN patients p ON q.patientId = p.id
JOIN queue_history qh ON q.id = qh.queueId
WHERE qh.stationId = 2
  AND qh.status IN ('CALLED', 'IN_PROGRESS')
LIMIT 1;
```

### **3. إحصائيات اليوم:**
```sql
SELECT 
  COUNT(*) as completedToday,
  AVG(waitingTime) as avgWaitTime,
  AVG(serviceTime) as avgServiceTime
FROM completed_visits
WHERE DATE(completedAt) = CURDATE();
```

### **4. الشاشة العامة (آخر الاستدعاءات):**
```sql
SELECT 
  q.queueNumber,
  s.displayNumber,
  qh.calledAt
FROM queue_history qh
JOIN queues q ON qh.queueId = q.id
JOIN stations s ON qh.stationId = s.id
WHERE qh.status IN ('CALLED', 'IN_PROGRESS')
ORDER BY qh.calledAt DESC
LIMIT 10;
```

---

## 🔒 قواعد التكامل المرجعي (Foreign Key Constraints)

```
Patient → Queue
  ON DELETE: CASCADE (عند حذف مريض، تُحذف أدواره)
  
Patient → CompletedVisit
  ON DELETE: RESTRICT (لا يمكن حذف مريض له زيارات مكتملة)
  
Station → Queue
  ON DELETE: RESTRICT (لا يمكن حذف محطة نشطة)
  
Station → QueueHistory
  ON DELETE: RESTRICT (لا يمكن حذف محطة لها سجلات)
  
Queue → QueueHistory
  ON DELETE: CASCADE (عند حذف دور، يُحذف سجله)
```

---

## 📈 فهارس الأداء (Performance Indexes)

```sql
-- على جدول Patient
INDEX idx_phone ON patients(phoneNumber)
INDEX idx_national_id ON patients(nationalId)

-- على جدول Station
INDEX idx_order ON stations(order)

-- على جدول Queue
INDEX idx_patient ON queues(patientId)
INDEX idx_current_station ON queues(currentStationId)
INDEX idx_status ON queues(status)
INDEX idx_created ON queues(createdAt)

-- على جدول QueueHistory
INDEX idx_queue ON queue_history(queueId)
INDEX idx_station ON queue_history(stationId)
INDEX idx_status ON queue_history(status)
INDEX idx_called ON queue_history(calledAt)

-- على جدول CompletedVisit
INDEX idx_patient ON completed_visits(patientId)
INDEX idx_completed ON completed_visits(completedAt)
```

---

## 💾 حجم البيانات المتوقع

### **تقديرات لعيادة متوسطة (100 مريض/يوم):**

```
┌─────────────────────┬────────────┬───────────┬──────────────┐
│      الجدول         │  يومياً    │  شهرياً   │   سنوياً     │
├─────────────────────┼────────────┼───────────┼──────────────┤
│ Patient             │ ~50 جديد   │ 1,500     │ 18,000       │
│ Queue (نشط)         │ ~100       │ ~100      │ ~100         │
│ QueueHistory (نشط)  │ ~300       │ ~300      │ ~300         │
│ CompletedVisit      │ 100        │ 3,000     │ 36,000       │
└─────────────────────┴────────────┴───────────┴──────────────┘

* الأدوار النشطة (Queue/QueueHistory) تُؤرشف وتُنظف دورياً
* الأرشيف (CompletedVisit) يمكن نقله لقاعدة بيانات منفصلة سنوياً
```

---

## ✅ مزايا هذا التصميم

✔️ **فصل واضح للمسؤوليات** - كل جدول له دور محدد
✔️ **قابل للتوسع** - إضافة محطات جديدة سهل
✔️ **تتبع كامل** - كل خطوة مسجلة
✔️ **أداء ممتاز** - فهارس محسّنة
✔️ **أرشفة تلقائية** - بيانات تاريخية محفوظة
✔️ **مرونة عالية** - يدعم سيناريوهات معقدة
✔️ **سلامة البيانات** - علاقات وقيود محكمة

---

**📅 تاريخ التصميم:** 10 أكتوبر 2025

