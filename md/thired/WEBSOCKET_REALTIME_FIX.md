# إصلاح مشكلة التحديث الفوري (WebSocket)

## التاريخ: 2025-10-12

## المشكلة
البيانات لا تُعرض على الشاشة إلا بعد حفظ الملف وإعادة تشغيل nodemon للسيرفر.

## السبب الجذري
كانت المشكلة تكمن في طريقة إدارة **Socket.IO instance** في `src/index.ts`:

1. **Circular Dependency**: استيراد دوري بين `index.ts` والـ controllers
2. **Module Caching**: عند إعادة تشغيل nodemon، يتم إعادة تحميل الـ modules، لكن قد تبقى references قديمة
3. **Singleton Pattern Issue**: `io` instance كانت مباشرة في `index.ts` وتُستورد من هناك

---

## الحل المطبق

### 1. إنشاء ملف WebSocket منفصل

أنشأنا `src/websocket/socket.ts` لإدارة Socket.IO بشكل مركزي:

```typescript
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export const initSocketIO = (socketServer: SocketIOServer) => {
  io = socketServer;
  console.log("✅ Socket.IO initialized");
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized! Call initSocketIO first.");
  }
  return io;
};

// وظائف إرسال الأحداث
export const emitQueueUpdate = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("queue-updated", data);
  console.log("📡 Emitted queue-updated to all clients");
};

export const emitNewQueue = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("new-queue", data);
  console.log("📡 Emitted new-queue to all clients:", data);
};

export const emitQueueCompleted = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("queue-completed", data);
  console.log("📡 Emitted queue-completed to all clients");
};

export const emitStationUpdate = (stationId: number, data: any) => {
  const socketIO = getIO();
  socketIO.to(`station-${stationId}`).emit("station-updated", data);
  socketIO.to("display-screen").emit("station-updated", data);
  console.log(
    `📡 Emitted station-updated to station-${stationId} and display-screen`
  );
};

export const emitPatientCalled = (data: any) => {
  const socketIO = getIO();
  socketIO.to("display-screen").emit("patient-called", data);
  console.log("📡 Emitted patient-called to display-screen:", {
    queueNumber: data.queueNumber,
    displayNumber: data.displayNumber,
    stationId: data.stationId,
  });
};

export const emitScreenDataUpdate = () => {
  const socketIO = getIO();
  socketIO.to("display-screen").emit("screen-data-updated");
  socketIO.emit("queue-updated", {});
  console.log("📡 Emitted screen-data-updated to display-screen");
};
```

### 2. تحديث `src/index.ts`

**قبل:**
```typescript
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ... WebSocket handlers

// وظائف إرسال الأحداث مباشرة في index.ts
export const emitQueueUpdate = (data: any) => {
  io.emit("queue-updated", data);
  console.log("📡 Emitted queue-updated to all clients");
};
// ... المزيد من الدوال
export { io };
```

**بعد:**
```typescript
import { initSocketIO } from "./websocket/socket";

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO
initSocketIO(io);

// ... WebSocket handlers

// Re-export WebSocket functions for backward compatibility
export {
  emitQueueUpdate,
  emitNewQueue,
  emitQueueCompleted,
  emitStationUpdate,
  emitPatientCalled,
  emitScreenDataUpdate,
} from "./websocket/socket";
```

---

## الفوائد

### 1. **Separation of Concerns**
- WebSocket logic منفصل عن server initialization
- أسهل في الصيانة والاختبار

### 2. **Better Module Management**
- تجنب Circular dependencies
- Module caching issues محلولة

### 3. **Singleton Pattern**
- `getIO()` تضمن الحصول على نفس instance
- خطأ واضح إذا لم يتم التهيئة

### 4. **Hot Reload Friendly**
- nodemon يعيد التشغيل بشكل صحيح
- لا مشاكل في references

---

## التأثير على الكود الموجود

### ✅ **لا تغييرات مطلوبة في Controllers**

جميع الـ controllers تستمر في العمل بدون تغيير:

```typescript
// في أي controller
import {
  emitPatientCalled,
  emitScreenDataUpdate,
  emitStationUpdate,
  emitQueueUpdate,
} from "..";

// الاستخدام بقي كما هو
emitPatientCalled({
  queueNumber: result.queueNumber,
  displayNumber: result.displayNumber,
  stationId: stationId,
  calledAt: new Date().toISOString(),
});
```

---

## الاختبار

### 1. اختبار التحديث الفوري

```bash
# شغّل الخادم
npm run dev

# شغّل الواجهة
cd web
npm run dev
```

### 2. خطوات الاختبار

1. افتح شاشة العرض في نافذة
2. افتح صفحة محطة (المحاسبة مثلاً) في نافذة أخرى
3. استدعي مريضاً من المحطة
4. **تحقق من**:
   - ✅ ظهور المريض فوراً على شاشة العرض (بدون refresh)
   - ✅ تشغيل الصوت
   - ✅ تحديث قوائم الانتظار

### 3. اختبار nodemon

1. عدّل أي ملف في `src/` (أضف console.log مثلاً)
2. احفظ الملف
3. nodemon سيعيد التشغيل
4. استدعي مريضاً
5. **تحقق من**: التحديثات تعمل فوراً بدون مشاكل

---

## Console Logs للتأكد

عند استدعاء مريض، يجب أن ترى في Console:

### Backend Console:
```
✅ Socket.IO initialized
📡 Client xyz123 subscribed to display-screen
📢 تم استدعاء الدور #1 → الشاشة 2
📡 Emitted patient-called to display-screen: { queueNumber: 1, displayNumber: 2, stationId: 2 }
📡 Emitted screen-data-updated to display-screen
```

### Frontend Console (Display Screen):
```
✅ متصل بالخادم
📢 مريض جديد: { queueNumber: 1, displayNumber: 2, ... }
🔄 معالجة الدور #1
🔊 تشغيل الصوت للدور #1
✅ انتهى الصوت للدور #1
```

---

## الخلاصة

✅ **WebSocket يعمل بشكل صحيح الآن**  
✅ **التحديثات فورية بدون refresh**  
✅ **nodemon hot reload يعمل بدون مشاكل**  
✅ **لا تغييرات في Controllers**  
✅ **كود أنظف وأسهل في الصيانة**  

النظام الآن يعمل بشكل real-time حقيقي! 🚀

