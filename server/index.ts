import { createServer, IncomingMessage } from "http";
import type { Duplex } from "stream";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { sockServer } from "./utils/websocket";
import { Client, roomRef } from "./utils";
import { app } from "./app";
import { staticFileRouter } from "./routes";

const dd = require("debug")("wss")

/* Raw Http server */
createServer(app)
  .listen(
    process.env.PORT,
    "0.0.0.0",
    () => console.log(`HTTP   Server run at http://localhost:${process.env.PORT}`)
  );

/* Websocket server */
const wsApp = express()
  .use(cors())
  .use(helmet());

createServer(wsApp)
  .on("upgrade", (request, socket, head) => {
    sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
      const client = new Client(ws);
      client.authorization = verifySockConnect(request, socket);
      sockServer.emit("connection", client, request);
    });
  })
  .listen(
    process.env.WS_PORT,
    "0.0.0.0",
    () => console.log(`Socket Server run at http://localhost:${process.env.WS_PORT}`)
  );

function verifySockConnect(req: IncomingMessage, socket: Duplex) {
  const table = roomRef.tokenMatchTable;
  const authHeader = req.headers["authorization"] ?? req.headers["sec-websocket-protocol"] ?? "";
  dd("receive authHeader '%s'", authHeader);
  return table.has(authHeader);
}