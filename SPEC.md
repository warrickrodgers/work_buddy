# WorkBuddy — Product Specification

## Phase 1 — Foundation (Completed)

### Authentication
- User registration and login with JWT-based auth
- Protected routes via `AuthContext` and `ProtectedRoute` wrapper
- Session persistence via localStorage token

### Dashboard Shell
- Sidebar navigation with collapsible panel (`AppSidebar`)
- Breadcrumb header with theme toggle (light/dark)
- Route-based page rendering under `/dashboard/*`

### General AI Chat (`/dashboard/chat`)
- Persistent GENERAL-type conversation per user (cached 5 min)
- Streaming-style message rendering with ReactMarkdown + GFM
- Typing indicator with animated dots
- Full conversation history loaded on mount

### Challenges (`/dashboard/challenges`)
- Challenge list view with status badges, progress bars, and date ranges
- Challenge detail view: left-panel metadata + right-panel coaching chat
- Challenge-scoped CHALLENGE-type conversations with AI coach "Simon"
- Create challenge form with validation (title, category, type, audience, dates, KPIs)

### Dashboard Home (`/dashboard`)
- Overview cards: active challenges, recent chat activity
- Priority task indicators with color-coded borders
- Stat widgets for completed challenges and average progress

### Theming Infrastructure
- Tailwind v4 with `@theme inline` CSS variable mapping
- shadcn/ui zinc theme with full light/dark mode token set
- `ThemeContext` toggling `.dark` class on document root
- Semantic CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, etc.

---

## Phase 2 — Neumorphic UI Overhaul (Planned / In Progress)

### Design Direction

Uplift the entire dashboard to a **neumorphic design system** inspired by the landing page (`Home.tsx`) aesthetic. The landing page establishes the brand identity:

- **`PRIMARY`** — `oklch(21% 0.034 264.665)` — deep dark navy (brand base)
- **`PRIMARY_LIGHT`** — `oklch(26% 0.04 264.665)` — lifted surface variant
- **`ACCENT`** — `oklch(62% 0.18 245)` — vivid cobalt blue (interactive elements)

Neumorphism creates the illusion of soft, extruded surfaces using dual box shadows — one darker shadow angled toward the bottom-right, one lighter shadow angled toward the top-left. Elements appear to emerge from or press into the background.

---

### Token System Overhaul (`App.css`)

Replace the zinc shadcn defaults with a neumorphic-aware palette:

**Light mode** — soft blue-gray neumorphic base:
- `--background / --card`: `hsl(220 16% 93%)` — classic neumorphic off-white
- `--foreground`: `hsl(224 32% 16%)` — deep navy text
- `--primary`: `oklch(62% 0.18 245)` — brand blue accent
- `--nm-shadow-dark`: `hsl(220 16% 78%)` — depth shadow
- `--nm-shadow-light`: `hsl(0 0% 100%)` — highlight shadow

**Dark mode** — drawn directly from Home.tsx brand colors:
- `--background / --card`: `oklch(21% 0.034 264.665)` / `oklch(23.5% 0.037 264.665)` — PRIMARY family
- `--foreground`: `oklch(92% 0.008 264)` — near white
- `--primary`: `oklch(62% 0.18 245)` — ACCENT blue (consistent across modes)
- `--sidebar`: `oklch(19.5% 0.032 264.665)` — deeper than background
- `--nm-shadow-dark`: `oklch(15.5% 0.026 264)` — deep depression shadow
- `--nm-shadow-light`: `oklch(27% 0.046 264.665)` — PRIMARY_LIGHT as highlight

**Neumorphic shadow utilities** added to `App.css`:
- `.nm-raised` — raised element (default card style)
- `.nm-inset` — concave element (input fields, depressed areas)
- `.nm-pressed` — active/pressed state (button click)

---

### Component Updates

#### Cards
- Remove `border` and `shadow-sm`; replace with `nm-raised`
- `rounded-2xl` for softer edges
- Background matches page surface (`bg-card` = `--background`) — the shadows do the work

#### Inputs & Textareas
- Remove border; apply `nm-inset` — inputs appear pressed into the surface
- Background: `bg-background` so the inset shadow reads correctly

#### Buttons
- **Primary (CTA)**: Solid `bg-primary text-primary-foreground` — accent color stands out from the monochromatic surface, no neumorphic shadow
- **Secondary**: `bg-background nm-raised` — emerges from the surface
- **Ghost / Link**: unchanged

#### Sidebar
- Dark mode: uses `oklch(19.5% 0.032 264.665)` — slightly deeper than page background, giving it a recessed panel feel
- Active items highlight with `oklch(62% 0.18 245 / 0.15)` accent tint

---

### Status Badges — Standardised Component

Replace inline conditional class strings with a shared `<StatusBadge status="ACTIVE | COMPLETED | DRAFT" />` component. Badges use intent-based tokens rather than raw Tailwind color names, making them dark-mode-safe.

### Progress Bars — Standardised Component

Replace inline progress bar markup with a shared `<ProgressBar value={n} />` using `bg-primary` fill on `bg-muted` track.

### Select Elements

Replace native `<select>` in CreateChallenge with shadcn `<Select>` so they inherit the neumorphic input style and have proper dark mode and keyboard nav.

### Chat UI Improvements

- Message timestamps with relative display ("2 min ago")
- Copy-to-clipboard action on assistant messages
- Persist draft input in `sessionStorage` across navigation
- Richer empty-state illustrations replacing icon-only zero states

### Accessibility

- `aria-label` on all icon-only buttons (send, back arrow, theme toggle)
- WCAG AA contrast audit across all status badge and muted-text pairings in both modes
- Keyboard-navigable sidebar active-link indicator

### Performance

- Skeleton loaders replacing plain-text "Loading…" states
- Virtual scroll / load-more for long message histories
- Optimistic UI standardised across all chat views
