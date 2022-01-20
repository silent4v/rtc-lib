import { Router } from "express";
import { 
  issueAccessToken,
  verifyAccessToken
} from "../controllers/verify.controller.js";
import { AuthMiddleware } from "../middlewares/auth.middleware.js";

export const verifyRouter = Router()
verifyRouter.use(AuthMiddleware);
verifyRouter.get("/access", issueAccessToken);
verifyRouter.post("/access/:token", verifyAccessToken);
