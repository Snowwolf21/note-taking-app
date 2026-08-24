# Inkwell — Smart Notes Workspace

A full-stack, production-grade note-taking web application built with **Next.js 15**, **React 19**, and a custom file-based persistence layer. Designed as a portfolio-quality project demonstrating real-world authentication, responsive UI, accessibility, and clean full-stack architecture.

---

## 📸 Features

- ✅ Create, read, update, and delete notes
- ✅ Archive / restore notes
- ✅ Filter notes by tag and view (All / Archived)
- ✅ Real-time full-text search (title, content, tags)
- ✅ 4 colour themes: Dark, Light, Sepia, Slate
- ✅ 3 font themes: Sans-serif, Serif, Monospace
- ✅ Edit / Preview mode with Markdown support
- ✅ User authentication: Register, Login, Logout
- ✅ Forgot password / Reset password flow (secure 6-digit PIN)
- ✅ Guest mode with demo notes (no sign-in required)
- ✅ Fully responsive: Mobile, Tablet, Desktop
- ✅ 100% keyboard navigable with visible focus rings
- ✅ Draggable floating settings widget

---

## 🧰 Tech Stack

### Frontend

| Technology | Version | Why This Choice |
|------------|---------|----------------|
| **Next.js** | 15.1.0 | App Router with React Server Components, built-in API routes, and file-based routing make it the gold standard for modern full-stack React apps. Eliminates the need for a separate Express server. |
| **React** | 19 | Latest stable version with concurrent rendering improvements. |
| **TypeScript** | 5.7 | Catches type errors at compile time, enforces API contracts between components, and makes refactoring safe. Every prop, hook return, and API response shape is typed. |
| **Tailwind CSS** | 4.0 | Utility-first CSS with CSS custom property (variable) theming. Tailwind v4's new syntax (`bg-(--primary)`) enables clean runtime theme switching without any JavaScript. |
| **Zustand** | 5.0 | Lightweight global state management. Chosen over Redux because the app's state (auth user, selected note, active filters, modal states) is simple enough that Redux's boilerplate adds noise without benefit. |
| **TanStack Query** | 5.0 | Server state management for API data fetching, caching, and mutation. Handles re-fetching, loading states, and cache invalidation after mutations (create/update/delete). |
| **Lucide React** | 0.468 | Consistent, tree-shakeable SVG icon library. Only imported icons appear in the bundle. |
| **jose** | 5.9 | Web-standard JWT signing and verification. Runs in both Node.js and Edge Runtime — unlike `jsonwebtoken` which is Node.js-only. |
| **bcryptjs** | 2.4 | Password hashing with adaptive cost factor (10 rounds). Pure JavaScript — no native bindings required, making deployment simpler. |

### Backend

| Technology | Why This Choice |
|------------|----------------|
| **Next.js API Routes** | Co-located with the frontend — no separate backend service to run, deploy, or maintain. Each route file exports HTTP method handlers (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). |
| **Custom File-based DB** | A zero-dependency, portable database adapter that mirrors the Prisma Client API exactly (`db.note.findMany`, `db.user.findUnique`). Swapping to real SQLite + Prisma requires changing only one file (`lib/db.ts`). |
| **Prisma (schema only)** | `prisma/schema.prisma` defines `User`, `Note`, and `PasswordResetToken` models with full relationships — ready to activate. |

---

## 🏛️ Architecture & Logic

### Project Structure

