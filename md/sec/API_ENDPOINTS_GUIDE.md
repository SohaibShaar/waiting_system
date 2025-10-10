# 🚀 دليل API Endpoints لنظام إدارة الأدوار

## 📋 نظرة عامة

هذا الدليل يوضح جميع الـ API endpoints المطلوبة لتطبيق نظام إدارة الأدوار.

---

## 🏗️ بنية الـ URLs

```
Base URL: http://localhost:3000/api

/api/system     - إعدادات النظام
/api/patients   - إدارة المرضى
/api/queue      - إدارة الأدوار
/api/stations   - إدارة المحطات
/api/display    - الشاشة العامة
/api/stats      - الإحصائيات
```

---

## 1️⃣ إعدادات النظام

### **POST** `/api/system/initialize`
**الوصف:** إعداد النظام للمرة الأولى (إنشاء المحطات والإعدادات)

**Request Body:**
```json
{
  "stations": [
    {
      "name": "الاستقبال",
      "displayNumber": 1,
      "order": 1,
      "description": "تسجيل بيانات المريض"
    },
    {
      "name": "الفحص الأولي",
      "displayNumber": 2,
      "order": 2,
      "description": "قياس الضغط والحرارة"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إعداد النظام بنجاح",
  "stations": [...]
}
```

### **POST** `/api/system/reset-queue-numbers`
**الوصف:** إعادة تعيين أرقام الأدوار (يومياً)

**Response:**
```json
{
  "success": true,
  "message": "تم إعادة تعيين أرقام الأدوار"
}
```

---

## 2️⃣ إدارة المرضى

### **POST** `/api/patients`
**الوصف:** إنشاء مريض جديد أو تحديث بياناته

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

### **GET** `/api/patients/:id`
**الوصف:** الحصول على بيانات مريض معين

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

### **GET** `/api/patients/search?phone=0501234567`
**الوصف:** البحث عن مريض برقم الهاتف أو الهوية

**Query Parameters:**
- `phone` - رقم الهاتف
- `nationalId` - رقم الهوية

**Response:**
```json
{
  "success": true,
  "patient": {...}
}
```

### **GET** `/api/patients/:id/history`
**الوصف:** تاريخ زيارات المريض

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

## 3️⃣ إدارة الأدوار

### **POST** `/api/queue/create`
**الوصف:** إنشاء دور جديد للمريض

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
  }
}
```

### **GET** `/api/queue/active`
**الوصف:** الحصول على جميع الأدوار النشطة

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
  ]
}
```

### **GET** `/api/queue/:id`
**الوصف:** الحصول على تفاصيل دور معين

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
        "station": "الاستقبال",
        "status": "COMPLETED",
        "calledAt": "...",
        "startedAt": "...",
        "completedAt": "..."
      }
    ]
  }
}
```

### **PUT** `/api/queue/:id/priority`
**الوصف:** تغيير أولوية دور

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
  "message": "تم تغيير الأولوية"
}
```

### **DELETE** `/api/queue/:id/cancel`
**الوصف:** إلغاء دور

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

## 4️⃣ المحطات - إدارة الأدوار

### **GET** `/api/stations/:stationId/waiting-list`
**الوصف:** قائمة المرضى المنتظرين لمحطة معينة

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
      "waitingTime": 5
    },
    {
      "queueNumber": 4,
      "patient": {
        "name": "فاطمة علي"
      },
      "priority": 0,
      "waitingTime": 3
    }
  ],
  "count": 2
}
```

### **GET** `/api/stations/:stationId/current`
**الوصف:** المريض الحالي في المحطة

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
    "startedAt": "2025-01-15T09:10:00.000Z"
  }
}
```

### **POST** `/api/stations/:stationId/call-next`
**الوصف:** استدعاء المريض التالي

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
  "queue": {
    "queueNumber": 3,
    "patient": {
      "name": "أحمد محمد"
    },
    "displayNumber": 1
  },
  "message": "تم استدعاء الدور #3"
}
```

### **POST** `/api/stations/:stationId/call-specific`
**الوصف:** استدعاء دور محدد بالرقم

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
  "message": "تم استدعاء الدور #5"
}
```

### **POST** `/api/stations/:stationId/start-service`
**الوصف:** بدء تقديم الخدمة

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

### **POST** `/api/stations/:stationId/complete-service`
**الوصف:** إنهاء الخدمة والانتقال للمحطة التالية

**Request Body:**
```json
{
  "queueId": 5,
  "notes": "تم الفحص بنجاح"
}
```

**Response:**
```json
{
  "success": true,
  "moved": true,
  "nextStation": {
    "id": 2,
    "name": "الفحص الأولي",
    "displayNumber": 2
  },
  "message": "انتهت الخدمة - انتقل للمحطة التالية"
}
```

**أو عند الانتهاء الكلي:**
```json
{
  "success": true,
  "moved": false,
  "completed": true,
  "message": "انتهى الدور بالكامل",
  "visitSummary": {
    "totalDuration": 45,
    "waitingTime": 20,
    "serviceTime": 25
  }
}
```

### **POST** `/api/stations/:stationId/skip-patient`
**الوصف:** تخطي المريض الحالي

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

## 5️⃣ الشاشة العامة

