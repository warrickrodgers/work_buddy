# WorkBuddy — Product Specification

> **Living document.** Completed phases are summarised here; full implementation prompts, diagnosis notes, and working context are moved to `spec-archive/` per the protocol below. Active phases retain full detail until shipped.

---

## Stack

- **Frontend:** React, TypeScript (`web-ui`)
- **Backend API:** Node.js, Express, TypeScript (`bi-app`)
- **AI/Agent layer:** Node.js, Express, TypeScript (`agent-server`)
- **Database:** PostgreSQL via Prisma (owned by `bi-app`)
- **Vector store:** ChromaDB
- **LLM:** Gemini 2.5 Flash
- **AI persona:** "Simon" — leadership coach

`bi-app` owns Prisma and exposes both user-facing (`/api/*`) and internal (`/internal/*`) endpoints. `agent-server` owns RAG, embeddings, and LLM orchestration; it does not run Prisma directly.

---

## Archive Generation Protocol

When a phase is marked **✅ Shipped** here, its full detail (original implementation prompt, diagnosis, working notes, step-by-step plan) is preserved in `spec-archive/phase-{n}-{slug}.md`. The active SPEC retains only the summary block.

**To generate an archive file** for a shipped phase, instruct Claude Code:

> "Generate `spec-archive/phase-{n}-{slug}.md` from the original implementation prompt for Phase {n}. Include: original context, diagnosis section, full implementation steps, SPEC content as it appeared at ship time, and any implementer notes. Format must match existing archive files in `spec-archive/`."

Archive files are written once at ship time and not updated. If a shipped phase later needs amendment, add an entry to the active SPEC under the phase summary noting the change and date — do not edit the archive.

---

## Phase 1 — Foundation ✅ Shipped

**What shipped:** Auth (JWT + `AuthContext` + `ProtectedRoute`), dashboard shell with sidebar nav and breadcrumb, general AI chat (`/dashboard/chat` with persistent GENERAL conversations), challenges feature (list + detail with Simon coaching chat), dashboard home with overview cards, theming infrastructure (Tailwind v4 + shadcn/ui zinc).

**Key data models:** `User`, `Conversation` (GENERAL | CHALLENGE), `ChatMessage`, `Challenge`, `ChallengeCheckIn`, `ProblemRequest`, `DataUpload`, `DataAnalysisResult`, `InsightFeedback`, `MetricTemplate`.

**Archive:** `spec-archive/phase-1-foundation.md` (to be generated on demand)

---

## Phase 2 — Neumorphic UI Overhaul ✅ Built (not yet deployed)

**Status note:** Implementation complete; not yet promoted to production.

**What shipped:** Token system overhaul in `App.css` replacing zinc shadcn defaults with a neumorphic-aware palette. Light mode uses a soft blue-gray base (`hsl(220 16% 93%)`); dark mode draws directly from `Home.tsx` brand colours (`oklch(21% 0.034 264.665)` PRIMARY family). New `--nm-shadow-dark` / `--nm-shadow-light` tokens drive three shadow utilities: `.nm-raised`, `.nm-inset`, `.nm-pressed`.

**Component updates:** Cards use `nm-raised` (no border); inputs/textareas use `nm-inset`; primary buttons stay solid `bg-primary`; secondary buttons use `bg-background nm-raised`. Sidebar uses a deeper background tone for a recessed feel. Standardised `<StatusBadge>` and `<ProgressBar>` components replace inline conditional class strings. shadcn `<Select>` replaces native selects.

**Other improvements:** Chat UI gained relative timestamps, copy-to-clipboard on assistant messages, `sessionStorage` draft persistence, and richer empty states. Accessibility pass added `aria-label` to icon-only buttons and a WCAG AA contrast audit. Skeleton loaders replaced plain-text "Loading…" states.

**Archive:** `spec-archive/phase-2-neumorphic-ui.md` (to be generated on demand)

---

## Phase 3a — Solution Outlines: Backend ✅ Shipped

**Purpose:** Convert Simon's structured coaching guidance from ephemeral chat prose into persistent, trackable artifacts (phases + checklists + habits + check-in prompts) tied to a Challenge.

