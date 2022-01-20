import express, { Router } from "express";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { healthChecker } from "../controllers/static.controller.js";

export const staticFileRouter = Router();
const publicPath = resolve(__dirname, "..", "..", "..", "public");
const libraryPath = resolve(__dirname, "..", "..");

staticFileRouter.use("/", express.static(publicPath));
staticFileRouter.use("/lib", express.static(libraryPath));
staticFileRouter.get("/health", healthChecker);
