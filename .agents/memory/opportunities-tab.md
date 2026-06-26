---
name: Opportunities tab
description: The Opportunities tab (formerly Polls) — data model, routes, frontend
---

Opportunities replace the Polls tab in Space.tsx. Categories: seminar, scholarship, internship, job, competition, event, other.

Backend: `opportunities` table (CREATE TABLE IF NOT EXISTS in schema.ts). Routes in `server/src/routes/opportunities.ts`, registered in `server/src/index.ts`.

Frontend: `client/src/api/opportunities.ts`, `client/src/store/contentStore.ts` (fetchOpportunities/createOpportunity/deleteOpportunity), types in `client/src/types/index.ts` (Opportunity interface + OPPORTUNITY_CATEGORIES const).

Polls backend still exists (unused in UI) — do not remove without confirming.

**Why:** User wanted a place for class reps to post scholarships, seminars, internships rather than polls.
