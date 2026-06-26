---
name: Auth/invite flow
description: How pending invite codes are preserved through auth redirects
---

When an unauthenticated user lands on JoinPreview for a space, they are redirected to /register (not /join) with the invite code saved to localStorage as `pendingInviteCode`.

Both Login.tsx and Register.tsx check for `pendingInviteCode` after successful auth. If present, they call `joinSpace(code)` and navigate to the space directly instead of /home.

localStorage cleanup: both keys (`pendingInviteCode`, `pendingSpaceId`) are removed after consumption.

**Why:** The old flow tried to call joinSpace() without auth (no token), which silently failed to add the user as a member. The fix ensures join always happens with a valid token.
