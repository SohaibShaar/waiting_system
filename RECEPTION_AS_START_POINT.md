# 🎯 الاستقبال كنقطة البداية

## التعديل الجديد

تم تعديل النظام ليجعل **محطة الاستقبال** هي **نقطة البداية** للنظام بالكامل.

---

## ⚡ الفرق الأساسي

### قبل التعديل
```
1. إنشاء دور يدوياً (POST /api/queue/create)
2. استدعاء المريض في الاستقبال
3. حفظ بيانات الاستقبال
4. استدعاء المريض التالي
```

### بعد التعديل ✅
```
1. إدخال بيانات الاستقبال مباشرة (POST /api/reception)
   ↓
   ✅ إنشاء مريض جديد تلقائياً (باسم الذكر ورقمه الوطني)
   ↓
   ✅ إنشاء دور جديد تلقائياً
   ↓
   ✅ حفظ بيانات الاستقبال
   ↓
   ✅ إظهاره على الشاشة مباشرة
```

---

## 📝 كيفية الاستخدام

### الطريقة الجديدة (موصى بها)

#### 1. إدخال بيانات الاستقبال مباشرة
```bash
POST http://localhost:3001/api/reception
Content-Type: application/json

{
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
  "phoneNumber": "0501234567",  // اختياري
  "notes": "ملاحظات",           // اختياري
  "priority": 0                  // اختياري
}
```

#### 2. النتيجة
```json
{
  "success": true,
  "message": "تم إنشاء المريض والدور وحفظ بيانات الاستقبال بنجاح",
  "patient": {
    "id": 1,
    "name": "أحمد محمد",
    "nationalId": "1234567890",
    "phoneNumber": "0501234567"
  },
  "queue": {
    "id": 1,
    "queueNumber": 1,
    "patientId": 1,
    "currentStationId": 1,
    "status": "ACTIVE"
  },
  "queueNumber": 1,
  "receptionData": {
    "id": 1,
    "queueId": 1,
    "patientId": 1,
    "maleName": "أحمد",
    ...
  }
}
```

---

## 🔄 سير العمل الكامل

### المريض الأول
```
1. موظف الاستقبال يدخل البيانات
   POST /api/reception
   ↓
2. النظام يُنشئ:
   ✅ مريض جديد (أحمد محمد - 1234567890)
   ✅ دور جديد (#1)
   ✅ بيانات الاستقبال
   ↓
3. يظهر على الشاشة: "الدور #1 → الشاشة 1"
   ↓
4. المريض ينتقل للمختبر
   POST /api/lab (مع استدعاء التالي)
   ↓
5. المريض ينتقل للطبيب
   POST /api/doctor (مع استدعاء التالي)
```

### المريض الثاني
```
1. موظف الاستقبال يدخل بيانات المريض الثاني
   POST /api/reception
   ↓
2. يُنشأ دور #2 تلقائياً
   ↓
3. وهكذا...
```

---

## ✨ الميزات

### 1. إنشاء تلقائي للمريض
- يتم إنشاء المريض باسم الذكر ورقمه الوطني
- لا حاجة لإنشاء المريض يدوياً

### 2. إنشاء تلقائي للدور
- يتم قطع دور جديد تلقائياً
- رقم الدور يزيد تلقائياً (1, 2, 3, ...)

### 3. ظهور مباشر على الشاشة
- يظهر الدور الجديد على الشاشة مباشرة
- حالة CALLED (تم الاستدعاء)

### 4. بيانات شاملة
- حفظ بيانات كاملة للزوجين
- رقم الهاتف (اختياري)
- الملاحظات (اختيارية)
- الأولوية (اختيارية)

---

## 📋 الحقول المطلوبة

### حقول إلزامية ✅
```typescript
{
  maleName: string;           // اسم الذكر
  maleLastName: string;       // اسم العائلة للذكر
  maleFatherName: string;     // اسم الأب للذكر
  maleBirthDate: Date;        // تاريخ ميلاد الذكر
  maleNationalId: string;     // الرقم الوطني للذكر
  maleAge: number;            // عمر الذكر
  
  femaleName: string;         // اسم الأنثى
  femaleLastName: string;     // اسم العائلة للأنثى
  femaleFatherName: string;   // اسم الأب للأنثى
  femaleBirthDate: Date;      // تاريخ ميلاد الأنثى
  femaleNationalId: string;   // الرقم الوطني للأنثى
  femaleAge: number;          // عمر الأنثى
}
```

### حقول اختيارية
```typescript
{
  phoneNumber?: string;       // رقم الهاتف
  notes?: string;             // ملاحظات
  priority?: number;          // الأولوية (0 = عادي)
}
```

---

## 🔧 التفاصيل التقنية

### ما يحدث داخلياً

