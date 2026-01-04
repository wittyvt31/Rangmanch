# Project: RangManch (The Republic of Cinema)
# Role: Senior Systems Architect & Lead Engineer

> **CRITICAL INSTRUCTION FOR AI:** > You are NOT a generic coding assistant. You are building a high-value, production-grade streaming platform. 
> Do not hallucinate. Do not guess. If you are unsure of a library or pattern, ASK me.
> **STRICT MODE: ON.**

---

## 1. The Core Stack (NON-NEGOTIABLE)
We use this exact stack to ensure stability and scalability. Do not suggest alternatives.

* **Framework:** Next.js 14+ (App Router). *Use Server Components by default.*
* **Language:** TypeScript (Strict Mode). *No `any` types allowed.*
* **Styling:** Tailwind CSS + `shadcn/ui` (Radix Primitives) + `lucide-react` (Icons).
* **Animations:** `framer-motion` (Use sparingly for "Cinema" feel).
* **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime).
* **Video Engine:** Mux (via `@mux/mux-uploader-react` & `@mux/mux-player-react`).
* **Payments:** Razorpay (Official SDK).
* **Validation:** `zod` (Schema validation) + `react-hook-form`.

---

## 2. Visual Design System ("The Silver Screen")
We do not hardcode hex values. We use semantic CSS variables in `globals.css` to allow for "Theming" later.

**Tailwind Config Rules:**
* **Background:** `var(--background)` -> `#0a0a0a` (Deep Charcoal)
* **Surface:** `var(--surface)` -> `#171717` (Cards/Modals)
* **Primary Text:** `var(--primary)` -> `#e5e5e5` (Cinema Silver)
* **Accent:** `var(--accent)` -> `#C5A059` (Muted Gold - Use ONLY for high-value actions like "Winner" or "Verified")
* **Border:** `var(--border)` -> `#333333` (Subtle separation)
* **Destructive:** `var(--destructive)` -> `#ef4444` (Red-500)

**UI Component Rules:**
* Use `shadcn/ui` components for EVERYTHING (Buttons, Dialogs, Inputs).
* **Border Radius:** `rounded-none` or `rounded-sm`. (Sharp, professional edges. No bubbly rounded corners).
* **Typography:** Headings = `Playfair Display` (Serif). Body = `Inter` (Sans).

---

## 3. Database Schema & Security (PostgreSQL)
*Refer to this schema for all backend logic. Do not invent tables.*

* **`profiles`**: `id` (uuid), `email`, `phone` (text), `reputation_score` (int), `role` (text).
* **`films`**: `id` (uuid), `uploader_id` (fk), `mux_playback_id`, `status` ('processing', 'live'), `submission_fee_paid` (bool).
* **`credits`**: `film_id`, `profile_id` (nullable), `invited_email` (text), `role` (text), `is_confirmed` (bool).
* **`transactions`**: `id`, `user_id`, `amount`, `razorpay_id`, `type`.

**Security Rules (RLS):**
1.  **Server Actions:** All data mutations (Upload, Edit, Pay) must happen in Server Actions (`use server`).
2.  **Row Level Security:** Never rely on frontend logic for security. 
    * *Rule:* Users can only edit `films` where `uploader_id == auth.uid()`.
    * *Rule:* `credits` can only be added by the Film Owner.

---

## 4. Critical Logic Flows (Do Not Break These)

### A. The "Idempotent" Payment Flow
* **Problem:** User pays, network dies, user loses money.
* **Solution:** 1.  User pays ₹199.
    2.  Webhook adds +1 to `profiles.submission_credits`.
    3.  User clicks "Upload" -> System checks credits -> Deducts 1.
    * *Constraint:* Never tie the "Upload" action directly to the "Razorpay Success" callback. Decouple them via the Database.

### B. Resumable Uploads
* **Library:** Use `@mux/mux-uploader-react`.
* **Constraint:** The upload endpoint must use the `tus` protocol. 
* *Why:* Indian internet is unstable. If upload fails at 90%, it MUST resume, not restart.

### C. The Viral Invite System
* **Constraint:** When adding a credit (e.g., "DOP: Ravi"), ALWAYS check if `Ravi` exists in `profiles`.
    * *If Yes:* Link `profile_id`.
    * *If No:* Store `invited_email`. Send Invite Email via Resend.
    * *Auto-Link:* When a new user signs up, check `credits` table for their email and auto-update `profile_id`.

---

## 5. Coding Standards (Strict Mode)
1.  **No `any` Types:** Define interfaces for everything (e.g., `interface Film { ... }`).
2.  **Server vs Client:** * Pages (`page.tsx`) = Server Components (Fetch data here).
    * Interactivity (`Button.tsx`, `Player.tsx`) = Client Components (`use client`).
3.  **Modular Code:** Do not write 500 lines in one file. 
    * *Bad:* `Dashboard.tsx` (500 lines).
    * *Good:* `Dashboard.tsx` -> `StatsCard.tsx`, `FilmList.tsx`, `UploadWidget.tsx`.
4.  **Error Handling:** All Server Actions must return a discriminated union:
    * `{ success: true, data: ... }` OR `{ success: false, error: "Message" }`.
    * Never throw raw errors to the client.

---

## 6. Implementation Phases
*Do not try to build everything at once. We build in this order:*

* **Phase 1:** Scaffolding (Next.js, Tailwind, Supabase Setup, Shadcn Setup).
* **Phase 2:** Authentication & Profile Management.
* **Phase 3:** The "Studio" (Upload Flow + Mux Integration).
* **Phase 4:** The "Cinema" (Watch Page + Public Directory).
* **Phase 5:** Payments & Credits.

*Acknowledge these rules before writing code.*