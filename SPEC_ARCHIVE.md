# Claude Code Prompt: Solution Outline Feature (Phase 3a + 3b)

## Context

WorkBuddy's Simon coach currently delivers structured guidance (phased plans, action items, reflective questions) inline in chat prose. This is rich but ephemeral — it scrolls away and isn't actionable. Users need a way to capture Simon's structured guidance as a persistent, trackable artifact tied to a Challenge.

This feature introduces **Solution Outlines** — research-backed artifacts containing phases, one-shot checklist items, recurring habits, and scheduled check-in prompts. Outlines are owned by a Challenge (1:many).

The detection mechanism is a **two-stage classifier**: a deterministic phrase-similarity signal (Stage 1) biases Simon's decision (Stage 2), but Simon — the LLM — is the only entity that decides whether to emit a structured outline.

**Sequencing:** This work is split across two phases in the SPEC. **Phase 3a** ships the backend independently of the in-progress neumorphic UI overhaul (Phase 2). **Phase 3b** ships the UI once Phase 2 settles. Treat them as separately deployable.

---

## Phase 1: Diagnosis & Architectural Decisions

### 1.1 Why two-stage classification (and not LLM-only or RAG-only)

**LLM-only fails** because Simon's system prompt biases him toward Socratic, reflective responses. He will frequently ask clarifying questions even when the user clearly wants an action plan ("ok now give me the steps").

**RAG-only fails** because intent expressions are open-ended. "Help me think through how to roll this out" warrants an outline but matches no obvious exemplar phrase.

**Two-stage works** because Stage 1 produces a *signal* (not a gate), and Stage 2 (Simon) uses that signal as one input among many — including conversation history, the current challenge context, and his coaching judgment.

### 1.2 Why a discriminated union for Simon's output

Simon's response shape must be one of:
- `{ type: "conversation", content: string }` — normal coaching prose
- `{ type: "solution_outline", outline: SolutionOutline, preamble: string }` — structured artifact + a short conversational lead-in

This avoids parsing markdown headings out of free-form prose (fragile) and gives the frontend a clean discriminator for rendering.

### 1.3 Why separate ChecklistItem, Habit, and CheckInPrompt

Completion semantics differ:
- **Checklist items** are binary one-shots (`is_complete: boolean`)
- **Habits** are recurring with a cadence and tracked via streak/log entries
- **Check-in prompts** are scheduled reflective questions with a free-text response

Conflating these into a single "task" entity forces UI compromises and breaks reporting. Keep them separate from day one.

### 1.4 Why outlines belong to Challenges (not standalone)

The existing schema already has `Challenge` with `ChallengeCheckIn` as a sibling. Outlines extend this naturally — a Challenge represents the "what we're working on," and an Outline represents "the structured plan for working on it." A Challenge can have multiple outlines (e.g., revision after retro), so the relation is 1:many.

### 1.5 Why reuse the existing JSON-extraction pattern

`agent-server/src/services/analysis.ts` already proves the pattern: prompt the LLM to emit JSON, run `cleanJsonResponse`, validate required fields, fall back gracefully. Don't introduce a new pattern — extend this one. Specifically, generalize `cleanJsonResponse` and field validation into a shared utility.

### 1.6 Why split this into Phase 3a (backend) and Phase 3b (UI)

Phase 2 (neumorphic UI overhaul) is in flight and the design direction may still shift. Building outline-specific UI components against an unsettled token system means rebuilding them. The backend has zero coupling to the visual system, so it can ship independently — which also lets you validate the hardest part of this feature (trigger reliability and JSON extraction) via API testing before any UI investment.

---

## Phase 2: Implementation Plan

### Phase 3a — Backend (ships independently)

#### ✅ Step A1 — Database schema (`bi-app/prisma/schema.prisma`)

Add models: `SolutionOutline`, `OutlinePhase`, `ChecklistItem`, `Habit`, `HabitLog`, `CheckInPrompt`. Add the `solution_outlines` relation to `Challenge`. See SPEC §3a.2 for exact shape.

Run migration: `npx prisma migrate dev --name add_solution_outlines`.

#### ✅ Step A2 — Stage 1 classifier (`agent-server/src/services/intentClassifier.ts`)

Create a new service that:
- Maintains a curated list of plan-request exemplar phrases (start with the 10 listed in SPEC §3a.1, hardcoded as a const array — do NOT put these in ChromaDB context/ directory; that caused RAG poisoning previously)
- On each user message, computes max cosine similarity between the message embedding and exemplar embeddings using the same embedding function ChromaDB uses
- Returns `{ signal: "plan_likely" | "plan_possible" | "plan_unlikely", score: number }`
- Thresholds (tunable): `>= 0.75 → plan_likely`, `0.55–0.75 → plan_possible`, `< 0.55 → plan_unlikely`

#### ✅ Step A3 — Shared JSON utility (`agent-server/src/llm/jsonUtils.ts`)

