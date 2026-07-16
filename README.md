MERN RAG Chatbot

A full-stack Retrieval-Augmented Generation (RAG) chatbot built using the MERN stack and Google Gemini. The application retrieves relevant information from a knowledge base using vector similarity search, maintains conversational context through chat history, and delivers real-time AI responses via streaming.

Features

* User authentication using JWT
* Retrieval-Augmented Generation (RAG) architecture
* Semantic search using vector embeddings
* Conversation memory with persistent chat history
* Real-time streaming AI responses
* Multiple conversation management
* Source attribution for retrieved documents
* Secure backend APIs with protected routes
* Responsive React-based user interface

Tech Stack

Frontend

* React
* Axios
* Server-Sent Events (SSE)

Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

AI & Search

* Google Gemini API
* Vector Embeddings
* Similarity Search
* Retrieval-Augmented Generation (RAG)

Authentication

* JSON Web Tokens (JWT)

System Architecture

```text
User Question
      │
      ▼
Frontend (React)
      │
      ▼
Express Backend
      │
      ▼
Generate Query Embedding
      │
      ▼
Vector Similarity Search
      │
      ▼
Retrieve Relevant Chunks
      │
      ▼
Load Conversation History
      │
      ▼
Build Prompt (Context + Memory)
      │
      ▼
Gemini LLM
      │
      ▼
Stream Response
      │
      ▼
Store Conversation
      │
      ▼
Return Answer
```

How It Works

1. Knowledge Retrieval

When a user submits a question:

1. The query is converted into an embedding vector.
2. The vector is used to perform similarity search against stored document embeddings.
3. The most relevant chunks are retrieved from the knowledge base.

2. Conversation Memory

The chatbot maintains conversational context by:

* Storing user and assistant messages in MongoDB.
* Retrieving recent messages from the active conversation.
* Including chat history in every LLM request.

This enables follow-up questions and context-aware responses.

3. Response Generation

The backend combines:

* Retrieved document chunks
* Recent conversation history
* Current user question

and sends them to Gemini to generate an informed response grounded in the retrieved context.

4. Real-Time Streaming

Responses are streamed token-by-token to the frontend using Server-Sent Events (SSE), providing a smooth and responsive chat experience.

Project Structure

```text
project-root/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── config/
│
├── README.md
└── .gitignore
```

Installation

Clone Repository

```bash
git clone <repository-url>
cd <project-folder>
```

Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=
MONGO_URI=
JWT_SECRET=
GEMINI_API_KEY=
```

Start the backend:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Environment Variables

| Variable       | Description                |
| -------------- | -------------------------- |
| PORT           | Backend server port        |
| MONGO_URI      | MongoDB connection string  |
| JWT_SECRET     | Secret key for JWT signing |
| GEMINI_API_KEY | Google Gemini API key      |

Key Engineering Decisions

Retrieval-Augmented Generation

Instead of relying solely on the LLM's pre-trained knowledge, the chatbot retrieves relevant information from a knowledge base before generating responses. This improves factual accuracy and reduces hallucinations.

Conversation Memory

Conversation history is stored in MongoDB and selectively included in prompts. This creates contextual continuity while controlling token usage and response latency.

Embedded Message Storage

Messages are embedded within conversation documents because chat messages are typically read together. This reduces database queries and simplifies conversation retrieval.

Streaming Responses

Server-Sent Events (SSE) are used to stream responses progressively, reducing perceived latency and improving user experience.

Future Improvements

* Conversation summarization for long chats
* Hybrid keyword + vector search
* Role-based access control
* Multi-document upload support
* Citation highlighting in responses
* Conversation search functionality
* Containerized deployment with Docker
* Production deployment on cloud infrastructure

Learning Outcomes

This project demonstrates:

* Full-stack MERN development
* Authentication and authorization with JWT
* Retrieval-Augmented Generation (RAG)
* Vector embeddings and semantic search
* Real-time streaming architectures
* MongoDB schema design
* LLM integration using Gemini
* Conversation memory management
