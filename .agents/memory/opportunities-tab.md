---
name: Opportunities tab
description: The Opportunities tab (formerly Polls) — data model, routes, frontend
---

Opportunities replace the Polls tab in Space.tsx. Categories: seminar, scholarship, internship, job, competition, event, other.

Backend: `opportunities` table (CREATE TABLE IF NOT EXISTS in schema.ts). Routes in `server/src/routes/opportunities.ts`, registered in `server/src/index.ts`.

Frontend: `client/src/api/opportunities.ts`, `client/src/store/contentStore.ts` (fetchOpportunities/createOpportunity/deleteOpportunity), types in `client/src/types/index.ts` (Opportunity interface + OPPORTUNITY_CATEGORIES const).

Polls backend removed entirely (routes, client api, store, types) — the author confirmed the feature won't return. `poll_*` DB tables still exist in the schema but are unused; don't restore code without asking.

**Why:** User wanted a place for class reps to post scholarships, seminars, internships rather than polls.