**Trigger mechanism:** Two-stage classifier. Stage 1 is a deterministic phrase-similarity signal (max cosine similarity of user message embedding against a hardcoded list of ~10 plan-request exemplars; thresholds `≥0.75` plan_likely, `0.55–0.75` plan_possible, `<0.55` plan_unlikely). Stage 2 is Simon's LLM judgment — the signal biases the decision but does not gate it. Exemplars are hardcoded constants, NOT in ChromaDB (avoids the RAG-poisoning class of bug).

**Output contract:** Simon emits a discriminated union — either `{ type: "conversation", content }` or `{ type: "solution_outline", preamble, outline }`. The frontend discriminates on `type`. JSON extraction reuses `cleanJsonResponse` (refactored to `agent-server/src/llm/jsonUtils.ts` and shared with `analysis.ts`).

**Data model added:**
- `SolutionOutline` (id, challenge_id, user_id, title, why, status, source_message_id, timestamps) — 1:many on Challenge
- `OutlinePhase` (order_index, title, timeframe, purpose) — 1:many on Outline
- `ChecklistItem` (description, why_it_matters, is_complete, completed_at) — binary one-shots
- `Habit` (description, cadence: DAILY|WEEKLY, why_it_matters) + `HabitLog` (logged_for date, notes) — recurring with streak tracking; unique on `(habit_id, logged_for)`
- `CheckInPrompt` (question, scheduled_for, response, responded_at) — reflective prompts
- Enums: `OutlineStatus { ACTIVE, COMPLETED, ARCHIVED }`, `HabitCadence { DAILY, WEEKLY }`

**API surface:**
```
GET    /api/challenges/:challengeId/outlines
GET    /api/outlines/:id
PATCH  /api/checklist-items/:id              { is_complete }
POST   /api/habits/:id/log                   { logged_for, notes? }   (idempotent on date)
PATCH  /api/check-in-prompts/:id/respond     { response }
```
All endpoints enforce ownership via `Challenge.user_id`.

**Validation rules:** reject empty phases, phases with zero items across all three lists, invalid cadence, empty `why`/`purpose`, >10 phases, >15 items per phase. On rejection, fall back to treating Simon's response as conversational.

**Progress computation:** phase progress = `0.4 * checklist_ratio + 0.4 * habit_consistency + 0.2 * check_in_ratio`, with empty-category weights redistributed proportionally. Outline progress = simple average of phase progresses, flowed back to `Challenge.progress` when active.

**Out of scope:** outline editing (user re-asks Simon), sharing across users, scheduled-check-in notifications, templates, migration of pre-existing chat plans.

**Archive:** `spec-archive/phase-3a-solution-outlines-backend.md` (to be generated on demand)

---

## Phase 3b — Solution Outlines: UI ✅ Shipped

**What shipped:** OutlineCard rendered inline in chat below Simon's preamble (with "View Outline" CTA); OutlineDetail page at `/dashboard/challenges/:id/outlines/:outlineId` with `why` callout, outline-level progress bar, and phase accordions (collapsed by default except phase 1); within each phase, three labelled sections — Checklist with checkboxes, Habits with cadence badge + streak count + "Log today/week" button (disabled if already logged), Check-Ins with question + response textarea + save with timestamp. Outline list page at `/dashboard/outlines` groups outlines by parent Challenge. Sidebar Solutions > Solution Outlines item now routes to the list page; individual outlines surface as sub-items via the same dynamic pattern used for Challenges.

**Styling:** Inherits Phase 2 neumorphic tokens. Outline cards use `nm-raised`; textareas use `nm-inset`; log buttons use the primary CTA pattern. No outline-specific tokens introduced.

**Accessibility:** Phase accordions use `aria-expanded`/`aria-controls`; progress bars expose `role="progressbar"` with full value attributes; streak counters have descriptive `aria-label` (e.g. "5-day streak"); tab order matches visual order. WCAG AA contrast audit passed for both modes.

**Archive:** `spec-archive/phase-3b-solution-outlines-ui.md` (to be generated on demand)

