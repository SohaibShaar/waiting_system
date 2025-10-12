# دليل استخدام النظام المحدث

## نظرة عامة
تم تحديث النظام ليعمل بشكل تلقائي حيث يتم استدعاء المريض التالي فوراً بعد حفظ البيانات في كل محطة.

---

## سير العمل التلقائي

### 1. محطة الاستقبال (Reception)
**عند إضافة بيانات الاستقبال:**
- يتم حفظ بيانات الزوجين
- يتم استدعاء المريض التالي **تلقائياً**
- يتم إرسال البيانات للشاشات عبر WebSocket

**Endpoint:**
```
POST /api/reception
```

**Request Body:**
```json
{
  "queueId": 1,
  "patientId": 1,
  "maleName": "أحمد",
  "maleLastName": "محمد",
  "maleFatherName": "علي",
  "maleBirthDate": "1995-01-15",
  "maleNationalId": "1234567890",
  "maleAge": 29,
  "femaleName": "فاطمة",
  "femaleLastName": "حسن",
  "femaleFatherName": "خالد",
  "femaleBirthDate": "1997-03-20",
  "femaleNationalId": "0987654321",
  "femaleAge": 27,
  "notes": "ملاحظات اختيارية"
}
```

**Response:**
```json
{
  "success": true,
  "receptionData": {
    "id": 1,
    "queueId": 1,
    "patientId": 1,
    "maleName": "أحمد",
    ...
  },
  "nextPatient": {
    "success": true,
    "queue": {...},
    "queueNumber": 2,
    "displayNumber": 1
  },
  "message": "تم حفظ بيانات الاستقبال واستدعاء المريض التالي"
}
```

---

### 2. محطة المختبر (Lab)
**عند إضافة بيانات المختبر:**
- يتم حفظ حالة الفحص الطبي (سليم/غير سليم) لكل من الزوجين
- يتم استدعاء المريض التالي **تلقائياً**
- يتم إرسال البيانات للشاشات عبر WebSocket

**Endpoint:**
```
POST /api/lab
```

**Request Body:**
```json
{
  "queueId": 1,
  "patientId": 1,
  "doctorName": "د. محمد أحمد",
  "isMaleHealthy": "HEALTHY",
  "isFemaleHealthy": "HEALTHY",
  "maleNotes": "ملاحظات على الزوج",
  "femaleNotes": "ملاحظات على الزوجة",
  "notes": "ملاحظات عامة"
}
```

**القيم المسموحة:**
- `isMaleHealthy` و `isFemaleHealthy`: `"HEALTHY"` أو `"UNHEALTHY"`

**Response:**
```json
{
  "success": true,
  "labData": {
    "id": 1,
    "queueId": 1,
    "patientId": 1,
    "doctorName": "د. محمد أحمد",
    "isMaleHealthy": "HEALTHY",
    "isFemaleHealthy": "HEALTHY",
    ...
  },
  "nextPatient": {
    "success": true,
    "queue": {...},
    "queueNumber": 2,
    "displayNumber": 2
  },
  "message": "تم حفظ بيانات المختبر واستدعاء المريض التالي"
}
```

---

### 3. محطة الطبيب (Doctor)
**عند إضافة بيانات الطبيب:**
- يتم حفظ فصيلة الدم وحالات الأمراض لكل من الزوجين
- يتم استدعاء المريض التالي **تلقائياً**
- يتم إرسال البيانات للشاشات عبر WebSocket

**Endpoint:**
```
POST /api/doctor
```

**Request Body:**
```json
{
  "queueId": 1,
  "patientId": 1,
  "maleBloodType": "O+",
  "femaleBloodType": "A+",
  "maleHIVstatus": "NEGATIVE",
  "femaleHIVstatus": "NEGATIVE",
  "maleHBSstatus": "NEGATIVE",
  "femaleHBSstatus": "NEGATIVE",
  "maleHBCstatus": "NEGATIVE",
  "femaleHBCstatus": "NEGATIVE",
  "maleNotes": "ملاحظات على الزوج",
  "femaleNotes": "ملاحظات على الزوجة",
  "notes": "ملاحظات عامة"
}
```

