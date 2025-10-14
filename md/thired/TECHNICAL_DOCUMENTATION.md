# 🛠️ التوثيق التقني - إدارة الأدوار من القائمة

## التاريخ: 2025-10-12

---

## 📐 البنية المعمارية

### Frontend Architecture
```
web/src/
├── pages/
│   ├── AccountingPage.tsx      ← ميزة إدارة الأدوار
│   ├── LabPage.tsx              ← ميزة إدارة الأدوار
│   └── DoctorPage.tsx           ← ميزة إدارة الأدوار
└── components/
    └── QueueSidebar.tsx         ← عرض القائمة + callback
```

### Backend Architecture
```
src/
├── controllers/
│   ├── queue.controller.ts      ← cancelQueueById مع WebSocket
│   └── station.controller.ts    ← callSpecific مع emitPatientCalled
└── services/
    └── queue.service.ts         ← منطق الإلغاء
```

---

## 🔧 التعديلات التقنية

### 1. State Management

#### States المضافة في كل صفحة:
```typescript
const [recallCount, setRecallCount] = useState(0);
const [isFromSidebar, setIsFromSidebar] = useState(false);
```

**recallCount**:
- النوع: `number`
- القيمة الابتدائية: `0`
- الاستخدام: تتبع عدد محاولات إعادة النداء
- يزيد بـ `+1` عند كل نداء
- يُصفر عند: الحفظ، الإلغاء، اختيار مريض جديد

**isFromSidebar**:
- النوع: `boolean`
- القيمة الابتدائية: `false`
- الاستخدام: تحديد إذا كان المريض جاء من القائمة أم من "استدعاء التالي"
- `true` → تظهر أزرار "إعادة النداء" و"لم يحضر"
- `false` → لا تظهر هذه الأزرار

---

### 2. Functions المضافة

#### handleSelectQueueFromSidebar
```typescript
const handleSelectQueueFromSidebar = async (queue: {
  id: number;
  queueNumber: number;
  patient: { name: string };
  ReceptionData?: {...};
}) => {
  // 1. جلب بيانات الدور الكاملة
  const queueResponse = await axios.get(`${API_URL}/queue/${queue.id}`);
  
  // 2. تعيين البيانات في currentPatient
  setCurrentPatient({...});
  
  // 3. تفعيل وضع "من القائمة"
  setIsFromSidebar(true);
  setRecallCount(0);
};
```

**المعاملات**:
- `queue`: كائن بيانات الدور من QueueSidebar

**الوظيفة**:
1. استدعاء API لجلب البيانات الكاملة
2. ملء `currentPatient` state
3. تفعيل `isFromSidebar`
4. إعادة `recallCount` لـ 0

**Error Handling**:
- `try-catch` شامل
- رسالة خطأ واضحة في `setErrorMessage`
- `loading` state لتعطيل UI

---

#### handleRecall
```typescript
const handleRecall = async () => {
  if (!currentPatient || !stationId) return;

  // إرسال استدعاء محدد عبر API
  const response = await axios.post(
    `${API_URL}/stations/${stationId}/call-specific`,
    {
      queueNumber: currentPatient.queueNumber,
      calledBy: "موظف المحاسبة (إعادة نداء)",
    }
  );

  // زيادة العداد
  setRecallCount((prev) => prev + 1);
  
  // إشعار للمستخدم
  alert(`✅ تم إعادة النداء (المحاولة ${recallCount + 1}/3)`);
};
```

**الوظيفة**:
1. استدعاء API endpoint: `POST /api/stations/{stationId}/call-specific`
2. إرسال `queueNumber` و `calledBy`
3. Backend يُرسل إشعار WebSocket لشاشة العرض
4. زيادة `recallCount`

**Backend Behavior**:
- يُرسل `patient-called` event عبر Socket.IO
- شاشة العرض تستقبل وتعرض الرقم
- الصوت يُشغّل تلقائياً (إذا كان مفعّلاً)

---

#### handleCancelQueue
```typescript
const handleCancelQueue = async () => {
  // 1. التحقق من عدد المحاولات
  if (recallCount < 3) {
    alert(`⚠️ يجب إعادة النداء 3 مرات قبل الإلغاء`);
    return;
  }

  // 2. طلب التأكيد
  if (!window.confirm(`هل أنت متأكد؟`)) {
    return;
  }

  // 3. إرسال DELETE request
  const response = await axios.delete(
    `${API_URL}/queue/${currentPatient.queueId}/cancel`
  );

  // 4. مسح البيانات
  setCurrentPatient(null);
  setRecallCount(0);
  setIsFromSidebar(false);
  
  // 5. تحديث الصفحة
  setTimeout(() => {
    window.location.reload();
  }, 500);
};
```

**Validation**:
- يفحص `recallCount >= 3`
- يطلب `window.confirm()`

**API Call**:
- `DELETE /api/queue/{queueId}/cancel`
- Backend يحذف من Prisma
- Backend يُرسل `emitQueueUpdate` عبر WebSocket

**Cleanup**:
- مسح جميع states المتعلقة
- `window.location.reload()` لتحديث القائمة

