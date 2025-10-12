# دليل تتبع مشكلة WebSocket

## المشكلة
عند استدعاء مريض، لا يظهر على شاشة العرض فوراً.

## خطوات التشخيص

### 1. افتح Console في Backend (Terminal حيث يعمل `npm run dev`)

عند استدعاء مريض، يجب أن ترى:

```
✅ نتيجة callNextPatient: { success: true, queueNumber: 1, displayNumber: 2 }
📡 إرسال emitPatientCalled من callNext...
📡 إرسال patient-called إلى X عميل في display-screen
📡 تم إرسال patient-called: { queueNumber: 1, displayNumber: 2, ... }
✅ تم إرسال الإشعارات من callNext
```

**إذا رأيت:**
- ❌ `عدد المشتركين في display-screen: 0` → المشكلة: شاشة العرض غير مشتركة!
- ❌ `displayNumber أو queueNumber مفقود!` → المشكلة في patient.service.ts

---

### 2. افتح Console في Frontend (شاشة العرض - F12)

عند فتح شاشة العرض، يجب أن ترى:

```
🔌 إنشاء اتصال WebSocket جديد...
✅ متصل بالخادم - Socket ID: xyz123
📺 تم الاشتراك في شاشة العرض
```

عند استدعاء مريض، يجب أن ترى:

```
📢 استقبال استدعاء جديد: { queueNumber: 1, displayNumber: 2, ... }
➕ تمت إضافة الدور #1 إلى الطابور
📋 عدد الأدوار في الطابور: 1
🔄 معالجة الدور #1
🔊 تشغيل الصوت للدور #1
✅ انتهى الصوت للدور #1
```

**إذا لم ترَ `📢 استقبال استدعاء جديد:`** → المشكلة في الاتصال!

---

### 3. فحص الاتصال

#### في Backend Console:
عند فتح شاشة العرض:
```
✅ عميل جديد متصل - Socket ID: xyz123
📺 العميل xyz123 اشترك في شاشة العرض
📊 عدد المشتركين في display-screen: 1
```

**إذا لم ترَ هذه الرسائل:**
1. تأكد أن السيرفر يعمل على `http://localhost:3003`
2. تأكد أن شاشة العرض متصلة بنفس العنوان

---

## الحلول السريعة

### الحل 1: إعادة تشغيل كل شيء

```bash
# أوقف Backend (Ctrl+C)
# أوقف Frontend (Ctrl+C)

# شغل Backend من جديد
npm run dev

# في terminal آخر، شغل Frontend
cd web
npm run dev
```

### الحل 2: تنظيف Cache

```bash
# Frontend
cd web
rm -rf node_modules/.vite
npm run dev
```

### الحل 3: التحقق من Port

تأكد أن Backend يعمل على port 3003:
```bash
# في Backend console يجب أن ترى:
🚀 Server is running on http://localhost:3003
```

---

## تفاصيل التعديلات الأخيرة

### 1. `src/controllers/station.controller.ts`
أضفنا console.log لتتبع:
- نتيجة `callNextPatient`
- نتيجة `callSpecificQueue`
- إرسال `emitPatientCalled`

### 2. `src/websocket/socket.ts`
أضفنا:
- عرض عدد العملاء المشتركين في `display-screen`
- تفاصيل البيانات المُرسلة

### 3. `src/index.ts`
أضفنا:
- تتبع اتصال العملاء
- عرض عدد المشتركين في كل room

### 4. `web/src/pages/DisplayScreen.tsx`
- ✅ إصلاح dependency array → `[]` بدلاً من `[getStationName, audioEnabled]`
- ✅ إضافة console.log مفصّلة
- ✅ تحسين منطق الاشتراك

---

## الخطوات التالية

1. **شغل Backend وFrontend**
2. **افتح شاشة العرض وراقب Console**
3. **افتح صفحة محطة**
4. **استدعي مريضاً**
5. **راقب Console في Backend و Frontend**
6. **أرسل لي ما تراه في Console**

---

## أسئلة للتشخيص

عندما تستدعي مريضاً:

1. هل ترى في **Backend Console**: `📡 إرسال emitPatientCalled...`?
2. هل ترى في **Backend Console**: `عدد المشتركين في display-screen: 1` (أو أكثر)?
3. هل ترى في **Frontend Console** (شاشة العرض): `📢 استقبال استدعاء جديد`?
4. هل شاشة العرض مفتوحة قبل الاستدعاء؟

أرسل لي الإجابات وسنحل المشكلة! 🔍

