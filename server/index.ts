import { createServer } from "http";
import { sockServer } from "./event/websocket.js";
import { verifySockConnect } from "./controllers/verify.controller.js";
import { app } from "./app";

/* Raw Http server */
createServer(app)
  .on("upgrade", (request, socket, head) => {
    if (verifySockConnect(request, socket)) {
      sockServer.handleUpgrade(request, socket as any, head, function done(ws) {
        sockServer.emit("connection", ws, request);
      });
    }
  })
  .listen(
    process.env.PORT,
    "0.0.0.0",
    () => console.log(`HTTP Server run at http://localhost:${process.env.PORT}`)
  );

