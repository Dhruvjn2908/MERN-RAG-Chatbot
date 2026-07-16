import { GoogleGenAI } from "@google/genai";

let ai;
function getClient() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

function buildSystemPrompt(context) {
  return `You are a helpful assistant answering questions about insurance policies.
Use ONLY the following context to answer the user's question. If the answer isn't
in the context, say you don't have that information — do not make anything up.

Context:
${context}`;
}

// Turns our stored { role: "user" | "assistant", content } messages into
// the { role: "user" | "model", parts: [...] } shape Gemini expects, then
// appends the brand-new question as the final turn.
function buildContents(history, question) {
  const priorTurns = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return [...priorTurns, { role: "user", parts: [{ text: question }] }];
}

export async function streamAnswer(question, context, history, onChunk) {
  const stream = await getClient().models.generateContentStream({
    model: "gemini-3.1-flash-lite",
    contents: buildContents(history, question),
    config: {
      systemInstruction: buildSystemPrompt(context),
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
}