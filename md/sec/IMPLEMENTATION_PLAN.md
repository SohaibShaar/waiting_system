# 📋 خطة التنفيذ الشاملة - نظام إدارة الأدوار

## 🎯 نظرة عامة

هذا الدليل يوضح خطوات التنفيذ الكاملة لبناء نظام إدارة أدوار المرضى من البداية إلى النهاية.

---

## 📦 المتطلبات الأساسية

### **تقنيات مستخدمة:**
- ✅ **Backend:** Node.js + TypeScript + Express
- ✅ **Database:** MySQL + Prisma ORM
- ✅ **Frontend:** React + TypeScript + Vite
- ✅ **Real-time:** Socket.io
- ✅ **Styling:** Tailwind CSS / Material-UI

### **قبل البدء:**
```bash
# تأكد من تثبيت:
- Node.js (v18 أو أحدث)
- MySQL Server
- npm أو yarn
```

---

## 🚀 المرحلة 1: إعداد قاعدة البيانات

### **الخطوة 1.1: تشغيل Migration**
```bash
# في المجلد الرئيسي للمشروع
npx prisma migrate dev --name init_queue_system
```

### **الخطوة 1.2: توليد Prisma Client**
```bash
npx prisma generate
```

### **الخطوة 1.3: إضافة البيانات الأولية (Seed)**
```bash
# إنشاء ملف prisma/seed.ts
npx prisma db seed
```

**محتوى ملف `prisma/seed.ts`:**
```typescript
import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // إنشاء المحطات
  await prisma.station.createMany({
    data: [
      { name: 'الاستقبال', displayNumber: 1, order: 1 },
      { name: 'الفحص الأولي', displayNumber: 2, order: 2 },
      { name: 'الطبيب', displayNumber: 3, order: 3 },
    ],
  });

  // إعدادات النظام
  await prisma.systemSettings.createMany({
    data: [
      { key: 'LAST_QUEUE_NUMBER', value: '0' },
    ],
  });

  console.log('✅ تم إضافة البيانات الأولية');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
```

**إضافة في `package.json`:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 🔧 المرحلة 2: بناء Backend API

### **الخطوة 2.1: بنية المشروع**
```
src/
├── index.ts                    # نقطة البداية
├── config/
│   └── database.ts             # إعدادات Prisma
├── services/
│   ├── queue.service.ts        # خدمات الأدوار
│   ├── patient.service.ts      # خدمات المرضى
│   ├── station.service.ts      # خدمات المحطات
│   └── stats.service.ts        # الإحصائيات
├── routes/
│   ├── queue.routes.ts
│   ├── patient.routes.ts
│   ├── station.routes.ts
│   └── stats.routes.ts
├── controllers/
│   ├── queue.controller.ts
│   ├── patient.controller.ts
│   ├── station.controller.ts
│   └── stats.controller.ts
├── middlewares/
│   ├── error.middleware.ts
│   └── validation.middleware.ts
├── websocket/
│   └── socket.handlers.ts      # WebSocket handlers
└── types/
    └── index.ts                # TypeScript types
```

### **الخطوة 2.2: إنشاء Services**

انسخ الدوال من ملف `QUEUE_SERVICE_EXAMPLES.ts` إلى الـ services المناسبة.

**مثال: `src/services/queue.service.ts`**
```typescript
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class QueueService {
  async createQueue(data) { /* ... */ }
  async getStationWaitingList(stationId) { /* ... */ }
  async callNextPatient(stationId) { /* ... */ }
  // ... باقي الدوال
}

export default new QueueService();
```

### **الخطوة 2.3: إنشاء Controllers**

**مثال: `src/controllers/queue.controller.ts`**
```typescript
import { Request, Response } from 'express';
import queueService from '../services/queue.service';

export class QueueController {
  async create(req: Request, res: Response) {
    try {
      const result = await queueService.createQueue(req.body);
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getWaitingList(req: Request, res: Response) {
    try {
      const stationId = parseInt(req.params.stationId);
      const list = await queueService.getStationWaitingList(stationId);
      res.json({ success: true, waiting: list });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // ... باقي الدوال
}

export default new QueueController();
```

### **الخطوة 2.4: إنشاء Routes**

**مثال: `src/routes/queue.routes.ts`**
```typescript
import { Router } from 'express';
import queueController from '../controllers/queue.controller';

const router = Router();

router.post('/create', queueController.create);
router.get('/active', queueController.getActive);
router.get('/:id', queueController.getById);
router.put('/:id/priority', queueController.updatePriority);
router.delete('/:id/cancel', queueController.cancel);

export default router;
```

### **الخطوة 2.5: إعداد Express Server**

