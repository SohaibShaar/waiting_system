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
  socketIO.emit("queue-updated", data); // Broadcast to all clients
  console.log("📡 Emitted queue-updated to all clients");
};

export const emitNewQueue = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("new-queue", data); // Broadcast to all clients
  console.log("📡 Emitted new-queue to all clients:", data);
};

export const emitQueueCompleted = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("queue-completed", data); // Broadcast to all clients
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
  // إرسال فقط لشاشة العرض لتجنب التكرار
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
  socketIO.emit("queue-updated", {}); // Trigger update for sidebars
  console.log("📡 Emitted screen-data-updated to display-screen");
};

export const emitFastPriceUpdate = (data: any) => {
  const socketIO = getIO();
  socketIO.emit("fast-price-updated", data);
  console.log("📡 Emitted fast-price-updated to all clients:", data);
};
