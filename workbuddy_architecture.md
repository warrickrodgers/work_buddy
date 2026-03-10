# WorkBuddy — System Architecture

## Overview

WorkBuddy is an AI-powered leadership coaching and team improvement platform. It gives business leaders — directors, managers, and owners — a purpose-driven AI mentor named **Simon** that helps them diagnose, understand, and act on workplace challenges. These challenges range from high turnover and low morale to compensation struggles, disengagement, and cross-department silos.

Simon is not a generic chatbot. He is an AI agent primed with a curated leadership knowledge base drawn from **Simon Sinek's Golden Circle**, Nelson Mandela's servant leadership, Dale Carnegie's human-relations framework, and modern behavioral science. Every interaction is anchored in the question *"Why?"* before it ever addresses *"What?"* or *"How?"*.

---

## Goals and Mission

| Layer | Statement |
|-------|-----------|
| **Purpose** | To awaken purpose-driven leadership — helping people rediscover their *why*, act with integrity, and inspire others through empathy, clarity, and courage. |
| **Vision** | A workplace culture where leadership is measured not by control, but by clarity, compassion, and courage. |
| **Primary user** | Small business owners, directors, and team leads who want to improve human and organizational metrics within their domain. |

---

## Monorepo Structure

```
work_buddy/
├── architecture.md          ← This document
├── README.md
├── project_structure.md
├── web-ui/                  ← React/Vite frontend (user interface)
├── bi-app/                  ← Business intelligence API (orchestration layer)
└── agent-server/            ← AI agent service (Simon — LLM + vector memory)
```

The three services are independently deployable Node.js applications that communicate over HTTP.

---

