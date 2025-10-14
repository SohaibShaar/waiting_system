# 📚 دليل النظام النهائي - نظام إدارة الأدوار

## 🎯 ملخص التحديثات النهائية

تم تطبيق نظام متكامل للتحديث الفوري (Real-time) باستخدام WebSocket، مع عرض قوائم انتظار مخصصة لكل محطة.

---

## 📋 الميزات الرئيسية

### 1. التحديث الفوري (Real-time Updates)
- ✅ عند إضافة مريض جديد في **الاستقبال**، يظهر فوراً في قائمة **المحاسبة**
- ✅ عند إنهاء الخدمة في محطة، ينتقل المريض تلقائياً للمحطة التالية
- ✅ تحديث فوري لجميع الصفحات المفتوحة في نفس الوقت

### 2. قوائم الانتظار المخصصة
كل محطة تعرض **فقط** الأشخاص الذين ينتظرون دورهم في تلك المحطة:

#### 📍 المحاسبة (Station #2)
- يظهر المرضى الذين أنهوا الاستقبال
- `currentStation.displayNumber === 2` أو `currentStation.name === "المحاسبة"`

#### 📍 المختبر (Station #3)
- يظهر المرضى الذين أنهوا المحاسبة
- `currentStation.displayNumber === 3` أو `currentStation.name === "المختبر"`

#### 📍 الطبيبة (Station #4)
- يظهر المرضى الذين أنهوا المختبر
- `currentStation.displayNumber === 4` أو `currentStation.name === "الطبيبة"`

---

## 🔧 التغييرات التقنية

### Backend (Node.js)

#### 1. ملف `src/index.ts`
```typescript
// وظائف WebSocket الجديدة
export const emitNewQueue = (data: any) => {
  io.emit("new-queue", data); // إرسال لجميع العملاء
};

export const emitQueueUpdate = (data: any) => {
  io.emit("queue-updated", data);
};

export const emitQueueCompleted = (data: any) => {
  io.emit("queue-completed", data);
};
```

#### 2. ملف `src/controllers/reception.controller.ts`
```typescript
// عند إضافة مريض جديد
emitNewQueue({
  queueId: result.queue.id,
  queueNumber: result.queueNumber,
  patient: result.patient,
});

emitQueueUpdate({
  type: "NEW",
  queueId: result.queue.id,
  queueNumber: result.queueNumber,
});
```

#### 3. ملف `src/services/queue.service.ts`
```typescript
// تضمين بيانات الاستقبال في القوائم
async function getAllActiveQueues() {
  return await prisma.queue.findMany({
    where: { status: OverallQueueStatus.ACTIVE },
    include: {
      patient: true,
      currentStation: true,
      ReceptionData: true, // ✅ جديد
    },
    orderBy: { queueNumber: "asc" },
  });
}
```

#### 4. Controllers الأخرى
- **accounting.controller.ts**: يرسل `queue-updated` عند حفظ البيانات
- **lab.controller.ts**: يرسل `queue-updated` عند حفظ البيانات
- **doctor.controller.ts**: يرسل `queue-updated` و `queue-completed` عند الانتهاء

### Frontend (React)

#### 1. Hook مخصص: `web/src/hooks/useQueueUpdates.ts`
```typescript
// يستمع للأحداث:
- new-queue          // دور جديد
- queue-updated      // تحديث
- patient-called     // استدعاء
- queue-completed    // اكتمال
```

#### 2. Component: `web/src/components/QueueSidebar.tsx`
```typescript
const fetchQueues = async () => {
  const response = await axios.get(`${API_URL}/queue/active`);
  
  // تصفية حسب المحطة الحالية
  const filteredQueues = response.data.queues.filter((q) => {
    if (!q.currentStation) return false;
    
    if (stationName === "المحاسبة") {
      return q.currentStation.displayNumber === 2;
    } else if (stationName === "المختبر") {
      return q.currentStation.displayNumber === 3;
    } else if (stationName === "الطبيبة") {
      return q.currentStation.displayNumber === 4;
    }
    
    return false;
  });
  
  setQueues(filteredQueues);
};

// التحديث عند WebSocket event
useEffect(() => {
  fetchQueues();
}, [stationName, updateTrigger]);
```

#### 3. الصفحات المحدثة
جميع الصفحات تحتوي على `<QueueSidebar>`:
- ✅ `ReceptionPage.tsx`
- ✅ `AccountingPage.tsx`
- ✅ `LabPage.tsx`
- ✅ `DoctorPage.tsx`

---

## 🧪 كيفية الاختبار

### الخطوة 1: تشغيل النظام

#### Backend:
```bash
cd C:\Users\SSH\Desktop\node.js\final_waiting_system
npm run dev
```

#### Frontend:
```bash
cd web
npm run dev
```

### الخطوة 2: سيناريو الاختبار

1. **افتح 3 نوافذ متصفح:**
   - نافذة 1: صفحة الاستقبال `http://localhost:5173/reception`
   - نافذة 2: صفحة المحاسبة `http://localhost:5173/accounting`
   - نافذة 3: صفحة المختبر `http://localhost:5173/lab`