**ملف `src/index.ts`:**
```typescript
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import queueRoutes from './routes/queue.routes';
import stationRoutes from './routes/station.routes';
import statsRoutes from './routes/stats.routes';
import { setupWebSocket } from './websocket/socket.handlers';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/queue', queueRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/stats', statsRoutes);

// WebSocket
setupWebSocket(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### **الخطوة 2.6: إعداد WebSocket**

**ملف `src/websocket/socket.handlers.ts`:**
```typescript
import { Server } from 'socket.io';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // الاشتراك في محطة معينة
    socket.on('subscribe-station', ({ stationId }) => {
      socket.join(`station-${stationId}`);
      console.log(`📡 Client subscribed to station ${stationId}`);
    });

    // الاشتراك في الشاشة العامة
    socket.on('subscribe-display', () => {
      socket.join('display-screen');
      console.log('📺 Client subscribed to display screen');
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
}

// دوال لإرسال الإشعارات
export function emitPatientCalled(io: Server, data: any) {
  io.to(`station-${data.stationId}`).emit('patient-called', data);
  io.to('display-screen').emit('display-updated', data);
}

export function emitWaitingListUpdated(io: Server, stationId: number, data: any) {
  io.to(`station-${stationId}`).emit('waiting-list-updated', data);
}
```

---

## 🎨 المرحلة 3: بناء Frontend

### **الخطوة 3.1: بنية المشروع**
```
web/src/
├── pages/
│   ├── Reception.tsx           # واجهة الاستقبال
│   ├── Station.tsx             # واجهة المحطة (عامة)
│   ├── DisplayScreen.tsx       # الشاشة العامة
│   └── Dashboard.tsx           # لوحة التحكم والإحصائيات
├── components/
│   ├── QueueList.tsx           # قائمة الأدوار
│   ├── PatientCard.tsx         # بطاقة المريض
│   ├── StationHeader.tsx       # رأس المحطة
│   ├── CallButton.tsx          # زر الاستدعاء
│   └── StatsWidget.tsx         # عرض الإحصائيات
├── services/
│   ├── api.service.ts          # استدعاءات API
│   └── socket.service.ts       # WebSocket
├── hooks/
│   ├── useQueue.ts             # Hook للأدوار
│   ├── useStation.ts           # Hook للمحطة
│   └── useWebSocket.ts         # Hook للـ WebSocket
├── context/
│   └── StationContext.tsx      # Context للمحطة
└── utils/
    ├── formatters.ts           # دوال تنسيق
    └── constants.ts            # ثوابت
```

### **الخطوة 3.2: إنشاء API Service**

**ملف `web/src/services/api.service.ts`:**
```typescript
const API_BASE = 'http://localhost:3000/api';

export const api = {
  // الأدوار
  createQueue: (data: any) =>
    fetch(`${API_BASE}/queue/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getWaitingList: (stationId: number) =>
    fetch(`${API_BASE}/stations/${stationId}/waiting-list`).then(r => r.json()),

  callNext: (stationId: number, calledBy: string) =>
    fetch(`${API_BASE}/stations/${stationId}/call-next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calledBy }),
    }).then(r => r.json()),

  startService: (stationId: number, queueId: number) =>
    fetch(`${API_BASE}/stations/${stationId}/start-service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId }),
    }).then(r => r.json()),

  completeService: (stationId: number, queueId: number, notes?: string) =>
    fetch(`${API_BASE}/stations/${stationId}/complete-service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, notes }),
    }).then(r => r.json()),

  // الإحصائيات
  getTodayStats: () =>
    fetch(`${API_BASE}/stats/today`).then(r => r.json()),
};
```

### **الخطوة 3.3: إنشاء WebSocket Service**

**ملف `web/src/services/socket.service.ts`:**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io('http://localhost:3000');
    
    this.socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    return this.socket;
  }

  subscribeToStation(stationId: number) {
    this.socket?.emit('subscribe-station', { stationId });
  }

  subscribeToDisplay() {
    this.socket?.emit('subscribe-display');
  }

  onPatientCalled(callback: (data: any) => void) {
    this.socket?.on('patient-called', callback);
  }

  onWaitingListUpdated(callback: (data: any) => void) {
    this.socket?.on('waiting-list-updated', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default new SocketService();
```

### **الخطوة 3.4: إنشاء Custom Hooks**

**ملف `web/src/hooks/useStation.ts`:**
```typescript
import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import socketService from '../services/socket.service';

export function useStation(stationId: number) {
  const [waitingList, setWaitingList] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تحميل القائمة
    loadWaitingList();

    // الاشتراك في WebSocket
    socketService.subscribeToStation(stationId);
    socketService.onWaitingListUpdated((data) => {
      setWaitingList(data.waitingList);
    });

    return () => {
      socketService.disconnect();
    };
  }, [stationId]);

  const loadWaitingList = async () => {
    setLoading(true);
    const result = await api.getWaitingList(stationId);
    setWaitingList(result.waiting || []);
    setLoading(false);
  };

  const callNext = async () => {
    const result = await api.callNext(stationId, 'موظف');
    if (result.success) {
      await loadWaitingList();
    }
    return result;
  };

  const startService = async (queueId: number) => {
    return await api.startService(stationId, queueId);
  };

  const completeService = async (queueId: number, notes?: string) => {
    const result = await api.completeService(stationId, queueId, notes);
    if (result.success) {
      await loadWaitingList();
    }
    return result;
  };

  return {
    waitingList,
    currentPatient,
    loading,
    callNext,
    startService,
    completeService,
    refresh: loadWaitingList,
  };
}
```

