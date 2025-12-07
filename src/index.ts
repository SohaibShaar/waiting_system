import express, { Express, Request, Response } from "express";
import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import cron from "node-cron";

// Import routes
import patientRoutes from "./routes/patient.routes";
import queueRoutes from "./routes/queue.routes";
import stationRoutes from "./routes/station.routes";
import statsRoutes from "./routes/stats.routes";
import screenRouter from "./routes/screen.routes";
import receptionRoutes from "./routes/reception.routes";
import labRoutes from "./routes/lab.routes";
import bloodDrawRoutes from "./routes/bloodDraw.routes";
import bloodTypeRoutes from "./routes/bloodType.routes";
import doctorRoutes from "./routes/doctor.routes";
import accountingRoutes from "./routes/accounting.routes";
import authRoutes from "./routes/auth.routes";
import archiveRoutes from "./routes/archive.routes";

// Import WebSocket functions
import { initSocketIO } from "./websocket/socket";
import favPricesRoutes from "./routes/favPrices.routes";
import fastPriceRoutes from "./routes/fastPrice.routes";
import { performDailyArchive } from "./services/archive.service";

dotenv.config();

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize Socket.IO
initSocketIO(io);

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/display", screenRouter);
app.use("/api/reception", receptionRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/blood-draw", bloodDrawRoutes);
app.use("/api/blood-type", bloodTypeRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/accounting", accountingRoutes);
app.use("/api/favPrices", favPricesRoutes);
app.use("/api/fastPrice", fastPriceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/archive", archiveRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🏥 نظام إدارة الأدوار - Queue Management System",
    version: "1.0.0",
    endpoints: {
      patients: "/api/patients",
      queue: "/api/queue",
      stations: "/api/stations",
      stats: "/api/stats",
      display: "/api/display",
      reception: "/api/reception",
      lab: "/api/lab",
      bloodDraw: "/api/blood-draw",
      bloodType: "/api/blood-type",
      doctor: "/api/doctor",
      accounting: "/api/accounting",
      archive: "/api/archive",
    },
  });
});

// WebSocket connection
io.on("connection", (socket: any) => {
  console.log("✅ Client connected:", socket.id);

  // الاشتراك في محطة معينة
  socket.on("subscribe-station", ({ stationId }: { stationId: number }) => {
    socket.join(`station-${stationId}`);
    console.log(`📡 Client ${socket.id} subscribed to station ${stationId}`);
  });

  // الاشتراك في الشاشة العامة
  socket.on("subscribe-display", () => {
    socket.join("display-screen");
    console.log(`📺 Client ${socket.id} subscribed to display screen`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Re-export WebSocket functions for backward compatibility
export {
  emitQueueUpdate,
  emitNewQueue,
  emitQueueCompleted,
  emitStationUpdate,
  emitPatientCalled,
  emitScreenDataUpdate,
} from "./websocket/socket";

// ============================================
// Scheduled Tasks - المهام المجدولة
// ============================================

/**
 * مهمة الأرشفة اليومية التلقائية
 * تعمل يومياً في الساعة 00:00 (منتصف الليل)
 * يمكن تغيير الوقت من متغير البيئة ARCHIVE_SCHEDULE_TIME
 * مثال: "0 0 * * *" = منتصف الليل يومياً
 * مثال: "0 2 * * *" = الساعة 2 صباحاً يومياً
 */
const archiveScheduleTime = process.env.ARCHIVE_SCHEDULE_TIME || "0 0 * * *";

cron.schedule(archiveScheduleTime, async () => {
  console.log("⏰ تشغيل مهمة الأرشفة اليومية التلقائية...");
  try {
    await performDailyArchive();
  } catch (error: any) {
    console.error("❌ فشلت مهمة الأرشفة التلقائية:", error);
  }
});

console.log(`📅 تم جدولة مهمة الأرشفة اليومية في: ${archiveScheduleTime}`);

// ============================================
// Server Start
// ============================================

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server is ready`);
  console.log(`📅 Daily archive scheduled at: ${archiveScheduleTime}`);
});
