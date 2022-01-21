import { createServer } from "http";
import type { Duplex } from "stream";
import { sockServer } from "./utils/websocket";
import { Client } from "./utils";
import { app } from "./app";

/* Raw Http server */
createServer(app)
  .on("upgrade", (request, socket, head) => {
    if (verifySockConnect(request, socket)) {
      sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
        sockServer.emit("connection", new Client(ws), request);
      });
    }
  })
  .listen(
    process.env.PORT,
    "0.0.0.0",
    () => console.log(`HTTP Server run at http://localhost:${process.env.PORT}`)
  );

function verifySockConnect(req: any, socket: Duplex) {
  const authTable = app.get("authTable");
  const authHeader = req.headers["authorization"] ?? "";
  if (authTable.has(authHeader) || process.env.NODE_ENV?.includes("dev")) {
    return true;
  } else {
    socket.destroy();
    return false;
  }
}