---

## Phase 4 — Document Ingestion & RAG Pipeline 🔄 In Progress

### Phase 4.1 — DB Schema + bi-app API ✅ Complete
Organisation model, User.organisation_id FK + backfill, IngestionDocument model + enums. Internal endpoints (`/internal/ingestion-documents` CRUD). User-facing endpoints (`GET/DELETE /api/documents`). `internalAuthMiddleware` with service-token gate.

### Phase 4.2 — Agent-server Pipeline ✅ Complete
`documentParser.ts` (pdf-parse / mammoth / papaparse / native), `documentChunker.ts` (recursive char split + overlap; CSV header-per-chunk), `vectorStoreAdapter.ts` (ChromaVectorStoreAdapter against `user_documents` collection), `documentIngestionService.ts` (fire-and-forget via setImmediate, status lifecycle back to bi-app), ingest + delete routes. `conversationController` queries `user_documents` filtered by `organisationId` in parallel with `knowledge`; `promptBuilder` injects "User-Provided Context" section. `agentClient` updated with `ingestDocument` / `deleteDocument`; bi-app `conversationController` fetches `organisation_id` and threads it to the agent.

### Phase 4.3 — Document Management UI ✅ Complete

Rewire the existing `/dashboard/uploads` pages to the new ingestion pipeline.

**Upload page (`NewUpload.tsx`):**
- Single-file drop zone; accepted types: pdf, csv, docx, md, txt; 20 MB limit
- Required `document_type` selector: survey | turnover | policy | report | custom
- Optional `tags` input (comma-separated)
- Submit → `POST /api/documents` (multipart); on 202 redirect to `/dashboard/uploads`
- Inline error for unsupported file type (422) or server error

**Document list page (`Uploads.tsx`):**
- `GET /api/documents` on mount; render table/card list: filename, document_type badge, status badge, tags, relative upload time
- Status badges: PENDING (muted), PROCESSING (warning + spinner), COMPLETE (success), FAILED (destructive)
- Auto-poll every 3 s while any document is PENDING or PROCESSING; stop when all are terminal
- Delete button per row → `DELETE /api/documents/:id` (confirm dialog); on success remove row optimistically
- Empty state with CTA pointing to `/dashboard/uploads/new-upload`

**Constraints:**
- Neumorphic styling from Phase 2 tokens; cards use `nm-raised`, inputs use `nm-inset`
- `document_type` rendered as shadcn `<Select>` (matches Phase 2 pattern)
- No new sidebar items; existing "Uploads" and "Upload New" nav entries are sufficient

### Phase 4.4 — Hardening & Dashboard Integration ✅ Complete

**Delete cascade fix:** bi-app `deleteUserDocument` currently only removes the Postgres row; ChromaDB chunks are orphaned. Fix: after ownership check, delegate to `agentClient.deleteDocument(id)` (which deletes ChromaDB chunks then calls `DELETE /internal/ingestion-documents/:id`). Remove the direct `prisma.ingestionDocument.delete` call from the user-facing handler.

**Dashboard home document card:** Add an `IngestionDocument` count card to `DashboardHome.tsx` alongside the existing challenge stat cards. Show total indexed documents (status = COMPLETE) fetched from `GET /api/documents`. Card links to `/dashboard/uploads`. Empty state prompts user to upload.

**Acceptance criteria:**
- Hard delete removes both the Postgres row and all ChromaDB chunks for that `documentId`
- Dashboard home shows correct COMPLETE document count; clicking navigates to the Uploads page

---

### Purpose

A dedicated pipeline for ingesting user-uploaded documents (surveys, turnover reports, policies, custom files) into the RAG layer so Simon can ground his coaching in the user's actual organisational context — not just the static leadership knowledge base.

This pipeline is **architecturally distinct from `knowledgeLoader.ts`**. The static knowledge base (Simon Sinek principles, leadership frameworks) is curated, version-controlled, and shared across all users. User-uploaded documents are unvetted, tenant-scoped, and dynamic. Separate ChromaDB collections, separate Postgres tables, separate ingestion path.

