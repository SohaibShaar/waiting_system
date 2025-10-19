# 📥 دليل تحميل وتثبيت خط Cairo

## الخطوة 1️⃣: تحميل الخط

### الخيار الأول: Google Fonts (الأسهل - موصى به)

1. **افتح الرابط التالي**:
   ```
   https://fonts.google.com/specimen/Cairo
   ```

2. **اضغط على زر "Download family"** في أعلى يمين الصفحة

3. **سيتم تحميل ملف ZIP** بحجم حوالي 1-2 MB

### الخيار الثاني: من GitHub

1. **افتح الرابط**:
   ```
   https://github.com/Gue3bara/Cairo/tree/main/fonts/ttf
   ```

2. **حمل الملفات** التالية (اضغط على كل ملف ثم "Download"):
   - `Cairo-Light.ttf`
   - `Cairo-Regular.ttf`
   - `Cairo-Medium.ttf`
   - `Cairo-SemiBold.ttf`
   - `Cairo-Bold.ttf`
   - `Cairo-ExtraBold.ttf`
   - `Cairo-Black.ttf`

### الخيار الثالث: رابط تحميل مباشر

```
https://fonts.google.com/download?family=Cairo
```

---

## الخطوة 2️⃣: استخراج الملفات (إذا حملت ZIP)

1. **ابحث عن ملف ZIP** في مجلد التحميلات
2. **اضغط كليك يمين** على الملف
3. **اختر "Extract All"** أو "استخراج الكل"
4. **ستجد مجلد `static`** بداخله ملفات `.ttf`

---

## الخطوة 3️⃣: نسخ الملفات

### المسار المطلوب:
```
نسخ الملفات إلى:
web/public/fonts/

المسار الكامل:
C:\Users\SSH\Desktop\node.js\final_waiting_system\web\public\fonts\
```

### الملفات المطلوبة (7 ملفات):
- ✅ `Cairo-Light.ttf`         (300)
- ✅ `Cairo-Regular.ttf`       (400) - **مهم جداً**
- ✅ `Cairo-Medium.ttf`        (500)
- ✅ `Cairo-SemiBold.ttf`      (600)
- ✅ `Cairo-Bold.ttf`          (700) - **مهم جداً**
- ✅ `Cairo-ExtraBold.ttf`     (800)
- ✅ `Cairo-Black.ttf`         (900)

### خطوات النسخ:

#### Windows:
1. افتح مجلد التحميلات واستخرج ZIP
2. ادخل إلى مجلد `Cairo` ثم `static`
3. **حدد كل ملفات `.ttf`**
4. اضغط `Ctrl+C` للنسخ
5. افتح مجلد المشروع:
   ```
   C:\Users\SSH\Desktop\node.js\final_waiting_system\web\public\fonts\
   ```
6. اضغط `Ctrl+V` للصق

#### باستخدام PowerShell:
```powershell
# إذا كانت الملفات في مجلد التحميلات
Copy-Item "$env:USERPROFILE\Downloads\Cairo\static\*.ttf" -Destination "C:\Users\SSH\Desktop\node.js\final_waiting_system\web\public\fonts\"
```

---

## الخطوة 4️⃣: التحقق من التثبيت

بعد النسخ، يجب أن يحتوي المجلد على:

```
web/public/fonts/
├── 📄 README.md
├── 📄 DOWNLOAD_INSTRUCTIONS.md (هذا الملف)
├── 🔤 Cairo-Light.ttf
├── 🔤 Cairo-Regular.ttf
├── 🔤 Cairo-Medium.ttf
├── 🔤 Cairo-SemiBold.ttf
├── 🔤 Cairo-Bold.ttf
├── 🔤 Cairo-ExtraBold.ttf
└── 🔤 Cairo-Black.ttf
```

### تحقق بالأمر:
```powershell
# في PowerShell
cd C:\Users\SSH\Desktop\node.js\final_waiting_system\web\public\fonts
dir *.ttf
```

يجب أن ترى **7 ملفات .ttf**

---

## الخطوة 5️⃣: إعادة تشغيل التطبيق

1. **أوقف الخادم** (إذا كان يعمل):
   - اضغط `Ctrl+C` في Terminal

2. **أعد تشغيل الخادم**:
   ```bash
   npm run dev
   # أو
   npm start
   ```

3. **أعد تحميل المتصفح**:
   - اضغط `F5` أو `Ctrl+R`
   - أو `Ctrl+Shift+R` (لمسح الذاكرة المؤقتة)

---

## ✅ التحقق من نجاح التثبيت

### طريقة 1: فحص النص
- افتح التطبيق في المتصفح
- النص العربي يجب أن يظهر **واضحاً وجميلاً**
- الخط يجب أن يكون **متناسقاً**

### طريقة 2: Developer Tools
1. افتح المتصفح (Chrome/Edge)
2. اضغط `F12` لفتح Developer Tools
3. اذهب إلى تبويب **Console**
4. اكتب:
   ```javascript
   getComputedStyle(document.body).fontFamily
   ```
5. يجب أن ترى: `"Cairo", sans-serif`

### طريقة 3: Network Tab
1. افتح `F12` → تبويب **Network**
2. أعد تحميل الصفحة `F5`
3. ابحث عن `Cairo` في الفلتر
4. يجب أن ترى ملفات `.ttf` محملة بنجاح (Status: **200**)

---

## 🚨 حل المشاكل

### المشكلة: الخط لا يظهر
**الحل:**
1. تأكد من وجود الملفات في المسار الصحيح
2. تأكد من أسماء الملفات صحيحة (حساسة لحالة الأحرف)
3. أعد تشغيل الخادم
4. امسح ذاكرة المتصفح المؤقتة (`Ctrl+Shift+Delete`)

### المشكلة: الملفات موجودة لكن الخط لا يعمل
**الحل:**
1. تحقق من Console في F12 لوجود أخطاء
2. تأكد من `fonts.css` محمل في `main.tsx`
3. جرب متصفح آخر

### المشكلة: بعض الأوزان لا تظهر
**الحل:**
- تأكد من نسخ **كل** ملفات `.ttf` السبعة
- الوزن `Regular` و `Bold` مهمان جداً

---

## 📞 دعم إضافي

إذا واجهت مشاكل:
1. تحقق من وجود الملفات: `dir web\public\fonts\*.ttf`
2. افحص Console في المتصفح (`F12`)
3. تأكد من إعادة تشغيل الخادم

---

**✨ بعد اتباع هذه الخطوات، يجب أن يعمل خط Cairo بشكل كامل بدون إنترنت!**

