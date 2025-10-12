# ملخص التعديلات على النظام

## نظرة عامة
تم تعديل النظام ليعمل بشكل تلقائي حيث يتم استدعاء المريض التالي فوراً بعد حفظ البيانات في كل محطة (الاستقبال، المختبر، الطبيب).

---

## الملفات الجديدة

### 📁 Services (الخدمات)

1. **`src/services/reception.service.ts`**
   - `createReceptionData()` - إضافة بيانات الاستقبال مع استدعاء المريض التالي تلقائياً
   - `getReceptionDataByQueueId()` - الحصول على بيانات الاستقبال
   - `updateReceptionData()` - تحديث بيانات الاستقبال

2. **`src/services/lab.service.ts`**
   - `createLabData()` - إضافة بيانات المختبر مع استدعاء المريض التالي تلقائياً
   - `getLabDataByQueueId()` - الحصول على بيانات المختبر
   - `updateLabData()` - تحديث بيانات المختبر

3. **`src/services/doctor.service.ts`**
   - `createDoctorData()` - إضافة بيانات الطبيب مع استدعاء المريض التالي تلقائياً
   - `getDoctorDataByQueueId()` - الحصول على بيانات الطبيب
   - `updateDoctorData()` - تحديث بيانات الطبيب

### 📁 Controllers (المتحكمات)

1. **`src/controllers/reception.controller.ts`**
   - `addReceptionData()` - POST /api/reception
   - `getReceptionData()` - GET /api/reception/:queueId
   - `updateReceptionDataController()` - PUT /api/reception/:queueId

2. **`src/controllers/lab.controller.ts`**
   - `addLabData()` - POST /api/lab
   - `getLabData()` - GET /api/lab/:queueId
   - `updateLabDataController()` - PUT /api/lab/:queueId

3. **`src/controllers/doctor.controller.ts`**
   - `addDoctorData()` - POST /api/doctor
   - `getDoctorData()` - GET /api/doctor/:queueId
   - `updateDoctorDataController()` - PUT /api/doctor/:queueId

### 📁 Routes (المسارات)

1. **`src/routes/reception.routes.ts`** - مسارات الاستقبال
2. **`src/routes/lab.routes.ts`** - مسارات المختبر
3. **`src/routes/doctor.routes.ts`** - مسارات الطبيب

---

## الملفات المُعدّلة

### 📄 `src/index.ts`
- إضافة استيراد المسارات الجديدة:
  ```typescript
  import receptionRoutes from "./routes/reception.routes";
  import labRoutes from "./routes/lab.routes";
  import doctorRoutes from "./routes/doctor.routes";
  ```

- إضافة المسارات إلى التطبيق:
  ```typescript
  app.use("/api/reception", receptionRoutes);
  app.use("/api/lab", labRoutes);
  app.use("/api/doctor", doctorRoutes);
  ```

- تحديث قائمة Endpoints في الصفحة الرئيسية

### 📄 `tsconfig.json`
- إضافة `"esModuleInterop": true`
- إضافة `"allowSyntheticDefaultImports": true`

---

## آلية العمل الجديدة

### 🔄 سير العمل التلقائي

#### 1. محطة الاستقبال
```
POST /api/reception
  ↓
حفظ بيانات الزوجين
  ↓
استدعاء المريض التالي تلقائياً (callNextPatient)
  ↓
إرسال حدث WebSocket للشاشات (emitPatientCalled)
  ↓
تحديث الشاشات (emitScreenDataUpdate)
```

#### 2. محطة المختبر
```
POST /api/lab
  ↓
حفظ نتائج الفحص (سليم/غير سليم)
  ↓
استدعاء المريض التالي تلقائياً (callNextPatient)
  ↓
إرسال حدث WebSocket للشاشات (emitPatientCalled)
  ↓
تحديث الشاشات (emitScreenDataUpdate)
```

#### 3. محطة الطبيب
```
POST /api/doctor
  ↓
حفظ بيانات الطبيب (فصائل الدم وحالات الأمراض)
  ↓
استدعاء المريض التالي تلقائياً (callNextPatient)
  ↓
إرسال حدث WebSocket للشاشات (emitPatientCalled)
  ↓
تحديث الشاشات (emitScreenDataUpdate)
```

---

## الميزات الجديدة

✅ **استدعاء تلقائي**: لا حاجة للضغط على زر استدعاء المريض التالي، يتم تلقائياً عند الحفظ

✅ **إشعارات فورية**: يتم إرسال الإشعارات للشاشات فوراً عبر WebSocket

✅ **تتبع كامل**: كل عملية حفظ تُسجل وتُربط بالدور (Queue)

✅ **بيانات شاملة**: يتم حفظ بيانات تفصيلية لكل من الزوجين في كل محطة

