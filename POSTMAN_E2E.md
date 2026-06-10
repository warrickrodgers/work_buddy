# WorkBuddy — Postman E2E Test Plan

Phase 3a acceptance gate + full API coverage. Run requests in the order listed; each section builds on the state created by the previous one.

---

## Environment Setup

Create a Postman environment called **WorkBuddy Local** with these variables:

| Variable        | Initial value              | Notes                          |
|----------------|---------------------------|--------------------------------|
| `base_url`      | `http://localhost:3000/api` | bi-app                         |
| `token`         | *(empty)*                  | Set automatically by Sign In   |
| `user_id`       | *(empty)*                  | Set automatically by Sign In   |
| `challenge_id`  | *(empty)*                  | Set automatically by Create Challenge |
| `conversation_id` | *(empty)*               | Set automatically by first message |
| `outline_id`    | *(empty)*                  | Set automatically by outline response |
| `checklist_item_id` | *(empty)*             | Set after GET outline          |
| `habit_id`      | *(empty)*                  | Set after GET outline          |
| `check_in_id`   | *(empty)*                  | Set after GET outline          |

Set `Authorization` header globally: **Bearer {{token}}**

---

## Section 1 — Auth

### 1.1 Sign Up (first run only)

**POST** `{{base_url}}/auth/signup`

```json
{
  "email": "testuser@workbuddy.dev",
  "password": "TestPass123!",
  "first_name": "Test",
  "last_name": "User"
}
```

**Expected:** `201`
```json
{
  "token": "<jwt>",
  "user": { "id": 1, "email": "testuser@workbuddy.dev", ... }
}
```

**Tests tab script:**
```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Has token", () => pm.expect(pm.response.json().token).to.be.a("string"));
pm.environment.set("token",   pm.response.json().token);
pm.environment.set("user_id", pm.response.json().user.id);
```

---

### 1.2 Sign In

**POST** `{{base_url}}/auth/signin`

```json
{
  "email": "testuser@workbuddy.dev",
  "password": "TestPass123!"
}
```

**Expected:** `200`
```json
{
  "token": "<jwt>",
  "user": { "id": 1, ... }
}
```

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Has token", () => pm.expect(pm.response.json().token).to.be.a("string"));
pm.environment.set("token",   pm.response.json().token);
pm.environment.set("user_id", pm.response.json().user.id);
```

---

### 1.3 Verify Token

**GET** `{{base_url}}/auth/verify`
Headers: `Authorization: Bearer {{token}}`

**Expected:** `200` — `{ "user": { "userId": 1, ... } }`

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("userId present", () => pm.expect(pm.response.json().user.userId).to.be.a("number"));
```

---

## Section 2 — Challenges

### 2.1 Create Challenge

**POST** `{{base_url}}/challenges`

```json
{
  "user_id": {{user_id}},
  "title": "Improve Team Standups",
  "description": "Make daily standups more focused and outcome-driven.",
  "category": "COMMUNICATION",
  "challenge_type": "HABIT",
  "audience_type": "TEAM",
  "start_date": "2026-05-01T00:00:00.000Z",
  "success_criteria": "Standups finish in under 15 minutes with clear action items."
}
```

**Expected:** `201` — challenge object with `id`

**Tests tab script:**
```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Has id", () => pm.expect(pm.response.json().id).to.be.a("number"));
pm.environment.set("challenge_id", pm.response.json().id);
```

---

### 2.2 Get Challenge

**GET** `{{base_url}}/challenges/{{challenge_id}}`

**Expected:** `200` — full challenge object matching what was created

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Title matches", () => pm.expect(pm.response.json().title).to.equal("Improve Team Standups"));
```

---

### 2.3 List Challenges for User

**GET** `{{base_url}}/challenges/user/{{user_id}}`

**Expected:** `200` — array containing at least the challenge just created

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("At least one challenge", () => pm.expect(pm.response.json()).to.have.length.above(0));
```

---

## Section 3 — Conversational Chat (non-outline)

### 3.1 Create Conversation for Challenge

**POST** `{{base_url}}/conversations`

```json
{
  "user_id": {{user_id}},
  "title": "Coaching: Improve Team Standups",
  "conversation_type": "CHALLENGE",
  "challenge_id": {{challenge_id}}
}
```

