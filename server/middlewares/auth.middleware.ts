import { RequestHandler, Router } from "express";

export const AuthMiddleware: RequestHandler = (req, res, next) => {
  const apiKey = req.headers["api-key"];
  if (apiKey !== process.env.API_KEY && !process.env.NODE_ENV?.includes("dev")){
    res.status(403).json({ "message": "unauthorized request" });
  }
  next();
};
