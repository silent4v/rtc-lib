import { createServer } from "http";
import express from "express";
import { Server } from "ws";

const PORT = 30000;
const httpServer = express();
const sockServer = new Server({ noServer: true });

createServer(httpServer)
  .on("upgrade", (request, socket, head) => {
    sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
      sockServer.emit("connection", ws, request);
    });
  })
  .listen(PORT, "0.0.0.0", () => console.log(`HTTP Server run at http://localhost:${PORT}`));
