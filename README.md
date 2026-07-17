# MERN RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot built from scratch on the MERN stack — with authentication, a real chunking + embedding pipeline, live token streaming, and multi-turn conversation memory. Built as a deep-dive learning project to understand exactly how production RAG systems work under the hood, rather than assembling one from a framework like LangChain.

## Why this isn't just another RAG demo

Most tutorial-level RAG chatbots stop at "embed some text, vector search it, paste it into a prompt." This project goes further, in ways that matter in real systems:

**An embedding safeguard, enforced twice.**
Every stored vector is tagged with the exact embedding model and version that produced it. Vector search queries filter on that tag, so if the embedding model is ever swapped, stale vectors from the old model are automatically excluded instead of silently returning nonsense results (a subtle bug that fails silently in most from-scratch RAG builds).

**Real token-level streaming, not a client-side typing animation.**
The backend streams tokens from the LLM to the frontend as they're generated, over Server-Sent Events, using a manually-parsed `fetch` stream (not `EventSource`, which can't carry auth headers). Answers appear progressively because they're generated progressively — not a `setInterval` faking it after a blocking response.

**True multi-turn memory**
not just a longer prompt. Each conversation is persisted in MongoDB; recent turns are re-hydrated and sent back to the LLM on every new question, with a bounded history window to keep latency and cost predictable as a conversation grows.

**JWT authentication protecting every AI-facing route**
with password hashing via bcrypt and stateless token verification — the RAG pipeline isn't just publicly exposed logic, it's behind the same auth discipline a real product would need.

**A deliberate chunking strategy** 
overlapping, word-windowed chunks — so information sitting near a chunk boundary doesn't silently get lost from retrieval.

## Architecture

```
React (Vite)  →  Express API  →  MongoDB Atlas (data + vector search)
                       │
                       ├──  Voyage AI      (embeddings)
                       └──  Google Gemini  (streaming generation)
```

**Request flow for a chat message:**

1. Frontend sends the question with a JWT in the `Authorization` header
2. Backend embeds the question (Voyage AI, `input_type: "query"`)
3. MongoDB Atlas `$vectorSearch` retrieves the top-k most similar chunks, filtered to only vectors matching the current embedding model/version
4. Prior conversation turns are loaded and trimmed to a fixed window
5. Retrieved context + conversation history are sent to Gemini, which streams the answer back token by token over SSE
6. The full exchange is persisted to the conversation once streaming completes

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios, Context API |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Vector search | MongoDB Atlas Vector Search (cosine similarity) |
| Embeddings | Voyage AI (`voyage-3.5-lite`, 1024 dimensions) |
| Generation | Google Gemini (`gemini-2.5-flash-lite`), streamed |
| Auth | JWT + bcrypt |

## Project structure

```
backend/
├── config/db.js                 # MongoDB connection
├── models/                      # User, Chunk, Conversation schemas
├── middleware/authMiddleware.js # JWT verification
├── controllers/                 # Auth + chat/RAG orchestration
├── routes/                      # /api/auth, /api/chat
├── services/
│   ├── chunkingService.js       # Overlapping text chunking
│   ├── embeddingService.js      # Voyage AI wrapper + safeguard constants
│   ├── vectorSearchService.js   # $vectorSearch aggregation
│   └── llmService.js            # Gemini streaming wrapper
└── seed/seed.js                 # Chunk → embed → store pipeline

frontend/
└── src/
    ├── api/axiosClient.js       # Axios instance with JWT interceptor
    ├── context/AuthContext.jsx  # Auth state via React Context
    ├── pages/                   # Login, Register, Chat
    └── components/MessageBubble.jsx
```

## Key implementation details

**Chunking:**

Text is split into 200-word windows with a 50-word overlap, so context near a chunk boundary is never fully lost to either side.

**The embedding safeguard:** 

Every chunk is stored with `embeddingModel` and `embeddingVersion` fields. The vector search stage includes a `$match` filter on both fields — so a change in embedding model doesn't silently corrupt retrieval quality; incompatible vectors are excluded outright rather than compared.

**Streaming:** 

The backend opens a `text/event-stream` response and writes `data:` events as Gemini's `generateContentStream` yields tokens. Since the browser's native `EventSource` API can't send custom headers (and this app needs JWT auth on the stream), the frontend instead reads `response.body.getReader()` directly, manually buffering and parsing SSE-formatted messages as they arrive.

**Conversation memory:**

Conversations are documents in MongoDB with an embedded `messages` array. Each new question loads the most recent N messages (trimmed to bound token cost), maps them into the LLM's expected multi-turn format, and appends the new turn — giving genuine dialogue continuity (e.g. resolving "the second one" from a prior answer) without unbounded context growth.

## Running it locally

1. Clone the repo, `npm install` in both `backend/` and `frontend/`
2. Create `backend/.env`:
   ```
   PORT=8000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret
   VOYAGE_API_KEY=your_voyage_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. In MongoDB Atlas, create a Vector Search index named `vector_index` on the `chunks` collection:
   ```json
   { "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }] }
   ```
4. Seed sample data: `cd backend && npm run seed`
5. Run both servers: `npm run dev` in `backend/`, `npm run dev` in `frontend/`

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Log in, receive a JWT |
| POST | `/api/chat/ask` | Required | Ask a question; streams the answer via SSE |
| GET | `/api/chat/conversations` | Required | List a user's past conversations |
| GET | `/api/chat/conversations/:id` | Required | Load a conversation's full message history |

## What I'd extend next

- Sentence/paragraph-aware chunking instead of fixed word windows
- Re-ranking retrieved chunks before generation
- Streaming source citations alongside the answer text
- Rate limiting and refresh tokens for production-grade auth
