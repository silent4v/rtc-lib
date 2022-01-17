import { Router } from "express";
import crypto from "crypto";
import { AuthMiddleware } from "../pipe/Auth.js";

export const VerifyRouter = Router();

const authTable = new Set<string>();
VerifyRouter.use(AuthMiddleware);

VerifyRouter.get("/", (req, res) => {
  res.json({ "message": "authorized" });
});

VerifyRouter.get("/access/", (req, res) => {
  const token = crypto.randomBytes(16).toString("hex");
  authTable.add(token);
  return res.json({ token });
});

VerifyRouter.post("/access/:token", (req, res) => {
  const token = req.params.token;
  if(authTable.has(token))
    res.json({ state: "authorized" });
  else
    res.status(404).json({ state: "unauthorized" });
});