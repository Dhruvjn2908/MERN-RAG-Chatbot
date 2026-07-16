import express from "express";
import { askQuestion, listConversations, getConversation } from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/ask", protect, askQuestion);
router.get("/conversations", protect, listConversations);
router.get("/conversations/:conversationId", protect, getConversation); 
export default router;