### 4.1 Architecture Overview

Six clearly separated stages:

```
Parse → Chunk → Embed → Store (with metadata) → Retrieve → Augment prompt
```

Each stage is a distinct service or module. No stage may reach across boundaries.

**Service ownership:**
- **Parse, Chunk, Embed, Store, Retrieve, Augment prompt** → `agent-server`
- **Source-of-truth metadata persistence** → `bi-app` (Postgres owner)

**Cross-service access:** agent-server writes ingestion records to Postgres via internal `bi-app` endpoints (§4.7). Hot-path retrieval does NOT cross this boundary — document metadata is denormalised onto each ChromaDB chunk.

### 4.2 What Must NOT Change

The existing `knowledgeLoader.ts` and the `knowledge` ChromaDB collection are out of scope. They continue to load static `.md` files from `agent-server/src/knowledge/` at startup. The Phase 4 pipeline writes to a different collection and is invoked at runtime by user upload.

The fix preventing RAG poisoning (excluding `category: 'context'` documents from retrieval) must remain in place.

### 4.3 Multi-Tenancy: Organisation Model

Phase 4 introduces an `Organisation` model as the tenancy boundary.

**Migration:**
- Add `Organisation { id, name, created_at, updated_at }`
- Add `User.organisation_id Int` FK
- Backfill: create one "Personal" organisation, set every existing user's `organisation_id` to it
- Make the FK `NOT NULL` after backfill

```prisma
model Organisation {
  id          Int      @id @default(autoincrement())
  name        String
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  users       User[]
  documents   IngestionDocument[]
}

model User {
  // ... existing fields ...
  organisation     Organisation @relation(fields: [organisation_id], references: [id])
  organisation_id  Int
  ingestion_documents IngestionDocument[]
}
```

### 4.4 Stage Specifications

#### 4.4.1 Parsing

Supported file types: `pdf`, `csv`, `docx`, `md`, `txt`. Parsing produces normalised raw text — no chunking, no embedding. Returns either a single text blob or, for CSV, a structured `{ headers: string[], rows: string[][] }`.

Recommended libraries: `pdf-parse`, `mammoth` (DOCX), `papaparse` (CSV), native `fs.readFileSync` for MD/TXT.

```typescript
parseDocument(filePath: string, fileType: FileType): Promise<ParsedDocument>
```

#### 4.4.2 Chunking

Recursive character chunking with overlap.

- Target chunk size: 500–1000 tokens (chars / 4 is acceptable estimator)
- Overlap: 10–20% of chunk size
- Split priority: paragraphs (`\n\n`) → sentences → words → characters
- CSV: each row (or logical row group) preserved as a chunk with column headers prepended. Never blindly chunk rows by char count
- Each chunk carries `chunkIndex` and `totalChunks`

#### 4.4.3 Embedding

Use the same embedding function ChromaDB is already configured with. Do NOT introduce a second embedding model — divergent embedding spaces would silently break retrieval quality.

#### 4.4.4 Storage

Vectors → ChromaDB. Source-of-truth records → Postgres. Linked via `documentId`.

**ChromaDB:** writes go to a NEW collection `user_documents`, structurally separate from the existing `knowledge` collection. Trade-off: retrieval queries two collections and merges. Cost is small; safety is large (eliminates the cross-contamination class that caused the earlier RAG-poisoning issue).

**Postgres:** `IngestionDocument` row created with `status: PENDING` before chunking begins, transitions to `PROCESSING`, then `COMPLETE` or `FAILED` (with error message).

#### 4.4.5 Retrieval

Agent-server queries BOTH collections per user message:
- `knowledge` (existing) for static leadership frameworks
- `user_documents` (new) for organisational context, filtered by `organisationId`

Results merged with explicit weighting: cap each source at top-3 hits, re-rank by score. Retrieval surfaces source provenance so the prompt builder can label appropriately ("From your uploaded survey..." vs "From leadership principles...").

#### 4.4.6 Augment Prompt

`promptBuilder.ts` extended to accept retrieved chunks from both sources and inject them with clear source labels. A "User-Provided Context" section appears in Simon's prompt only when uploaded-document chunks are present. No change to Simon's persona or system-prompt structure.

