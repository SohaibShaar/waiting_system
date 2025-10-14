# دليل البدء السريع

## 🚀 تشغيل النظام

### المتطلبات
- Node.js (v18 أو أحدث)
- MySQL Database
- npm أو yarn

### خطوات التشغيل

#### 1. تثبيت الحزم
```bash
npm install
```

#### 2. إعداد قاعدة البيانات
```bash
# تأكد من إنشاء .env وتعيين DATABASE_URL
DATABASE_URL="mysql://user:password@localhost:3306/database_name"

# تشغيل Migrations
npx prisma migrate dev

# (اختياري) تشغيل Seeding
npx prisma db seed
```

#### 3. تشغيل الخادم
```bash
npm run dev
```

الخادم سيعمل على: `http://localhost:3001`

---

## 📡 اختبار النظام

### 1. التحقق من تشغيل الخادم
```bash
curl http://localhost:3001
```

**الاستجابة المتوقعة:**
```json
{
  "message": "🏥 نظام إدارة الأدوار - Queue Management System",
  "version": "1.0.0",
  "endpoints": {
    "patients": "/api/patients",
    "queue": "/api/queue",
    "stations": "/api/stations",
    "stats": "/api/stats",
    "display": "/api/display",
    "reception": "/api/reception",
    "lab": "/api/lab",
    "doctor": "/api/doctor"
  }
}
```

---

## 🧪 اختبار سريع

### الخطوة 1: إنشاء دور جديد
```bash
curl -X POST http://localhost:3001/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "phoneNumber": "0501234567",
    "nationalId": "1234567890"
  }'
```

### الخطوة 2: استدعاء المريض في محطة الاستقبال (محطة رقم 1)
```bash
curl -X POST http://localhost:3001/api/stations/1/call-next \
  -H "Content-Type: application/json" \
  -d '{
    "calledBy": "موظف الاستقبال"
  }'
```

### الخطوة 3: حفظ بيانات الاستقبال (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/reception \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### الخطوة 4: حفظ بيانات المختبر (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/lab \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1,
    "patientId": 1,
    "isMaleHealthy": "HEALTHY",
    "isFemaleHealthy": "HEALTHY",
    "doctorName": "د. محمد أحمد"
  }'
```

### الخطوة 5: حفظ بيانات الطبيب (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/doctor \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

---

## 📊 الـ Endpoints الرئيسية

### إدارة الأدوار
- `POST /api/queue/create` - إنشاء دور جديد
- `GET /api/queue/active` - قائمة الأدوار النشطة
- `GET /api/queue/:id` - تفاصيل دور معين

### المحطات
- `GET /api/stations` - قائمة جميع المحطات
- `POST /api/stations/:stationId/call-next` - استدعاء المريض التالي
- `GET /api/stations/:stationId/waiting-list` - قائمة الانتظار

### بيانات المحطات (جديد)
- `POST /api/reception` - حفظ بيانات الاستقبال + استدعاء تلقائي
- `POST /api/lab` - حفظ بيانات المختبر + استدعاء تلقائي
- `POST /api/doctor` - حفظ بيانات الطبيب + استدعاء تلقائي

### الشاشات
- `GET /api/display/data` - بيانات الشاشة العامة

---

## 🔧 استكشاف الأخطاء

### الخادم لا يبدأ
1. تأكد من تثبيت جميع الحزم: `npm install`
2. تحقق من ملف `.env` والاتصال بقاعدة البيانات
3. تأكد من تشغيل MySQL

### خطأ في قاعدة البيانات
1. تشغيل migrations: `npx prisma migrate dev`
2. تحديث Prisma Client: `npx prisma generate`

### لا يوجد محطات
قم بإنشاء محطات يدوياً:
```bash
curl -X POST http://localhost:3001/api/stations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "الاستقبال",
    "displayNumber": 1,
    "order": 1
  }'
```

---

## 📚 المزيد من التوثيق

- **`API_USAGE_GUIDE.md`** - دليل استخدام كامل للـ API
- **`CHANGES_SUMMARY.md`** - ملخص التعديلات على النظام
- **`md/sec/`** - توثيق تفصيلي للنظام القديم

---

## 💡 نصائح

1. **WebSocket**: للحصول على التحديثات الفورية، اتصل بـ WebSocket على نفس المنفذ
2. **الاستدعاء التلقائي**: يحدث فقط عند POST، وليس PUT
3. **الأولوية**: يمكنك تعيين أولوية للمرضى عند الإنشاء
4. **المحطات**: تأكد من ترتيب المحطات بشكل صحيح (order: 1, 2, 3, ...)

---

## 🎯 الخطوات التالية

1. جرب النظام باستخدام الأوامر أعلاه
2. راجع `API_USAGE_GUIDE.md` للحصول على تفاصيل كاملة
3. قم بإنشاء واجهة أمامية لكل محطة
4. أضف Unit Tests للتأكد من صحة العمل

---

**استمتع باستخدام النظام! 🎉**

