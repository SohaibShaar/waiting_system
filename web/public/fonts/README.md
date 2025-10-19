# تعليمات تثبيت خط Cairo

## 📥 كيفية تحميل الخط

### الطريقة الأولى: من Google Fonts (موصى بها)
1. اذهب إلى: https://fonts.google.com/specimen/Cairo
2. اضغط على "Download family"
3. سيتم تحميل ملف ZIP

### الطريقة الثانية: من GitHub
1. اذهب إلى: https://github.com/Gue3bara/Cairo
2. حمل الخطوط من المستودع

## 📦 تثبيت الخط

1. **استخرج ملف ZIP**
   - ستجد مجلد `static` يحتوي على ملفات `.ttf`

2. **انسخ الملفات التالية إلى مجلد `web/public/fonts/`**:
   ```
   Cairo-Regular.ttf
   Cairo-Bold.ttf
   Cairo-SemiBold.ttf
   Cairo-Medium.ttf
   Cairo-Light.ttf
   ```

3. **أو انسخ كل ملفات الأوزان**:
   ```
   Cairo-ExtraLight.ttf
   Cairo-Light.ttf
   Cairo-Regular.ttf
   Cairo-Medium.ttf
   Cairo-SemiBold.ttf
   Cairo-Bold.ttf
   Cairo-ExtraBold.ttf
   Cairo-Black.ttf
   ```

## ✅ التحقق من التثبيت

بعد نسخ الملفات، يجب أن يبدو المجلد كالتالي:
```
web/public/fonts/
  ├── README.md (هذا الملف)
  ├── Cairo-Regular.ttf
  ├── Cairo-Bold.ttf
  ├── Cairo-SemiBold.ttf
  └── ... (باقي الملفات)
```

## 🔄 إعادة تشغيل التطبيق

بعد نسخ الخطوط:
1. احفظ جميع الملفات
2. أعد تشغيل خادم التطوير (dev server)
3. أعد تحميل الصفحة في المتصفح

---

**ملاحظة**: تم تكوين النظام تلقائياً لاستخدام هذه الخطوط من مجلد `fonts/`.

