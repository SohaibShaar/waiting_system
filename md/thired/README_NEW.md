# 🏥 نظام إدارة الأدوار - Queue Management System

نظام شامل لإدارة أدوار المرضى في عيادات الفحص الطبي قبل الزواج.

---

## ✨ الميزات الجديدة

### 🔄 الاستدعاء التلقائي
عند حفظ البيانات في أي محطة (استقبال، مختبر، طبيب)، يتم:
- ✅ حفظ البيانات
- ✅ استدعاء المريض التالي **تلقائياً**
- ✅ إرسال الإشعارات للشاشات **فوراً**

### 📊 ثلاث محطات رئيسية

#### 1️⃣ محطة الاستقبال (Reception)
- تعبئة بيانات الزوجين الكاملة
- الأسماء، التواريخ، الأعمار، أرقام الهوية
- استدعاء تلقائي للمريض التالي

#### 2️⃣ محطة المختبر (Lab)
- فحص الحالة الصحية لكل من الزوجين
- تسجيل: سليم (HEALTHY) أو غير سليم (UNHEALTHY)
- ملاحظات منفصلة لكل مريض
- استدعاء تلقائي للمريض التالي

#### 3️⃣ محطة الطبيب (Doctor)
- تسجيل فصائل الدم
- فحص الأمراض: HIV, HBS, HBC
- حالة كل مرض: إيجابي (POSITIVE) أو سلبي (NEGATIVE)
- ملاحظات طبية مفصلة
- استدعاء تلقائي للمريض التالي

---

## 🚀 البدء السريع

### المتطلبات
- Node.js v18+
- MySQL Database
- npm أو yarn

### التثبيت
```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد البيئة
cp .env.example .env
# عدّل DATABASE_URL في .env

# 3. تشغيل Migrations
npx prisma migrate dev

# 4. تشغيل الخادم
npm run dev
```

الخادم يعمل على: **http://localhost:3001**

---

## 📚 التوثيق

### 📖 الأدلة الرئيسية
- **[QUICK_START.md](QUICK_START.md)** - دليل البدء السريع
- **[API_USAGE_GUIDE.md](API_USAGE_GUIDE.md)** - دليل استخدام API الكامل
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - ملخص التعديلات
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - تفاصيل التنفيذ

### 🔧 ملفات إضافية
- **[API_EXAMPLES.http](API_EXAMPLES.http)** - أمثلة API (Thunder Client/Postman)

---

## 🎯 الـ API Endpoints

### إدارة الأدوار
```
POST   /api/queue/create          # إنشاء دور جديد
GET    /api/queue/active          # الأدوار النشطة
GET    /api/queue/:id             # تفاصيل دور معين
```

### المحطات
```
GET    /api/stations                         # جميع المحطات
POST   /api/stations/:id/call-next          # استدعاء التالي
GET    /api/stations/:id/waiting-list       # قائمة الانتظار
POST   /api/stations/:id/complete-service   # إنهاء الخدمة
```

### 🆕 بيانات المحطات (مع الاستدعاء التلقائي)
```
POST   /api/reception      # حفظ بيانات الاستقبال + استدعاء تلقائي
GET    /api/reception/:id  # عرض بيانات الاستقبال
PUT    /api/reception/:id  # تحديث بيانات الاستقبال

POST   /api/lab            # حفظ بيانات المختبر + استدعاء تلقائي
GET    /api/lab/:id        # عرض بيانات المختبر
PUT    /api/lab/:id        # تحديث بيانات المختبر

POST   /api/doctor         # حفظ بيانات الطبيب + استدعاء تلقائي
GET    /api/doctor/:id     # عرض بيانات الطبيب
PUT    /api/doctor/:id     # تحديث بيانات الطبيب
```

### المرضى والإحصائيات
```
POST   /api/patients             # إنشاء مريض
GET    /api/patients/search      # البحث عن مريض
GET    /api/stats/today          # إحصائيات اليوم
GET    /api/display/data         # بيانات الشاشة
```

---

## 💡 مثال على الاستخدام

### 1. إنشاء دور جديد
```bash
curl -X POST http://localhost:3001/api/queue/create \
  -H "Content-Type: application/json" \
  -d '{"name": "أحمد محمد", "phoneNumber": "0501234567"}'
```

### 2. حفظ بيانات الاستقبال (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/reception \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1,
    "patientId": 1,
    "maleName": "أحمد",
    "maleLastName": "محمد",
    ...
  }'
```

### 3. حفظ بيانات المختبر (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/lab \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1,
    "patientId": 1,
    "isMaleHealthy": "HEALTHY",
    "isFemaleHealthy": "HEALTHY"
  }'
```

