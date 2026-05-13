# russianidioms.com — Overhaul Reference Document

> **For the implementing agent:** This document is the complete reference for a ground-up overhaul of
> russianidioms.com. Work through sections in order. Each section is self-contained with file paths,
> line numbers, and concrete instructions. Do not skip security fixes to start on improvements.

---

## Current State Summary

| Dimension | Status |
|---|---|
| Frontend | React 18 + TypeScript + Vite, hosted on Netlify |
| Backend | Netlify Functions (serverless, `.mjs`) |
| Database | Firestore (Firebase Admin SDK) |
| Auth | Auth0 (`@auth0/auth0-react`) |
| UI libs | Bootstrap 5 + MUI Joy 5 (beta) + Emotion |
| Tests | **None** |
| Security | **31 npm vulnerabilities (3 critical), 6 unprotected API endpoints** |
| TypeScript | Strict mode enabled but bypassed with `@ts-ignore` |

All source is under `idioms/`. The Netlify functions are in `idioms/netlify/functions/`.

---

## Phase 1 — Critical Security Fixes

These must be resolved before any other work. They represent active exploitability.

### 1.1 XSS via `<script>` tag in IdiomFavoriteButton

**File:** `idioms/src/components/buttons/IdiomFavoriteButton.tsx:63`

```tsx
// CURRENT — executes arbitrary JS
{error && <script>{`alert('${error}')`}</script>}
```

**Fix:** Replace the `<script>` tag with a styled error paragraph. No sanitization library needed;
just don't inject into script tags.

```tsx
// REPLACEMENT
{error && <p className="error-message" role="alert">{error}</p>}
```

Add `.error-message { color: #d32f2f; font-size: 0.875rem; margin-top: 0.5rem; }` to
`IdiomFavoriteButton.css`.

---

### 1.2 Unauthenticated Netlify Functions

Every POST function accepts arbitrary `user_id` in the request body with no token verification.
Any caller can read/write any user's data.

**Affected files:**
- `idioms/netlify/functions/firestore-save-idiom-handler.mjs`
- `idioms/netlify/functions/firestore-post-handler.mjs`
- `idioms/netlify/functions/firestore-initialize-user.mjs`
- `idioms/netlify/functions/firestore-get-user-idioms.mjs`

**Fix:** Add a shared Auth0 JWT verifier. Create
`idioms/netlify/functions/_auth.mjs` (underscore prefix prevents Netlify from exposing it as an
endpoint):

```js
// idioms/netlify/functions/_auth.mjs
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`)
);

/**
 * Verifies the Bearer token in the Authorization header.
 * Returns the decoded payload (sub = Auth0 user ID) or throws.
 */
export async function verifyToken(req) {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization header');
  }
  const token = authHeader.slice(7);
  const { payload } = await jwtVerify(token, JWKS, {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  });
  return payload; // payload.sub is the Auth0 user ID
}
```

Add `jose` as a dependency (`npm install jose`).

**In each function**, replace the body `user_id` trust with token verification:

```js
// Pattern for every protected function
import { verifyToken } from './_auth.mjs';

export default async (req) => {
  let payload;
  try {
    payload = await verifyToken(req);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authenticatedUserId = payload.sub; // use this, not body user_id
  // ...rest of function
};
```

**On the frontend**, all `fetch` calls to protected functions must include the token:

```tsx
// Add this hook or utility
import { useAuth0 } from '@auth0/auth0-react';

// Inside component:
const { getAccessTokenSilently } = useAuth0();
const token = await getAccessTokenSilently();

fetch('/.netlify/functions/firestore-save-idiom-handler', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ idiom_id: idiomId }), // remove user_id — derive from token server-side
});
```

Update `auth0Provider.tsx` to configure `authorizationParams.audience` so `getAccessTokenSilently`
returns a JWT verifiable by Auth0:

```tsx
authorizationParams: {
  redirect_uri: window.location.origin,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE,
}
```

Add `VITE_AUTH0_AUDIENCE` to your `.env` file. Set it to the Auth0 API identifier you create in
the Auth0 dashboard (e.g. `https://russianidioms.com/api`).

---

### 1.3 Open Redirect in Auth0 Callback

**File:** `idioms/src/auth0Provider.tsx:16`

```tsx
// CURRENT — any URL in appState.returnTo is trusted
navigate(appState?.returnTo || window.location.pathname);
```

**Fix:** Validate that the redirect is an internal path before using it.