## Service Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         User (Browser)                           │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     web-ui  (React / Vite)                       │
│                         Port 5173                                │
│  - Authentication pages (Login, SignUp, Forgot Password)         │
│  - Dashboard with sidebar navigation                             │
│  - Chat interface (Simon / WorkBuddyChat)                        │
│  - Data upload interface                                         │
└───────────────────────────┬──────────────────────────────────────┘
                            │ REST API  /api/*
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                   bi-app  (Express / Node.js)                    │
│                         Port 3000                                │
│  - Auth / JWT middleware                                         │
│  - Conversation management & persistence                         │
│  - Problem request lifecycle                                     │
│  - File upload handling (Multer)                                 │
│  - PostgreSQL via Prisma ORM                                     │
│  - Proxies AI requests to agent-server                           │
└────────────────┬─────────────────────────────────────────────────┘
                 │ HTTP  (agentClient)
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                 agent-server  (Express / Node.js)                │
│                         Port 4000                                │
│  - Simon AI agent (Gemini 2.0 Flash)                             │
│  - Prompt construction from context + knowledge files            │
│  - ChromaDB vector store (conversations, insights, knowledge)    │
│  - Knowledge base loaded from markdown at startup                │
└────────────────┬──────────────────────────────┬─────────────────┘
                 │                              │
                 ▼                              ▼
    ┌─────────────────────┐       ┌──────────────────────────┐
    │   Google Gemini API  │       │   ChromaDB  (Port 8000)   │
    │   gemini-2.0-flash   │       │   Vector similarity store │
    └─────────────────────┘       └──────────────────────────┘
                 │
    ┌─────────────────────┐
    │   PostgreSQL DB      │
    │   (via Prisma ORM)   │
    └─────────────────────┘
```

---

## Service Detail: web-ui

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · React Router

### Pages & Components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Home.tsx` | Landing / marketing page |
| `/login` | `Login.tsx` | User authentication |
| `/signup` | `SignUp.tsx` | User registration |
| `/forgot-password` | `ForgotPassword.tsx` | Password recovery |
| `/dashboard` | `Dashboard.tsx` | Protected dashboard shell with sidebar |
| `/dashboard/chat` | `WorkBuddyChat.tsx` | Main Simon AI chat interface |
| `/dashboard/uploads` | `Uploads.tsx` | Data file management |
| `/dashboard/uploads/new` | `NewUpload.tsx` | Upload new data files |

### Key Design Patterns

- **Auth Context** (`AuthContext.tsx`) — global auth state with `PrivateRoute` guard wrapping all dashboard routes.
- **API Client** (`lib/api.ts`) — centralized Axios instance targeting the bi-app.
- **Conversation Cache** — `localStorage` caching (5-minute TTL) in `WorkBuddyChat` reduces redundant API calls on re-mount.
- **Markdown Rendering** — Simon's responses are rendered with `react-markdown` + `remark-gfm`, supporting rich formatting like lists, headers, and emphasis.
- **Auto-expanding textarea** — the chat input grows dynamically and submits on `Enter` (Shift+Enter for newline).

---

## Service Detail: bi-app

**Stack:** Node.js · Express · TypeScript · Prisma ORM · PostgreSQL · Multer · JWT

### Responsibilities

The bi-app is the orchestration layer between the frontend and the AI agent. It handles:

1. **Authentication** — JWT-based user auth with `authMiddleware`.
2. **Conversation lifecycle** — creating, loading, paginating, and archiving conversations and messages.
3. **AI proxy** — when a user message arrives, `conversationController` fetches the last 10 messages for context, calls `agentClient.generateResponse()`, then persists the returned assistant message.
4. **Problem request management** — structured intake of a user's role description, problem description, and parameters. Drives the async analysis pipeline (PENDING → PROCESSING → DONE).
5. **File uploads** — accepts multipart uploads (CSV, spreadsheets) via Multer, stores files on disk, and creates `DataUpload` records linked to a `ProblemRequest`.

### API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/login` | Authenticate and receive JWT |
| POST | `/api/auth/signup` | Register new user |
| GET | `/api/conversations/user/:user_id` | List user's active conversations |
| GET | `/api/conversations/:id` | Get single conversation |
| POST | `/api/conversations` | Create new conversation |
| PATCH | `/api/conversations/:id` | Update conversation title |
| GET | `/api/conversations/:id/messages` | Paginated message list |
| POST | `/api/conversations/:id/messages` | Send message → triggers AI response |
| GET | `/api/problem-requests/:id` | Get problem request by ID |
| GET | `/api/problem-requests/user/:user_id` | List user's problem requests |
| POST | `/api/problem-requests` | Submit a new problem request |
| GET | `/api/uploads/:problemRequestId` | List uploads for a problem |
| POST | `/api/uploads` | Upload data files |

### Agent Client (`agentClient.ts`)

A typed Axios wrapper that communicates with the agent-server. Methods:

| Method | Agent-server endpoint | Purpose |
|--------|-----------------------|---------|
| `generateResponse()` | `POST /api/conversations/generate` | Core conversational AI turn |
| `searchContext()` | `POST /api/conversations/search` | Semantic context search |
| `analyzeData()` | `POST /analyze` | LLM-based data interpretation |
| `generatePlan()` | `POST /generate-plan` | Produce a step-by-step improvement plan |
| `healthCheck()` | `GET /health` | Service availability check |

The agent client has a 30-second timeout and gracefully degrades — if the agent-server is unavailable, the user message is still saved and an error indicator is returned to the frontend rather than dropping the conversation.

---

## Service Detail: agent-server

**Stack:** Node.js · Express · TypeScript · Google Gemini API · ChromaDB

This is the AI brain of WorkBuddy — the home of **Simon**.

### Startup Sequence

1. `chromaService.initialize()` — creates (or reconnects to) three ChromaDB collections: `conversations`, `insights`, `knowledge`.
2. `loadKnowledgeBase()` — reads the knowledge markdown files and seeds them into the `knowledge` collection so Simon can perform semantic recall during conversations.
3. Express server starts on port 4000.

### Simon's Identity Context

Simon's personality and reasoning are grounded by four files loaded into every conversation:

| File | Contents |
|------|----------|
| `context/goals.json` | Agent name, purpose, inspiration figures, core principles, primary goals, tone guidelines |
| `context/objectives.md` | Mission, vision, guiding philosophy, core objectives, behavioral commitments |
| `context/purpose.md` | Simon's beliefs and "why" manifesto |
| `context/role.md` | Simon's role as Visionary Leader — keeper of the "why" |

### Knowledge Base (Vector Store)

The `knowledge` ChromaDB collection holds leadership frameworks indexed for semantic search. Simon can retrieve relevant passages at query time via cosine similarity:

| File | Content |
|------|---------|
| `knowledge/leadership_models.md` | Transformational leadership, Situational leadership, Emotional Intelligence (Goleman), Servant leadership, Adaptive leadership (Heifetz), Human motivation (Maslow + SDT), Organizational culture models |
| `knowledge/improvement_frameworks.md` | Why–How–What (Sinek), Ubuntu Principle (Mandela), Human Relations (Carnegie), Growth Mindset (Dweck), Integrative Change Framework, Lean/DMAIC, PDCA, Kaizen, Kotter's 8-Step |
| `knowledge/example_insights.md` | Annotated real-world patterns: meeting disengagement, anonymous feedback spikes, training vs. behavior gaps, high-performer turnover, cross-department silos, post-restructure morale drops, absenteeism during uncertainty, manager churn |

### LLM Integration

Simon uses **Google Gemini 2.0 Flash** (`gemini-2.0-flash-exp`) for response generation.

- Conversation history (up to 10 prior messages) is mapped to Gemini's `user`/`model` turn format.
- Temperature is set to **0.7** for a balance between coherent, empathetic responses and creative insight.
- Output is capped at **1000 tokens** per turn.
- Raw Gemini output is cleaned of markdown code fences before returning to the frontend.

### ChromaDB Collections

| Collection | Purpose | Key Metadata |
|------------|---------|--------------|
| `conversations` | Per-user message embeddings for semantic memory | `userId`, `conversationId`, `role`, `timestamp` |
| `insights` | Generated leadership insights tied to problem requests | `userId`, `problemRequestId`, `category`, `timestamp` |
| `knowledge` | Static leadership frameworks and example insights | `source`, `category`, `timestamp` |

All collections use **cosine similarity** (`hnsw_space: cosine`) for semantic search.

### Agent-server API Routes

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/health` | healthRoute | Service health + ChromaDB ping |
| POST | `/analyze` | analyzeRoute | LLM-based data interpretation (planned) |
| POST | `/generate-plan` | generatePlanRoute | Step-by-step improvement plan (planned) |
| POST | `/api/conversations/generate` | `generateAIResponse` | Core AI turn — takes history, calls Gemini |
| POST | `/api/conversations/search` | `searchContext` | Semantic search over user's conversation history |

---

## Data Model (PostgreSQL)

```
User
├── id, email, first_name, last_name
├── job_title, company           ← used to contextualize Simon's coaching
├── password_hash, auth_method
├── problem_request[]
├── insight_feedback[]
└── conversations[]

ProblemRequest
├── id, user_id
├── title, role_description      ← "I am a Director of Operations..."
├── problem_description          ← "Our turnover rate is 40% YoY..."
├── problem_parameters           ← parsed/parametrized version
├── problem_insights             ← AI-generated insights
├── solution_summary             ← final plan summary
├── problem_status               ← PENDING | PROCESSING | DONE | DID_NOT_MEET
├── problem_data[]  (DataUpload)
└── metric_temp?    (MetricTemplate)

DataUpload
├── id, problem_request_id
├── file_url, filename, source_type
└── data_analysis_result?

DataAnalysisResult
├── id, data_upload_id
├── summary
├── inferred_schema (JSON)
├── outliers_found[]
└── metrics_highlighted[]

InsightFeedback
├── id, user_id
├── rating, comment

MetricTemplate
├── id, problem_request_id
├── name, description
├── source, metric_type

Conversation
├── id, user_id
├── title, is_archived
└── messages[]  (ChatMessage)

ChatMessage
├── id, conversation_id
├── role  ← USER | ASSISTANT
└── content
```

---

## Core Workflows

### 1. Conversational Leadership Coaching (Simon Chat)

```
User types message in WorkBuddyChat
    ↓
web-ui POST /api/conversations/:id/messages { role: USER, content }
    ↓
bi-app saves UserMessage to PostgreSQL
bi-app fetches last 10 messages for context window
bi-app calls agentClient.generateResponse(userId, conversationId, userMessage, history)
    ↓
agent-server POST /api/conversations/generate
    └── Formats history as Gemini user/model turns
    └── Calls Gemini 2.0 Flash with full context
    └── Strips markdown artifacts from response
    └── Returns { response: string }
    ↓
bi-app saves AssistantMessage to PostgreSQL
bi-app returns { userMessage, assistantMessage }
    ↓
web-ui renders assistant response as rich Markdown
web-ui updates localStorage cache
```

Simon's response style is governed by the `goals.json` tone guidelines: empathetic, visionary, humble. He asks "why" before offering direction, uses storytelling, and avoids corporate jargon.

### 2. Problem Request Pipeline

```
User submits: job title + problem description + optional data files
    ↓
bi-app creates ProblemRequest (status: PENDING)
bi-app creates DataUpload records for any attached files
    ↓
[Future] agent-server analyzes uploaded data → DataAnalysisResult
[Future] agent-server generates insights → ProblemRequest.problem_insights
[Future] agent-server produces plan → ProblemRequest.solution_summary
[Future] status transitions: PENDING → PROCESSING → DONE
    ↓
User views generated plan and provides InsightFeedback (rating + comment)
```

### 3. Knowledge-Augmented Response (RAG — Planned)

```
User sends message about, e.g., "high turnover in my best team"
    ↓
agent-server queries ChromaDB `knowledge` collection
    └── Semantic search returns: "High Turnover in High-Performing Teams" example
    └── Returns relevant framework passages (Servant Leadership, Sinek's Why)
    ↓
agent-server injects retrieved context into Gemini prompt
    ↓
Simon responds with framework-grounded, example-backed insight
```

---

## Simon's Philosophical Framework

Simon's coaching approach is an integrated model combining three dimensions:

| Dimension | Core Question | Leadership Outcome |
|-----------|--------------|-------------------|
| **Why** | What belief drives this person's leadership? | Clarity and trust |
| **How** | How does that belief show up in daily behavior? | Integrity and alignment |
| **What** | What tangible results prove the belief true? | Performance with purpose |

The knowledge base encodes nine leadership frameworks Simon draws upon:

1. **Transformational Leadership** — inspire intrinsic motivation, lead by example
2. **Situational Leadership** (Hersey & Blanchard) — adapt style to follower readiness
3. **Emotional Intelligence** (Goleman) — self-awareness, empathy, social skill
4. **Servant Leadership** — success measured by others' growth, not personal power
5. **Adaptive Leadership** (Heifetz) — navigate complexity, protect productive tension
6. **Human Motivation** (Maslow + Deci & Ryan) — autonomy, competence, relatedness
7. **Organizational Culture Models** (Quinn, Denison) — purpose → behavior → culture loop
8. **Improvement Frameworks** — Sinek's Why–How–What, Ubuntu, Carnegie, Growth Mindset, DMAIC, Kaizen
9. **Integrative Change** — Sense → Understand → Co-Create → Experiment → Reflect → Scale

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM | Google Gemini 2.0 Flash | Fast, capable, cost-effective for conversational turns |
| Vector DB | ChromaDB | Simple self-hosted setup; cosine similarity ideal for semantic search |
| Relational DB | PostgreSQL + Prisma | Strong typing, migrations, relational integrity for user/conversation data |
| Frontend | React + Vite + shadcn/ui | Modern, component-driven, accessible UI primitives |
| Backend API | Express + TypeScript | Lightweight, flexible, familiar Node.js stack |
| File handling | Multer | Standard multipart upload middleware for Node.js |
| Auth | JWT | Stateless, scalable authentication |

---

## Development Ports

| Service | Port |
|---------|------|
| web-ui | 5173 |
| bi-app | 3000 |
| agent-server | 4000 |
| ChromaDB | 8000 |

The agent-server is configured with CORS to accept requests only from `BI_APP_URL` (default `http://localhost:3000`), and the bi-app proxies all AI calls — the frontend never contacts the agent-server directly.

---

## Current State vs. Planned

| Feature | Status |
|---------|--------|
| User auth (JWT) | Implemented |
| Conversation persistence (PostgreSQL) | Implemented |
| Simon chat UI (Markdown rendering, cache) | Implemented |
| Gemini 2.0 Flash integration | Implemented |
| ChromaDB initialization + knowledge seeding | Implemented |
| Problem request creation | Implemented (partial) |
| File upload + DataUpload records | Implemented |
| RAG-augmented responses (knowledge retrieval in prompts) | Planned |
| Data analysis pipeline (DataAnalysisResult) | Planned |
| Plan generation workflow | Planned |
| Insight feedback loop | Planned |
| Prompt builder with full context injection | Planned |
| MetricTemplate population | Planned |

---

## Design Principles

1. **Start with Why** — every AI response anchors in belief before action. Simon does not jump to solutions.
2. **Empathy precedes instruction** — Simon listens deeply before advising; the system collects context (role, company, problem) before generating insights.
3. **Growth is relational** — the conversation history, vector memory, and feedback loops are infrastructure for a long-term coaching relationship, not one-shot answers.
4. **Graceful degradation** — if the agent-server is unreachable, the bi-app saves the user's message and returns a soft error rather than losing the conversation.
5. **Human first** — metrics (turnover, morale, engagement) are always framed as symptoms of human experience, not abstract KPIs to optimize.
