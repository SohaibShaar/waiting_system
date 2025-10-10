# 🧪 دليل اختبار النظام

## 🚀 تشغيل النظام

### 1. تشغيل الخادم
```bash
npm run dev
```

يجب أن ترى:
```
🚀 Server is running on http://localhost:3001
📡 WebSocket server is ready
```

---

## 📝 سيناريو اختبار كامل

### **الخطوة 1: إنشاء دور جديد**

```bash
curl -X POST http://localhost:3001/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phoneNumber": "0501234567",
    "priority": 0
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "queue": {
    "id": 1,
    "queueNumber": 1,
    "patient": {
      "id": 1,
      "name": "أحمد محمد"
    },
    "currentStation": {
      "id": 1,
      "name": "الاستقبال",
      "displayNumber": 1
    }
  }
}
```

---

### **الخطوة 2: الحصول على قائمة الانتظار**

```bash
curl http://localhost:3001/api/stations/1/waiting-list
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "station": {
    "id": 1,
    "name": "الاستقبال",
    "displayNumber": 1
  },
  "waiting": [
    {
      "queueNumber": 1,
      "patient": {
        "name": "أحمد محمد"
      },
      "priority": 0,
      "waitingTime": 0
    }
  ],
  "count": 1
}
```

---

### **الخطوة 3: استدعاء المريض التالي**

```bash
curl -X POST http://localhost:3001/api/stations/1/call-next \
  -H "Content-Type: application/json" \
  -d '{
    "calledBy": "موظف الاستقبال"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "queue": {...},
  "displayNumber": 1,
  "queueNumber": 1,
  "message": "تم استدعاء الدور #1"
}
```

---

### **الخطوة 4: بدء الخدمة**

```bash
curl -X POST http://localhost:3001/api/stations/1/start-service \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "بدأت الخدمة"
}
```

---

### **الخطوة 5: إنهاء الخدمة والانتقال للمحطة التالية**

```bash
curl -X POST http://localhost:3001/api/stations/1/complete-service \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1,
    "notes": "تم التسجيل بنجاح"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "moved": true,
  "nextStation": {
    "id": 2,
    "name": "الفحص الأولي",
    "displayNumber": 2
  },
  "completed": false,
  "message": "انتهت الخدمة - انتقل للمحطة الفحص الأولي"
}
```

---

### **الخطوة 6: الحصول على إحصائيات اليوم**

```bash
curl http://localhost:3001/api/stats/today
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "date": "2025-10-10",
  "stats": {
    "completedToday": 0,
    "activeNow": 1,
    "totalToday": 1,
    "avgWaitingTime": 0,
    "avgServiceTime": 0,
    "avgTotalDuration": 0
  }
}
```

---

## 🔄 اختبار WebSocket

### **استخدام JavaScript/Node.js:**

```javascript
const io = require('socket.io-client');

// الاتصال بالخادم
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // الاشتراك في محطة معينة
  socket.emit('subscribe-station', { stationId: 1 });
  
  // الاشتراك في الشاشة العامة
  socket.emit('subscribe-display');
});

// استقبال الأحداث
socket.on('patient-called', (data) => {
  console.log('📢 Patient called:', data);
});

socket.on('waiting-list-updated', (data) => {
  console.log('📋 Waiting list updated:', data);
});

socket.on('display-updated', (data) => {
  console.log('📺 Display updated:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});
```

---

## 📊 اختبار جميع Endpoints

### **1. Patient Endpoints**

```bash
# إنشاء مريض
curl -X POST http://localhost:3001/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"فاطمة علي","phoneNumber":"0509876543"}'

# البحث عن مريض
curl "http://localhost:3001/api/patients/search?phone=0509876543"

# الحصول على بيانات مريض
curl http://localhost:3001/api/patients/1

# تاريخ زيارات المريض
curl http://localhost:3001/api/patients/1/history
```

---

### **2. Queue Endpoints**

```bash
# إنشاء دور
curl -X POST http://localhost:3001/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{"name":"خالد حسن","phoneNumber":"0551234567"}'

# الأدوار النشطة
curl http://localhost:3001/api/queue/active

# تفاصيل دور
curl http://localhost:3001/api/queue/1

# تغيير الأولوية
curl -X PUT http://localhost:3001/api/queue/1/priority \
  -H "Content-Type: application/json" \
  -d '{"priority":10}'

# إلغاء دور
curl -X DELETE http://localhost:3001/api/queue/1/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason":"المريض غادر"}'
```

---

### **3. Station Endpoints**