### **GET** `/api/display/recent-calls`
**الوصف:** آخر الاستدعاءات للعرض على الشاشة

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
    },
    {
      "queueNumber": 3,
      "displayNumber": 2,
      "stationName": "الفحص الأولي",
      "calledAt": "2025-01-15T09:03:00.000Z",
      "status": "IN_PROGRESS"
    }
  ]
}
```

### **GET** `/api/display/screen-data`
**الوصف:** بيانات الشاشة العامة منسقة

**Response:**
```json
{
  "success": true,
  "display": [
    {
      "queueNumber": 5,
      "displayNumber": 1,
      "message": "الدور 5 → الشاشة 1"
    },
    {
      "queueNumber": 3,
      "displayNumber": 2,
      "message": "الدور 3 → الشاشة 2"
    }
  ]
}
```

---

## 6️⃣ الإحصائيات

### **GET** `/api/stats/today`
**الوصف:** إحصائيات اليوم

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

### **GET** `/api/stats/stations`
**الوصف:** إحصائيات جميع المحطات

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
    },
    {
      "id": 2,
      "name": "الفحص الأولي",
      "displayNumber": 2,
      "waitingCount": 3,
      "currentPatient": null
    }
  ]
}
```

### **GET** `/api/stats/station/:stationId`
**الوصف:** إحصائيات محطة معينة

**Response:**
```json
{
  "success": true,
  "station": {
    "id": 1,
    "name": "الاستقبال",
    "waitingCount": 5,
    "servedToday": 25,
    "avgServiceTime": 8
  }
}
```

### **GET** `/api/stats/overview`
**الوصف:** نظرة عامة شاملة

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

## 7️⃣ إدارة المحطات

### **GET** `/api/stations`
**الوصف:** قائمة جميع المحطات

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

### **POST** `/api/stations`
**الوصف:** إنشاء محطة جديدة

**Request Body:**
```json
{
  "name": "الصيدلية",
  "displayNumber": 4,
  "order": 4,
  "description": "صرف الأدوية"
}
```

### **PUT** `/api/stations/:id`
**الوصف:** تحديث بيانات محطة

**Request Body:**
```json
{
  "name": "الصيدلية المركزية",
  "isActive": true
}
```

### **DELETE** `/api/stations/:id`
**الوصف:** حذف محطة (فقط إذا لم تكن نشطة)

---

## 🔄 WebSocket Events

### **للتحديثات اللحظية:**

```javascript
// الاتصال
const socket = io('http://localhost:3000');

// الاشتراك في تحديثات محطة معينة
socket.emit('subscribe-station', { stationId: 1 });

// استقبال الأحداث
socket.on('patient-called', (data) => {
  // { queueNumber, displayNumber, stationName }
});

socket.on('waiting-list-updated', (data) => {
  // { stationId, waitingList }
});

socket.on('patient-completed', (data) => {
  // { queueNumber, stationId }
});

socket.on('display-updated', (data) => {
  // { calls: [...] }
});
```

---

## 📊 أكواد الأخطاء

```
200 - نجاح العملية
201 - تم الإنشاء بنجاح
400 - خطأ في البيانات المرسلة
404 - العنصر غير موجود
409 - تعارض في البيانات
500 - خطأ في الخادم
```

---

## 🧪 أمثلة استخدام cURL

### **إنشاء دور جديد:**
```bash
curl -X POST http://localhost:3000/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phoneNumber": "0501234567",
    "priority": 0
  }'
```

### **استدعاء المريض التالي:**
```bash
curl -X POST http://localhost:3000/api/stations/1/call-next \
  -H "Content-Type: application/json" \
  -d '{
    "calledBy": "موظف الاستقبال"
  }'
```

### **الحصول على قائمة الانتظار:**
```bash
curl http://localhost:3000/api/stations/1/waiting-list
```

### **إحصائيات اليوم:**
```bash
curl http://localhost:3000/api/stats/today
```

---

## 🔐 المصادقة (Authentication)

**للإصدارات المستقبلية:**

```javascript
// إضافة JWT Token في الـ header
headers: {
  'Authorization': 'Bearer <token>',
  'Content-Type': 'application/json'
}
```

---

## 📱 أمثلة استخدام JavaScript/TypeScript

### **إنشاء دور:**
```typescript
async function createQueue(patientData) {
  const response = await fetch('/api/queue/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  
  const data = await response.json();
  return data;
}
```

### **استدعاء مريض:**
```typescript
async function callNext(stationId: number) {
  const response = await fetch(`/api/stations/${stationId}/call-next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calledBy: 'موظف 1' })
  });
  
  return await response.json();
}
```

### **الحصول على قائمة الانتظار:**
```typescript
async function getWaitingList(stationId: number) {
  const response = await fetch(`/api/stations/${stationId}/waiting-list`);
  return await response.json();
}
```

---

## 🎯 ملاحظات مهمة

1. ✅ جميع التواريخ بصيغة ISO 8601
2. ✅ الأوقات بالدقائق
3. ✅ الاستجابات دائماً تحتوي على `success: true/false`
4. ✅ في حالة الخطأ، الرسالة في `error` أو `message`
5. ✅ استخدم WebSocket للتحديثات اللحظية
6. ✅ أرقام الأدوار تُعاد تلقائياً يومياً

---

**تم إعداد هذا الدليل لمساعدتك في بناء الـ API** 🚀

