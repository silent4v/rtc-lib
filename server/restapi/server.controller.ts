import type { RequestHandler } from "express";
import { Server } from "../utils";

export const currentBanWords: RequestHandler = (_, res) => {
  res.status(200).json({ banWordList: [...Server.banWords_.values()] });
}

export const setBanWords: RequestHandler = (req, res) => {
  const body = req.body as string ?? "";
  console.log(body);
  Server.banWords_ = new Set(body);
  const banWordList = [...Server.banWords_.values()];
  Server.broadcast_("server::ban-words", banWordList);
  res.status(200).json({ banWordList });
};

export const appendBanWords: RequestHandler = (req, res) => {
  const body = req.body as string[] ?? "";
  body.forEach(word => {
    Server.banWords_.add(word);
  });
  const banWordList = [...Server.banWords_.values()];
  Server.broadcast_("server::ban-words", banWordList);
  res.status(200).json({ banWordList });
};