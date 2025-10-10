# 📚 توثيق API - نظام إدارة الأدوار

## 🎯 نظرة عامة

تم إنشاء جميع الـ Controllers و Routes بنجاح لنظام إدارة الأدوار. هذا الملف يوثق جميع الـ endpoints المتاحة.

**Base URL:** `http://localhost:3001/api`

---

## 📋 جدول المحتويات

1. [إدارة المرضى (Patients)](#1-إدارة-المرضى-patients)
2. [إدارة الأدوار (Queue)](#2-إدارة-الأدوار-queue)
3. [إدارة المحطات (Stations)](#3-إدارة-المحطات-stations)
4. [الإحصائيات (Stats)](#4-الإحصائيات-stats)
5. [الشاشة العامة (Display)](#5-الشاشة-العامة-display)
6. [WebSocket Events](#6-websocket-events)

---

## 1️⃣ إدارة المرضى (Patients)

### **POST** `/api/patients`
إنشاء أو تحديث مريض

**Request Body:**
```json
{
  "name": "أحمد محمد علي",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": 1,
    "name": "أحمد محمد علي",
    "phoneNumber": "0501234567",
    "nationalId": "1234567890",
    "createdAt": "2025-01-15T09:00:00.000Z",
    "updatedAt": "2025-01-15T09:00:00.000Z"
  }
}
```

---

### **GET** `/api/patients/:id`
الحصول على بيانات مريض معين

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": 1,
    "name": "أحمد محمد علي",
    "phoneNumber": "0501234567",
    "queues": [
      {
        "id": 5,
        "queueNumber": 5,
        "status": "ACTIVE",
        "currentStation": {
          "name": "الفحص الأولي",
          "displayNumber": 2
        }
      }
    ]
  }
}
```

---

### **GET** `/api/patients/search?phone=xxx&nationalId=xxx`
البحث عن مريض برقم الهاتف أو الهوية

**Query Parameters:**
- `phone` - رقم الهاتف
- `nationalId` - رقم الهوية

**Response:**
```json
{
  "success": true,
  "patient": {
    "id": 1,
    "name": "أحمد محمد علي",
    "phoneNumber": "0501234567"
  }
}
```

---

### **GET** `/api/patients/:id/history`
تاريخ زيارات المريض

**Response:**
```json
{
  "success": true,
  "visits": [
    {
      "id": 1,
      "queueNumber": 12,
      "completedAt": "2025-01-14T14:30:00.000Z",
      "totalDuration": 45,
      "waitingTime": 20,
      "serviceTime": 25
    }
  ]
}
```

---

## 2️⃣ إدارة الأدوار (Queue)

### **POST** `/api/queue/create`
إنشاء دور جديد للمريض

**Request Body:**
```json
{
  "name": "أحمد محمد",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890",
  "priority": 0,
  "notes": "مريض جديد"
}
```

**Response:**
```json
{
  "success": true,
  "queue": {
    "id": 5,
    "queueNumber": 5,
    "patient": {
      "id": 1,
      "name": "أحمد محمد"
    },
    "currentStation": {
      "id": 1,
      "name": "الاستقبال",
      "displayNumber": 1
    },
    "status": "ACTIVE",
    "createdAt": "2025-01-15T09:00:00.000Z"
  },
  "queueNumber": 5,
  "patient": {...},
  "station": {...}
}
```

---

### **GET** `/api/queue/active`
الحصول على جميع الأدوار النشطة

**Response:**
```json
{
  "success": true,
  "queues": [
    {
      "id": 5,
      "queueNumber": 5,
      "patient": {...},
      "currentStation": {...},
      "status": "ACTIVE"
    }
  ],
  "count": 1
}
```

---

### **GET** `/api/queue/:id`
الحصول على تفاصيل دور معين

**Response:**
```json
{
  "success": true,
  "queue": {
    "id": 5,
    "queueNumber": 5,
    "patient": {...},
    "currentStation": {...},
    "history": [
      {
        "station": {...},
        "status": "COMPLETED",
        "calledAt": "...",
        "startedAt": "...",
        "completedAt": "..."
      }
    ]
  }
}
```

---

### **PUT** `/api/queue/:id/priority`
تغيير أولوية دور

**Request Body:**
```json
{
  "priority": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تغيير الأولوية إلى 10"
}
```

---

### **DELETE** `/api/queue/:id/cancel`
إلغاء دور

**Request Body:**
```json
{
  "reason": "المريض غادر"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إلغاء الدور"
}
```

---

### **POST** `/api/queue/:id/complete`
إنهاء دور بالكامل

**Response:**
```json
{
  "success": true,
  "message": "تم إنهاء الدور بالكامل",
  "completedVisit": {...},
  "queue": {...}
}
```

---

## 3️⃣ إدارة المحطات (Stations)

### **GET** `/api/stations`
الحصول على قائمة جميع المحطات

**Response:**
```json
{
  "success": true,
  "stations": [
    {
      "id": 1,
      "name": "الاستقبال",
      "displayNumber": 1,
      "order": 1,
      "isActive": true
    }
  ]
}
```

---

### **POST** `/api/stations`
إنشاء محطة جديدة

**Request Body:**
```json
{
  "name": "الصيدلية",
  "displayNumber": 4,
  "order": 4,
  "description": "صرف الأدوية"
}
```

**Response:**
```json
{
  "success": true,
  "station": {
    "id": 4,
    "name": "الصيدلية",
    "displayNumber": 4,
    "order": 4,
    "isActive": true
  }
}
```

---

### **PUT** `/api/stations/:id`
تحديث بيانات محطة

**Request Body:**
```json
{
  "name": "الصيدلية المركزية",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "station": {...}
}
```

---

### **DELETE** `/api/stations/:id`
حذف محطة

**Response:**
```json
{
  "success": true,
  "message": "تم حذف المحطة"
}
```

---

### **GET** `/api/stations/:stationId/waiting-list`
قائمة المرضى المنتظرين لمحطة معينة

**Response:**
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
      "queueNumber": 3,
      "patient": {
        "name": "أحمد محمد"
      },
      "priority": 0,
      "waitingTime": 5,
      "notes": null
    }
  ],
  "count": 1
}
```

---

### **GET** `/api/stations/:stationId/current`
المريض الحالي في المحطة

**Response:**
```json
{
  "success": true,
  "current": {
    "queueNumber": 2,
    "patient": {
      "name": "خالد حسن"
    },
    "status": "IN_PROGRESS",
    "startedAt": "2025-01-15T09:10:00.000Z",
    "calledAt": "2025-01-15T09:08:00.000Z"
  }
}
```

---

### **POST** `/api/stations/:stationId/call-next`
استدعاء المريض التالي

**Request Body:**
```json
{
  "calledBy": "موظف الاستقبال"
}
```

**Response:**
```json
{
  "success": true,
  "queue": {...},
  "displayNumber": 1,
  "queueNumber": 3,
  "message": "تم استدعاء الدور #3"
}
```

---

### **POST** `/api/stations/:stationId/call-specific`
استدعاء دور محدد بالرقم

**Request Body:**
```json
{
  "queueNumber": 5,
  "calledBy": "موظف الاستقبال"
}
```

**Response:**
```json
{
  "success": true,
  "queue": {...},
  "message": "تم استدعاء الدور #5"
}
```

---

### **POST** `/api/stations/:stationId/start-service`
بدء تقديم الخدمة

**Request Body:**
```json
{
  "queueId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "بدأت الخدمة"
}
```

---

### **POST** `/api/stations/:stationId/complete-service`
إنهاء الخدمة والانتقال للمحطة التالية

**Request Body:**
```json
{
  "queueId": 5,
  "notes": "تم الفحص بنجاح"
}
```

**Response (عند الانتقال للمحطة التالية):**
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

**Response (عند الانتهاء الكلي):**
```json
{
  "success": true,
  "moved": false,
  "completed": true,
  "message": "انتهى الدور بالكامل"
}
```

---

### **POST** `/api/stations/:stationId/skip-patient`
تخطي المريض الحالي

**Request Body:**
```json
{
  "queueId": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تخطي المريض"
}
```

---

## 4️⃣ الإحصائيات (Stats)

### **GET** `/api/stats/today`
إحصائيات اليوم

**Response:**
```json
{
  "success": true,
  "date": "2025-01-15",
  "stats": {
    "completedToday": 45,
    "activeNow": 8,
    "totalToday": 53,
    "avgWaitingTime": 15,
    "avgServiceTime": 10,
    "avgTotalDuration": 35
  }
}
```

---

### **GET** `/api/stats/stations`
إحصائيات جميع المحطات

**Response:**
```json
{
  "success": true,
  "stations": [
    {
      "id": 1,
      "name": "الاستقبال",
      "displayNumber": 1,
      "waitingCount": 5,
      "currentPatient": {
        "queueNumber": 2,
        "name": "خالد حسن"
      }
    }
  ]
}
```

---

### **GET** `/api/stats/station/:stationId`
إحصائيات محطة معينة

**Response:**
```json
{
  "success": true,
  "station": {
    "id": 1,
    "name": "الاستقبال",
    "displayNumber": 1,
    "waitingCount": 5,
    "servedToday": 25,
    "avgServiceTime": 8
  }
}
```

---

### **GET** `/api/stats/overview`
نظرة عامة شاملة

**Response:**
```json
{
  "success": true,
  "overview": {
    "today": {
      "completed": 45,
      "active": 8,
      "cancelled": 2
    },
    "thisWeek": {
      "completed": 320,
      "avgPerDay": 53
    },
    "avgTimes": {
      "waiting": 15,
      "service": 10,
      "total": 35
    }
  }
}
```

---

## 5️⃣ الشاشة العامة (Display)

### **GET** `/api/stations/display/recent-calls?limit=10`
آخر الاستدعاءات للشاشة العامة

**Query Parameters:**
- `limit` - عدد الاستدعاءات (افتراضي: 10)

**Response:**
```json
{
  "success": true,
  "calls": [
    {
      "queueNumber": 5,
      "displayNumber": 1,
      "stationName": "الاستقبال",
      "calledAt": "2025-01-15T09:05:00.000Z",
      "status": "CALLED"
    }
  ]
}
```

---

### **GET** `/api/stations/display/screen-data`
بيانات الشاشة العامة منسقة

**Response:**
```json
{
  "success": true,
  "display": [
    {
      "queueNumber": 5,
      "displayNumber": 1,
      "stationName": "الاستقبال",
      "calledAt": "2025-01-15T09:05:00.000Z",
      "status": "CALLED"
    }
  ]
}
```

---

## 6️⃣ WebSocket Events

### **الاتصال:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
```

### **الاشتراك في محطة معينة:**
```javascript
socket.emit('subscribe-station', { stationId: 1 });
```

### **الاشتراك في الشاشة العامة:**
```javascript
socket.emit('subscribe-display');
```

### **استقبال الأحداث:**
```javascript
// عند استدعاء مريض
socket.on('patient-called', (data) => {
  console.log('Patient called:', data);
  // { queueNumber, displayNumber, stationName }
});

// عند تحديث قائمة الانتظار
socket.on('waiting-list-updated', (data) => {
  console.log('Waiting list updated:', data);
  // { stationId, waitingList }
});

// عند إنهاء خدمة مريض
socket.on('patient-completed', (data) => {
  console.log('Patient completed:', data);
  // { queueNumber, stationId }
});

// عند تحديث الشاشة العامة
socket.on('display-updated', (data) => {
  console.log('Display updated:', data);
  // { calls: [...] }
});
```

---

## 📊 أكواد الأخطاء

| الكود | الوصف |
|------|-------|
| 200 | نجاح العملية |
| 201 | تم الإنشاء بنجاح |
| 400 | خطأ في البيانات المرسلة |
| 404 | العنصر غير موجود |
| 409 | تعارض في البيانات |
| 500 | خطأ في الخادم |

---

## 🧪 أمثلة استخدام cURL

### **إنشاء دور جديد:**
```bash
curl -X POST http://localhost:3001/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phoneNumber": "0501234567",
    "priority": 0
  }'
```

### **استدعاء المريض التالي:**
```bash
curl -X POST http://localhost:3001/api/stations/1/call-next \
  -H "Content-Type: application/json" \
  -d '{
    "calledBy": "موظف الاستقبال"
  }'
```

### **الحصول على قائمة الانتظار:**
```bash
curl http://localhost:3001/api/stations/1/waiting-list
```

### **إحصائيات اليوم:**
```bash
curl http://localhost:3001/api/stats/today
```

---

## ✅ ملخص الملفات المنشأة

### **Controllers:**
- ✅ `src/controllers/patient.controller.ts` - 4 دوال
- ✅ `src/controllers/queue.controller.ts` - 6 دوال
- ✅ `src/controllers/station.controller.ts` - 14 دالة
- ✅ `src/controllers/stats.controller.ts` - 4 دوال

### **Routes:**
- ✅ `src/routes/patient.routes.ts` - 4 endpoints
- ✅ `src/routes/queue.routes.ts` - 6 endpoints
- ✅ `src/routes/station.routes.ts` - 12 endpoints
- ✅ `src/routes/stats.routes.ts` - 4 endpoints

### **Services (محدثة):**
- ✅ `src/services/patient.service.ts` - مع exports
- ✅ `src/services/queue.service.ts` - مع exports
- ✅ `src/services/station.service.ts` - مع exports
- ✅ `src/services/stats.service.ts` - مع exports

### **Main Server:**
- ✅ `src/index.ts` - مع جميع الـ routes و WebSocket

---

## 🚀 تشغيل المشروع

```bash
# تثبيت المكتبات
npm install

# تشغيل الخادم في وضع التطوير
npm run dev

# الخادم سيعمل على
# http://localhost:3001
```

---

## 📝 ملاحظات مهمة

1. ✅ جميع الـ Controllers تتبع نفس النمط والمنطق
2. ✅ جميع الـ Routes منظمة ومرتبة
3. ✅ جميع الـ Services لها exports صحيحة
4. ✅ لا توجد أخطاء في الـ TypeScript
5. ✅ WebSocket جاهز للتحديثات اللحظية
6. ✅ التوثيق شامل وواضح

---

**تم إنشاء النظام بنجاح! 🎉**

