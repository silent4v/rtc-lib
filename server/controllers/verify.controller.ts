import crypto from "crypto";
import type { RequestHandler } from "express";
import type { Duplex } from "stream";
import { app } from "../app.js";
import debug from "debug";
const debugLogger = debug("Route:Verify");
const { parse } = JSON;

export const issueAccessToken: RequestHandler = (req, res) => {
  const data = req.query?.data ?? "";
  const authTable = req.app.get("authorTable") as Map<string, any>;
  const token = crypto.randomBytes(16).toString("hex");
  authTable.set(token, isJsonString(data) ? parse(data) : (data ?? ""));
  return res.json({ token });
}

export const verifyAccessToken: RequestHandler = (req, res) => {
  const authTable = req.app.get("authorTable") as Map<string, any>;
  const token = req.params.token;

  if (authTable.has(token)) {
    res.json({ state: "authorized", data: authTable.get(token) });
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

function isJsonString(str): str is string {
  try {
    const json = JSON.parse(str);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}
