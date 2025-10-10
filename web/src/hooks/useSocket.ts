import { useEffect, useState, useCallback } from "react";
import { socketService } from "../services/socket";

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(socketService.getSocket());

  useEffect(() => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
    };
  }, []);

  // Memoize the on function to prevent unnecessary re-renders
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.on(event, callback);
  }, []);

  return {
    socket,
    isConnected,
    subscribeToStation: socketService.subscribeToStation.bind(socketService),
    subscribeToDisplay: socketService.subscribeToDisplay.bind(socketService),
    on,
    emit: socketService.emit.bind(socketService),
  };
};
