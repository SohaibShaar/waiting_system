# ⚡ مرجع سريع - نظام إدارة الأدوار

## 📚 الملفات المتوفرة

| الملف | الوصف |
|-------|-------|
| `prisma/schema.prisma` | قاعدة البيانات الكاملة (6 جداول) |
| `QUEUE_SYSTEM_LOGIC.md` | شرح المنطق مع أمثلة كود |
| `DATABASE_SCHEMA_DIAGRAM.md` | مخططات بصرية للعلاقات |
| `QUEUE_SERVICE_EXAMPLES.ts` | 40+ دالة جاهزة |
| `API_ENDPOINTS_GUIDE.md` | دليل API كامل |
| `IMPLEMENTATION_PLAN.md` | خطة التنفيذ التفصيلية |
| `SQL_QUERIES_EXAMPLES.sql` | استعلامات SQL شائعة |
| `README_QUEUE_SYSTEM.md` | الدليل الشامل |

---

## 🗂️ الجداول الرئيسية

```
Patient         → بيانات المريض
Station         → المحطات/الأجهزة
Queue           → الدور النشط
QueueHistory    → سجل التحركات
CompletedVisit  → الزيارات المكتملة
SystemSettings  → إعدادات النظام
```

---

## 🔄 سير العمل السريع

```
1. إنشاء مريض → Patient
2. إنشاء دور → Queue + QueueHistory (WAITING)
3. استدعاء → QueueHistory (CALLED)
4. بدء خدمة → QueueHistory (IN_PROGRESS)
5. إنهاء → QueueHistory (COMPLETED)
6. انتقال → Queue.currentStationId + QueueHistory جديد
7. إنهاء كلي → CompletedVisit + Queue (COMPLETED)
```

---

## 🚀 أوامر البدء السريع

```bash
# قاعدة البيانات
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed

# Backend
npm install
npm run dev

# Frontend
cd web
npm install
npm run dev
```

---

## 📡 API الأساسية

```bash
# إنشاء دور
POST /api/queue/create
{"name":"أحمد","phoneNumber":"0501234567"}

# استدعاء
POST /api/stations/1/call-next
{"calledBy":"موظف"}

# إنهاء
POST /api/stations/1/complete-service
{"queueId":5}

# قائمة الانتظار
GET /api/stations/1/waiting-list

# الإحصائيات
GET /api/stats/today
```

---

## 💡 استعلامات SQL مهمة

```sql
-- قائمة الانتظار
SELECT q.queueNumber, p.name
FROM queues q
JOIN patients p ON q.patientId = p.id
WHERE q.currentStationId = 1 AND q.status = 'ACTIVE';

-- إحصائيات اليوم
SELECT COUNT(*) AS total, AVG(waitingTime) AS avgWait
FROM completed_visits
WHERE DATE(completedAt) = CURDATE();
```

---

## 🎯 النقاط المهمة

✅ كل دور له `queueNumber` فريد يومياً  
✅ كل محطة لها `displayNumber` للشاشة  
✅ `QueueHistory` يسجل كل خطوة  
✅ `CompletedVisit` للأرشفة  
✅ WebSocket للتحديثات اللحظية  
✅ نظام أولويات مدمج  

---

## 🔧 التخصيص السريع

### إضافة محطة:
```typescript
await prisma.station.create({
  data: { name: 'الصيدلية', displayNumber: 4, order: 4 }
});
```

### تغيير أولوية:
```typescript
await prisma.queue.update({
  where: { id: queueId },
  data: { priority: 10 }
});
```

---

## 📊 الحالات (Enums)

### QueueStatus (في المحطة):
- `WAITING` - منتظر
- `CALLED` - مُستدعى
- `IN_PROGRESS` - قيد الخدمة
- `COMPLETED` - مكتمل

### OverallQueueStatus (الكلية):
- `ACTIVE` - نشط
- `COMPLETED` - منتهي
- `CANCELLED` - ملغي

---

## 🐛 حل المشاكل الشائعة

**القائمة فارغة؟**
- تحقق من `currentStationId`
- تحقق من `QueueHistory.status = WAITING`

**WebSocket لا يعمل؟**
- تحقق من الاتصال
- تحقق من `socket.join('station-X')`

**الأرقام لا تُعاد؟**
- أضف Cron Job يومياً

---

## 📞 الدعم السريع

1. راجع `README_QUEUE_SYSTEM.md` للدليل الكامل
2. راجع `QUEUE_SYSTEM_LOGIC.md` للمنطق
3. راجع `API_ENDPOINTS_GUIDE.md` للـ API
4. راجع `SQL_QUERIES_EXAMPLES.sql` للاستعلامات

---

**تم إعداده بـ ❤️ للتنفيذ السريع**

