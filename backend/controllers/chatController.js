import { getEmbeddings } from "../services/embeddingService.js";
import { searchSimilarChunks } from "../services/vectorSearchService.js";
import { streamAnswer } from "../services/llmService.js";
import Conversation from "../models/Conversation.js";

// How many past messages we re-send as context. Kept small deliberately —
// every message we include costs tokens (money + latency) on EVERY future
// question in this conversation, so unbounded history would get slower
// and more expensive the longer a conversation runs.
const MAX_HISTORY_MESSAGES = 6;

export async function askQuestion(req, res) {
  const { question, conversationId } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "A question is required" });
  }

  try {
    // Load an existing conversation, or start a new one
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: req.userId });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.create({ user: req.userId, messages: [] });
    }

    // Take only the most recent messages, not the whole history
    const history = conversation.messages
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    const [queryEmbedding] = await getEmbeddings([question], "query");
    const chunks = await searchSimilarChunks(queryEmbedding, 3);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send the conversation id back FIRST — crucial for a brand new
    // conversation, since the frontend has no way to know its id otherwise.
    res.write(`event: meta\ndata: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

    if (chunks.length === 0) {
      const fallback = "I couldn't find any relevant information to answer that.";
      res.write(`data: ${JSON.stringify({ text: fallback })}\n\n`);
      res.write("data: [DONE]\n\n");

      conversation.messages.push({ role: "user", content: question });
      conversation.messages.push({ role: "assistant", content: fallback });
      await conversation.save();

      return res.end();
    }

    const context = chunks.map((c) => c.text).join("\n\n");

    res.write(
      `event: sources\ndata: ${JSON.stringify(
        chunks.map((c) => ({ text: c.text, score: c.score }))
      )}\n\n`
    );

    // Accumulate the full answer as it streams, so we can save the
    // COMPLETE text to the conversation once streaming finishes.
    let fullAnswer = "";
    await streamAnswer(question, context, history, (textPiece) => {
      fullAnswer += textPiece;
      res.write(`data: ${JSON.stringify({ text: textPiece })}\n\n`);
    });

    conversation.messages.push({ role: "user", content: question });
    conversation.messages.push({ role: "assistant", content: fullAnswer });
    await conversation.save();

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Ask question error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong answering your question" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Something went wrong" })}\n\n`);
      res.end();
    }
  }
}

export async function listConversations(req, res) {
  try {
    const conversations = await Conversation.find({ user: req.userId })
      .select("_id messages updatedAt")
      .sort({ updatedAt: -1 });

    const summaries = conversations.map((c) => ({
      id: c._id,
      title: c.messages[0]?.content?.slice(0, 60) || "New conversation",
      updatedAt: c.updatedAt,
    }));

    res.json(summaries);
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ error: "Could not load conversations" });
  }
}

export async function getConversation(req, res) {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, user: req.userId });
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json({ id: conversation._id, messages: conversation.messages });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Could not load conversation" });
  }
}