2. **أضف مريض جديد من صفحة الاستقبال:**
   - املأ البيانات
   - اضغط "إضافة مريض"

3. **راقب التحديث الفوري:**
   - ✅ يجب أن يظهر المريض فوراً في قائمة الاستقبال
   - ✅ يجب أن يظهر في قائمة انتظار المحاسبة (النافذة 2)
   - ❌ لا يظهر في المختبر (لأنه لم يمر بالمحاسبة بعد)

4. **انتقل للمحاسبة:**
   - استدعِ المريض (`callNextPatient`)
   - أدخل بيانات المحاسبة
   - احفظ البيانات

5. **راقب الانتقال:**
   - ✅ يختفي من قائمة المحاسبة
   - ✅ يظهر فوراً في قائمة انتظار المختبر (النافذة 3)

6. **أكمل باقي المحطات:**
   - المختبر → الطبيبة
   - كل انتقال يحدث فورياً

---

## 🔍 استكشاف الأخطاء

### المشكلة: القوائم لا تتحدث

#### الحل 1: تحقق من WebSocket
افتح Browser Console (F12):
```javascript
// يجب أن ترى:
✅ WebSocket متصل
🔍 جاري جلب الأدوار لـ المحاسبة...
✅ تم جلب X دور نشط
📋 تم العثور على Y دور ينتظر في المحاسبة
```

#### الحل 2: تحقق من Backend
في Terminal الـ Backend يجب أن ترى:
```
✅ Client connected: SOCKET_ID
📡 Emitted new-queue to all clients: { queueId, ... }
📡 Emitted queue-updated to all clients
```

#### الحل 3: أعد تشغيل النظام
```bash
# أوقف Backend (Ctrl+C)
# أوقف Frontend (Ctrl+C)

# أعد التشغيل
npm run dev  # في Backend
npm run dev  # في Frontend (مجلد web)
```

#### الحل 4: امسح Cache
في المتصفح:
- اضغط `Ctrl + Shift + R` (Hard Reload)
- أو افتح DevTools → Application → Clear Storage → Clear site data

---

## 📊 تتبع البيانات

### Console Logs مفيدة:

#### في Backend:
```
✅ Client connected: abc123
📡 Emitted new-queue to all clients: { queueId: 1, queueNumber: 101, ... }
📡 Emitted queue-updated to all clients
```

#### في Frontend (Browser):
```
🔍 جاري جلب الأدوار لـ المحاسبة...
✅ تم جلب 5 دور نشط
📋 تم العثور على 2 دور ينتظر في المحاسبة
🆕 دور جديد: { queueId: 1, ... }
📋 تحديث الدور: { ... }
```

---

## 🎨 التصميم

### الألوان المستخدمة:
```css
--primary: #054239    /* الأخضر الداكن */
--secondary: #b9a779  /* الذهبي */
--dark: #3d3a3b       /* الرمادي الداكن */
--light: #edebe0      /* البيج الفاتح */
--white: #ffffff      /* الأبيض */
```

### المكونات:
- ✅ Header موحد في جميع الصفحات
- ✅ QueueSidebar على يسار كل صفحة
- ✅ تصميم responsive
- ✅ بدون scroll (كل شيء في صفحة واحدة)

---

## 📝 ملاحظات مهمة

1. **قوائم الانتظار مخصصة لكل محطة**
   - المحاسبة ترى فقط من ينتظرها
   - المختبر يرى فقط من ينتظره
   - الطبيبة ترى فقط من ينتظرها

2. **التحديث الفوري**
   - يعمل فقط عندما Backend و Frontend يعملان معاً
   - يستخدم WebSocket (Socket.IO)
   - لا يحتاج refresh للصفحة

3. **الترتيب**
   - القوائم مرتبة حسب رقم الدور (من الأصغر للأكبر)
   - الأولوية (`priority`) تظهر كـ badge أحمر

4. **البيانات المعروضة**
   - اسم الزوج والزوجة (من ReceptionData)
   - رقم الدور
   - حالة الدور (نشط، منتظر، إلخ)
   - المحطة الحالية

---

## 🚀 ما التالي؟

النظام الآن جاهز بالكامل! يمكنك:
1. اختبار النظام بالسيناريو أعلاه
2. إضافة مزيد من المحطات إذا لزم الأمر
3. تخصيص التصميم حسب الحاجة
4. إضافة مزيد من التقارير والإحصائيات

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Console Logs (Backend & Frontend)
2. تأكد من أن جميع الخدمات تعمل
3. جرب Hard Reload للمتصفح
4. أعد تشغيل Backend

---

**تم بحمد الله! ✅**

النظام الآن يعمل بشكل متكامل مع:
- ✅ تحديث فوري عبر جميع الصفحات
- ✅ قوائم انتظار مخصصة لكل محطة
- ✅ تصميم جميل وسهل الاستخدام
- ✅ بدون scroll أو مشاكل في العرض

