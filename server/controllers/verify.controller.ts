import crypto from "crypto";
import type { RequestHandler } from "express";
const { parse } = JSON;

export const issueAccessToken: RequestHandler = (req, res) => {
  const room = req.query?.room;
  const data = req.query?.data ?? "";
  const authTable = req.app.get("authorTable") as Map<string, any>;
  const token = crypto.randomBytes(16).toString("hex");
  authTable.set(token, isJsonString(data) ? parse(data) : (data ?? ""));
  if( !room ) {
    res.status(400).json({ message: "invaild room" })
  }
  res.status(200).json({ token });
}

export const verifyAccessToken: RequestHandler = (req, res) => {
  const authTable = req.app.get("authorTable") as Map<string, any>;
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
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}
