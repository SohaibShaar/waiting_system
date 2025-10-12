# دليل اختبار نظام التحديث الفوري (WebSocket)

## 📋 ملخص التحديثات

تم تطبيق نظام WebSocket للتحديث الفوري في جميع الصفحات:

### 1. Backend (Node.js/Express)

#### ملف `src/index.ts`
- ✅ `emitNewQueue()` - إرسال إشعار عند إنشاء دور جديد
- ✅ `emitQueueUpdate()` - إرسال إشعار عند تحديث الدور
- ✅ `emitQueueCompleted()` - إرسال إشعار عند إكمال الدور
- ✅ `emitPatientCalled()` - إرسال إشعار عند استدعاء مريض
- ✅ `emitScreenDataUpdate()` - تحديث الشاشة العامة

#### الـ Controllers المحدثة:
- ✅ `reception.controller.ts` - يرسل `new-queue` و `queue-updated` عند إضافة مريض
- ✅ `accounting.controller.ts` - يرسل `queue-updated` عند حفظ بيانات المحاسبة
- ✅ `lab.controller.ts` - يرسل `queue-updated` عند حفظ بيانات المختبر
- ✅ `doctor.controller.ts` - يرسل `queue-updated` و `queue-completed` عند إكمال الفحص
- ✅ `station.controller.ts` - يرسل تحديثات عند استدعاء وإكمال الخدمة

### 2. Frontend (React)

#### Hook المخصص: `web/src/hooks/useQueueUpdates.ts`
```typescript
// يستمع للأحداث التالية:
- new-queue          // دور جديد تم إنشاؤه
- queue-updated      // تحديث في حالة الدور
- patient-called     // تم استدعاء مريض
- queue-completed    // اكتمل الدور
```

#### Component المشترك: `web/src/components/QueueSidebar.tsx`
- يعرض قائمة الأدوار النشطة
- يتم تصفية القائمة حسب المحطة
- يتحدث تلقائياً عند أي حدث WebSocket

#### الصفحات المحدثة:
- ✅ `ReceptionPage.tsx` - تظهر قائمة المرضى اليوم + sidebar
- ✅ `AccountingPage.tsx` - sidebar يعرض قائمة الانتظار
- ✅ `LabPage.tsx` - sidebar يعرض قائمة الانتظار
- ✅ `DoctorPage.tsx` - sidebar يعرض قائمة الانتظار

## 🧪 كيفية الاختبار

### الخطوة 1: تشغيل Backend
```bash
cd C:\Users\SSH\Desktop\node.js\final_waiting_system
npm run dev
```

### الخطوة 2: تشغيل Frontend
```bash
cd C:\Users\SSH\Desktop\node.js\final_waiting_system\web
npm run dev
```

### الخطوة 3: اختبار التحديث الفوري

1. **افتح صفحة المحاسبة** في المتصفح الأول
2. **افتح صفحة الاستقبال** في متصفح آخر (أو نافذة أخرى)
3. **أضف مريض جديد** من صفحة الاستقبال
4. **راقب صفحة المحاسبة** - يجب أن يظهر المريض فوراً في القائمة الجانبية

### الخطوة 4: تتبع الأحداث في Console

#### في Backend (Terminal):
```
✅ Client connected: SOCKET_ID
📡 Emitted new-queue to all clients: { queueId, queueNumber, patient }
📡 Emitted queue-updated to all clients
```

#### في Frontend (Browser Console):
```
✅ WebSocket متصل
🆕 دور جديد: { queueId, queueNumber, patient }
📋 تحديث الدور: { ... }
```

## 🔧 استكشاف الأخطاء

### المشكلة: القائمة لا تتحدث

#### الحل 1: تأكد من تشغيل Backend
```bash
# تحقق من أن الخادم يعمل على المنفذ 3003
curl http://localhost:3003
```

#### الحل 2: تحقق من WebSocket Connection
افتح Browser Console واكتب:
```javascript
// يجب أن ترى "✅ WebSocket متصل"
```

#### الحل 3: تحقق من الأحداث
في Backend terminal، يجب أن ترى:
```
📡 Emitted new-queue to all clients
```

إذا لم ترى هذه الرسالة، تحقق من:
- هل تم حفظ الملفات المحدثة؟
- هل تم إعادة تشغيل Backend بعد التحديثات؟

### المشكلة: WebSocket لا يتصل

#### السبب المحتمل:
- Backend غير قيد التشغيل
- Frontend يحاول الاتصال بعنوان خاطئ

#### الحل:
تحقق من `web/src/hooks/useQueueUpdates.ts`:
```typescript
const newSocket = io("http://localhost:3003"); // تأكد من العنوان
```

## 📝 ملاحظات مهمة

1. **التحديث الفوري** يعمل فقط عندما يكون Backend و Frontend يعملان معاً
2. **القائمة الجانبية** تتحدث تلقائياً عند:
   - إضافة مريض جديد
   - استدعاء مريض
   - إكمال خدمة في محطة
   - إكمال الدور بالكامل
3. **التصفية** تحدث في `QueueSidebar` حسب المحطة:
   - المحاسبة: جميع الأدوار الجديدة
   - المختبر: الأدوار التي مرت بالمحاسبة
   - الطبيبة: الأدوار التي مرت بالمختبر

## 🎯 الخطوات التالية

إذا كانت القوائم لا تزال لا تتحدث:
1. أعد تشغيل Backend
2. أعد تشغيل Frontend
3. امسح cache المتصفح (Ctrl+Shift+R)
4. تحقق من console للأخطاء

