import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE, TOKEN_KEY } from "../utils/api";

/**
 * 채팅 WebSocket 훅.
 *
 * @param {string} roomId — 채팅방 ID (예: "community")
 * @param {object} handlers — { onMessage, onDeleted, onError, onJoined }
 * @returns { sendMessage, deleteMessage, status }
 */
export function useChatSocket(roomId, handlers = {}) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [status, setStatus] = useState("connecting"); // connecting|open|closed|error
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus("error");
      return;
    }
    const url = `${WS_BASE}/v1/community/ws?token=${encodeURIComponent(token)}`;
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.error("[useChatSocket] connect failed", e);
      setStatus("error");
      return;
    }
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => {
      setStatus("open");
      // 룸 join 메시지 전송
      ws.send(JSON.stringify({ type: "room.join", payload: { roomId } }));
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const { type, payload } = msg || {};
      switch (type) {
        case "room.joined":
          handlersRef.current.onJoined?.(payload);
          break;
        case "message.new":
          handlersRef.current.onMessage?.(payload);
          break;
        case "message.deleted":
          handlersRef.current.onDeleted?.(payload);
          break;
        case "error":
          handlersRef.current.onError?.(payload);
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("closed");
      // 자동 재접속 (3초 후)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
      wsRef.current = null;
    };
  }, [connect]);

  const sendMessage = useCallback((messageType, content, fileId) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(
      JSON.stringify({
        type: "message.send",
        payload: { roomId, messageType, content, fileId },
      })
    );
    return true;
  }, [roomId]);

  const deleteMessage = useCallback((messageId) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(
      JSON.stringify({
        type: "message.delete",
        payload: { messageId },
      })
    );
    return true;
  }, []);

  return { sendMessage, deleteMessage, status };
}
