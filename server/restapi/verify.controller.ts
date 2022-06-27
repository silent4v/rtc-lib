import crypto from "crypto";
import type { RequestHandler } from "express";
import { roomRef, UserData } from "../utils/room";

export const issueAccessToken: RequestHandler = (req, res) => {
  const body = req.body as Partial<UserData> ?? {};
  const token = crypto.randomBytes(16).toString("hex");
  body.userData = isJsonString(body.userData ?? {});
  if( !body.room || typeof body.room !== "string" ) {
    res.status(400).json({ message: "invaild room" });
  } else if (!body.permission) {
    res.status(400).json({ message: "should set player permission" });
  }

  roomRef.setExpireToken(token, {
    room: body.room as string,
    userData: body.userData,
    permission: body.permission,
  });
  res.status(200).json({ token });
}

export const verifyAccessToken: RequestHandler = (req, res) => {
  const table = roomRef.tokenMatchTable;
  const token = req.params.token;

  if (table.has(token)) {
    res.status(200).json({ state: "authorized", data: table.get(token) });
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