### 4. حفظ بيانات الطبيب (يستدعي التالي تلقائياً)
```bash
curl -X POST http://localhost:3001/api/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "queueId": 1,
    "patientId": 1,
    "maleHIVstatus": "NEGATIVE",
    "femaleHIVstatus": "NEGATIVE",
    ...
  }'
```

---

## 🏗️ البنية

```
final_waiting_system/
├── src/
│   ├── controllers/          # المتحكمات
│   │   ├── reception.controller.ts    # 🆕
│   │   ├── lab.controller.ts          # 🆕
│   │   ├── doctor.controller.ts       # 🆕
│   │   ├── queue.controller.ts
│   │   ├── station.controller.ts
│   │   └── ...
│   ├── services/             # الخدمات
│   │   ├── reception.service.ts       # 🆕
│   │   ├── lab.service.ts             # 🆕
│   │   ├── doctor.service.ts          # 🆕
│   │   ├── queue.service.ts
│   │   ├── station.service.ts
│   │   └── ...
│   ├── routes/               # المسارات
│   │   ├── reception.routes.ts        # 🆕
│   │   ├── lab.routes.ts              # 🆕
│   │   ├── doctor.routes.ts           # 🆕
│   │   └── ...
│   ├── websocket/            # WebSocket
│   ├── types/                # الأنواع
│   └── index.ts              # نقطة الدخول
├── prisma/
│   ├── schema.prisma         # نموذج قاعدة البيانات
│   └── migrations/           # الهجرات
├── web/                      # الواجهة الأمامية (React)
└── md/                       # التوثيق القديم
```

---

## 📡 WebSocket Events

### الأحداث المُرسلة

#### `patient-called`
يُرسل عند استدعاء مريض تلقائياً
```json
{
  "queueNumber": 5,
  "displayNumber": 1,
  "stationId": 1,
  "calledAt": "2025-10-12T10:30:00.000Z"
}
```

#### `screen-data-updated`
يُرسل لتحديث بيانات الشاشة

#### `station-updated`
يُرسل عند تحديث حالة محطة

---

## 🗄️ قاعدة البيانات

### الجداول الرئيسية
- `Patient` - بيانات المرضى
- `Queue` - الأدوار النشطة
- `QueueHistory` - سجل تحركات الأدوار
- `Station` - المحطات
- `ReceptionData` - 🆕 بيانات الاستقبال
- `LabData` - 🆕 بيانات المختبر
- `DoctorData` - 🆕 بيانات الطبيب
- `CompletedVisit` - الزيارات المكتملة

---

## 🔐 الأمان

- ✅ Validation للبيانات المُدخلة
- ✅ معالجة الأخطاء
- ✅ TypeScript للتحقق من الأنواع
- ✅ Prisma ORM لمنع SQL Injection

---

## 🧪 الاختبار

### تشغيل الاختبارات
```bash
npm test
```

### اختبار يدوي
استخدم ملف `API_EXAMPLES.http` مع Thunder Client أو Postman

---

## 📊 الإحصائيات

### المتاحة
- إحصائيات اليوم
- إحصائيات المحطات
- أوقات الانتظار
- عدد المرضى
- تاريخ الزيارات

---

## 🛠️ التقنيات المستخدمة

### Backend
- **Node.js** - بيئة التشغيل
- **Express.js** - إطار العمل
- **TypeScript** - لغة البرمجة
- **Prisma** - ORM لقاعدة البيانات
- **Socket.IO** - WebSocket للتحديثات الفورية
- **MySQL** - قاعدة البيانات

### Frontend
- **React** - واجهة المستخدم
- **TypeScript** - لغة البرمجة
- **Vite** - أداة البناء
- **Socket.IO Client** - اتصال WebSocket

---

## 📝 الملاحظات

⚠️ **مهم:**
- الاستدعاء التلقائي يحدث فقط عند **POST** (إضافة بيانات جديدة)
- التحديث باستخدام **PUT** لا يستدعي المريض التالي
- تأكد من إنشاء المحطات قبل البدء
- جميع الحقول الأساسية مطلوبة، والملاحظات اختيارية

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ Branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

---

## 📄 الرخصة

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

## 📞 الدعم

للأسئلة والدعم:
- 📖 راجع التوثيق في مجلد `md/`
- 💬 افتح Issue على GitHub
- 📧 تواصل مع فريق التطوير

---

## 🎉 شكر خاص

شكراً لجميع المساهمين في هذا المشروع!

---

**آخر تحديث:** 2025-10-12

**الإصدار:** 2.0.0 (مع الاستدعاء التلقائي)