**Expected:** `201` — conversation object with `id`

**Tests tab script:**
```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));
pm.environment.set("conversation_id", pm.response.json().id);
```

---

### 3.2 Send a Conversational Message (should NOT produce an outline)

**POST** `{{base_url}}/conversations/{{conversation_id}}/messages`

```json
{
  "role": "USER",
  "content": "What do you think is causing our standups to run long?"
}
```

**Expected:** `201`
```json
{
  "userMessage":      { "id": ..., "content": "What do you think..." },
  "assistantMessage": { "id": ..., "content": "<Simon's coaching response>" }
}
```

No `kind: "outline"` field should be present, or if present it should not be `"outline"`.

**Tests tab script:**
```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));

const body = pm.response.json();
pm.test("Has userMessage",      () => pm.expect(body.userMessage).to.be.an("object"));
pm.test("Has assistantMessage", () => pm.expect(body.assistantMessage).to.be.an("object"));
pm.test("Is NOT an outline",    () => pm.expect(body.kind).to.not.equal("outline"));
pm.test("Response is non-empty",() => pm.expect(body.assistantMessage.content.length).to.be.above(10));
```

---

### 3.3 Fetch Conversation Messages

**GET** `{{base_url}}/conversations/{{conversation_id}}/messages`

**Expected:** `200` — `{ messages: [...] }` with at least 2 messages (user + assistant)

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("At least 2 messages", () => pm.expect(pm.response.json().messages.length).to.be.at.least(2));
```

---

## Section 4 — Outline Generation (core Phase 3a gate)

### 4.1 Send a Plan-Request Message (should produce an outline)

Send a message with clear plan-request intent so the intent classifier returns `plan_likely` and Simon generates a structured outline.

**POST** `{{base_url}}/conversations/{{conversation_id}}/messages`

```json
{
  "role": "USER",
  "content": "Can you generate a solution outline with a step-by-step plan to fix our standup problem?"
}
```

**Expected:** `201`
```json
{
  "kind":      "outline",
  "outlineId": 1,
  "preamble":  "<Simon's 1-2 sentence lead-in>",
  "outline":   { "id": 1, ... },
  "userMessage":      { ... },
  "assistantMessage": { "content": "<preamble text>" }
}
```

**Tests tab script:**
```javascript
pm.test("Status 201", () => pm.response.to.have.status(201));

const body = pm.response.json();
pm.test("kind is outline",         () => pm.expect(body.kind).to.equal("outline"));
pm.test("Has outlineId",           () => pm.expect(body.outlineId).to.be.a("number"));
pm.test("Has preamble",            () => pm.expect(body.preamble).to.be.a("string").and.have.length.above(5));
pm.test("Has outline.phases",      () => pm.expect(body.outline.phases).to.be.an("array").and.have.length.above(0));
pm.test("assistantMessage stored", () => pm.expect(body.assistantMessage.content).to.equal(body.preamble));

pm.environment.set("outline_id", body.outlineId);
```

> **If this returns `kind: "message"` instead:** Simon didn't generate an outline. Try a more explicit prompt like `"Give me a detailed structured plan I can save and track for fixing our standup issue"` and re-run. The intent classifier threshold may need tuning — check agent-server logs for the `signal` and `score` values.

---

## Section 5 — Outline REST API

### 5.1 List Outlines for Challenge

**GET** `{{base_url}}/challenges/{{challenge_id}}/outlines`

**Expected:** `200` — `{ outlines: [ { id: {{outline_id}}, phases: [...] } ] }`

**Tests tab script:**
```javascript
pm.test("Status 200",           () => pm.response.to.have.status(200));
pm.test("At least one outline", () => pm.expect(pm.response.json().outlines.length).to.be.above(0));
pm.test("Outline has phases",   () => pm.expect(pm.response.json().outlines[0].phases.length).to.be.above(0));
```

---

### 5.2 Get Full Outline

**GET** `{{base_url}}/outlines/{{outline_id}}`

**Expected:** `200` — full outline with nested phases, checklist items, habits, check-in prompts, and habit logs

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));

const outline = pm.response.json().outline;
pm.test("Has title",  () => pm.expect(outline.title).to.be.a("string"));
pm.test("Has why",    () => pm.expect(outline.why).to.be.a("string").and.have.length.above(0));
pm.test("Has phases", () => pm.expect(outline.phases).to.be.an("array").and.have.length.above(0));

// Capture IDs for downstream tests
const phase = outline.phases[0];
if (phase.checklist_items?.length)  pm.environment.set("checklist_item_id", phase.checklist_items[0].id);
if (phase.habits?.length)           pm.environment.set("habit_id",          phase.habits[0].id);
if (phase.check_in_prompts?.length) pm.environment.set("check_in_id",       phase.check_in_prompts[0].id);
```

