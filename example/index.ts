import express from "express";
import { createServer } from "http";
import { performance } from "perf_hooks";
import { WebSocketServer } from "ws";
import { regMessengerEvent } from "./routes/messenger/register.js";
import { clientInit } from "./utils/client.js";
import { serverInit } from "./utils/server.js";

const PORT = 30000;

/* RESTful Application */
const httpServer = express();

httpServer
  .use(express.json())
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
});

/* Raw Http server */
createServer(httpServer)
  .on("upgrade", (request, socket, head) => {
    sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
      sockServer.emit("connection", ws, request);
    });
  })
  .listen(PORT, "0.0.0.0", () => console.log(`HTTP Server run at http://localhost:${PORT}`));