```tsx
const isSafePath = (path: unknown): path is string =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

const onRedirectCallback = (appState: AppState | undefined) => {
  const target = isSafePath(appState?.returnTo) ? appState.returnTo : '/';
  navigate(target);
};
```

---

### 1.4 Security Headers in netlify.toml

**File:** `idioms/netlify.toml`

Add a `[[headers]]` block. These headers defend against clickjacking, MIME sniffing, and
information leakage with zero code changes:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' https://*.auth0.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https://*.auth0.com https://lh3.googleusercontent.com;
      connect-src 'self' https://*.auth0.com https://*.netlify.app
        https://firestore.googleapis.com;
      frame-src https://*.auth0.com;
      font-src 'self';
    """
```

Note: `'unsafe-inline'` for styles is needed to support MUI Joy's CSS-in-JS. If you migrate to
Tailwind (see Phase 3), remove it and tighten the CSP.

---

### 1.5 Remove Console Statements

Console output leaks user data and internal structure in production.

Search and replace across all source files:

```bash
rg "console\.(log|error|warn)" idioms/src idioms/netlify --type ts --type js -l
```

- In Netlify functions: replace `console.error` with structured logging via
  `console.error(JSON.stringify({ error: error.message, context: '...' }))` or remove entirely
  for user-facing errors.
- In React components: remove all `console.log` statements.
- In `MyIdioms.tsx:10`: the `@ts-ignore` + console.log pattern needs to be fixed at the type level
  (see Phase 2).

---

### 1.6 Update react-router-dom

**Current:** `react-router-dom@7.0.2`
**Vulnerability:** XSS via open redirects (GHSA-2w69-qvjg-hvjx), SSR XSS in ScrollRestoration,
CSRF in action requests.
**Fix:** `npm install react-router-dom@latest`

Verify the version is ≥7.5.1 after install. The API is compatible — no code changes needed.

---

### 1.7 Fix Critical npm Vulnerabilities

Run:

```bash
cd idioms && npm audit fix
```

The critical vulnerabilities in `fast-xml-parser`, `protobufjs`, and `form-data` come from
`firebase-admin`'s transitive dependencies. After running `npm audit fix`, re-run `npm audit` to
confirm critical/high counts dropped. If `firebase-admin` still pulls in vulnerable versions, pin
the transitive deps in `package.json`:

```json
"overrides": {
  "fast-xml-parser": ">=5.0.0",
  "protobufjs": ">=7.4.0",
  "form-data": ">=4.0.4"
}
```

---

## Phase 2 — Code Quality and Type Safety

### 2.1 Eliminate @ts-ignore

**File:** `idioms/src/components/pages/MyIdioms.tsx:10,21,24`

The `@ts-ignore` comments mask a real type mismatch — `user.name` and `user.sub` from Auth0 are
`string | null | undefined`, not `string`. Fix by using the correct Auth0 type:

```tsx
import { useAuth0 } from '@auth0/auth0-react';

const { user } = useAuth0();

// user.sub is string | undefined in @auth0/auth0-react types
const submittedIdioms = idioms.filter(
  (idiom) => idiom.submittedBy != null && idiom.submittedBy === user?.sub
);
```

Update the `Idiom` type in `idioms/src/types/types.ts` to include `submittedBy` as `string | undefined`
(it already is optional — just ensure it is used consistently).

---

### 2.2 Fix Duplicate Alert in IdiomForm

**File:** `idioms/src/components/pages/AddIdiom.tsx` (or wherever `IdiomForm` is used) and
`idioms/src/components/IdiomForm.tsx:52-70`

There are two `alert('New idioms submitted for review')` calls in one submit handler. Remove the
duplicate. Replace browser `alert()` with an inline success message in state to avoid blocking the
UI thread.

---

### 2.3 Fix Array-Index Keys in IdiomsTable

**File:** `idioms/src/components/IdiomsTable.tsx:15`

```tsx
// CURRENT — breaks on reorder/filter
.map((idiom, index) => <tr key={index}>

// FIX — use the Firestore document ID
.map((idiom) => <tr key={idiom.id}>
```

`idiom.id` is already present on the `Idiom` type.

---

### 2.4 Migrate Class Components to Functions

The following files use class components with no benefit. Migrate each to a function component with
`useState`/`useCallback`:

- `idioms/src/components/buttons/IdiomFavoriteButton.tsx`
- `idioms/src/components/IdiomForm.tsx`
- `idioms/src/components/IdiomRow.tsx`
- `idioms/src/components/IdiomField.tsx`

**Pattern:**

```tsx
// Before (class)
class IdiomFavoriteButton extends Component<Props, State> { ... }

// After (function)
function IdiomFavoriteButton({ userId, idiomId }: Props) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ...
}
```

---

### 2.5 Consolidate Duplicate Netlify Functions

`firestore-get-idioms.mjs` and `firestore-handler.mjs` both fetch the idioms collection but return
different response shapes. Pick one format and delete the other. The frontend uses
`firestore-get-idioms` — delete `firestore-handler.mjs`.

---

### 2.6 Add Input Validation to Netlify Functions

Install `zod` as a dependency:

```bash
npm install zod
```

Add schema validation before any Firestore write:

```js
// firestore-post-handler.mjs
import { z } from 'zod';

const IdiomRowSchema = z.object({
  idiom: z.string().min(1).max(500),
  translation: z.string().min(1).max(500),
  definition: z.string().min(1).max(1000),
  example: z.string().max(1000).optional(),
});

const SubmitSchema = z.object({
  submittedBy: z.string().min(1).max(200),
  rows: z.array(IdiomRowSchema).min(1).max(20),
});

// In handler:
const parseResult = SubmitSchema.safeParse(data);
if (!parseResult.success) {
  return new Response(JSON.stringify({ error: 'Invalid input', details: parseResult.error.issues }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
const validated = parseResult.data;
```

Apply equivalent schemas to `firestore-save-idiom-handler.mjs` and `firestore-initialize-user.mjs`.

---

### 2.7 Add approvalStatus Filter to Public Idiom Endpoint

**File:** `idioms/netlify/functions/firestore-get-idioms.mjs`

Currently returns ALL idioms including `approvalStatus: "pending"`. Public users should only see
approved idioms:

```js
const snapshot = await idiomsCollection
  .where('approvalStatus', '==', 'approved')
  .get();
```

This requires a Firestore composite index on `approvalStatus`. Add it in the Firebase console or
via `firestore.indexes.json`. Add `firestore.indexes.json` to the repo so the index is reproducible.

---

## Phase 3 — Modern Upgrades

### 3.1 Update All Dependencies

Run a full update:

```bash
cd idioms
npx npm-check-updates -u
npm install
npm audit
```

Key version jumps:
- `react` / `react-dom`: 18.3.1 → 19.x (check for breaking changes in concurrent mode)
- `@auth0/auth0-react`: 2.2.4 → latest (2.16+ fixes several security issues)
- `react-router-dom`: already handled in Phase 1
- `firebase-admin`: 13.0.1 → latest
- `@mui/joy`: 5.0.0-beta.48 → latest stable (check for API changes)
- `react-quizlet-flashcard`: 3.0.0 → 4.x (breaking API changes likely — check changelog)
- `vite`: 6.0.1 → latest
- `typescript`: 5.6.2 → 5.8+

After upgrading, run `tsc -b` and fix any new type errors before proceeding.

---

### 3.2 Replace Bootstrap + MUI Joy with Tailwind CSS

The current setup installs **three** separate style systems (Bootstrap, MUI Joy, Emotion). This
inflates the bundle, creates specificity conflicts, and splits styling conventions.

**Migration path:**

1. Install Tailwind:
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```

2. Add the Vite plugin to `vite.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

3. Replace `index.css` content with:
   ```css
   @import "tailwindcss";
   ```

4. Remove Bootstrap, react-bootstrap, @mui/joy, @emotion/react, @emotion/styled from
   `package.json`.

5. Rewrite component styles class-by-class. The components are small enough that this is a
   mechanical pass.

**Benefit:** ~150KB bundle reduction, single styling system, purged CSS in production, better
accessibility primitives from Tailwind UI patterns.

---

### 3.3 Replace ESLint Config with oxlint + stricter rules

**Current:** ESLint 9 + typescript-eslint

**Replace with:**
```bash
npm remove eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh typescript-eslint globals
npm install -D oxlint
```

Add to `package.json` scripts:
```json
"lint": "oxlint --deny-warnings src/ netlify/functions/"
```

Remove `eslint.config.js`.

Also add `eslint-plugin-security` if staying on ESLint, but oxlint covers the same rules faster.

---

### 3.4 Add Testing Infrastructure

The project has zero tests. Add Vitest for unit/component tests:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event
```

Update `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
});
```

**Priority test targets (write these first):**
1. `src/types/types.ts` — `transformApiIdiom` function
2. `netlify/functions/_auth.mjs` — token verification edge cases
3. `netlify/functions/firestore-post-handler.mjs` — input validation (mock Firestore)
4. `src/components/buttons/IdiomFavoriteButton.tsx` — that the XSS fix holds; error renders as
   `<p>` not `<script>`

Add test script to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

---

### 3.5 Add Pre-commit Hooks

```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:
```sh
#!/bin/sh
npx lint-staged
```

`package.json`:
```json
"lint-staged": {
  "*.{ts,tsx}": ["oxlint --deny-warnings", "tsc --noEmit --skipLibCheck"],
  "*.{mjs,js}": ["oxlint --deny-warnings"]
}
```

---

### 3.6 Vite Build Optimizations

**File:** `idioms/vite.config.ts`

```ts
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'auth': ['@auth0/auth0-react'],
        },
      },
    },
  },
});
```

This splits Auth0 and React into separate cached chunks so returning users don't re-download the
full bundle on app updates.

---

### 3.7 Add Pagination to the Idioms API

**File:** `idioms/netlify/functions/firestore-get-idioms.mjs`

The current implementation fetches the entire collection on every page load. As the database grows
this will become slow and expensive.

```js
// Support cursor-based pagination
const LIMIT = 50;

export default async (req) => {
  const url = new URL(req.url);
  const after = url.searchParams.get('after'); // Firestore document ID cursor

  let query = db.collection('idioms')
    .where('approvalStatus', '==', 'approved')
    .orderBy('idiom')
    .limit(LIMIT);

  if (after) {
    const cursorDoc = await db.collection('idioms').doc(after).get();
    query = query.startAfter(cursorDoc);
  }

  const snapshot = await query.get();
  const idioms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const nextCursor = snapshot.docs.length === LIMIT
    ? snapshot.docs[snapshot.docs.length - 1].id
    : null;

  return new Response(JSON.stringify({ idioms, nextCursor }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
};
```

Update `IdiomStore.tsx` to handle the new response shape and support loading more pages.

---

## Phase 4 — UX and Feature Improvements

### 4.1 Add SEO Meta Tags

**File:** `idioms/index.html`

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Learn Russian idioms with translations, definitions, and flashcards." />
  <meta property="og:title" content="Russian Idioms" />
  <meta property="og:description" content="Learn Russian idioms with translations, definitions, and flashcards." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://russianidioms.com" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://russianidioms.com" />
  <title>Russian Idioms</title>
</head>
```

Also add a `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /profile
Disallow: /my-idioms
Sitemap: https://russianidioms.com/sitemap.xml
```

---

### 4.2 Accessibility Fixes

Across all form inputs:

```tsx
// Before
<input type="text" value={...} onChange={...} />

// After
<label htmlFor="idiom-input">Russian idiom</label>
<input id="idiom-input" type="text" value={...} onChange={...} aria-required="true" />
```

For the favorite button:

```tsx
<button
  onClick={handleFavorite}
  className="favorite-button"
  aria-label={success ? 'Remove from favorites' : 'Add to favorites'}
  aria-pressed={success}
>
  {success ? '★' : '☆'} Favorite
</button>
```

For error/success states, use `role="alert"` so screen readers announce them:

```tsx
{error && <p className="error-message" role="alert">{error}</p>}
{success && <p className="success-message" role="status">Idiom favorited!</p>}
```

---

### 4.3 Loading States

`IdiomsDatabase.tsx` and `MyIdioms.tsx` have no loading skeletons — users see a blank page while
fetching. Add a simple skeleton:

```tsx
if (loading) {
  return (
    <div aria-busy="true" aria-label="Loading idioms">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  );
}
```

Add CSS:
```css
.skeleton-row {
  height: 2rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 4.4 Fix N+1 Query in MyIdioms

**File:** `idioms/src/components/pages/MyIdioms.tsx:13-47`

Current flow:
1. Fetch user document → get array of idiom IDs
2. Fetch all idioms globally (already in context)
3. Filter in JavaScript

The global idioms context already contains all idioms (until pagination is added). After adding
pagination, the approach needs a dedicated endpoint. Create
`idioms/netlify/functions/firestore-get-user-idiom-details.mjs` that accepts the user token,
resolves the user's idiom IDs from Firestore, and returns the full idiom objects in a single
batched read using `db.getAll(...docRefs)`.

---

### 4.5 Admin Approval Workflow

Pending idiom submissions (`approvalStatus: "pending"`) are never displayed or manageable through
the UI. Add a simple admin page:

- Add an `admin` field to the Firestore user document
- Add `/admin` route, guarded by `isAdmin` check
- Admin page lists pending idioms with Approve/Reject buttons
- Netlify function `firestore-approve-idiom.mjs` accepts idiom ID, verifies token is admin,
  updates `approvalStatus: "approved"`

This makes the submission feature actually functional end-to-end.

---

## Phase 5 — Environment and CI/CD

### 5.1 Environment Variable Validation

**File:** `idioms/src/vite-env.d.ts`

Add strict typing for all env vars so missing ones fail at build time:

```ts
interface ImportMetaEnv {
  readonly VITE_REACT_APP_AUTH0_DOMAIN: string;
  readonly VITE_REACT_APP_AUTH0_CLIENT_ID: string;
  readonly VITE_AUTH0_AUDIENCE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

For server-side (Netlify functions), add a startup guard in `firestore.js`:

```js
const required = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'AUTH0_DOMAIN', 'AUTH0_AUDIENCE'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

---

### 5.2 Add GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: idioms

    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: idioms/package-lock.json

      - run: npm ci

      - name: Type check
        run: tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build

      - name: Audit
        run: npm audit --audit-level=high
```

---

### 5.3 Add Firestore Security Rules

Create `firestore.rules` in the repo root and deploy it with the Firebase CLI:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Public read of approved idioms only
    match /idioms/{idiomId} {
      allow read: if resource.data.approvalStatus == 'approved';
      allow write: if false; // All writes go through server-side functions
    }

    // Users can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Add deployment to CI or document the `firebase deploy --only firestore:rules` command.

---

## Implementation Order

| Priority | Phase | Effort |
|---|---|---|
| 1 | 1.1 XSS fix | 15 min |
| 2 | 1.3 Open redirect fix | 15 min |
| 3 | 1.4 Security headers | 15 min |
| 4 | 1.5 Remove console logs | 30 min |
| 5 | 1.6 Update react-router-dom | 15 min |
| 6 | 1.7 npm audit fix | 30 min |
| 7 | 1.2 Auth on all endpoints | 3 hrs |
| 8 | 2.1–2.3 Type safety + key fixes | 1 hr |
| 9 | 2.4 Migrate class → function components | 2 hrs |
| 10 | 2.5–2.6 Consolidate functions + validation | 2 hrs |
| 11 | 2.7 Filter pending idioms from public API | 30 min |
| 12 | 3.1 Update all dependencies | 1 hr |
| 13 | 3.4 Add Vitest + write priority tests | 3 hrs |
| 14 | 3.5 Pre-commit hooks | 30 min |
| 15 | 3.6 Vite build optimizations | 1 hr |
| 16 | 3.2 Replace Bootstrap + MUI with Tailwind | 4 hrs |
| 17 | 3.7 Pagination | 2 hrs |
| 18 | 4.1 SEO meta tags | 30 min |
| 19 | 4.2 Accessibility fixes | 2 hrs |
| 20 | 4.3–4.4 Loading states + N+1 fix | 2 hrs |
| 21 | 4.5 Admin approval workflow | 4 hrs |
| 22 | 5.1–5.3 CI/CD + env validation + Firestore rules | 2 hrs |

Items 1–6 have no dependencies and can be done in parallel. Item 7 (auth) unlocks items 8–11
safely. Items 12+ are improvements, not fixes.

---

## Files to Delete

| File | Reason |
|---|---|
| `idioms/netlify/functions/firestore-handler.mjs` | Duplicate of `firestore-get-idioms.mjs` |
| `idioms/eslint.config.js` | Replace with oxlint |
| All `*.css` files under `idioms/src/components/style/` | Replace with Tailwind (Phase 3.2) |

---

## Environment Variables Reference

| Variable | Location | Purpose |
|---|---|---|
| `VITE_REACT_APP_AUTH0_DOMAIN` | `.env` | Auth0 tenant domain |
| `VITE_REACT_APP_AUTH0_CLIENT_ID` | `.env` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | `.env` | Auth0 API audience for JWT |
| `AUTH0_DOMAIN` | Netlify env | Token verification in functions |
| `AUTH0_AUDIENCE` | Netlify env | Token verification in functions |
| `FIREBASE_PROJECT_ID` | Netlify env | Firestore project |
| `FIREBASE_CLIENT_EMAIL` | Netlify env | Service account email |
| `FIREBASE_PRIVATE_KEY` | Netlify env | Service account private key (with `\n`) |

The `VITE_*` vars are baked into the frontend bundle at build time. The non-prefixed vars are only
available server-side in Netlify functions.
