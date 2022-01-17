import crypto from "crypto";
import type { RequestHandler } from "express";
import type { Duplex } from "stream";
import { app } from "../index.js";

export const getAccessToken: RequestHandler = (req, res) => {
  const authTable = req.app.get("authorTable") as Set<string>;
  const token = crypto.randomBytes(16).toString("hex");
  authTable.add(token);
  return res.json({ token });
}

export const verifyAccessToken: RequestHandler = (req, res) => {
  const authTable = req.app.get("authorTable") as Set<string>;
  const token = req.params.token;
  if (authTable.has(token)) {
    res.json({ state: "authorized" });
  } else {
    res.status(403).json({ state: "unauthorized" });
  }
}

export const verifySockConnect = (req: any, socket: Duplex) => {
  const authTable = app.get("authorTable") as Set<string>;
  const authHeader = req.headers["authorization"] ?? "";
  if (authTable.has(authHeader) || process.env.NODE_ENV?.includes("dev")) {
    return true;
  } else {
    socket.destroy();
    return false;
  }
}

