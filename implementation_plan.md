# Simi Treinadora Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build "Simi Treinadora", an AI-powered system that analyzes mentoring sessions to provide actionable feedback and calculate a Mentoring Effectiveness Score (MES).

**Architecture:** A Next.js application with Supabase for data storage and auth. The AI pipeline uses Gemini 3 Flash for fast, multi-modal (audio/text) analysis and structured output generation. The system follows a 5-dimension framework (Clarity, Depth, Connection, Efficiency, Consistency).

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Supabase (Auth/Postgres/Storage), Gemini 3 Flash API (@google/genai), Zod for validation.

---

## Phase 1: Foundation & Infrastructure

### Task 1: Project Initialization
**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/styles/globals.css`

**Step 1: Initialize Next.js app**
Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`

**Step 2: Install core dependencies**
Run: `npm install @google/genai zod lucide-react clsx tailwind-merge`
Run: `npm install -D prettier prettier-plugin-tailwindcss`

**Step 3: Setup basic layout and theme**
Implement a sleek, dark-themed layout with Inter font.

**Step 4: Commit**
```bash
git add .
git commit -m "chore: initial project setup with next.js and tailwind"
```

### Task 2: Supabase Integration
**Files:**
- Create: `src/lib/supabase.ts`
- Create: `supabase/migrations/20260422170000_initial_schema.sql`

**Step 1: Configure Supabase client**
Setup environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Step 2: Define Schema**
Create tables for:
- `mentors`: profile and aggregate scores.
- `sessions`: recording link, transcript, and metadata.
- `analyses`: structured feedback, scores per dimension, and MES.

**Step 3: Commit**
```bash
git add .
git commit -m "feat: setup supabase client and initial schema"
```

---

## Phase 2: AI Pipeline (The "Simi" Brain)

### Task 3: Transcription & Block Structuring
**Files:**
- Create: `src/app/api/analyze/route.ts`
- Create: `src/lib/ai/pipeline.ts`

**Step 1: Implement audio/text ingestion**
Accept audio file or raw transcript. If audio, use Gemini's multi-modal capabilities or a dedicated STT service.

**Step 2: Block Structuring**
Segment the conversation into: Abertura, Exploração, Síntese, Ação.

**Step 3: Commit**
```bash
git add .
git commit -m "feat: implement session processing and block structuring"
```

### Task 4: Framework-based Analysis
**Files:**
- Create: `src/lib/ai/prompts.ts`
- Create: `src/lib/ai/schemas.ts`

**Step 1: Define Zod schemas for analysis**
Strict validation for the 5 dimensions and the MES score.

**Step 2: Implementation of the Analysis Prompt**
Inject the proprietary framework (Clarity, Depth, Connection, Efficiency, Consistency) and supplementary frameworks (Charles Duhigg, High-quality questions).

**Step 3: Run regression tests on prompts**
Verify structured output with sample session data.

**Step 4: Commit**
```bash
git add .
git commit -m "feat: add framework-based analysis with gemini"
```

---

## Phase 3: Dashboard & Visualization

### Task 5: Mentor Dashboard (Individual)
**Files:**
- Create: `src/app/dashboard/mentor/page.tsx`
- Create: `src/components/AnalysisReport.tsx`
- Create: `src/components/ScoreChart.tsx`

**Step 1: Build the Session Report View**
Show the MES score, breakdown by dimension, and "Micro-ajustes" (actionable recommendations).

**Step 2: Build the Evolution Chart**
Visualize performance over time.

**Step 3: Commit**
```bash
git add .
git commit -m "feat: build mentor dashboard and session report"
```

### Task 6: Organizational Dashboard
**Files:**
- Create: `src/app/dashboard/admin/page.tsx`
- Create: `src/components/ProgramOverview.tsx`

**Step 1: Aggregate data across all sessions**
Show patterns, gaps, and program health (MES average).

**Step 2: Commit**
```bash
git add .
git commit -m "feat: build organizational dashboard"
```

---

## Phase 4: Polish & Premium UI

### Task 7: Premium UI Refinement
**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`

**Step 1: Add Glassmorphism and Micro-animations**
Use subtle gradients and hover effects.

**Step 2: Final Verification**
Test the end-to-end flow: Session Upload -> AI Processing -> Feedback Generation -> Dashboard Visualization.

**Step 3: Commit**
```bash
git add .
git commit -m "style: final UI polish and animation refinement"
```

---

## Verification Plan

### Automated Tests
- `npm test`: Verify Zod schemas and prompt logic (to be added in Task 4).
- Linting: `npm run lint`.

### Manual Verification
1. Upload a dummy session transcript.
2. Verify if the generated MES reflects the "behaviors" in the transcript.
3. Check if "Micro-ajustes" are practical and specific.
4. Verify responsiveness on mobile.