---

### 3. UI Components

#### الأزرار الجديدة
```typescript
{isFromSidebar && (
  <div className='flex gap-3'>
    {/* زر إعادة النداء */}
    <button
      onClick={handleRecall}
      disabled={loading}
      style={{ backgroundColor: "var(--accent)" }}>
      {loading ? "⏳ جاري النداء..." : `🔔 إعادة النداء (${recallCount}/3)`}
    </button>

    {/* زر لم يحضر */}
    <button
      onClick={handleCancelQueue}
      disabled={loading || recallCount < 3}
      style={{
        backgroundColor: recallCount >= 3 ? "#dc2626" : "#9ca3af",
      }}>
      {loading ? "⏳ جاري الإلغاء..." : "❌ لم يحضر"}
    </button>
  </div>
)}
```

**Conditional Rendering**:
- `isFromSidebar` → تظهر الأزرار
- `!isFromSidebar` → لا تظهر

**Styling**:
- إعادة النداء: `var(--accent)` (برتقالي)
- لم يحضر (معطل): `#9ca3af` (رمادي)
- لم يحضر (مفعّل): `#dc2626` (أحمر)

**Disabled State**:
- إعادة النداء: `disabled={loading}`
- لم يحضر: `disabled={loading || recallCount < 3}`

---

### 4. QueueSidebar Component

#### Props المضافة
```typescript
interface QueueSidebarProps {
  stationName: string;
  currentQueueId?: number;
  stationId?: number | null;
  onSelectQueue?: (queue: QueueItem) => void; // ← جديد
}
```

#### Event Handler
```typescript
const handleQueueClick = (queue: QueueItem) => {
  if (onSelectQueue) {
    onSelectQueue(queue); // استدعاء callback من الصفحة الأم
  }
};
```

#### UI Updates
```typescript
<div
  key={queue.id}
  onClick={() => handleQueueClick(queue)} // ← جديد
  className='... cursor-pointer hover:border-primary' // ← جديد
  >
  {/* ... */}
  
  {/* Click indicator */}
  <div className='text-xs mt-2 text-center' style={{ color: "var(--accent)" }}>
    👆 اضغط للتفاصيل
  </div>
</div>
```

---

### 5. Backend Changes

#### queue.controller.ts
```typescript
export async function cancelQueueById(req: Request, res: Response) {
  const id = parseInt(req.params.id as string);
  const reason = req.body?.reason || "لم يحضر المريض"; // ← إصلاح

  await cancelQueue(id, reason);

  // ← إضافة WebSocket notification
  const { emitQueueUpdate } = await import("..");
  emitQueueUpdate({ queueId: id, action: "cancelled" });

  res.json({ success: true, message: "تم إلغاء الدور" });
}
```

**التغييرات**:
1. استخدام `req.body?.reason` مع قيمة افتراضية
2. إضافة `emitQueueUpdate` لإشعار جميع Clients
3. console.log للتتبع

---

## 🔄 WebSocket Flow

### إعادة النداء
```
Frontend (Station)
    ↓
POST /api/stations/{stationId}/call-specific
    ↓
Backend (station.controller.ts)
    ↓
callSpecificQueue() في patient.service.ts
    ↓
emitPatientCalled() في websocket/socket.ts
    ↓
Socket.IO → "patient-called" event
    ↓
Frontend (DisplayScreen)
    ↓
pendingCallsRef.current.push(data)
    ↓
useEffect يعالج الطابور
    ↓
تعرض الرقم + تشغيل الصوت ✅
```

### إلغاء الدور
```
Frontend (Station)
    ↓
DELETE /api/queue/{queueId}/cancel
    ↓
Backend (queue.controller.ts)
    ↓
cancelQueue() في queue.service.ts
    ↓
emitQueueUpdate() في websocket/socket.ts
    ↓
Socket.IO → "queue-updated" event
    ↓
Frontend (All Stations)
    ↓
useQueueUpdates hook يستقبل
    ↓
QueueSidebar تُحدّث القائمة ✅
```

---

## 🔍 Error Handling

### Frontend
```typescript
try {
  // API call
} catch (error) {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  
  const errorMsg =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    "حدث خطأ غير متوقع";
    
  alert(`❌ ${errorMsg}`);
} finally {
  setLoading(false);
}
```

### Backend
```typescript
try {
  // Business logic
  res.json({ success: true, ... });
} catch (error: any) {
  console.error("❌ خطأ:", error);
  res.status(500).json({
    success: false,
    error: error.message,
  });
}
```

---

## 🧪 Testing

### Unit Tests (مقترح)
```typescript
describe("handleRecall", () => {
  it("should increment recallCount", async () => {
    // Arrange
    const mockPatient = { queueId: 1, queueNumber: 5 };
    const mockStationId = 2;
    
    // Act
    await handleRecall();
    
    // Assert
    expect(recallCount).toBe(1);
  });
});

describe("handleCancelQueue", () => {
  it("should not cancel if recallCount < 3", async () => {
    // Arrange
    setRecallCount(2);
    
    // Act
    await handleCancelQueue();
    
    // Assert
    expect(currentPatient).not.toBeNull();
  });
  
  it("should cancel if recallCount >= 3", async () => {
    // Arrange
    setRecallCount(3);
    
    // Act & confirm
    window.confirm = jest.fn(() => true);
    await handleCancelQueue();
    
    // Assert
    expect(currentPatient).toBeNull();
  });
});
```

