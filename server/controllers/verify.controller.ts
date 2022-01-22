import crypto from "crypto";
import type { RequestHandler } from "express";
import { roomRef } from "../utils/room";

export const issueAccessToken: RequestHandler = (req, res) => {
  const body = req.body ?? {};
  const authTable = req.app.get("authTable") as Map<string, any>;
  const token = crypto.randomBytes(16).toString("hex");

  authTable.set(token, isJsonString(body.userData ?? {}));
  if( !body.room ) {
    res.status(400).json({ message: "invaild room" });
  }

  roomRef.setExpireToken(token, body.room as string);
  res.status(200).json({ token });
}

export const verifyAccessToken: RequestHandler = (req, res) => {
  const authTable = req.app.get("authTable") as Map<string, any>;
  const token = req.params.token;

  if (authTable.has(token)) {
    res.status(200).json({ state: "authorized", data: authTable.get(token) });
  } else {
    res.status(401).json({ state: "unauthorized" });
  }
}

function isJsonString(str): str is string {
  try {
    const json = JSON.parse(str);
    return json;
  } catch (e) {
    return str;
  }
}
