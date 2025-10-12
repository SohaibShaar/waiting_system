import express, { Express, Request, Response } from "express";
import { createServer } from "node:http";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";

// Import routes
import patientRoutes from "./routes/patient.routes";
import queueRoutes from "./routes/queue.routes";
import stationRoutes from "./routes/station.routes";
import statsRoutes from "./routes/stats.routes";
import screenRouter from "./routes/screen.routes";
import receptionRoutes from "./routes/reception.routes";
import labRoutes from "./routes/lab.routes";
import doctorRoutes from "./routes/doctor.routes";
import accountingRoutes from "./routes/accounting.routes";

dotenv.config();

const app: Express = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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
app.use("/api/doctor", doctorRoutes);
app.use("/api/accounting", accountingRoutes);

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
      doctor: "/api/doctor",
      accounting: "/api/accounting",
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

// وظائف إرسال الأحداث
export const emitQueueUpdate = (data: any) => {
  io.emit("queue-updated", data); // Broadcast to all clients
  console.log("📡 Emitted queue-updated to all clients");
};

export const emitNewQueue = (data: any) => {
  io.emit("new-queue", data); // Broadcast to all clients
  console.log("📡 Emitted new-queue to all clients:", data);
};

export const emitQueueCompleted = (data: any) => {
  io.emit("queue-completed", data); // Broadcast to all clients
  console.log("📡 Emitted queue-completed to all clients");
};

export const emitStationUpdate = (stationId: number, data: any) => {
  io.to(`station-${stationId}`).emit("station-updated", data);
  io.to("display-screen").emit("station-updated", data);
  console.log(
    `📡 Emitted station-updated to station-${stationId} and display-screen`
  );
};

export const emitPatientCalled = (data: any) => {
  // إرسال فقط لشاشة العرض لتجنب التكرار
  io.to("display-screen").emit("patient-called", data);
  console.log("📡 Emitted patient-called to display-screen:", {
    queueNumber: data.queueNumber,
    displayNumber: data.displayNumber,
    stationId: data.stationId,
  });
};

export const emitScreenDataUpdate = () => {
  io.to("display-screen").emit("screen-data-updated");
  io.emit("queue-updated", {}); // Trigger update for sidebars
  console.log("📡 Emitted screen-data-updated to display-screen");
};
// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server is ready`);
});
