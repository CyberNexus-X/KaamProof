# KaamProof — Evidence-first work verification (MVP)

> **Know what was agreed. See the evidence. Track what is done.**

KaamProof is an AI-powered work verification platform (PRD v1.0, MVP planning)
for customers, contractors, technicians, freelancers and small service
businesses in India — starting with home repair and renovation. It creates a
shared project workspace where tasks have explicit completion criteria, photos
are submitted against specific tasks, an AI assistant compares the evidence
with those criteria, and a **human** records the final decision.

**Core principle:** KaamProof helps verify evidence of work. It does **not**
guarantee workmanship, certify legal compliance, or prove a photograph is
authentic.

## Tech stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS · Supabase (Auth,
PostgreSQL, private Storage) · Zod validation · Vitest tests · server-side AI
adapter (mock by default, OpenAI-compatible multimodal model optional).

```
Browser ──► Next.js App Router (pages + API routes)
                │  auth (Supabase Bearer token, or demo user in DEMO_MODE)
                ├─► Supabase PostgreSQL (RLS + server-side role checks)
                ├─► Supabase Storage — PRIVATE `evidence` bucket (signed URLs only)
                └─► AI adapter (server only, key never reaches the client)
                     MockAdapter (deterministic) / OpenAIAdapter (optional)
```

## Quick start — demo mode (no keys needed)

```bash
npm install
cp .env.example .env.local   # DEMO_MODE=true is the default there
npm run dev                  # http://localhost:3000
```

Demo mode uses a seeded in-memory store with the PRD §22 project (see below).
No Supabase project and no AI key are required.

## Setup — real Supabase + AI

```bash
npm install
cp .env.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#   SUPABASE_SERVICE_ROLE_KEY   (server only — never commit it)
#   AI_PROVIDER=openai, OPENAI_API_KEY, AI_MODEL=gpt-4o-mini   (optional)
#   DEMO_MODE=false
# Apply the migration to your Supabase project:
#   supabase db push   (or run supabase/migrations/001_init.sql in the SQL editor)
# Create the private storage bucket: insert into storage.buckets (id, name, public)
#   values ('evidence', 'evidence', false);  then add member-checked storage policies.
npm run dev
npm test
npm run build
```

## Demo scenario — Bedroom Painting (PRD §22)

1. Open the app → **View demo project** → *Bedroom Painting — Home Renovation*.
2. Open the task **Paint the bedroom walls** (4 criteria, 2 photos already uploaded).
3. Click **Run AI assessment**. The mock (and a real model, given the same
   evidence) finds **Insufficient evidence**: the photos show two walls, but
   the remaining walls and corners are not visible.
4. Upload two more photos (JPEG/PNG, ≤ 10 MB) via **Upload evidence**.
5. Run the assessment again — with ≥ 4 photos the mock returns
   **Supported by evidence** for the criteria.
6. In **Human review**, record **Accept the submitted evidence** (or
   *Request more evidence* / *Dispute*). Only this human decision changes the
   task to *Accepted by customer*.
7. Back in the project, open the **Report** tab: project details, tasks,
   evidence, AI summaries, human decisions, outstanding items, and the
   limitations disclaimer — the P1 web report (PDF export is a later P1 step).

## What is implemented (P0 + P1 web report)

- Auth pages (login/register, demo sign-in; Supabase Auth in real mode),
  dashboard with project cards and the PRD empty state, project creation.
- Project workspace tabs: Overview / Tasks / Evidence / Activity /
  Participants / Report; task detail with criteria, before/after slider,
  evidence upload, AI assessment, comments, and review actions.
- API routes for projects, tasks, evidence, assessments, invitations,
  review-decisions and comments — each authenticating, validating with Zod,
  checking membership/role, and returning PRD §11.6 error codes
  (400/401/403/404/409/413/415/422/429/500/503) without leaking other users' data.
- Invitations: expiring (7 days), single-use tokens — only a SHA-256 hash is
  stored; the raw token is shown once to the inviter.
