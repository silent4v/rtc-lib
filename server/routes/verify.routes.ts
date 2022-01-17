import { Router } from "express";
import { 
  getAccessToken,
  verifyAccessToken
} from "../controllers/verify.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

export const verifyRouter = Router()
verifyRouter.use(AuthMiddleware);
verifyRouter.get("/access", getAccessToken);
verifyRouter.post("/access/:token", verifyAccessToken);