Extract `cleanJsonResponse` from `analysis.ts` into a shared util. Both `analysis.ts` and the new outline path will import from here. Don't duplicate.

#### ✅ Step A4 — Update `promptBuilder.ts` for dual-mode output

Modify `buildContextualPrompt` to accept the intent signal and inject it as context. Add output-format instructions that tell Simon:
- If you decide to generate a plan, output ONLY a JSON object matching the discriminated-union schema
- Otherwise, respond conversationally as normal
- Use the `intent_signal` as a hint, not a command — your judgment overrides

The system prompt should include a wrapper like:

```
## Output Mode
The user's message has an intent signal of: {{intent_signal}} (similarity score: {{score}}).

If — and ONLY if — you judge that the user wants a structured action plan they can save and track, respond with valid JSON matching this exact schema:

{
  "type": "solution_outline",
  "preamble": "<1–2 sentences acknowledging the request, in Simon's voice>",
  "outline": { ...full SolutionOutline shape per SPEC §3a.3... }
}

Otherwise, respond conversationally as you normally would. The signal is a hint — your coaching judgment about what the user actually needs takes priority.
```

#### ✅ Step A5 — Update `conversationController.ts`

After receiving Simon's response:
1. Run `cleanJsonResponse` on the raw text
2. Try `JSON.parse`
3. If parse succeeds AND `parsed.type === "solution_outline"` AND outline shape validates → persist outline to DB, return `{ kind: "outline", outlineId, preamble, outline }` to frontend
4. If parse fails or type is not `solution_outline` → return `{ kind: "message", content: rawText }` as before

Validation should reject outlines per SPEC §3a.4 rules.

#### ✅ Step A6 — Outline persistence service (`bi-app/src/services/outlineService.ts`)

Single function: `persistOutline(challengeId, userId, outlinePayload) → Promise<SolutionOutline>`. Wraps the Prisma writes for the outline + nested phases + items in a single transaction.

#### ✅ Step A7 — Outline REST endpoints (`bi-app/src/routes/outlines.ts`)

```
GET    /api/challenges/:challengeId/outlines        — list outlines for a challenge
GET    /api/outlines/:id                            — full outline with phases + items
PATCH  /api/checklist-items/:id                     — toggle is_complete
POST   /api/habits/:id/log                          — record habit completion for a date
PATCH  /api/check-in-prompts/:id/respond            — submit reflective response
```

All endpoints enforce ownership via `Challenge.user_id`. Full contract in SPEC §3a.5.

#### ✅ Step A8 — Tests

- Unit: `intentClassifier.test.ts` — assert thresholds for plan-request and non-plan phrases
- Unit: `outlineValidation.test.ts` — reject malformed outlines
- Integration: end-to-end "user asks for a plan → outline persisted → outline retrievable" via the chat endpoint

#### ✅ Step A9 — Phase 3a acceptance gate

Before declaring 3a done, validate via Postman/curl:
- Send a "give me a plan to..." message → response includes `kind: "outline"` with persisted ID
- Send a "what do you think about..." message → response is `kind: "message"`, no outline created
- GET the outline back, toggle a checklist item, log a habit, respond to a check-in
- Confirm progress computation per SPEC §3a.6 returns sensible values

This gate must pass before any Phase 3b work begins.

---

### Phase 3b — UI ✅ COMPLETE

#### ✅ Step B1 — Outline card in chat (`web-ui/src/pages/dashboard/dashPages/Challenges/ChallengeDetail.tsx`)

When a chat message has `kind === "outline"`:
- Render Simon's `preamble` as a normal assistant message
- Below it, render a compact `OutlineCard` with phase pills and a "View Outline" CTA linking to `/dashboard/challenges/:id/outlines/:outlineId`

Styling: match whatever Phase 2 lands on (neumorphic if shipped, or fall back to current shadcn style).

#### ✅ Step B2 — Outline Detail page

New route: `/dashboard/challenges/:id/outlines/:outlineId`. New file: `web-ui/src/pages/dashboard/dashPages/Outlines/OutlineDetail.tsx`.

Layout per SPEC §3b.2:
- Header with `why` callout and outline-level progress bar
- Phase accordions (collapsed by default except phase 1)
- Within each phase: three sections — Checklist (checkboxes), Habits (log button + streak), Check-Ins (textarea + save)

#### ✅ Step B3 — Outline list page

New route: `/dashboard/outlines`. Lists outlines grouped by challenge. Wire the existing "Solution Outlines" sidebar item (`appNavigationData.ts`, currently `url: "#"`) to this route.

#### ✅ Step B4 — Sidebar nav update

Update `appNavigationData.ts` so the Solutions > Solution Outlines item links to `/dashboard/outlines`. If the dynamic-list pattern from Challenges is reusable here (showing outline titles as sub-items), apply it.

#### ✅ Step B5 — UI tests

- Component test for `OutlineCard` rendering from a fixture
- Component test for checklist toggle optimistic update
- Smoke test for `OutlineDetail` page mount + accordion expand

---

