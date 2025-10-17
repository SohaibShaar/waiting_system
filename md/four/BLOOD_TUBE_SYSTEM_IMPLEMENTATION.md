# نظام ترقيم أنابيب الدم - التنفيذ المكتمل

## نظرة عامة
تم تنفيذ نظام ترقيم فريد لأنابيب الدم في محطة سحب الدم بنجاح.

## آلية العمل

### توليد الأرقام
- **الزوج**: 
  - أنبوبة 1: `11{patientId}`
  - أنبوبة 2: `12{patientId}`
- **الزوجة**: 
  - أنبوبة 1: `21{patientId}`
  - أنبوبة 2: `22{patientId}`

### متى يتم التوليد؟
- تلقائياً عند استدعاء المراجع في محطة سحب الدم
- سواء من زر "استدعاء المراجع التالي" أو من الـ Sidebar

### الحالات الخاصة
- **دعوة شرعية (شخص واحد)**: يتم توليد الأرقام فقط للشخص الموجود
- **خارج القطر/المحافظة**: يتم توليد الأرقام فقط للشخص الموجود

## التغييرات التقنية

### 1. قاعدة البيانات
**ملف**: `prisma/schema.prisma`

تمت إضافة 4 حقول جديدة إلى `BloodDrawData`:
```prisma
maleBloodTube1   String?  @unique @db.VarChar(50)
maleBloodTube2   String?  @unique @db.VarChar(50)
femaleBloodTube1 String?  @unique @db.VarChar(50)
femaleBloodTube2 String?  @unique @db.VarChar(50)
```

الحقول فريدة (unique) لضمان عدم التكرار.

### 2. Backend Services
**ملف**: `src/services/bloodDraw.service.ts`

#### دالة جديدة: `generateBloodTubeNumbers`
```typescript
function generateBloodTubeNumbers(
  patientId: number,
  maleStatus: SpouseStatus,
  femaleStatus: SpouseStatus
)
```
توليد الأرقام بناءً على `patientId` وحالة كل من الزوج والزوجة.

#### دالة جديدة: `generateTubeNumbersForQueue`
```typescript
async function generateTubeNumbersForQueue(queueId: number)
```
تُستخدم من الـ API لتوليد الأرقام عند استدعاء المراجع.

#### تحديث: `createBloodDrawData`
تم تحديثها لقبول وحفظ أرقام الأنابيب الأربعة.

### 3. Backend API
**ملف**: `src/controllers/bloodDraw.controller.ts`

#### Controller جديد: `generateTubeNumbers`
```typescript
POST /api/blood-draw/generate-tubes/:queueId
```
يُستدعى من الـ frontend لتوليد الأرقام عند استدعاء المراجع.

#### تحديث: `addBloodDrawData`
تم تحديثه لقبول أرقام الأنابيب وحفظها.

**ملف**: `src/routes/bloodDraw.routes.ts`
تمت إضافة route جديد للـ API.

### 4. Frontend
**ملف**: `web/src/pages/BloodDrawPage.tsx`

#### State جديد
```typescript
const [tubeNumbers, setTubeNumbers] = useState<TubeNumbers | null>(null);
```

#### تحديثات الدوال
- **`callNextPatient`**: توليد الأرقام تلقائياً بعد الاستدعاء
- **`handleSelectQueueFromSidebar`**: توليد الأرقام عند اختيار دور من الـ Sidebar
- **`handleSave`**: إرسال الأرقام مع بيانات سحب الدم

#### واجهة المستخدم
تمت إضافة قسم جديد لعرض أرقام الأنابيب:
- عرض واضح وكبير للأرقام
- ألوان مميزة (أزرق للزوج، وردي للزوجة)
- يظهر فقط الأرقام للأشخاص الموجودين

## مثال على الاستخدام

### سيناريو 1: حالة عادية (زوج وزوجة)
- `patientId = 123`
- الزوج: `11123`, `12123`
- الزوجة: `21123`, `22123`

### سيناريو 2: دعوة شرعية (زوج فقط)
- `patientId = 456`
- الزوج: `11456`, `12456`
- الزوجة: لا توجد أرقام

### سيناريو 3: دعوة شرعية (زوجة فقط)
- `patientId = 789`
- الزوج: لا توجد أرقام
- الزوجة: `21789`, `22789`

## الميزات
✅ توليد تلقائي للأرقام عند الاستدعاء
✅ أرقام فريدة (unique) لضمان عدم التكرار
✅ معالجة الحالات الخاصة (دعوة شرعية، خارج القطر، إلخ)
✅ واجهة مستخدم واضحة وسهلة
✅ حفظ الأرقام في قاعدة البيانات

## ملاحظات
- الأرقام يتم توليدها فقط عند الاستدعاء (ليس عند الحفظ)
- كل رقم فريد ولا يمكن تكراره في النظام
- الأرقام مرتبطة بـ `patientId` وليس `queueId`

