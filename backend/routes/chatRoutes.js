import express from "express";
import { chatWithAI } from "../controllers/chatController.js";
import { optionalFirebaseAuth } from "../middleware/securityMiddleware.js";

const router = express.Router();

router.use(optionalFirebaseAuth);
router.post("/", chatWithAI);

export default router;