### 4.5 Chunk Metadata Schema

ChromaDB metadata values must be primitives. `tags` is denormalised to `tagsCsv` at the chunk level; the full array lives on the Postgres row.

```typescript
interface ChunkMetadata {
  documentId: string;          // ties chunks to source IngestionDocument
  organisationId: number;      // multi-tenancy filter key
  uploadedBy: number;          // user_id
  documentType: 'survey' | 'turnover' | 'policy' | 'report' | 'custom';
  fileType: 'pdf' | 'csv' | 'docx' | 'md' | 'txt';
  uploadedAt: string;          // ISO timestamp
  chunkIndex: number;
  totalChunks: number;
  source: string;              // original filename
  tagsCsv: string;             // comma-separated, denormalised from string[]
}
```

### 4.6 Postgres: IngestionDocument Model

```prisma
model IngestionDocument {
  id              String           @id @default(uuid())
  organisation    Organisation     @relation(fields: [organisation_id], references: [id])
  organisation_id Int
  uploaded_by     User             @relation(fields: [uploaded_by_id], references: [id])
  uploaded_by_id  Int
  filename        String
  file_type       FileType
  document_type   DocumentType
  status          IngestionStatus  @default(PENDING)
  chunk_count     Int              @default(0)
  tags            String[]
  error_message   String?          @db.Text
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt

  @@index([organisation_id])
  @@index([uploaded_by_id])
  @@index([status])
}

enum FileType        { PDF CSV DOCX MD TXT }
enum DocumentType    { SURVEY TURNOVER POLICY REPORT CUSTOM }
enum IngestionStatus { PENDING PROCESSING COMPLETE FAILED }
```

`IngestionDocument.id` is a UUID string (used directly as `documentId` in chunk metadata — avoids leaking sequential IDs).

**Naming note:** `DataUpload` already exists for `ProblemRequest` one-shot analysis. `IngestionDocument` is intentionally separate — different lifecycle, different access pattern. Do NOT consolidate.

### 4.7 DocumentIngestionService Interface

`agent-server/src/services/documentIngestionService.ts`:

```typescript
interface DocumentIngestionService {
  ingestDocument(
    file: { buffer: Buffer; filename: string; mimeType: string },
    userId: number,
    organisationId: number,
    documentType: DocumentType,
    tags?: string[]
  ): Promise<{ documentId: string; status: IngestionStatus }>;

  deleteDocument(documentId: string, userId: number): Promise<void>;
  listDocuments(organisationId: number, filters?: { documentType?: DocumentType; status?: IngestionStatus }): Promise<IngestionDocument[]>;
  rechunkDocument(documentId: string, userId: number): Promise<void>;
}
```

`ingestDocument` returns once the row is created (`PENDING`); chunking proceeds in the background. Frontend polls status. `rechunkDocument` deletes existing chunks for that `documentId` before re-ingestion.

### 4.8 VectorStoreAdapter Interface

ChromaDB is accessed via an adapter — `documentIngestionService` and the retrieval layer depend on the adapter, not on `chromadb`.

```typescript
interface VectorStoreAdapter {
  store(collection: string, chunks: Array<{ id: string; content: string; metadata: ChunkMetadata }>): Promise<void>;
  search(collection: string, query: string, filters: Record<string, string | number | boolean>, limit?: number):
    Promise<Array<{ content: string; metadata: ChunkMetadata; score: number }>>;
  delete(collection: string, filters: Record<string, string | number | boolean>): Promise<void>;
}
```

Phase 4 ships `ChromaVectorStoreAdapter`. The interface exists so a future migration to pgvector or Pinecone can swap implementations without touching the pipeline. The existing `chromaService.ts` is NOT replaced — it continues to handle conversation, insights, and the static knowledge base.

### 4.9 Internal API (bi-app, called by agent-server)

```
POST   /internal/ingestion-documents       — create row at start of ingest
PATCH  /internal/ingestion-documents/:id   — update status, chunk_count, error_message
DELETE /internal/ingestion-documents/:id   — delete row
GET    /internal/ingestion-documents       — list with org filter
```