```
src/
├── app/
│   ├── page.tsx              # Root layout — orchestrates state, composes panels
│   ├── globals.css           # CSS custom properties for all themes
│   └── api/
│       ├── auth/route.ts     # All auth actions via POST body action field
│       └── notes/
│           ├── route.ts      # GET (list), POST (create)
│           └── [id]/route.ts # GET, PUT (update), PATCH (archive), DELETE
├── components/
│   ├── Sidebar.tsx           # Left nav: views, tags, user profile
│   ├── NoteList.tsx          # Middle column: note cards with actions
│   ├── NoteEditor.tsx        # Right panel: title, tags, content editor
│   ├── AuthModal.tsx         # Login / Register / Change Password modal
│   ├── ForgotPasswordModal.tsx
│   ├── SettingsModal.tsx     # Theme switcher
│   ├── ConfirmModal.tsx      # Delete confirmation dialog
│   └── FloatingSettingsWidget.tsx  # Draggable settings shortcut
├── hooks/
│   └── useNotes.ts           # TanStack Query: fetch, create, update, delete, archive
├── lib/
│   ├── auth.ts               # JWT signing, bcrypt, cookie helpers
│   ├── db.ts                 # File-based DB adapter (Prisma-compatible API)
│   └── rate-limit.ts         # In-memory IP-based rate limiter
└── store/
    └── useAppStore.ts        # Zustand global state
```

---

### State Management Design

The app has two distinct kinds of state, each managed separately:

#### 1. Global UI State → Zustand (`useAppStore`)

UI-only state that any component needs to read or set:

- `selectedNoteId` — which note is open in the editor
- `isNewNoteMode` — whether a blank new note editor is showing
- `activeView` (`all` | `archived`) — current list filter
- `activeTag` — active tag pill filter
- `searchQuery` — live search string
- `user` — authenticated user object (`null` for guests)
- Modal open/close flags (`isSettingsOpen`, `authModal`, etc.)

**Why Zustand over React Context API?**
React Context re-renders every consumer on any state change. Zustand subscriptions are granular — a component reading only `selectedNoteId` only re-renders when that specific slice changes. This is critical for performance in a note editor where typing must not trigger unrelated re-renders.

#### 2. Server State → TanStack Query (`useNotes`)

Data that lives on the server and needs fetching, caching, and synchronisation:

- Notes list (fetched from `/api/notes`)
- Cache invalidated after every mutation (create, save, delete, archive)
- Keeps UI in sync without manual `setState` calls

**Why TanStack Query over plain `useEffect` + `fetch`?**
- Automatic background re-fetching when the window regains focus
- Loading and error states built-in
- Cache invalidation after mutations in one line
- Request deduplication — multiple components requesting the same data make only one network request

---

### Mobile Navigation Logic

On screens under `768px`, the app operates as a **single-panel view** — only one panel is visible at a time:

```
Default view     → NoteList (full screen)
Tap a note card  → NoteEditor (full screen)
Tap "← Notes"   → Back to NoteList
```

**How it's implemented:**

```tsx
// NoteList — hidden when a note is selected or new note mode is active
className={selectedNoteId !== null || isNewNoteMode ? 'hidden md:flex' : 'flex'}

// NoteEditor wrapper — shown only when a note is active
className={selectedNoteId !== null || isNewNoteMode ? 'flex' : 'hidden md:flex'}
```

The two panels mirror each other's visibility condition exactly. `onBackMobile` resets both `selectedNoteId` and `isNewNoteMode` to `null`/`false`, which triggers NoteList to become visible again.

---

### Authentication Flow

```
Register → hashPassword (bcrypt, 10 rounds)
         → db.user.create
         → signToken (HS256 JWT, 1-day expiry)
         → setAuthCookie (httpOnly, sameSite: lax, secure in production)

Login    → db.user.findUnique (by email)
         → verifyPassword (bcrypt.compare)
         → signToken → setAuthCookie

Request  → cookies().get('auth_token')
         → jwtVerify (jose)
         → db.user.findUnique (confirm user still exists)
         → return UserSession to API route handler
```

**Security decisions explained:**

| Decision | Reason |
|----------|--------|
| `httpOnly` cookie for JWT | Token is never accessible to JavaScript. XSS attacks cannot steal it. |
| `sameSite: lax` | Blocks cross-site form POST requests from other origins (CSRF protection). |
| Generic login error message | `"Invalid email or password"` whether email or password is wrong — prevents email enumeration attacks. |
| `randomInt` from Node `crypto` | Cryptographically secure random reset PINs — not predictable like `Math.random()`. |
| 10-minute reset PIN expiry | Short window limits brute-force attack surface on password reset codes. |
| Rate limiting (10 req/min per IP) | Auth endpoints are rate-limited via `lib/rate-limit.ts`. Applies to login, register, forgot-password, reset-password. |