```bash
# جميع المحطات
curl http://localhost:3001/api/stations

# إنشاء محطة
curl -X POST http://localhost:3001/api/stations \
  -H "Content-Type: application/json" \
  -d '{"name":"الصيدلية","displayNumber":4,"order":4}'

# تحديث محطة
curl -X PUT http://localhost:3001/api/stations/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"الاستقبال المركزي"}'

# قائمة الانتظار
curl http://localhost:3001/api/stations/1/waiting-list

# المريض الحالي
curl http://localhost:3001/api/stations/1/current

# استدعاء التالي
curl -X POST http://localhost:3001/api/stations/1/call-next \
  -H "Content-Type: application/json" \
  -d '{"calledBy":"موظف 1"}'

# استدعاء محدد
curl -X POST http://localhost:3001/api/stations/1/call-specific \
  -H "Content-Type: application/json" \
  -d '{"queueNumber":5,"calledBy":"موظف 1"}'

# بدء الخدمة
curl -X POST http://localhost:3001/api/stations/1/start-service \
  -H "Content-Type: application/json" \
  -d '{"queueId":1}'

# إنهاء الخدمة
curl -X POST http://localhost:3001/api/stations/1/complete-service \
  -H "Content-Type: application/json" \
  -d '{"queueId":1,"notes":"تم بنجاح"}'

# تخطي مريض
curl -X POST http://localhost:3001/api/stations/1/skip-patient \
  -H "Content-Type: application/json" \
  -d '{"queueId":1}'

# آخر الاستدعاءات
curl "http://localhost:3001/api/stations/display/recent-calls?limit=5"

# بيانات الشاشة
curl http://localhost:3001/api/stations/display/screen-data
```

---

### **4. Stats Endpoints**

```bash
# إحصائيات اليوم
curl http://localhost:3001/api/stats/today

# إحصائيات جميع المحطات
curl http://localhost:3001/api/stats/stations

# إحصائيات محطة معينة
curl http://localhost:3001/api/stats/station/1

# نظرة عامة
curl http://localhost:3001/api/stats/overview
```

---

## 🎯 اختبار متقدم - Postman Collection

يمكنك استيراد هذا الـ JSON في Postman:

```json
{
  "info": {
    "name": "Queue Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Queue",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"name\":\"أحمد محمد\",\"phoneNumber\":\"0501234567\"}"
        },
        "url": {
          "raw": "http://localhost:3001/api/queue/create",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "queue", "create"]
        }
      }
    },
    {
      "name": "Get Active Queues",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3001/api/queue/active",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "queue", "active"]
        }
      }
    },
    {
      "name": "Get Waiting List",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3001/api/stations/1/waiting-list",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "stations", "1", "waiting-list"]
        }
      }
    },
    {
      "name": "Call Next Patient",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"calledBy\":\"موظف الاستقبال\"}"
        },
        "url": {
          "raw": "http://localhost:3001/api/stations/1/call-next",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "stations", "1", "call-next"]
        }
      }
    },
    {
      "name": "Today Stats",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3001/api/stats/today",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "stats", "today"]
        }
      }
    }
  ]
}
```

---

## ✅ قائمة التحقق

- [ ] الخادم يعمل بدون أخطاء
- [ ] يمكن إنشاء دور جديد
- [ ] يمكن الحصول على قائمة الانتظار
- [ ] يمكن استدعاء مريض
- [ ] يمكن بدء الخدمة
- [ ] يمكن إنهاء الخدمة والانتقال للمحطة التالية
- [ ] الإحصائيات تعمل بشكل صحيح
- [ ] WebSocket يرسل الأحداث
- [ ] جميع الـ endpoints تعيد استجابات صحيحة

---

## 🐛 استكشاف الأخطاء

### **مشكلة: Cannot find module**
```bash
npm install
```

### **مشكلة: Port already in use**
قم بتغيير PORT في `.env`:
```
PORT=3002
```

### **مشكلة: Database connection error**
تأكد من تشغيل MySQL وتحديث `.env`:
```
DATABASE_URL="mysql://user:password@localhost:3306/queue_system"
```

### **مشكلة: Prisma Client not generated**
```bash
npx prisma generate
```

---

## 📝 ملاحظات مهمة

1. تأكد من تشغيل قاعدة البيانات قبل تشغيل الخادم
2. استخدم `npm run dev` للتطوير (مع nodemon)
3. جميع الاستجابات تحتوي على `success: true/false`
4. في حالة الخطأ، الرسالة في `error`
5. WebSocket يعمل على نفس المنفذ (3001)

---

**جاهز للاختبار! 🚀**

