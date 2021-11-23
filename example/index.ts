import express from "express";
import { createServer } from "http";
import { performance } from "perf_hooks";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { regMessengerEvent } from "./routes/messenger/register.js";
import { clientInit } from "./utils/client.js";
import { serverInit } from "./utils/server.js";
import { regRtcEvent } from "./routes/rtc/register.js";
import { regRoomEvent } from "./routes/room/regester.js";

const PORT = 30000;
const DIRNAME = resolve(fileURLToPath(import.meta.url), "..");
const publicPath = resolve(DIRNAME, "..", "..", "public");
const libPath = resolve(DIRNAME, "..");
/* RESTful Application */
const httpServer = express();

console.log({DIRNAME, publicPath, libPath});
httpServer
  .use("/", express.static(publicPath))
  .use("/lib", express.static(libPath));

httpServer
  .get("/health", (_, res) => {
    const runTime = (performance.now() / 1000) | 0;
    let h = (runTime / 3600) | 0;
    let m = ((runTime % 3600) / 60) | 0;
    let s = (runTime % 60) | 0;
    res.status(200).end(`running: ${h} hr ${m} min ${s} sec`);
  });

/* WebSocket Handler */
const sockServer = serverInit(new WebSocketServer({ noServer: true }));
sockServer.on("connection", rawSock => {
  const client = clientInit(rawSock);
  sockServer.users.set(client.sessionId, client);
  regMessengerEvent(sockServer, client);
  regRtcEvent(sockServer, client);
  regRoomEvent(sockServer, client);

  client.on("request::ping-pong", ({ $replyToken , ...payload }) => {
    /* For testing event, return origin payload */
    client.sendout($replyToken, payload);
  })
});

/* Raw Http server */
createServer(httpServer)
  .on("upgrade", (request, socket, head) => {
    sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
      sockServer.emit("connection", ws, request);
    });
  })
  .listen(PORT, "0.0.0.0", () => console.log(`HTTP Server run at http://localhost:${PORT}`));