```typescript
// 1. إنشاء المريض
const patient = await prisma.patient.create({
  name: `${maleName} ${maleLastName}`,
  nationalId: maleNationalId,
  phoneNumber: phoneNumber // اختياري
});

// 2. قطع دور جديد
const queueNumber = lastNumber + 1;

const queue = await prisma.queue.create({
  queueNumber: queueNumber,
  patientId: patient.id,
  currentStationId: firstStation.id,
  status: "ACTIVE"
});

// 3. إنشاء سجل في QueueHistory (حالة CALLED)
await prisma.queueHistory.create({
  queueId: queue.id,
  stationId: firstStation.id,
  status: "CALLED",
  calledAt: new Date()
});

// 4. حفظ بيانات الاستقبال
const receptionData = await prisma.receptionData.create({
  queueId: queue.id,
  patientId: patient.id,
  maleName, maleLastName, ...
});

// 5. إرسال للشاشات
emitPatientCalled({
  queueNumber,
  displayNumber,
  stationId,
  calledAt
});
```

---

## 🎯 مثال عملي كامل

### الخطوة 1: إدخال بيانات الاستقبال للمريض الأول
```bash
curl -X POST http://localhost:3001/api/reception \
  -H "Content-Type: application/json" \
  -d '{
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
    "phoneNumber": "0501234567"
  }'
```

**النتيجة:**
- ✅ تم إنشاء المريض: أحمد محمد (1234567890)
- ✅ تم إنشاء الدور #1
- ✅ ظهر على الشاشة مباشرة

### الخطوة 2: الانتقال للمختبر
```bash
# بعد الانتهاء من الاستقبال
POST http://localhost:3001/api/stations/1/complete-service
{
  "queueId": 1
}

# في المختبر: استدعاء المريض
POST http://localhost:3001/api/stations/2/call-next

# حفظ بيانات المختبر (يستدعي التالي تلقائياً)
POST http://localhost:3001/api/lab
{
  "queueId": 1,
  "patientId": 1,
  "isMaleHealthy": "HEALTHY",
  "isFemaleHealthy": "HEALTHY"
}
```

### الخطوة 3: الانتقال للطبيب
```bash
# الانتقال للطبيب
POST http://localhost:3001/api/stations/2/complete-service
{
  "queueId": 1
}

# عند الطبيب: استدعاء
POST http://localhost:3001/api/stations/3/call-next

# حفظ بيانات الطبيب (يستدعي التالي تلقائياً)
POST http://localhost:3001/api/doctor
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

### الخطوة 4: إدخال المريض الثاني (من الاستقبال)
```bash
POST http://localhost:3001/api/reception
{
  "maleName": "خالد",
  "maleLastName": "أحمد",
  ...
}
```

**النتيجة:**
- ✅ تم إنشاء دور #2 تلقائياً
- ✅ ظهر على الشاشة

---

## 🆚 الفرق بين الطريقتين

### الطريقة القديمة (لا تزال متاحة)
```bash
# 1. إنشاء دور يدوياً
POST /api/queue/create
{
  "name": "أحمد محمد",
  "phoneNumber": "0501234567",
  "nationalId": "1234567890"
}

# 2. استدعاء في الاستقبال
POST /api/stations/1/call-next

# 3. حفظ بيانات الاستقبال
POST /api/reception
{
  "queueId": 1,
  "patientId": 1,
  "maleName": "أحمد",
  ...
}
```

### الطريقة الجديدة ✅ (موصى بها)
```bash
# خطوة واحدة فقط!
POST /api/reception
{
  "maleName": "أحمد",
  "maleLastName": "محمد",
  ...
}
```

---

## ✅ الفوائد

1. **سهولة الاستخدام**
   - خطوة واحدة بدلاً من ثلاث خطوات

2. **تقليل الأخطاء**
   - لا حاجة لتتبع queueId و patientId

3. **سرعة أكبر**
   - إنشاء تلقائي للمريض والدور

4. **تجربة أفضل**
   - موظف الاستقبال يدخل البيانات مرة واحدة فقط

---

## 📌 ملاحظات مهمة

⚠️ **الاستقبال الآن هو نقطة البداية:**
- لا حاجة لـ `POST /api/queue/create` عند استخدام الاستقبال
- المريض يُنشأ تلقائياً من بيانات الذكر
- الدور يُنشأ تلقائياً ويظهر على الشاشة

⚠️ **في المحطات الأخرى (Lab & Doctor):**
- يتم استدعاء المريض التالي تلقائياً بعد حفظ البيانات
- كما هو مطلوب في التعديل السابق

---

## 🎉 الخلاصة

✅ **الاستقبال = نقطة البداية**
- إدخال بيانات → إنشاء مريض ودور جديد تلقائياً

✅ **المختبر والطبيب = استدعاء تلقائي**
- حفظ بيانات → استدعاء المريض التالي تلقائياً

✅ **نظام متكامل وسلس**
- من الاستقبال حتى إنهاء الفحص الطبي

---

**تاريخ التحديث:** 2025-10-12  
**الإصدار:** 2.1.0

