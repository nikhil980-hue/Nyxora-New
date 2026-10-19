import "dotenv/config";
import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chatRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import notesImageRoutes from "./routes/notesImageRoutes.js";
import aiImageRoutes from "./routes/aiImageRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import computerRoutes from "./routes/computerRoutes.js";
import browserRoutes from "./routes/browserRoutes.js";
import fileSystemRoutes from "./routes/fileSystemRoutes.js";
import presentationRoutes from "./routes/presentationRoutes.js";
import { nyxoraSecurityMiddleware } from "./middleware/securityMiddleware.js";
import { getAgentObservabilitySnapshot } from "./services/agentObservabilityService.js";
import { runEvaluationSuite } from "./services/agentEvaluationService.js";

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(nyxoraSecurityMiddleware);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.get("/", (req, res) => res.json({ success: true, message: "Nyxora AI Backend Running Successfully" }));
app.use("/api/chat", chatRoutes);
app.use("/api/generate-image", imageRoutes);
app.use("/api/notes-image", notesImageRoutes);
app.use("/api/ai-image", aiImageRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/computer", computerRoutes);
app.use("/api/browser", browserRoutes);
app.use("/api/filesystem", fileSystemRoutes);
app.use("/api/presentation", presentationRoutes);

function adminAuthorized(req) {
  const configured = String(process.env.NYXORA_ADMIN_TOKEN || "").trim();
  if (!configured) return false;
  const supplied = String(req.headers["x-nyxora-admin-token"] || "").trim();
  return supplied && supplied === configured;
}

app.get("/api/observability", (req, res) => {
  if (!adminAuthorized(req)) return res.status(403).json({ success: false, error: "Observability access denied." });
  res.json({ success: true, data: getAgentObservabilitySnapshot() });
});

app.get("/api/agent/evaluation-suite", (req, res) => {
  if (!adminAuthorized(req)) return res.status(403).json({ success: false, error: "Evaluation access denied." });
  res.json({ success: true, data: runEvaluationSuite() });
});

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large" || error?.status === 413) {
    console.error("Attachment payload too large.");
    return res.status(413).json({ success: false, reply: "This file is too large. Please upload a smaller file.", requestId: req.nyxoraRequestId });
  }
  console.error("Nyxora backend error:", error?.message || error);
  res.status(Number(error?.status) || 500).json({ success: false, error: "Internal server error.", requestId: req.nyxoraRequestId });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Nyxora AI Backend running on http://localhost:${PORT}`));
