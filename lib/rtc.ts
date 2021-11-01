import { SocketAdapter } from "./socket-adapter.js";

const retryTime = 3;
const retryInterval = 1500;
export default function rtc(sockOrigin: string, subProtocols?: string | string[]) {
  let sockClient = new SocketAdapter(sockOrigin, subProtocols);

  /* Retry Connection */
  const onClose = () => {
    let attemptCount = retryTime;
    sockClient.lock = true;

    const timer = setInterval(() => {
      const websocket = new WebSocket(sockOrigin, subProtocols);
      websocket.onopen = () => {
        sockClient.reconnect(websocket);
        sockClient.lock = false;
        console.log("Reconnect!")
        clearInterval(timer);
        websocket.onclose = onClose;
      }

      if (--attemptCount <= 0) {
        clearInterval(timer);
        if (websocket.readyState !== 1) throw new Error("WebSocketServer No response");
      }
    }, retryInterval);
  }

  sockClient.sockRef.onclose = onClose;

  return sockClient;
}
