import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./config";
import {
  staticFileRouter,
  verifyRouter
} from "./routes";

/* RESTful Application */
export const app = express()
  .use(cors())
  .use(helmet())
  .use(express.json());

app.set("authTable", new Map<string, any>());
app.use(staticFileRouter);
app.use("/api/v1", verifyRouter);
