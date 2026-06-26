---
name: Reactions model
description: How announcement reactions work — upvote/downvote model, server-side hydration
---

Reactions use string keys 'upvote' and 'downvote' (not emojis).

Server validates only these two in `ALLOWED_REACTIONS`. Switching from one to the other removes the opposite vote first (atomic toggle).

The GET /api/spaces/:id/announcements endpoint optionally reads the user's token (no auth required) and returns:
- `reactions: { upvote: N, downvote: N }` — counts
- `my_reaction: string | null` — the logged-in user's current vote

Space.tsx hydrates `userReacted` from `ann.my_reaction` in a useEffect when announcements load, but only for IDs not already tracked (preserves optimistic updates).

**Why:** Old emoji system (👍❤️👀🔥) was incompatible with new UI. Counts must match keys exactly or UI shows zeros.
