/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL_WITHOUT_ROUTE } from "../services/api";

interface QueueUpdate {
  type: "NEW_QUEUE" | "QUEUE_CALLED" | "QUEUE_COMPLETED" | "QUEUE_UPDATED";
  data: any;
}

export const useQueueUpdates = (onUpdate?: (update: QueueUpdate) => void) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const newSocket = io(API_URL_WITHOUT_ROUTE);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ WebSocket متصل");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ WebSocket منفصل");
      setIsConnected(false);
    });

    // Listen for all queue-related events
    newSocket.on("queue-updated", (data: any) => {
      console.log("📋 تحديث الدور:", data);

      setUpdateTrigger((prev) => prev + 1);
      if (onUpdate) {
        onUpdate({ type: "QUEUE_UPDATED", data });
      }
    });

    newSocket.on("patient-called", (data: any) => {
      console.log("📢 استدعاء مراجع:", data);
      setUpdateTrigger((prev) => prev + 1);
      if (onUpdate) {
        onUpdate({ type: "QUEUE_CALLED", data });
      }
    });

    // Listen for new queue creation
    newSocket.on("new-queue", (data: any) => {
      console.log("🆕 دور جديد:", data);
      setUpdateTrigger((prev) => prev + 1);
      if (onUpdate) {
        onUpdate({ type: "NEW_QUEUE", data });
      }
    });

    // Listen for queue completion
    newSocket.on("queue-completed", (data: any) => {
      console.log("✅ اكتمال الدور:", data);
      setUpdateTrigger((prev) => prev + 1);
      if (onUpdate) {
        onUpdate({ type: "QUEUE_COMPLETED", data });
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected, updateTrigger };
};