---

### 5.3 Get Outline — Ownership Enforcement

Sign in as a different user (or use an invalid token) and attempt to fetch the outline.

**GET** `{{base_url}}/outlines/{{outline_id}}`
Headers: `Authorization: Bearer <other_user_token>`

**Expected:** `403 Forbidden`

**Tests tab script:**
```javascript
pm.test("Status 403", () => pm.response.to.have.status(403));
```

---

## Section 6 — Checklist Items

### 6.1 Toggle Checklist Item — Complete

**PATCH** `{{base_url}}/checklist-items/{{checklist_item_id}}`

```json
{ "is_complete": true }
```

**Expected:** `200` — `{ item: { id: ..., is_complete: true, completed_at: "<timestamp>" } }`

**Tests tab script:**
```javascript
pm.test("Status 200",          () => pm.response.to.have.status(200));
pm.test("is_complete is true", () => pm.expect(pm.response.json().item.is_complete).to.be.true);
pm.test("completed_at is set", () => pm.expect(pm.response.json().item.completed_at).to.not.be.null);
```

---

### 6.2 Toggle Checklist Item — Uncomplete

**PATCH** `{{base_url}}/checklist-items/{{checklist_item_id}}`

```json
{ "is_complete": false }
```

**Expected:** `200` — `{ item: { is_complete: false, completed_at: null } }`

**Tests tab script:**
```javascript
pm.test("Status 200",           () => pm.response.to.have.status(200));
pm.test("is_complete is false", () => pm.expect(pm.response.json().item.is_complete).to.be.false);
pm.test("completed_at cleared", () => pm.expect(pm.response.json().item.completed_at).to.be.null);
```

---

### 6.3 Toggle — Missing Field Validation

**PATCH** `{{base_url}}/checklist-items/{{checklist_item_id}}`

```json
{}
```

**Expected:** `400 Bad Request`

**Tests tab script:**
```javascript
pm.test("Status 400", () => pm.response.to.have.status(400));
```

---

## Section 7 — Habit Logging

### 7.1 Log a Habit

**POST** `{{base_url}}/habits/{{habit_id}}/log`

```json
{
  "logged_for": "2026-05-01",
  "notes": "Did the full 15-minute standup review today."
}
```

**Expected:** `200` or `201` — `{ log: { id: ..., habit_id: ..., logged_for: "2026-05-01T..." } }`

**Tests tab script:**
```javascript
pm.test("Status 2xx",      () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));
pm.test("Log has habit_id",() => pm.expect(pm.response.json().log.habit_id).to.be.a("number"));
```

---

### 7.2 Log Same Date Again (idempotency)

**POST** `{{base_url}}/habits/{{habit_id}}/log`

```json
{
  "logged_for": "2026-05-01",
  "notes": "Updated note."
}
```

**Expected:** `200` — updates notes, does NOT create a duplicate

**Tests tab script:**
```javascript
pm.test("Status 200",         () => pm.response.to.have.status(200));
pm.test("Notes updated",      () => pm.expect(pm.response.json().log.notes).to.equal("Updated note."));
```

---

### 7.3 Log a Different Date

**POST** `{{base_url}}/habits/{{habit_id}}/log`

```json
{ "logged_for": "2026-05-02" }
```

**Expected:** `200` or `201` — new log entry for a different date

**Tests tab script:**
```javascript
pm.test("Status 2xx", () => pm.expect(pm.response.code).to.be.oneOf([200, 201]));
```

---

### 7.4 Log — Missing logged_for

**POST** `{{base_url}}/habits/{{habit_id}}/log`

```json
{ "notes": "Forgot the date" }
```

**Expected:** `400 Bad Request`

**Tests tab script:**
```javascript
pm.test("Status 400", () => pm.response.to.have.status(400));
```