**القيم المسموحة:**
- جميع حالات الأمراض: `"POSITIVE"` أو `"NEGATIVE"`
- فصائل الدم: أي نص (مثل: "O+", "A+", "B-", إلخ)

**Response:**
```json
{
  "success": true,
  "doctorData": {
    "id": 1,
    "queueId": 1,
    "patientId": 1,
    "maleBloodType": "O+",
    "femaleBloodType": "A+",
    "maleHIVstatus": "NEGATIVE",
    ...
  },
  "nextPatient": {
    "success": true,
    "queue": {...},
    "queueNumber": 2,
    "displayNumber": 3
  },
  "message": "تم حفظ بيانات الطبيب واستدعاء المريض التالي"
}
```

---

## Endpoints إضافية

### الحصول على البيانات

#### Reception
```
GET /api/reception/:queueId
```

#### Lab
```
GET /api/lab/:queueId
```

#### Doctor
```
GET /api/doctor/:queueId
```

### تحديث البيانات

#### Reception
```
PUT /api/reception/:queueId
```

#### Lab
```
PUT /api/lab/:queueId
```

#### Doctor
```
PUT /api/doctor/:queueId
```

---

## WebSocket Events

عند حفظ البيانات في أي محطة، يتم إرسال الأحداث التالية:

### 1. `patient-called`
يُرسل عند استدعاء مريض جديد
```json
{
  "queueNumber": 2,
  "displayNumber": 1,
  "stationId": 1,
  "calledAt": "2025-10-12T10:30:00.000Z"
}
```

### 2. `screen-data-updated`
يُرسل لتحديث بيانات الشاشة

---

## مثال على سير العمل الكامل

### 1. إنشاء دور جديد
```bash
POST /api/queue/create
{
  "name": "أحمد محمد",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890",
  "priority": 0
}
```

### 2. استدعاء المريض في الاستقبال
```bash
POST /api/stations/1/call-next
{
  "calledBy": "موظف الاستقبال"
}
```

### 3. حفظ بيانات الاستقبال (يستدعي التالي تلقائياً)
```bash
POST /api/reception
{
  "queueId": 1,
  "patientId": 1,
  "maleName": "أحمد",
  "maleLastName": "محمد",
  ...
}
```

### 4. حفظ بيانات المختبر (يستدعي التالي تلقائياً)
```bash
POST /api/lab
{
  "queueId": 1,
  "patientId": 1,
  "isMaleHealthy": "HEALTHY",
  "isFemaleHealthy": "HEALTHY"
}
```

### 5. حفظ بيانات الطبيب (يستدعي التالي تلقائياً)
```bash
POST /api/doctor
{
  "queueId": 1,
  "patientId": 1,
  "maleHIVstatus": "NEGATIVE",
  "femaleHIVstatus": "NEGATIVE",
  ...
}
```

---

## ملاحظات مهمة

1. **الاستدعاء التلقائي**: يتم تلقائياً عند حفظ البيانات في أي محطة
2. **WebSocket**: يتم إرسال الأحداث للشاشات تلقائياً
3. **الحقول المطلوبة**: جميع الحقول في البيانات الأساسية مطلوبة
4. **الملاحظات**: اختيارية في جميع المحطات
5. **التحقق من البيانات**: يتم التحقق من صحة القيم قبل الحفظ

---

## رموز الحالة

### Status (Lab)
- `HEALTHY` - سليم
- `UNHEALTHY` - غير سليم

### DiseasesStatus (Doctor)
- `POSITIVE` - مصاب
- `NEGATIVE` - غير مصاب

---

## معالجة الأخطاء

جميع الـ endpoints تُرجع نفس صيغة الأخطاء:

```json
{
  "success": false,
  "error": "رسالة الخطأ"
}
```

**رموز الحالة:**
- `200` - نجاح
- `201` - تم الإنشاء بنجاح
- `400` - بيانات غير صحيحة
- `404` - غير موجود
- `500` - خطأ في الخادم