✅ **معالجة أخطاء**: التحقق من صحة البيانات قبل الحفظ

---

## نماذج البيانات

### Reception Data
```typescript
{
  queueId: number;
  patientId: number;
  maleName: string;
  maleLastName: string;
  maleFatherName: string;
  maleBirthDate: Date;
  maleNationalId: string;
  maleAge: number;
  femaleName: string;
  femaleLastName: string;
  femaleFatherName: string;
  femaleBirthDate: Date;
  femaleNationalId: string;
  femaleAge: number;
  notes?: string;
}
```

### Lab Data
```typescript
{
  queueId: number;
  patientId: number;
  doctorName?: string;
  isMaleHealthy: "HEALTHY" | "UNHEALTHY";
  isFemaleHealthy: "HEALTHY" | "UNHEALTHY";
  maleNotes?: string;
  femaleNotes?: string;
  notes?: string;
}
```

### Doctor Data
```typescript
{
  queueId: number;
  patientId: number;
  maleBloodType?: string;
  femaleBloodType?: string;
  maleHIVstatus: "POSITIVE" | "NEGATIVE";
  femaleHIVstatus: "POSITIVE" | "NEGATIVE";
  maleHBSstatus: "POSITIVE" | "NEGATIVE";
  femaleHBSstatus: "POSITIVE" | "NEGATIVE";
  maleHBCstatus: "POSITIVE" | "NEGATIVE";
  femaleHBCstatus: "POSITIVE" | "NEGATIVE";
  maleNotes?: string;
  femaleNotes?: string;
  notes?: string;
}
```

---

## WebSocket Events

### 📡 `patient-called`
يُرسل عند استدعاء مريض جديد تلقائياً
```json
{
  "queueNumber": 2,
  "displayNumber": 1,
  "stationId": 1,
  "calledAt": "2025-10-12T10:30:00.000Z"
}
```

### 📡 `screen-data-updated`
يُرسل لتحديث بيانات الشاشة بعد كل عملية

---

## كيفية الاستخدام

### مثال: سير عمل مريض كامل

#### 1. إنشاء دور جديد
```bash
POST http://localhost:3001/api/queue/create
Content-Type: application/json

{
  "name": "أحمد محمد",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890"
}
```

#### 2. في محطة الاستقبال: استدعاء وحفظ البيانات
```bash
# استدعاء المريض
POST http://localhost:3001/api/stations/1/call-next
Content-Type: application/json

{
  "calledBy": "موظف الاستقبال"
}

# حفظ بيانات الاستقبال (يستدعي التالي تلقائياً)
POST http://localhost:3001/api/reception
Content-Type: application/json

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
  "femaleAge": 27
}
```

#### 3. في محطة المختبر: حفظ البيانات (يستدعي التالي تلقائياً)
```bash
POST http://localhost:3001/api/lab
Content-Type: application/json

{
  "queueId": 1,
  "patientId": 1,
  "isMaleHealthy": "HEALTHY",
  "isFemaleHealthy": "HEALTHY",
  "doctorName": "د. محمد أحمد"
}
```

#### 4. في محطة الطبيب: حفظ البيانات (يستدعي التالي تلقائياً)
```bash
POST http://localhost:3001/api/doctor
Content-Type: application/json

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
  "femaleHBCstatus": "NEGATIVE"
}
```

---

## الملفات التوثيقية

- **`API_USAGE_GUIDE.md`** - دليل استخدام كامل للـ API
- **`CHANGES_SUMMARY.md`** - هذا الملف

---

## ملاحظات مهمة

⚠️ **الاستدعاء التلقائي**: يحدث فقط عند **حفظ البيانات** (POST)، وليس عند التحديث (PUT)

⚠️ **الحقول المطلوبة**: جميع الحقول الأساسية مطلوبة، والملاحظات اختيارية

⚠️ **التحقق من البيانات**: يتم التحقق من صحة القيم (مثل HEALTHY/UNHEALTHY) قبل الحفظ

⚠️ **WebSocket**: يجب الاتصال بـ WebSocket لتلقي التحديثات في الوقت الفعلي

---

## الخطوات التالية للتطوير

1. ✅ تم: إنشاء Services و Controllers و Routes
2. ✅ تم: دمج الاستدعاء التلقائي في كل محطة
3. ✅ تم: إضافة WebSocket للإشعارات الفورية
4. 🔄 يُنصح به: اختبار النظام بالكامل
5. 🔄 يُنصح به: إضافة Unit Tests
6. 🔄 يُنصح به: إضافة Validation Middleware
7. 🔄 يُنصح به: إنشاء واجهة أمامية لكل محطة

---

## اتصل بالمطور

للأسئلة والدعم، الرجاء الرجوع إلى ملف `API_USAGE_GUIDE.md` للحصول على تفاصيل أكثر.