---

## Section 8 — Check-In Prompts

### 8.1 Submit a Reflection

**PATCH** `{{base_url}}/check-in-prompts/{{check_in_id}}/respond`

```json
{
  "response": "I noticed the team is much more engaged when we start with blockers first rather than status updates."
}
```

**Expected:** `200` — `{ prompt: { id: ..., response: "...", responded_at: "<timestamp>" } }`

**Tests tab script:**
```javascript
pm.test("Status 200",           () => pm.response.to.have.status(200));
pm.test("Response saved",       () => pm.expect(pm.response.json().prompt.response).to.have.length.above(5));
pm.test("responded_at is set",  () => pm.expect(pm.response.json().prompt.responded_at).to.not.be.null);
```

---

### 8.2 Submit — Empty Response

**PATCH** `{{base_url}}/check-in-prompts/{{check_in_id}}/respond`

```json
{ "response": "   " }
```

**Expected:** `400 Bad Request`

**Tests tab script:**
```javascript
pm.test("Status 400", () => pm.response.to.have.status(400));
```

---

## Section 9 — Edge Cases & Error Handling

### 9.1 Non-Plan Message Produces No Outline

**POST** `{{base_url}}/conversations/{{conversation_id}}/messages`

```json
{
  "role": "USER",
  "content": "How is everyone feeling about the team culture lately?"
}
```

**Expected:** `201` with `kind` absent or not `"outline"`, and `assistantMessage` present.

**Tests tab script:**
```javascript
pm.test("Status 201",        () => pm.response.to.have.status(201));
pm.test("NOT an outline",    () => pm.expect(pm.response.json().kind).to.not.equal("outline"));
pm.test("Has assistant msg", () => pm.expect(pm.response.json().assistantMessage).to.be.an("object"));
```

---

### 9.2 Outline Not Found

**GET** `{{base_url}}/outlines/999999`

**Expected:** `404 Not Found`

**Tests tab script:**
```javascript
pm.test("Status 404", () => pm.response.to.have.status(404));
```

---

### 9.3 Unauthenticated Request

**GET** `{{base_url}}/outlines/{{outline_id}}`
*(No Authorization header)*

**Expected:** `401 Unauthorized`

**Tests tab script:**
```javascript
pm.test("Status 401", () => pm.response.to.have.status(401));
```

---

### 9.4 Challenge Has No Outlines (different challenge)

**GET** `{{base_url}}/challenges/999999/outlines`

**Expected:** `200` — `{ outlines: [] }` (or `403`/`404` if ownership is enforced at this level)

**Tests tab script:**
```javascript
pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Empty list", () => pm.expect(pm.response.json().outlines).to.be.an("array").and.have.length(0));
```

---

## Phase 3a Acceptance Checklist

Run these requests in order and confirm all pass before declaring Phase 3a done:

- [ ] **1.2** Sign In returns a valid JWT
- [ ] **2.1** Challenge created successfully
- [ ] **3.2** Conversational message → `kind` is NOT `"outline"`, `assistantMessage` present
- [ ] **4.1** Plan-request message → `kind: "outline"`, `outlineId` set, `phases` non-empty
- [ ] **5.1** List outlines for challenge → outline appears
- [ ] **5.2** Get full outline → phases, checklist items, habits, check-in prompts all present
- [ ] **6.1** Toggle checklist item complete → `is_complete: true`, `completed_at` set
- [ ] **6.2** Toggle uncomplete → `is_complete: false`, `completed_at: null`
- [ ] **7.1** Log habit for a date → success
- [ ] **7.2** Log same date again → idempotent (200, no duplicate)
- [ ] **8.1** Submit check-in response → `responded_at` set
- [ ] **5.3** Other user cannot access outline → `403`
- [ ] **9.1** Non-plan message produces no outline
- [ ] **9.3** Unauthenticated request → `401`

All boxes checked = Phase 3a gate passed. Phase 3b (UI) is unblocked.

---

## Section 10 — Teardown

Run this section after all tests pass to clean up state created during the run.

