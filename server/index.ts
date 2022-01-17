import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import "./config/index.js";
import { sockServer } from "./event/websocket.js";
import { verifySockConnect } from "./controllers/verify.controller.js";
import {
  staticFileRouter,
  verifyRouter
} from "./routes/index.js";

/* RESTful Application */
export const app = express()
  .use(cors())
  .use(helmet())
  .use(express.json());

app.set("authorTable", new Set<string>());
app.use(staticFileRouter);
app.use("/api/v1", verifyRouter);

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

