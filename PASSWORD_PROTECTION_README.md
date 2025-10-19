# 🔐 نظام حماية الصفحات بكلمة مرور

تم إضافة نظام حماية بكلمة مرور لجميع صفحات التطبيق (ما عدا Display والصفحة الرئيسية).

## كلمات المرور الافتراضية

### كلمة المرور العامة (تعمل على جميع الصفحات)
- **الكلمة**: `admin123`
- **الاستخدام**: يمكن استخدامها للدخول إلى أي صفحة

### كلمات مرور الصفحات الفردية

| الصفحة | كلمة المرور |
|--------|-------------|
| الاستقبال (Reception) | `r123` |
| المحاسبة (Accounting) | `a123` |
| الفحص الطبي (Lab) | `l123` |
| سحب الدم (Blood Draw) | `b123` |
| الطبيبة (Doctor) | `d123` |

## الصفحات غير المحمية

- **الصفحة الرئيسية**: `/` - متاحة للجميع
- **شاشة العرض**: `/display` - متاحة للجميع

## آلية العمل

1. عند الدخول إلى أي صفحة محمية، سيظهر modal لإدخال كلمة المرور
2. يمكن استخدام كلمة المرور العامة أو كلمة المرور الخاصة بالصفحة
3. بعد إدخال كلمة المرور الصحيحة، يتم حفظ الجلسة في `sessionStorage`
4. الجلسة تستمر حتى إغلاق المتصفح أو التبويب

## تغيير كلمات المرور

### عبر API

#### تغيير كلمة المرور العامة
```bash
PUT http://localhost:3003/api/auth/master-password
Content-Type: application/json

{
  "newPassword": "كلمة_المرور_الجديدة"
}
```

#### تغيير كلمة مرور صفحة محددة
```bash
PUT http://localhost:3003/api/auth/page-password/:pageName
Content-Type: application/json

{
  "newPassword": "كلمة_المرور_الجديدة"
}
```

مثال:
```bash
PUT http://localhost:3003/api/auth/page-password/reception
Content-Type: application/json

{
  "newPassword": "reception_new_password"
}
```

### عبر قاعدة البيانات

يمكنك تغيير كلمات المرور مباشرة في جداول:
- `master_password` - للكلمة العامة
- `page_passwords` - لكلمات مرور الصفحات

## ملاحظات أمنية

⚠️ **تحذير**: كلمات المرور مخزنة كنص عادي (بدون تشفير) كما تم الطلب. هذا النظام مخصص للاستخدام الداخلي فقط.

## API Endpoints

### التحقق من كلمة المرور
```
POST /api/auth/verify-page
```
**Body:**
```json
{
  "pageName": "reception",
  "password": "r123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "random_token_here",
  "isMaster": false,
  "message": "تم التحقق بنجاح"
}
```

### جلب جميع كلمات المرور
```
GET /api/auth/passwords
```

**Response:**
```json
{
  "success": true,
  "passwords": [
    {
      "id": 1,
      "pageName": "reception",
      "password": "r123",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

## التكامل مع Frontend

الصفحات المحمية محاطة بـ `<PasswordProtectedRoute>`:

```tsx
<Route
  path='/reception'
  element={
    <PasswordProtectedRoute pageName='reception'>
      <ReceptionPage />
    </PasswordProtectedRoute>
  }
/>
```

## استكشاف الأخطاء

### المشكلة: "كلمة المرور غير صحيحة" رغم إدخال الكلمة الصحيحة
- تحقق من أن قاعدة البيانات تحتوي على كلمات المرور
- تأكد من عدم وجود مسافات زائدة في كلمة المرور
- تحقق من حقل `isActive` في الجدول

### المشكلة: يطلب كلمة المرور في كل مرة
- تأكد من أن المتصفح يسمح بـ `sessionStorage`
- تحقق من أن اسم الصفحة (`pageName`) صحيح

### المشكلة: الـ API لا يستجيب
- تأكد من تشغيل Backend على المنفذ 3003
- تحقق من أن جداول `page_passwords` و `master_password` موجودة في قاعدة البيانات

## الملفات المضافة/المعدلة

### Backend
- `prisma/schema.prisma` - إضافة جداول PagePassword و MasterPassword
- `prisma/seed-passwords.ts` - script لإدخال البيانات الأولية
- `src/services/auth.service.ts` - منطق المصادقة
- `src/controllers/auth.controller.ts` - معالجات API
- `src/routes/auth.routes.ts` - مسارات API
- `src/index.ts` - إضافة auth routes

### Frontend
- `web/src/components/PasswordProtectedRoute.tsx` - مكون الحماية
- `web/src/App.tsx` - تغليف الصفحات المحمية

## الدعم

للمساعدة أو الاستفسارات، يرجى التواصل مع مطور النظام.

