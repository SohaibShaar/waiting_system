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
  io.to("display-screen").emit("queue-updated", data);
  console.log("📡 Emitted queue-updated to display-screen");
};

export const emitStationUpdate = (stationId: number, data: any) => {
  io.to(`station-${stationId}`).emit("station-updated", data);
  io.to("display-screen").emit("station-updated", data);
  console.log(
    `📡 Emitted station-updated to station-${stationId} and display-screen`
  );
};

export const emitPatientCalled = (data: any) => {
  io.to("display-screen").emit("patient-called", data);
  console.log("📡 Emitted patient-called to display-screen");
};

export const emitScreenDataUpdate = () => {
  io.to("display-screen").emit("screen-data-updated");
  console.log("📡 Emitted screen-data-updated to display-screen");
};
// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server is ready`);
});
