import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = "http://192.168.1.100:3003";

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to server:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from server");
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Connection error:", error);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // الاشتراك في محطة معينة
  subscribeToStation(stationId: number): void {
    if (this.socket) {
      this.socket.emit("subscribe-station", { stationId });
    }
  }

  // الاشتراك في الشاشة العامة
  subscribeToDisplay(): void {
    if (this.socket) {
      this.socket.emit("subscribe-display");
    }
  }

  // الاستماع للأحداث
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // إرسال الأحداث
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