---

### Guest Mode

Users who don't sign in receive a guest session:

1. On first visit, a `guest_xxx` cookie ID is generated server-side using `Date.now()` + a random suffix
2. Demo notes are seeded into the database under that guest ID
3. All read operations work normally
4. All write operations (create, save, archive, delete) are blocked client-side — the Sign In modal appears instead

Guest IDs are stored in an `httpOnly` cookie with a 30-day expiry, so the same demo notes reappear on return visits.

---

## ⌨️ Keyboard Navigation

The app is fully operable without a mouse. Every interactive element has a visible focus ring and proper ARIA attributes.

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + N` / `Ctrl + N` | Create a new note |
| `Cmd + S` / `Ctrl + S` | Save the current note |
| `/` | Jump focus to the search input |

### Note List Navigation

| Key | Action |
|-----|--------|
| `↑` Arrow Up | Select the previous note in the list |
| `↓` Arrow Down | Select the next note in the list |
| `Tab` | Move between interactive elements |
| `Enter` / `Space` | Open the focused note in the editor |

**How arrow key navigation works:**

The note list container has `tabIndex={0}` to receive keyboard focus. An `onKeyDown` handler intercepts `ArrowUp` and `ArrowDown` and calls `onSelectNote` with the adjacent note's ID, preventing the browser's default scroll behaviour.

```tsx
const handleListKeyDown = (e: React.KeyboardEvent) => {
  const currentIndex = notes.findIndex((n) => n.id === selectedNoteId);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    onSelectNote(notes[(currentIndex + 1) % notes.length].id);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    onSelectNote(notes[(currentIndex - 1 + notes.length) % notes.length].id);
  }
};
```

The modulo (`%`) wrapping means pressing `↓` on the last note wraps back to the first, and `↑` on the first note wraps to the last.

### Note Editor

| Key | Action |
|-----|--------|
| `Tab` | Move between Title → Tags → Content → Add Tag button |
| `Enter` (in tag input) | Add the typed tag |
| `,` (in tag input) | Also adds the typed tag (comma-separated workflow) |

### Tag Filter Pills

| Key | Action |
|-----|--------|
| `Tab` | Move between tag pills |
| `Enter` / `Space` | Apply the focused tag as a filter |

### Modals

| Key | Action |
|-----|--------|
| `Escape` | Close the open modal |
| `Tab` | Cycle through form fields |
| `Enter` | Submit the focused form |

**Why keyboard navigation is non-negotiable:**
WCAG 2.1 Level AA requires full keyboard operability for all functionality. Screen reader users, power users who prefer the keyboard, and developers all navigate primarily without a mouse. Building this from the start — rather than retrofitting — demonstrates professional-grade accessibility thinking.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/note-taking-app.git
cd note-taking-app

# 2. Install dependencies
npm install

# 3. Create the .env.local file with a strong JWT secret
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" > .env.local

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app starts in guest mode and seeds demo notes automatically on first load — no database setup required.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ Yes | Min 32-character random string for signing JWT tokens. **Never commit this to version control.** |

---

## 📁 Data Storage

Data is stored in flat JSON files in the `/data` directory (auto-created on first run):

| File | Contents |
|------|----------|
| `data/users.json` | Registered user accounts — passwords stored as bcrypt hashes, never plain text |
| `data/notes.json` | All notes for all users and guests |
| `data/tokens.json` | Active (unexpired) password reset PIN tokens |

> ⚠️ The `/data` directory is excluded from version control via `.gitignore`.

---

## 🗺️ Planned Upgrades

| Upgrade | Impact |
|---------|--------|
| Migrate to SQLite + Prisma (one-file swap in `lib/db.ts`) | Eliminates write race conditions, adds ACID transactions, enables complex queries |
| Add Zod validation on all API routes | Type-safe input validation with descriptive per-field error responses |
| Replace in-memory rate limiter with Redis (Upstash) | Persists across restarts, works across multiple server instances |

---

## 📄 License

MIT