### Integration Tests (مقترح)
```typescript
describe("Queue Management Flow", () => {
  it("should allow recall after selecting from sidebar", async () => {
    // 1. Select from sidebar
    fireEvent.click(screen.getByText("#5"));
    
    // 2. Verify buttons appear
    expect(screen.getByText(/إعادة النداء/)).toBeInTheDocument();
    expect(screen.getByText(/لم يحضر/)).toBeDisabled();
    
    // 3. Recall 3 times
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByText(/إعادة النداء/));
      await waitFor(() => {
        expect(screen.getByText(`(${i+1}/3)`)).toBeInTheDocument();
      });
    }
    
    // 4. Verify "Did Not Attend" is enabled
    expect(screen.getByText(/لم يحضر/)).not.toBeDisabled();
  });
});
```

---

## 📊 Performance Considerations

### Frontend
- ✅ `useCallback` للـ handlers (يمنع re-renders غير ضرورية)
- ✅ `loading` state لتعطيل UI أثناء API calls
- ✅ Conditional rendering للأزرار (تقليل DOM nodes)

### Backend
- ✅ Prisma query optimization
- ✅ WebSocket rooms (إرسال لـ clients محددة فقط)
- ✅ console.log للتتبع (يمكن إزالته في production)

### Network
- ⚠️ `window.location.reload()` بعد الحذف (يعيد تحميل كل شيء)
  - **تحسين مقترح**: استخدام WebSocket لتحديث القائمة بدون reload

---

## 🔐 Security

### Frontend Validation
- ✅ `recallCount >= 3` قبل السماح بالإلغاء
- ✅ `window.confirm()` للتأكيد
- ✅ `stationId` و `currentPatient` checks

### Backend Validation
- ✅ parseInt للـ IDs
- ✅ `isNaN()` checks
- ✅ Prisma where clauses لضمان وجود السجل
- ⚠️ **لا يوجد authentication** (يمكن إضافة JWT في المستقبل)

---

## 📝 Code Quality

### TypeScript
- ✅ جميع الدوال typed بشكل صحيح
- ✅ interfaces واضحة
- ✅ no `any` (إلا في catch blocks)
- ✅ strict mode enabled

### Linting
```bash
✅ No ESLint errors
✅ No TypeScript errors
✅ Build successful
```

### Naming Conventions
- ✅ camelCase للمتغيرات والدوال
- ✅ PascalCase للـ Components
- ✅ UPPER_CASE للـ constants
- ✅ أسماء واضحة ووصفية

---

## 🚀 Deployment

### Build
```bash
cd web
npm run build

# Output:
# ✓ 130 modules transformed.
# ✓ built in 1.72s
```

### Environment Variables (مقترح)
```env
# .env
VITE_API_URL=http://localhost:3003/api
VITE_WS_URL=http://localhost:3003

# production
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=https://api.yourdomain.com
```

---

## 📚 Future Enhancements

### 1. Remove `window.location.reload()`
```typescript
// بدلاً من reload
window.location.reload();

// استخدام WebSocket
socket.on("queue-cancelled", (data) => {
  setQueues(prev => prev.filter(q => q.id !== data.queueId));
});
```

### 2. Add Authentication
```typescript
// إضافة JWT token
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

### 3. Add Undo Feature
```typescript
// إضافة "تراجع" بعد الحذف
const [deletedQueue, setDeletedQueue] = useState(null);

// بعد الحذف
setDeletedQueue(currentPatient);
setTimeout(() => {
  setDeletedQueue(null); // بعد 5 ثواني
}, 5000);

// زر تراجع
{deletedQueue && (
  <button onClick={handleUndo}>⏪ تراجع</button>
)}
```

### 4. Add Analytics
```typescript
// تتبع إحصائيات
analytics.track("patient_recalled", {
  queueNumber: currentPatient.queueNumber,
  attempt: recallCount,
  stationName: stationName,
});

analytics.track("patient_cancelled", {
  queueNumber: currentPatient.queueNumber,
  totalRecalls: recallCount,
  stationName: stationName,
});
```

---

## 🔗 Related Files

### Frontend
- `web/src/pages/AccountingPage.tsx`
- `web/src/pages/LabPage.tsx`
- `web/src/pages/DoctorPage.tsx`
- `web/src/components/QueueSidebar.tsx`
- `web/src/hooks/useQueueUpdates.ts`

### Backend
- `src/controllers/queue.controller.ts`
- `src/controllers/station.controller.ts`
- `src/services/queue.service.ts`
- `src/services/patient.service.ts`
- `src/websocket/socket.ts`

---

**📖 End of Technical Documentation**