- Task versioning in the schema, activity timeline, progress =
  accepted ÷ applicable × 100 (blocked tasks excluded), criterion-level AI
  output with missing-evidence and limitations, and a failed assessment that
  never counts as approval.

## Definition of Done — mapped to PRD §23

- [x] Users can register and authenticate in demo mode; server-side Supabase Bearer-token verification exists for API routes, but the login/register forms are not yet wired to Supabase Auth (see Known limitations).
- [x] Customers can create projects.
- [x] Customers can define tasks and completion criteria.
- [x] Providers can join through an invitation (token flow + accept/decline APIs).
- [x] Providers can submit task-linked evidence (JPEG/PNG, stage, caption).
- [x] Images are stored privately (private bucket in the migration; demo
      previews are in-memory only, never a public URL contract).
- [x] AI can produce a validated assessment using a supported model
      (MockAdapter by default; OpenAIAdapter when `OPENAI_API_KEY` is set).
- [x] The system can request more evidence (assessment + review decision).
- [x] Customers can record human review decisions.
- [x] AI findings and human decisions are clearly distinguished in UI and data.
- [x] Task and scope changes appear in the history (activity timeline).
- [x] Unauthorized users cannot access project files (RLS + API role checks;
      verified by permission tests and by the API returning 403, not data).
- [x] Model failures do not destroy existing evidence (failed assessment,
      503, retry path).
- [x] The core workflow works on mobile devices (mobile-first Tailwind,
      touch controls, camera capture attribute on the upload input).
- [x] A complete demo project can be completed from start to finish (§22 above).
- [x] This README documents setup, env vars, architecture and limitations.

## Explicitly excluded (PRD §4.3)

Payments, escrow, blockchain verification, advanced fraud scoring, native
mobile apps, and automated legal dispute resolution are **not** implemented.

## Known limitations

- **AI is advisory, not certification.** It cannot certify structural,
  electrical or plumbing safety, legal compliance, or workmanship quality.
  Safety-critical work needs a qualified inspection.
- **Upload timestamp ≠ capture time.** The timestamp proves when the app
  received a file, not when the photo was taken. EXIF / user-supplied times
  may be missing or inaccurate.
- **No authenticity guarantee.** KaamProof does not prove a photo is
  unedited, AI-generated or not, or taken at the stated location.
- **No invented confidence.** The app never shows a numerical confidence
  score for an assessment, and never claims fraud, intent, authenticity,
  safety, certification, or that payment is owed from image analysis alone.
- **Mock AI in demo mode** is deterministic (see `lib/ai/adapter.ts`) so the
  demo is reproducible; it is not a real vision model.
- **PDF report export** (P1) is provided as a web report in this MVP; a
  printable/PDF export is the next P1 step.
- **Email notifications** are schema-ready (`notifications` table) but the
  MVP surfaces notifications in-app only; invitation delivery by email is
  not wired up (the token is returned once to the inviter in demo mode).
- **Real-mode wiring still needed:** (1) login/register forms to Supabase
  Auth, (2) evidence file bytes to Supabase Storage (demo mode uses
  in-memory previews; real mode stores metadata against the private bucket).
  Do not use this MVP with real users until those two steps are done and
  RLS is re-verified against your Supabase project.
- **Supabase store** implements the core entities against the migration
  tables; demo mode is the fully exercised path in this build (see tests).
  Verify RLS policies against your own Supabase project before production use.

## What still needs real keys to go beyond demo mode

1. A Supabase project (URL + anon key + service-role key) with migration
   `001_init.sql` applied and a private `evidence` bucket created.
2. An AI provider key if you want real vision assessments
   (`AI_PROVIDER=openai`, `OPENAI_API_KEY`, `AI_MODEL`); otherwise the
   deterministic mock is used and assessments are clearly labelled as such.
3. An email provider if you want invitations delivered by email instead of
   the one-time token shown to the inviter.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests (progress, transitions, permissions, invitations, assessment schema, validation, demo seed) |
