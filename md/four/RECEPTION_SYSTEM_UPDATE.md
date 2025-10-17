# تحديث نظام الاستقبال - الحقول والحالات الجديدة

## 📋 ملخص التحديثات

تم تحديث نظام الاستقبال لدعم حالات مختلفة للزوجين وإضافة حقول جديدة:

### الحالات الجديدة (SpouseStatus)
1. **عادي (NORMAL)**: الزوج/الزوجة موجود - جميع البيانات مطلوبة
2. **دعوة شرعية (LEGAL_INVITATION)**: شخص واحد فقط يأتي للمراجعة
3. **خارج القطر (OUT_OF_COUNTRY)**: الزوج/الزوجة خارج القطر - البيانات اختيارية
4. **خارج المحافظة (OUT_OF_PROVINCE)**: الزوج/الزوجة خارج المحافظة - البيانات اختيارية

### الحقول الجديدة
تمت إضافة 3 حقول جديدة لكل من الزوج والزوجة:
- **مكان الولادة** (BirthPlace)
- **القيد** (Registration)
- **البلد** (Country)

---

## 🗄️ التغييرات في قاعدة البيانات

### 1. إضافة Enum جديد
```prisma
enum SpouseStatus {
  NORMAL           // عادي - الزوجان موجودان
  LEGAL_INVITATION // دعوة شرعية - شخص واحد فقط
  OUT_OF_COUNTRY   // خارج القطر
  OUT_OF_PROVINCE  // خارج المحافظة
}
```

### 2. تحديث جدول ReceptionData
```prisma
model ReceptionData {
  // حالة الزوجين
  maleStatus       SpouseStatus @default(NORMAL)
  femaleStatus     SpouseStatus @default(NORMAL)
  
  // بيانات الزوج (أصبحت اختيارية)
  maleName         String?      @db.VarChar(255)
  maleLastName     String?      @db.VarChar(255)
  maleFatherName   String?      @db.VarChar(255)
  maleBirthDate    DateTime?    @db.DateTime
  maleNationalId   String?      @db.VarChar(255)
  maleAge          Int?
  maleBirthPlace   String?      @db.VarChar(255) // جديد
  maleRegistration String?      @db.VarChar(255) // جديد
  maleCountry      String?      @db.VarChar(255) // جديد
  
  // بيانات الزوجة (أصبحت اختيارية)
  femaleName       String?      @db.VarChar(255)
  femaleLastName   String?      @db.VarChar(255)
  femaleFatherName String?      @db.VarChar(255)
  femaleBirthDate  DateTime?    @db.DateTime
  femaleNationalId String?      @db.VarChar(255)
  femaleAge        Int?
  femaleBirthPlace String?      @db.VarChar(255) // جديد
  femaleRegistration String?    @db.VarChar(255) // جديد
  femaleCountry    String?      @db.VarChar(255) // جديد
}
```

### 3. Migration
تم إنشاء migration بتاريخ: `20251014160243_add_spouse_status_and_location_fields`

---

## 💻 التغييرات في Backend

### 1. Reception Service (`src/services/reception.service.ts`)

#### تحديث دالة createReceptionData
- أصبحت تدعم الحالات المختلفة
- تقوم بتحديد اسم المراجع بناءً على الحالة:
  - إذا كان الزوج في حالة NORMAL أو LEGAL_INVITATION: يستخدم اسم الزوج
  - إذا كانت الزوجة في حالة LEGAL_INVITATION فقط: يستخدم اسم الزوجة
- تقوم بحفظ جميع الحقول الجديدة

#### تحديث دالة updateReceptionData
- أضيفت دعم تحديث الحقول الجديدة (maleStatus, femaleStatus, birthPlace, registration, country)

### 2. Reception Controller (`src/controllers/reception.controller.ts`)

#### Validation Logic الجديد
```javascript
// التحقق من وجود الحالة
if (!maleStatus || !femaleStatus) {
  return error("حالة الزوج والزوجة مطلوبة");
}

// إذا كانت الحالة NORMAL للطرفين
if (maleStatus === "NORMAL" && femaleStatus === "NORMAL") {
  // جميع بيانات الزوجين مطلوبة
}

// إذا كانت حالة الزوج NORMAL أو LEGAL_INVITATION
if (maleStatus === "NORMAL" || maleStatus === "LEGAL_INVITATION") {
  // بيانات الزوج مطلوبة
}

// إذا كانت حالة الزوجة NORMAL أو LEGAL_INVITATION
if (femaleStatus === "NORMAL" || femaleStatus === "LEGAL_INVITATION") {
  // بيانات الزوجة مطلوبة
}
```

---

## 🎨 التغييرات في Frontend

### 1. واجهة المستخدم (`web/src/pages/ReceptionPage.tsx`)

#### إضافة قوائم منسدلة للحالة
لكل من الزوج والزوجة:
```jsx
<select name="maleStatus" value={formData.maleStatus}>
  <option value="NORMAL">عادي - الزوج موجود</option>
  <option value="LEGAL_INVITATION">دعوة شرعية</option>
  <option value="OUT_OF_COUNTRY">خارج القطر</option>
  <option value="OUT_OF_PROVINCE">خارج المحافظة</option>
</select>
```

#### إضافة الحقول الجديدة
- مكان الولادة
- القيد
- البلد

#### Dynamic Form Validation
الحقول تصبح:
- **مطلوبة (required)**: عندما تكون الحالة NORMAL أو LEGAL_INVITATION
- **معطلة (disabled)**: عندما تكون الحالة OUT_OF_COUNTRY أو OUT_OF_PROVINCE

