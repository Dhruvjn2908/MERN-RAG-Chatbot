import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config(); // reads .env into process.env — must run before anything uses process.env

const app = express();

app.use(cors());          // allows the React frontend to call this API
app.use(express.json());  // lets Express read JSON request bodies (req.body)

// A simple route to prove the server is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Temporary test route to prove the middleware works — we'll fold this
// into real protected routes once Phase 4 (chat endpoint) exists.
app.get("/api/auth/me", protect, (req, res) => {
  res.json({ message: "You are authenticated", userId: req.userId });
});

const PORT = process.env.PORT || 8080;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();