## Phase 3: SPEC.md Sections — Copy Verbatim

> **The two sections below append directly to your existing SPEC.md after the Phase 2 section.**

---

## Phase 3a — Solution Outlines: Backend (Planned)

### Purpose

Solution Outlines are research-backed artifacts that capture Simon's structured coaching guidance as a persistent, actionable plan. They convert ephemeral chat prose into trackable phases, checklists, habits, and check-in prompts tied to a Challenge.

The design is grounded in three behavior-change concepts: phased rollouts (habit anchoring), differentiated task types (one-shot vs. recurring vs. reflective), and purpose anchoring (every phase carries a `purpose` field — Simon's "why").

Phase 3a delivers the data model, intent classifier, Simon output contract, persistence layer, and REST API. It is independently deployable and validatable via API testing — no UI dependency.

### 3a.1 Trigger Mechanism — Two-Stage Classification

User messages flow through two stages before Simon responds:

**Stage 1 — Deterministic intent signal (server-side, pre-LLM):**
- A curated list of ~10 plan-request exemplar phrases is embedded once at server startup
- For each user message, compute max cosine similarity between the message embedding and exemplar embeddings
- Output: `{ signal: "plan_likely" | "plan_possible" | "plan_unlikely", score: number }`
- Thresholds: `score >= 0.75 → plan_likely`, `0.55 ≤ score < 0.75 → plan_possible`, `score < 0.55 → plan_unlikely`
- Exemplars are hardcoded constants — they are NOT ingested into ChromaDB (this would re-introduce the RAG poisoning class of bug)

Seed exemplars:
```
generate a solution outline
give me a plan
outline the steps
what should I do
help me build a roadmap
walk me through how to approach this
break this down into steps
make me a checklist
how do I tackle this
turn this into actionable steps
```

**Stage 2 — LLM judgment (Simon decides):**
- The intent signal and score are injected into Simon's system prompt as context
- Simon's prompt explicitly states: "the signal is a hint, not a command — your coaching judgment about what the user actually needs takes priority"
- Simon emits one of two output shapes (discriminated union, see §3a.3)

Stage 1 never gates the LLM call. It only biases Simon's decision.

### 3a.2 Data Model

```prisma
model SolutionOutline {
  id              Int             @id @default(autoincrement())
  challenge       Challenge       @relation(fields: [challenge_id], references: [id], onDelete: Cascade)
  challenge_id    Int
  user_id         Int
  title           String
  why             String          @db.Text  // The purpose anchor for the entire outline
  source_message_id Int?                    // Optional link back to the chat message that generated it
  status          OutlineStatus   @default(ACTIVE)
  phases          OutlinePhase[]
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt
  archived_at     DateTime?

  @@index([challenge_id])
  @@index([user_id])
}

model OutlinePhase {
  id              Int             @id @default(autoincrement())
  outline         SolutionOutline @relation(fields: [outline_id], references: [id], onDelete: Cascade)
  outline_id      Int
  order_index     Int             // 0-based ordering within outline
  title           String
  timeframe       String?         // e.g. "Days 1-15", "Pre-Launch"
  purpose         String          @db.Text  // Simon's "why" for this phase
  checklist_items ChecklistItem[]
  habits          Habit[]
  check_in_prompts CheckInPrompt[]

  @@index([outline_id])
  @@unique([outline_id, order_index])
}

model ChecklistItem {
  id              Int             @id @default(autoincrement())
  phase           OutlinePhase    @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  phase_id        Int
  order_index     Int
  description     String          @db.Text
  why_it_matters  String?         @db.Text
  is_complete     Boolean         @default(false)
  completed_at    DateTime?

  @@index([phase_id])
}

model Habit {
  id              Int             @id @default(autoincrement())
  phase           OutlinePhase    @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  phase_id        Int
  order_index     Int
  description     String          @db.Text
  cadence         HabitCadence    // DAILY | WEEKLY
  why_it_matters  String?         @db.Text
  logs            HabitLog[]

  @@index([phase_id])
}

model HabitLog {
  id          Int      @id @default(autoincrement())
  habit       Habit    @relation(fields: [habit_id], references: [id], onDelete: Cascade)
  habit_id    Int
  logged_for  DateTime @db.Date  // The date the habit was completed for
  notes       String?  @db.Text
  created_at  DateTime @default(now())

  @@index([habit_id])
  @@unique([habit_id, logged_for])
}

model CheckInPrompt {
  id              Int             @id @default(autoincrement())
  phase           OutlinePhase    @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  phase_id        Int
  order_index     Int
  question        String          @db.Text
  scheduled_for   DateTime?       // Optional — when the user should be prompted
  response        String?         @db.Text
  responded_at    DateTime?

  @@index([phase_id])
}

enum OutlineStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum HabitCadence {
  DAILY
  WEEKLY
}
```

`Challenge` gets a new relation: `solution_outlines SolutionOutline[]`.

### 3a.3 Simon Output Contract

Simon returns one of two JSON shapes. The discriminator is the top-level `type` field.

**Conversation mode:**
```json
{
  "type": "conversation",
  "content": "<Simon's normal coaching prose>"
}
```

**Outline mode:**
```json
{
  "type": "solution_outline",
  "preamble": "<1–2 sentence conversational lead-in in Simon's voice>",
  "outline": {
    "title": "<short, descriptive title>",
    "why": "<the overarching purpose anchor>",
    "phases": [
      {
        "order_index": 0,
        "title": "<phase name>",
        "timeframe": "<e.g. 'Pre-Launch' or 'Days 1-15'>",
        "purpose": "<the 'why' for this phase>",
        "checklist_items": [
          { "order_index": 0, "description": "...", "why_it_matters": "..." }
        ],
        "habits": [
          { "order_index": 0, "description": "...", "cadence": "DAILY", "why_it_matters": "..." }
        ],
        "check_in_prompts": [
          { "order_index": 0, "question": "...", "scheduled_for": null }
        ]
      }
    ]
  }
}
```

### 3a.4 Validation Rules

An outline payload is rejected if any of:
- `phases` array is empty
- Any phase has zero items across `checklist_items + habits + check_in_prompts` combined
- Any `cadence` value is not `DAILY` or `WEEKLY`
- `why` or any phase `purpose` is empty/whitespace
- Total phases > 10 (sanity cap)
- Total items per phase > 15 (sanity cap)

On rejection, fall back to treating the response as conversational (return raw text) and log the validation failure.

### 3a.5 API Surface

```
GET    /api/challenges/:challengeId/outlines
       → 200 { outlines: SolutionOutline[] }

GET    /api/outlines/:id
       → 200 { outline: SolutionOutline (with nested phases + items) }

PATCH  /api/checklist-items/:id
       body: { is_complete: boolean }
       → 200 { item: ChecklistItem }

POST   /api/habits/:id/log
       body: { logged_for: ISO date string, notes?: string }
       → 201 { log: HabitLog }
       (idempotent on (habit_id, logged_for) — second POST same date is 200, not duplicate)

PATCH  /api/check-in-prompts/:id/respond
       body: { response: string }
       → 200 { prompt: CheckInPrompt }
```

All endpoints require authenticated user; ownership is enforced via `Challenge.user_id`.

### 3a.6 Progress Computation

Outline-level progress is a simple average across phases. Phase-level progress is computed as:

```
phase_progress = (
    checklist_completion_ratio * 0.4 +
    habit_consistency_ratio    * 0.4 +
    check_in_response_ratio    * 0.2
)
```

Where:
- `checklist_completion_ratio` = completed items / total items
- `habit_consistency_ratio` = total log entries / expected entries since outline creation (capped at 1.0; expected = days-since-creation for DAILY, weeks-since-creation for WEEKLY)
- `check_in_response_ratio` = responded prompts / total prompts

If a phase has zero items in a category, that category's weight redistributes proportionally to the remaining categories.

Outline progress flows back to update `Challenge.progress` when the outline is the active one for that challenge.

### 3a.7 Acceptance Criteria

Phase 3a is complete when all of:
- Migration applied cleanly to dev DB
- Postman/curl flow validated: plan-request message → outline persisted; non-plan message → no outline
- All five REST endpoints return correct shapes and enforce ownership
- Unit + integration tests pass
- Intent classifier scores logged for the first week of usage (for threshold tuning)

### 3a.8 Out of Scope (deferred to 3b or later)

- Any UI rendering of outlines (Phase 3b)
- Editing an outline after generation (user re-asks Simon for a new outline)
- Sharing outlines across users / teams
- Notifications for scheduled check-ins
- Outline templates or duplication
- Migration of existing chat-based plans into structured outlines

---

## Phase 3b — Solution Outlines: UI ✅ COMPLETE

### Purpose

Render Solution Outlines (delivered by Phase 3a) as first-class UI surfaces in the dashboard. Depends on Phase 2 (neumorphic UI overhaul) being settled — outline-specific components inherit whatever token system Phase 2 lands on.

### 3b.1 Chat Integration (`ChallengeDetail.tsx`)

When a chat message returns with `kind: "outline"`:
- Render Simon's `preamble` as a normal assistant message
- Append a compact `OutlineCard` below it showing: title, phase count, total item count, and a "View Outline" CTA
- CTA navigates to `/dashboard/challenges/:challengeId/outlines/:outlineId`

### 3b.2 Outline Detail Page

Route: `/dashboard/challenges/:challengeId/outlines/:outlineId`
File: `web-ui/src/pages/dashboard/dashPages/Outlines/OutlineDetail.tsx`

Layout:
- **Header** — outline title, `why` callout (visually emphasized), outline-level progress bar
- **Phase accordions** — collapsed by default except phase 1; each accordion shows phase title, timeframe, and phase-level progress
- **Within each expanded phase** — three labeled sections:
  - **Checklist** — items with checkboxes; completed items strike through and show timestamp on hover
  - **Habits** — items with cadence badge (Daily/Weekly), current streak count, "Log today" / "Log this week" button (disabled if already logged for current period)
  - **Check-Ins** — items showing question prominently, response textarea below, "Save reflection" button; saved responses show timestamp and become read-only with edit affordance

### 3b.3 Outline List Page

Route: `/dashboard/outlines`
File: `web-ui/src/pages/dashboard/dashPages/Outlines/OutlineList.tsx`

Lists all outlines for the user, grouped by parent Challenge. Each outline shows title, phase count, progress bar, status badge, and last-updated timestamp.

### 3b.4 Navigation

Update `web-ui/src/lib/appNavigationData.ts`:
- The existing Solutions > Solution Outlines item (currently `url: "#"`) routes to `/dashboard/outlines`
- Apply the dynamic sub-item pattern used by Challenges so individual outlines show as sidebar children when expanded

### 3b.5 Styling

All outline UI uses the token system established by Phase 2. If Phase 2 ships the neumorphic overhaul, outline cards use `nm-raised`, textareas use `nm-inset`, log buttons use the primary CTA pattern. If Phase 2 is rolled back to shadcn defaults, outline UI follows whatever Phase 2 settles on. Do not introduce outline-specific tokens.

### 3b.6 Accessibility

- All checkboxes, log buttons, and textareas keyboard-navigable in tab order matching visual order
- Phase accordions use proper `aria-expanded` / `aria-controls`
- Progress bars expose `role="progressbar"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- Streak counters expose `aria-label` with full context (e.g. "5-day streak")

### 3b.7 Acceptance Criteria

Phase 3b is complete when:
- Generating an outline from chat shows the OutlineCard inline and navigates to the detail page
- All three interaction types (toggle checkbox, log habit, save check-in response) work with optimistic UI
- Outline list page renders all outlines grouped by challenge
- Sidebar nav surfaces individual outlines
- Component tests pass
- WCAG AA contrast audit passes for both light and dark modes

---

## Notes for Claude Code

- **3a and 3b are separately deployable.** Do not start 3b until 3a's acceptance gate passes.
- **Don't ingest exemplar phrases into ChromaDB.** Hardcode them in the classifier service. The previous RAG-poisoning issue was caused by exactly this kind of mixing.
- **Reuse `cleanJsonResponse` from `analysis.ts`** — refactor it into a shared util at `agent-server/src/llm/jsonUtils.ts` and import from both sites.
- **Single transaction for outline persistence.** Use `prisma.$transaction` to write outline + phases + items atomically.
- **Don't assume the outline parses on first try.** Log raw response on validation failure for observability.
- **For 3b: Tailwind only**, no inline styles, no new component libraries beyond what's in `web-ui/src/components/ui/`. Use whatever neumorphic utilities Phase 2 introduces.
- **Don't touch the existing `Challenge` or `ChallengeCheckIn` models** beyond adding the `solution_outlines` relation field.

# Phase 4 — Document Ingestion & RAG Pipeline

> **Append this section to SPEC.md after Phase 3b.**
> The Phase 1 diagnosis notes at the bottom of this document are working notes for the implementer (Claude Code or future-you) — only the SPEC content above the divider should be copied into SPEC.md.

---

## Phase 4 — Document Ingestion & RAG Pipeline (Planned)

### Purpose

Phase 4 introduces a dedicated pipeline for ingesting user-uploaded documents (surveys, turnover reports, policies, custom files) into the RAG layer so Simon can ground his coaching in the user's actual organisational context — not just the static leadership knowledge base.

This pipeline is **architecturally distinct from `knowledgeLoader.ts`**. The static knowledge base (Simon Sinek principles, leadership frameworks) is curated, version-controlled, and shared across all users. User-uploaded documents are unvetted, tenant-scoped, and dynamic. They live in separate ChromaDB collections, separate Postgres tables, and flow through a separate ingestion path.

### 4.1 Architecture Overview

The pipeline has six clearly separated stages:

```
Parse → Chunk → Embed → Store (with metadata) → Retrieve → Augment prompt
```

Each stage is a distinct service or module. No stage may reach across boundaries — the parser does not know about chunking, the chunker does not know about ChromaDB, the storage layer does not know about retrieval. This separation exists so each stage can be tested, swapped, or scaled independently.

**Service ownership:**
- **Parse, Chunk, Embed, Store** → `agent-server` (the AI/RAG service owns ingestion)
- **Source-of-truth metadata persistence** → `bi-app` (Postgres owner)
- **Retrieve** → `agent-server` (used during chat response generation)
- **Augment prompt** → `agent-server` (existing `promptBuilder.ts`, extended)

**Cross-service access:** agent-server writes ingestion records to Postgres via a small set of internal `bi-app` endpoints (see §4.7). Hot-path retrieval does NOT cross this boundary — document metadata is denormalised onto each ChromaDB chunk so queries stay local to agent-server.

### 4.2 What Must NOT Change

The existing `knowledgeLoader.ts` and the `knowledge` ChromaDB collection are out of scope for Phase 4. They continue to load static `.md` files from `agent-server/src/knowledge/` at startup. The Phase 4 pipeline writes to a different collection and is invoked at runtime by user upload — not at server startup.

The fix applied to prevent RAG poisoning (excluding `category: 'context'` documents from retrieval) must remain in place. Phase 4 does not touch `knowledgeLoader`, `chromaService.searchKnowledge`, or any existing context/knowledge directory loading.

### 4.3 Multi-Tenancy: Organisation Model

Phase 4 introduces an `Organisation` model as the tenancy boundary. Without it, every "organisationId" reference in the pipeline would be fictional.

**Migration:**
- Add `Organisation { id, name, created_at, updated_at }`
- Add `User.organisation_id Int` FK
- Backfill: create one "Personal" organisation, set every existing user's `organisation_id` to it
- Make the FK `NOT NULL` after backfill

This is a small migration with significant payoff: every Phase 4 entity (and future tenant-scoped entities) anchors to a real table.

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

Supported file types: `pdf`, `csv`, `docx`, `md`, `txt`.

Parsing produces normalised raw text. It does not chunk. It does not embed. It returns one of:
- A single text blob (PDF, DOCX, MD, TXT)
- A structured row collection (CSV — preserved as `{ headers: string[], rows: string[][] }`)

Recommended libraries:
- `pdf-parse` for PDF
- `mammoth` for DOCX
- `papaparse` for CSV
- Native `fs.readFileSync` for MD and TXT

The parser module exposes a single function:
```typescript
parseDocument(filePath: string, fileType: FileType): Promise<ParsedDocument>
```

#### 4.4.2 Chunking

Recursive character chunking with overlap. The chunker accepts a `ParsedDocument` and returns `Chunk[]`.

Rules:
- Target chunk size: 500–1000 tokens (use a token estimator — characters / 4 is acceptable)
- Overlap: 10–20% of chunk size
- Split priority: paragraphs (`\n\n`) → sentences (`. `, `! `, `? `) → words → characters
- CSV/structured data: each row (or logical group of rows) preserved as a chunk with column headers prepended as context. Never blindly chunk rows by character count — column-row alignment must be preserved
- Each chunk carries `chunkIndex` (0-based position) and `totalChunks` (set after all chunks are produced)

#### 4.4.3 Embedding

Embeddings use the same embedding function ChromaDB is already configured with (default Chroma embedding or whatever `chromaService` is using). Do NOT introduce a second embedding model — divergent embedding spaces between knowledge base and uploaded documents would silently break retrieval quality.

#### 4.4.4 Storage

Vectors land in ChromaDB. Source-of-truth records land in Postgres. The two are linked via `documentId`.

**ChromaDB:** writes go to a NEW collection `user_documents`, separate from the existing `knowledge` collection. This separation is structural, not just filter-based — it eliminates an entire class of cross-contamination bugs (the same class that caused the earlier RAG poisoning issue with `context/` documents). Trade-off: retrieval queries two collections instead of one and merges results. The cost is small; the safety is large.

**Postgres:** writes the `IngestionDocument` row before chunking begins (status: `pending`), updates to `processing` when chunking starts, and `complete` when all chunks land in ChromaDB. On failure, status becomes `failed` and the row stores an error message.

#### 4.4.5 Retrieval

When Simon needs context for a user message, agent-server queries BOTH collections:
- `knowledge` (existing) for static leadership frameworks
- `user_documents` (new) for the user's organisational context, filtered by `organisationId`

Results are merged with explicit weighting (recommended: cap each source at top-3 hits, then re-rank by score). The retrieval function exposes which results came from which source so the prompt builder can label them appropriately ("From your uploaded survey..." vs "From leadership principles...").

#### 4.4.6 Augment Prompt

The existing `promptBuilder.ts` is extended to accept retrieved chunks from BOTH sources and inject them into Simon's context with clear source labels. No change to Simon's persona or system prompt structure beyond adding a "User-Provided Context" section when uploaded-document chunks are present.

### 4.5 Chunk Metadata Schema

Every chunk stored in `user_documents` MUST carry the following metadata. ChromaDB metadata values must be primitives (string, number, boolean) — arrays are not supported, so `tags` is denormalised to a comma-separated string at the chunk level.

```typescript
interface ChunkMetadata {
  documentId: string;          // ties chunks to source IngestionDocument
  organisationId: number;      // multi-tenancy filter key
  uploadedBy: number;          // user_id
  documentType: 'survey' | 'turnover' | 'policy' | 'report' | 'custom';
  fileType: 'pdf' | 'csv' | 'docx' | 'md' | 'txt';
  uploadedAt: string;          // ISO timestamp
  chunkIndex: number;          // 0-based position
  totalChunks: number;
  source: string;              // original filename
  tagsCsv: string;             // comma-separated tags (denormalised from string[])
}
```

The full `tags: string[]` array lives on the `IngestionDocument` row in Postgres. The CSV form on chunks is for filterability only.

### 4.6 Postgres: IngestionDocument Model

```prisma
model IngestionDocument {
  id              String              @id @default(uuid())  // UUID, not autoincrement — used as documentId in ChromaDB metadata
  organisation    Organisation        @relation(fields: [organisation_id], references: [id])
  organisation_id Int
  uploaded_by     User                @relation(fields: [uploaded_by_id], references: [id])
  uploaded_by_id  Int
  filename        String
  file_type       FileType
  document_type   DocumentType
  status          IngestionStatus     @default(PENDING)
  chunk_count     Int                 @default(0)
  tags            String[]            // Postgres native string[] — full array lives here
  error_message   String?             @db.Text  // populated when status = FAILED
  created_at      DateTime            @default(now())
  updated_at      DateTime            @updatedAt

  @@index([organisation_id])
  @@index([uploaded_by_id])
  @@index([status])
}

enum FileType {
  PDF
  CSV
  DOCX
  MD
  TXT
}

enum DocumentType {
  SURVEY
  TURNOVER
  POLICY
  REPORT
  CUSTOM
}

enum IngestionStatus {
  PENDING       // row created, processing not started
  PROCESSING    // chunking/embedding in progress
  COMPLETE      // all chunks in ChromaDB
  FAILED        // see error_message
}
```

`IngestionDocument.id` is a UUID string (not an autoincrementing int) so it can be used directly as the `documentId` field in ChromaDB metadata without leaking sequential IDs.

**Naming note:** A `DataUpload` model already exists, tied to `ProblemRequest` for one-time data analysis. `IngestionDocument` is intentionally separate — it serves ongoing RAG retrieval, not one-shot analysis. Do NOT consolidate them; their lifecycles and access patterns are different.

### 4.7 DocumentIngestionService Interface

The service lives in `agent-server/src/services/documentIngestionService.ts` and exposes:

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

  listDocuments(
    organisationId: number,
    filters?: { documentType?: DocumentType; status?: IngestionStatus }
  ): Promise<IngestionDocument[]>;

  rechunkDocument(documentId: string, userId: number): Promise<void>;
}
```

`ingestDocument` is the orchestrator — it walks Parse → Chunk → Embed → Store. It's `async` and returns once the row is created with status `PENDING`; chunking proceeds in the background. The frontend polls the document status (or subscribes via the existing chat infrastructure if real-time updates are wanted later).

`rechunkDocument` re-runs Chunk → Embed → Store for an existing document. Used when chunking parameters change or when a previously-failed document is retried. Existing chunks for that `documentId` are deleted from ChromaDB before re-ingestion.

### 4.8 VectorStoreAdapter Interface

ChromaDB is accessed via an adapter, not directly. The `documentIngestionService` and the retrieval layer both depend on the adapter, not on `chromadb`.

```typescript
interface VectorStoreAdapter {
  store(
    collection: string,
    chunks: Array<{ id: string; content: string; metadata: ChunkMetadata }>
  ): Promise<void>;

  search(
    collection: string,
    query: string,
    filters: Record<string, string | number | boolean>,
    limit?: number
  ): Promise<Array<{ content: string; metadata: ChunkMetadata; score: number }>>;

  delete(
    collection: string,
    filters: Record<string, string | number | boolean>
  ): Promise<void>;
}
```

The Phase 4 implementation is `ChromaVectorStoreAdapter`. The interface exists so a future migration to pgvector or Pinecone (see §4.11) can swap implementations without touching the pipeline.

The existing `chromaService.ts` is NOT replaced — it continues to handle the conversation and insights collections and the static knowledge base. The new adapter is a new file, used only by the Phase 4 pipeline.

### 4.9 Internal API (bi-app endpoints called by agent-server)

agent-server doesn't run Prisma. All `IngestionDocument` writes go through bi-app via internal endpoints:

```
POST   /internal/ingestion-documents           — create row (called at start of ingest)
PATCH  /internal/ingestion-documents/:id       — update status, chunk_count, error_message
DELETE /internal/ingestion-documents/:id       — delete row (called by deleteDocument)
GET    /internal/ingestion-documents           — list with org filter
```

These are `/internal/*` routes — separate from `/api/*` user-facing endpoints. Authentication is via a shared service token between bi-app and agent-server (env var, NOT user JWT). User authorisation (does this user own this document?) is enforced inside agent-server before calling the internal endpoint.

**Hot-path retrieval does not call these endpoints.** Document metadata needed for response generation is denormalised onto chunk metadata in ChromaDB. The endpoints are for the management lifecycle (create, update status, delete, list), not for query-time enrichment.

### 4.10 User-Facing API (bi-app)

```
POST   /api/documents                          — multipart upload, returns { documentId, status }
GET    /api/documents                          — list current user's org documents
GET    /api/documents/:id                      — single document detail
DELETE /api/documents/:id                      — soft-delete? hard-delete? (decision: hard-delete in v1, with cascade to ChromaDB chunks)
POST   /api/documents/:id/rechunk              — trigger rechunkDocument
```

bi-app handles auth + ownership checks, then calls into agent-server's ingestion service via HTTP. Ownership is enforced via `IngestionDocument.organisation_id === req.user.organisation_id`.

### 4.11 Future Considerations

- **pgvector migration.** Postgres has a `pgvector` extension that supports vector similarity search natively. Migrating the `user_documents` collection (and eventually the `knowledge`, `conversations`, `insights` collections) from ChromaDB to pgvector would eliminate ChromaDB as a separate service — simplifying AWS deployment, reducing the ops surface, and unifying Postgres as the single data store. The `VectorStoreAdapter` interface is designed for this migration. The trigger to do this is when ChromaDB hosting becomes a deployment friction point (or earlier, if pgvector benchmarks prove sufficient for the scale).

- **Per-organisation vector store namespacing.** v1 uses a single `user_documents` collection with `organisationId` as a metadata filter. At scale, ChromaDB (and pgvector) support per-tenant collections / namespaces, which can improve query performance and harden tenant isolation. The migration path: when an organisation crosses ~100k chunks, lift it into its own collection. The `VectorStoreAdapter.collection` parameter already accommodates this.

- **Document versioning.** v1 treats each upload as immutable. Re-uploading a "Q3 Survey" creates a new `IngestionDocument`. A future version could collapse uploads of the same `(organisation, filename)` into versioned records, with the latest version retrieved by default.

- **Chunk-level citations in Simon's responses.** When Simon cites information from an uploaded document, the response could include a structured citation referencing the `documentId` and `chunkIndex` so the UI can link back to the source. v1 does not implement this; the chunk metadata is structured to support it later.

### 4.12 Acceptance Criteria

Phase 4 is complete when:
- `Organisation` model exists, all users backfilled to "Personal" org
- `IngestionDocument` model migrated cleanly
- Upload flow (PDF, CSV, DOCX, MD, TXT) end-to-end: file uploaded → row created → chunked → embedded → stored in `user_documents` collection with full metadata
- Status lifecycle observable via `GET /api/documents/:id` (PENDING → PROCESSING → COMPLETE or FAILED)
- Simon's responses on a chat with an active organisation surface uploaded-document chunks alongside knowledge-base chunks, labelled by source
- Existing `knowledgeLoader` and `knowledge` collection remain untouched and continue to work
- `VectorStoreAdapter` is in place and `documentIngestionService` does not import `chromadb` directly
- Hard delete works end-to-end: row removed from Postgres, all chunks removed from ChromaDB

### 4.13 Out of Scope

- UI for upload management (a separate phase / sub-phase will design this — sidebar already has an "Uploads" placeholder)
- Soft delete / undo
- Document versioning
- OCR for scanned PDFs
- Document sharing across organisations
- Streaming ingestion progress (polling is sufficient for v1)
- Real-time collaborative annotations on documents

---

## Implementer Notes (NOT for SPEC.md — working notes only)

These are the conflicts and decisions surfaced during spec drafting. Keep them with your prompt history; don't paste them into SPEC.md.

### Conflicts surfaced and resolved
1. **No `Organisation` model existed.** Resolved by adding stub model + backfill migration as Phase 4.3.
2. **`knowledgeLoader.ts` and the existing `knowledge` collection** have a known RAG-poisoning failure mode. Resolved by isolating uploaded documents into a separate `user_documents` collection — structural separation, not filter-based.
3. **Naming overlap with existing `DataUpload` model.** Called out explicitly in §4.6 — they have different lifecycles and shouldn't be consolidated.
4. **agent-server has no Prisma client.** Resolved with `/internal/*` endpoints on bi-app + denormalised chunk metadata to avoid HTTP cost on the hot path (§4.1, §4.9).
5. **ChromaDB metadata cannot store arrays.** Resolved by denormalising `tags` to `tagsCsv` on chunks; full array stays on Postgres row (§4.5).

### Things deliberately left vague
- **Embedding function.** Spec says "use whatever ChromaDB is configured with" rather than naming a model — the existing `chromaService` doesn't appear to specify, so locking it down here would risk a mismatch.
- **Background job runner.** Ingestion is async-after-row-creation, but I didn't spec a queue (BullMQ, etc.). For solo-dev velocity, a simple `setImmediate` + status updates is fine for v1; introduce a queue when concurrency demands it.
- **File size limits.** Not specified. Reasonable starting point: 25 MB per file, 100 chunks max per document.

### Open questions worth thinking about before implementation
- Do you want users to upload on behalf of their org, or scoped to themselves? Spec assumes org-scoped (any org member can see uploads). Flag if you want user-scoped.
- Should the `knowledge` collection retrieval be turned off entirely for organisations that have uploaded documents? (Probably no — leadership principles + organisational context together is the value proposition — but worth confirming.)
- Are there compliance/PII concerns for uploaded surveys? v1 assumes no, but if you ever target regulated industries this needs revisiting.