---

## 🚀 كيفية الاستخدام

### سيناريو 1: حالة عادية (الزوجان موجودان)
1. اختر "عادي - الزوج موجود" للزوج
2. اختر "عادي - الزوجة موجودة" للزوجة
3. أدخل جميع البيانات لكلا الطرفين (مطلوبة)
4. يمكن إضافة مكان الولادة، القيد، والبلد (اختياري)

### سيناريو 2: دعوة شرعية (شخص واحد فقط)

#### للزوج فقط:
1. اختر "دعوة شرعية" للزوج
2. اختر أي حالة للزوجة (يفضل "دعوة شرعية" أو "خارج القطر/المحافظة")
3. أدخل بيانات الزوج (مطلوبة)
4. بيانات الزوجة اختيارية

#### للزوجة فقط:
1. اختر أي حالة للزوج (يفضل "خارج القطر/المحافظة")
2. اختر "دعوة شرعية" للزوجة
3. بيانات الزوج اختيارية
4. أدخل بيانات الزوجة (مطلوبة)

### سيناريو 3: أحد الطرفين خارج القطر
1. اختر "عادي" أو "دعوة شرعية" للطرف الموجود
2. اختر "خارج القطر" للطرف الغائب
3. أدخل بيانات الطرف الموجود فقط
4. حقول الطرف الغائب ستكون معطلة

### سيناريو 4: أحد الطرفين خارج المحافظة
1. اختر "عادي" أو "دعوة شرعية" للطرف الموجود
2. اختر "خارج المحافظة" للطرف الغائب
3. أدخل بيانات الطرف الموجود فقط
4. حقول الطرف الغائب ستكون معطلة

---

## 📊 مثال على البيانات المرسلة

### حالة عادية:
```json
{
  "maleStatus": "NORMAL",
  "femaleStatus": "NORMAL",
  "maleName": "أحمد",
  "maleLastName": "محمد",
  "maleFatherName": "علي",
  "maleBirthDate": "1990-01-01",
  "maleNationalId": "12345678901",
  "maleAge": 34,
  "maleBirthPlace": "دمشق",
  "maleRegistration": "دمشق الأولى",
  "maleCountry": "سوريا",
  "femaleName": "فاطمة",
  "femaleLastName": "أحمد",
  "femaleFatherName": "محمد",
  "femaleBirthDate": "1992-05-15",
  "femaleNationalId": "98765432109",
  "femaleAge": 32,
  "femaleBirthPlace": "حلب",
  "femaleRegistration": "حلب الثانية",
  "femaleCountry": "سوريا",
  "phoneNumber": "0912345678",
  "notes": "ملاحظات"
}
```

### دعوة شرعية (زوج فقط):
```json
{
  "maleStatus": "LEGAL_INVITATION",
  "femaleStatus": "OUT_OF_COUNTRY",
  "maleName": "أحمد",
  "maleLastName": "محمد",
  "maleFatherName": "علي",
  "maleBirthDate": "1990-01-01",
  "maleNationalId": "12345678901",
  "maleAge": 34,
  "maleBirthPlace": "دمشق",
  "maleRegistration": "دمشق الأولى",
  "maleCountry": "سوريا",
  "phoneNumber": "0912345678"
}
```

---

## ⚠️ ملاحظات هامة

1. **الحقول الإلزامية** تعتمد على الحالة المختارة
2. **الرقم الوطني** لم يعد unique constraint على مستوى قاعدة البيانات (أصبح nullable)
3. **اسم المراجع** يتم تحديده تلقائياً بناءً على الحالة
4. **جميع الحقول الجديدة** (مكان الولادة، القيد، البلد) اختيارية
5. عند اختيار "خارج القطر" أو "خارج المحافظة"، الحقول تصبح معطلة في الواجهة

---

## 🔧 خطوات ما بعد التحديث

1. **إعادة تشغيل Backend**:
   ```bash
   npm run dev
   # أو
   npx nodemon
   ```

2. **إعادة تشغيل Frontend**:
   ```bash
   cd web
   npm run dev
   ```

3. **التحقق من Migration**:
   - تم تطبيق Migration تلقائياً
   - للتحقق: تفقد جدول `reception_data` في قاعدة البيانات

4. **Prisma Client**:
   - سيتم توليده تلقائياً عند إعادة تشغيل Backend
   - إذا واجهت مشكلة، أوقف Backend وقم بتشغيل:
     ```bash
     npx prisma generate
     ```

---

## 📝 الملفات المعدلة

1. `prisma/schema.prisma` - تحديث Schema
2. `prisma/migrations/20251014160243_add_spouse_status_and_location_fields/migration.sql` - Migration
3. `src/services/reception.service.ts` - Business Logic
4. `src/controllers/reception.controller.ts` - API Endpoints & Validation
5. `web/src/pages/ReceptionPage.tsx` - UI Components

---

## 🎯 الخلاصة

النظام الآن يدعم:
✅ 4 حالات مختلفة لكل من الزوجين
✅ حقول إضافية (مكان الولادة، القيد، البلد)
✅ Validation ديناميكي حسب الحالة
✅ حقول اختيارية وإلزامية حسب الحالة
✅ واجهة مستخدم محدثة مع تعطيل الحقول غير المطلوبة

تم إنجاز جميع التحديثات بنجاح! ✨

