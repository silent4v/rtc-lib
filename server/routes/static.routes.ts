import express, { Router } from "express";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { healthChecker } from "../controllers/static.controller.js";

export const staticFileRouter = Router();
const DIRNAME = resolve(fileURLToPath(import.meta.url), "..");
const publicPath = resolve(DIRNAME, "..", "..", "..", "public");
const libraryPath = resolve(DIRNAME, "..", "..");

staticFileRouter.use("/", express.static(publicPath));
staticFileRouter.use("/lib", express.static(libraryPath));
staticFileRouter.get("/health", healthChecker);