> **What the API covers vs. what it doesn't:**
>
> | Resource | DELETE endpoint | Cascade behaviour |
> |---|---|---|
> | Challenge | ✅ `DELETE /challenges/:id` | Cascades → outlines, phases, items, check-ins |
> | Outline | ❌ No endpoint | Deleted via challenge cascade |
> | Conversation | ❌ No endpoint | `challenge_id` FK set to null on challenge delete; messages remain |
> | User | ❌ No endpoint | Must be removed manually from DB |
>
> The single challenge delete handles everything outline-related. The conversation and user require a manual DB step — see 10.3 and 10.4.

---

### 10.1 Delete the Challenge

This is the only teardown call you need to make via the API. Deleting the challenge cascades and removes:
- All `SolutionOutline` records for this challenge
- All `OutlinePhase`, `ChecklistItem`, `Habit`, `HabitLog`, `CheckInPrompt` records
- All `ChallengeCheckIn` records

**DELETE** `{{base_url}}/challenges/{{challenge_id}}`

**Expected:** `200` — `{ "success": true }`

**Tests tab script:**
```javascript
pm.test("Status 200",     () => pm.response.to.have.status(200));
pm.test("success: true",  () => pm.expect(pm.response.json().success).to.be.true);

// Clear environment variables that are no longer valid
pm.environment.unset("challenge_id");
pm.environment.unset("outline_id");
pm.environment.unset("checklist_item_id");
pm.environment.unset("habit_id");
pm.environment.unset("check_in_id");
```

---

### 10.2 Verify Challenge Is Gone

**GET** `{{base_url}}/challenges/{{challenge_id}}`

**Expected:** `404 Not Found` (or the variable is now unset and the URL resolves to `undefined`)

**Tests tab script:**
```javascript
pm.test("Status 404", () => pm.response.to.have.status(404));
```

---

### 10.3 Conversation Cleanup (manual DB step)

The conversation created in **3.1** is not deleted by the challenge cascade — its `challenge_id` FK is set to null, but the row and its messages remain. There is no `DELETE /conversations/:id` endpoint.

To clean it up, run this against your PostgreSQL database:

```sql
-- Replace <conversation_id> with the value captured in your environment
DELETE FROM "ChatMessage"    WHERE conversation_id = <conversation_id>;
DELETE FROM "Conversation"   WHERE id = <conversation_id>;
```

Or, if you want to wipe all orphaned conversations for the test user:

```sql
DELETE FROM "ChatMessage"
WHERE conversation_id IN (
    SELECT id FROM "Conversation" WHERE user_id = <user_id> AND challenge_id IS NULL
);
DELETE FROM "Conversation" WHERE user_id = <user_id> AND challenge_id IS NULL;
```

> **Future work:** A `DELETE /conversations/:id` endpoint would allow this to be done via the API. Worth adding before Phase 3b ships.

---

### 10.4 User Cleanup (manual DB step)

There is no `DELETE /auth/user` endpoint. To remove the test user after a run:

```sql
-- Cascades through all owned data if FK constraints are set up with onDelete: Cascade,
-- otherwise delete dependents first (conversations, challenges, etc.)
DELETE FROM "User" WHERE email = 'testuser@workbuddy.dev';
```

If you reuse the same test user across runs, skip this step and just re-run **1.2 Sign In** at the top of the next run.

---

### 10.5 Environment Reset

After teardown, clear all remaining environment variables so the next run starts clean:

In Postman: **Environments → WorkBuddy Local → Reset All**

Or run this in a Postman script (attach to a dummy GET request):

```javascript
["token", "user_id", "challenge_id", "conversation_id",
 "outline_id", "checklist_item_id", "habit_id", "check_in_id"
].forEach(k => pm.environment.unset(k));
```

---

## Notes

- **Agent server** must be running on `http://localhost:4000` for the AI response tests to work.
- **ChromaDB** must be running on `http://localhost:8000`.
- Check agent-server logs after **4.1** to confirm the intent classifier logged `signal=plan_likely` and a score ≥ 0.75. If the score is lower, try a more explicit prompt.
- If **4.1** consistently produces `kind: "message"`, the classifier thresholds may need tuning in [agent-server/src/services/intentClassifier.ts](agent-server/src/services/intentClassifier.ts) (`THRESHOLDS.likely` and `THRESHOLDS.possible`).
- **Teardown order matters** — always run 10.1 before 10.3. The challenge delete must happen first so the conversation's `challenge_id` FK is nulled before you attempt to delete the conversation row.