### **الخطوة 3.5: إنشاء Components**

**ملف `web/src/components/QueueList.tsx`:**
```tsx
import React from 'react';

interface Props {
  queues: any[];
  onSelectQueue?: (queue: any) => void;
}

export function QueueList({ queues, onSelectQueue }: Props) {
  return (
    <div className="space-y-2">
      {queues.map((queue) => (
        <div
          key={queue.id}
          onClick={() => onSelectQueue?.(queue)}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">الدور #{queue.queueNumber}</h3>
              <p className="text-gray-600">{queue.patient.name}</p>
            </div>
            {queue.priority > 0 && (
              <span className="px-2 py-1 bg-red-500 text-white rounded">
                أولوية
              </span>
            )}
          </div>
        </div>
      ))}
      {queues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          لا يوجد مرضى في الانتظار
        </div>
      )}
    </div>
  );
}
```

### **الخطوة 3.6: إنشاء الصفحات**

**ملف `web/src/pages/Station.tsx`:**
```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useStation } from '../hooks/useStation';
import { QueueList } from '../components/QueueList';

export function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const {
    waitingList,
    currentPatient,
    loading,
    callNext,
    completeService,
  } = useStation(Number(stationId));

  const handleCallNext = async () => {
    const result = await callNext();
    if (result.success) {
      alert(`تم استدعاء الدور #${result.queueNumber}`);
    }
  };

  const handleComplete = async () => {
    if (!currentPatient) return;
    const result = await completeService(currentPatient.id);
    if (result.success) {
      if (result.moved) {
        alert(`انتقل للمحطة ${result.nextStation.name}`);
      } else {
        alert('انتهى الدور بالكامل!');
      }
    }
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">المحطة {stationId}</h1>

      {/* المريض الحالي */}
      {currentPatient && (
        <div className="mb-6 p-6 bg-blue-100 rounded-lg">
          <h2 className="text-2xl mb-2">المريض الحالي</h2>
          <p className="text-xl">الدور #{currentPatient.queueNumber}</p>
          <p>{currentPatient.patient.name}</p>
          <button
            onClick={handleComplete}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded"
          >
            إنهاء الخدمة
          </button>
        </div>
      )}

      {/* زر الاستدعاء */}
      <button
        onClick={handleCallNext}
        disabled={waitingList.length === 0}
        className="w-full mb-4 px-6 py-4 bg-blue-500 text-white text-xl rounded disabled:bg-gray-300"
      >
        استدعاء المريض التالي
      </button>

      {/* قائمة الانتظار */}
      <h2 className="text-2xl font-bold mb-4">
        قائمة الانتظار ({waitingList.length})
      </h2>
      <QueueList queues={waitingList} />
    </div>
  );
}
```

**ملف `web/src/pages/DisplayScreen.tsx`:**
```tsx
import React, { useEffect, useState } from 'react';
import socketService from '../services/socket.service';

export function DisplayScreen() {
  const [calls, setCalls] = useState([]);

  useEffect(() => {
    socketService.connect();
    socketService.subscribeToDisplay();

    socketService.socket?.on('display-updated', (data) => {
      setCalls((prev) => [data, ...prev].slice(0, 10));
    });

    return () => socketService.disconnect();
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-8">
        <h1 className="text-5xl font-bold text-center mb-12">
          الاستدعاءات
        </h1>

        <div className="space-y-4">
          {calls.map((call, index) => (
            <div
              key={index}
              className={`p-6 rounded-lg ${
                index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="text-4xl font-bold">
                  الدور {call.queueNumber}
                </div>
                <div className="text-4xl">
                  → الشاشة {call.displayNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 المرحلة 4: الاختبار

### **الخطوة 4.1: اختبار API**
```bash
# تثبيت أدوات الاختبار
npm install --save-dev jest @types/jest supertest
```

### **الخطوة 4.2: اختبار Services**
```typescript
// tests/queue.service.test.ts
describe('QueueService', () => {
  it('should create new queue', async () => {
    const result = await queueService.createQueue({
      name: 'Test Patient',
      phoneNumber: '0500000000',
    });
    expect(result.queueNumber).toBe(1);
  });
});
```

---

## 🚢 المرحلة 5: النشر (Deployment)

### **الخطوة 5.1: إعداد Production Build**
```bash
# Backend
npm run build

# Frontend
cd web && npm run build
```

### **الخطوة 5.2: Docker (اختياري)**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## ✅ قائمة المراجعة النهائية

- [ ] قاعدة البيانات تعمل بشكل صحيح
- [ ] جميع الـ API endpoints تعمل
- [ ] WebSocket يرسل التحديثات بشكل صحيح
- [ ] واجهات جميع المحطات تعمل
- [ ] الشاشة العامة تعرض الاستدعاءات
- [ ] الإحصائيات تحسب بشكل صحيح
- [ ] إعادة تعيين الأرقام اليومية تعمل
- [ ] النظام يتعامل مع الأخطاء بشكل صحيح

---

## 📚 الموارد المساعدة

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)

---

**🎉 بالتوفيق في التنفيذ!**

