import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { performance } from "perf_hooks";
import { resolve } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import { regMessengerEvent } from "./routes/messenger/register.js";
import { regRtcEvent } from "./routes/rtc/register.js";
import { regRoomEvent } from "./routes/room/regester.js";
import { clientInit } from "./utils/client.js";
import { serverInit } from "./utils/server.js";

import debug from "debug";
import { VerifyRouter } from "./routes/api/verify.js";

const log = debug("Connection");
const DIRNAME = resolve(fileURLToPath(import.meta.url), "..");
const publicPath = resolve(DIRNAME, "..", "..", "public");
const libPath = resolve(DIRNAME, "..");

const config = dotenv.config({ path: resolve(DIRNAME, "..", "..", ".env") }).parsed;
debug("Config")(config);
/* RESTful Application */
const httpServer = express()
  .use(cors())
  .use(helmet())
  .use(express.json());

httpServer.use("/api/v1", VerifyRouter);

httpServer  // Static Resource
  .use("/", express.static(publicPath))
  .use("/lib", express.static(libPath))
  .get("/health", (_, res) => {
    const runTime = (performance.now() / 1000) | 0;
    let h = (runTime / 3600) | 0;
    let m = (runTime % 3600 / 60) | 0;
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

  client.on("request::register", ({ username }, _replyToken) => {
    log("recv %o", { _replyToken, username });
    client.username = username;
    client.sendout(_replyToken, {
      sessionId: client.sessionId
    });
  });

  client.on("request::ping-pong", (payload, _replyToken) => {
    /* For testing event, return origin payload */
    client.sendout(_replyToken, payload);
  })
});

/* Raw Http server */
createServer(httpServer)
  .on("upgrade", (request, socket, head) => {
    sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
      sockServer.emit("connection", ws, request);
    });
  })
  .listen(
    process.env.PORT,
    "0.0.0.0",
    () => console.log(`HTTP Server run at http://localhost:${process.env.PORT}`)
  );
