import { useEffect, useRef } from "react";
import { requestNotificationPermission, showDesktopNotification } from "../utils/notifications";

export interface User {
  id?: number | string;
  [key: string]: any;
}

export function useRealtimeNotifications(currentUser: User | null | undefined): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestNotificationPermission();

    if (!currentUser || currentUser.id === undefined || currentUser.id === null) {
      return;
    }

    const userIdStr = String(currentUser.id);
    let isMounted = true;

    const connectWebSocket = () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }

      // Defer instantiation by 50ms so React StrictMode double-mount pass finishes first
      connectTimeoutRef.current = setTimeout(() => {
        if (!isMounted) return;

        if (
          wsRef.current &&
          (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
        ) {
          return;
        }

        const hostname = window.location.hostname;
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${hostname}:8000/ws/notifications/${userIdStr}`;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          console.log(`[WS] Connected successfully for User #${userIdStr}`);
        };

        socket.onmessage = (event: MessageEvent) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            showDesktopNotification(data.title || "IT Service Desk", {
              body: data.message,
              url: data.link || "/tickets",
            });
          } catch (err) {
            console.error("[WS] Error parsing JSON payload:", err);
          }
        };

        socket.onerror = (error) => {
          if (!isMounted || socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
            return;
          }
          console.warn("[WS] Socket error event:", error);
        };

        socket.onclose = (event) => {
          if (!isMounted) return;
          console.log(`[WS] Connection closed (code ${event.code}). Retrying in 3s...`);
          wsRef.current = null;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connectWebSocket();
            }
          }, 3000);
        };
      }, 50);
    };

    connectWebSocket();

    return () => {
      isMounted = false;

      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        const socket = wsRef.current;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Component unmounted");
        } else if (socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
        wsRef.current = null;
      }
    };
  }, [currentUser?.id]);
}