Auth: shared service token between bi-app and agent-server (env var, NOT user JWT). User authorisation is enforced inside agent-server before calling the internal endpoint. **Hot-path retrieval does not call these endpoints** — chunk metadata holds everything needed.

### 4.10 User-Facing API (bi-app)

```
POST   /api/documents                  — multipart upload, returns { documentId, status }
GET    /api/documents                  — list current user's org documents
GET    /api/documents/:id              — single document detail
DELETE /api/documents/:id              — hard-delete in v1, cascades to ChromaDB chunks
POST   /api/documents/:id/rechunk      — trigger rechunkDocument
```

Ownership enforced via `IngestionDocument.organisation_id === req.user.organisation_id`.

### 4.11 Acceptance Criteria

- `Organisation` model exists, all users backfilled to "Personal" org
- `IngestionDocument` model migrated cleanly
- Upload flow end-to-end (PDF, CSV, DOCX, MD, TXT): file → row → chunks → ChromaDB with full metadata
- Status lifecycle observable via `GET /api/documents/:id`
- Simon's responses surface uploaded-document chunks alongside knowledge-base chunks, source-labelled
- Existing `knowledgeLoader` and `knowledge` collection untouched
- `VectorStoreAdapter` in place; `documentIngestionService` does not import `chromadb` directly
- Hard delete works end-to-end (Postgres row + all chunks)

### 4.12 Out of Scope

UI for upload management (deferred to a Phase 4b — sidebar already has an "Uploads" placeholder), soft delete, document versioning, OCR for scanned PDFs, document sharing across orgs, streaming ingestion progress (polling is sufficient v1), real-time annotations.

### 4.13 Future Considerations

- **pgvector migration.** Eliminates ChromaDB as a separate service; unifies on Postgres. The `VectorStoreAdapter` interface is designed for this. Trigger: when ChromaDB hosting becomes deployment friction.
- **Per-organisation namespacing.** v1 uses one `user_documents` collection with `organisationId` filters. At ~100k chunks per org, lift into per-tenant collections. The `collection` parameter on the adapter already accommodates this.
- **Document versioning.** v1 treats each upload as immutable. A future version could collapse `(organisation, filename)` uploads into versioned records.
- **Chunk-level citations.** Simon could cite `documentId` + `chunkIndex` so the UI can link back to source. Chunk metadata is structured to support this.

---

## Cross-Cutting Reference

### Current ChromaDB collections

| Collection | Owner | Contents |
|---|---|---|
| `knowledge` | `knowledgeLoader.ts` (startup) | Curated leadership frameworks, Simon Sinek principles |
| `conversations` | `chromaService.ts` (runtime) | User chat messages for similarity search |
| `insights` | `chromaService.ts` (runtime) | Analysis insights tied to ProblemRequest |
| `user_documents` (Phase 4) | `ChromaVectorStoreAdapter` (runtime) | User-uploaded organisational documents |

### Service boundary cheat sheet

| Concern | bi-app | agent-server |
|---|---|---|
| Prisma client | ✅ | ❌ (uses internal endpoints) |
| User-facing `/api/*` | ✅ | ❌ |
| LLM calls | ❌ | ✅ |
| ChromaDB | ❌ | ✅ |
| Embeddings | ❌ | ✅ |
| Source-of-truth writes | ✅ | ❌ |

---

## Conventions

- **JSON extraction from LLM:** use `agent-server/src/llm/jsonUtils.ts` (`cleanJsonResponse`). Don't introduce parallel utilities.
- **Multi-step Prisma writes:** use `prisma.$transaction`.
- **Frontend styling:** Tailwind + neumorphic utilities (`nm-raised`, `nm-inset`, `nm-pressed`) + shadcn primitives in `web-ui/src/components/ui/`. No inline styles. No new component libraries without spec entry.
- **RAG context vs persona:** persona/tone documents are NEVER ingested into ChromaDB. They live in system prompts only. Mixing them caused the earlier RAG-poisoning incident.