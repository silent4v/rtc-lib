import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./config/index.js";
import {
  staticFileRouter,
  verifyRouter
} from "./routes/index.js";

/* RESTful Application */
export const app = express()
  .use(cors())
  .use(helmet())
  .use(express.json());

app.set("authorTable", new Map<string, any>());
app.use(staticFileRouter);
app.use("/api/v1", verifyRouter);

