# ClassSpace

**A mobile-first academic organiser built for Nigerian university students.**

ClassSpace replaces the chaos of WhatsApp academic groups with one clean, structured space per department and level. Course reps post announcements, upload materials, and students can actually find what they need — without scrolling through 500 messages.

It is not a chat app. It does not replace WhatsApp. It sits alongside it as the single source of truth for everything academic.


## Why it exists

Every Nigerian university student knows the problem. The class WhatsApp group has 300 people. Important announcements get buried under memes, arguments, and off-topic threads within hours. Someone always misses a deadline because the message got lost. Study materials get shared once and vanish.

ClassSpace fixes this with a focused feed of structured announcements and a materials library organised by course — nothing else.


## What it does

**One Space per department and level** — e.g. "300L Production Engineering, UNILAG". Everyone in the class joins the same space.

**Announcements** are structured, not freeform. Every post has:
- A type tag (Assignment, Test, Update, Meeting, Announcement)
- A bold title
- A key details card showing deadline, submission method, format, and venue at a glance
- Full instructions below
- A status badge (Active, Due Soon, Expired)

**Materials** are organised into course folders. Tap a course to see all its files, grouped by category (Notes, Slides, Assignments, Past Questions, Lab Resources, Templates).

**Sharing** — every announcement, material, and course folder has its own shareable link. Anyone who opens the link sees a structured preview and can join the space directly from it.

---

## Current version

This is a **single-file frontend prototype** — one HTML file with no build step, no framework, no dependencies except a Google Fonts import. Everything runs in the browser. Data lives in memory for the session.

It ships with demo data for a 300L Production Engineering class at UNILAG so it looks and feels real from the moment you open it.


## Features

- Mobile-first design (430px max-width, dark theme, AMOLED-friendly)
- Landing page with Create a Space onboarding flow and Join with a Link flow
- Four distinct link-type landing pages (Space, Announcement, Material, Course Folder)
- Announcement feed with filter chips by course code, Urgent, and Pinned
- Announcement detail screen with structured Key Details card
- Course folder materials browser with category grouping
- Post announcement sheet with type selector, key details fields, and Urgent/Pin flags
- Upload material sheet with file picker and category tagging
- Share sheet with WhatsApp integration and copy link fallback
- Profile screen with notification toggles


## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Structure | Vanilla HTML | No build step, single file, works anywhere |
| Styling | CSS custom properties | Theming without a preprocessor |
| Logic | Vanilla JavaScript | No framework overhead for a prototype |
| Fonts | Google Fonts (Syne + DM Sans) | Clean, modern, Nigerian tech aesthetic |
| Backend | None (yet) | See roadmap |



## Getting started

No install. No `npm install`. No build.

```bash
git clone https://github.com/your-username/classspace.git
cd classspace
open classspace.html   # or just double-click the file
```

Open `classspace.html` in any modern browser. The demo data loads automatically.

To test on mobile, either:
- Connect your phone to the same WiFi and serve with `python3 -m http.server 8080`, then open your machine's local IP on your phone
- Or drag the file to [netlify.com/drop](https://netlify.com/drop) for an instant shareable link


## Project structure

```
classspace/
├── classspace.html     # The entire app — HTML, CSS, and JS in one file
└── README.md
```

Everything is intentionally in one file to make sharing and collaboration simple during the prototype phase. When the project moves to production, it will be split into a proper folder structure.



## Demo data

The app ships with a pre-loaded demo space: **300 Level Production Engineering, University of Lagos**.

It includes six announcements across five courses (PEG 301, PEG 303, PEG 305, MTH 301, GNS 301), a full materials library with 14 demo files, and the full link-preview join flow. Everything is visible without signing in.



## Roadmap

The current version is a frontend prototype. Here is what comes next, roughly in order:

**Phase 1 — Backend**
- Supabase integration (auth, database, file storage)
- Real user accounts with email/password
- Announcements and materials persisted and shared in real time
- File uploads stored in cloud storage with real download links

**Phase 2 — Access control**
- Rep verification system — only verified reps can post announcements
- Member roles (Rep, Member, Guest)
- Space invite codes

**Phase 3 — Notifications**
- Push notifications for new announcements and uploaded materials
- Notification preferences per space

**Phase 4 — Polish**
- PWA support (installable on Android home screen, offline access)
- Announcement reactions (quick acknowledgements — "Seen", "Got it")
- Rep analytics (how many people have seen each post)

**Phase 5 — Scale**
- Multi-university support
- University admin dashboard
- Institution licensing tier



## Contributing

Contributions are welcome. The project is in early prototype stage so the best contributions right now are:

- **Bug reports** — if something breaks or looks wrong on your device, open an issue with your device, browser, and a description of what happened
- **UI feedback** — screenshots of anything that feels off or confusing
- **Feature ideas** — open a discussion, especially if you're a Nigerian student with a specific pain point this doesn't solve yet
- **Code contributions** — see the guide below

### How to contribute code

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes in `classspace.html`
4. Test on mobile (use browser DevTools mobile view at 430px width minimum)
5. Open a pull request with a clear description of what changed and why

### Code style

- All HTML, CSS, and JS stays in `classspace.html` for now
- CSS uses the existing custom property system — add new variables to `:root` if needed, don't hardcode colour values
- JS follows the existing pattern: short variable names for DOM state, descriptive names for data
- No external libraries or frameworks — keep it dependency-free
- Test in Chrome mobile view and on a real Android device if possible



## Design principles

These are the rules the UI is built around. New contributions should respect them.

**Calm over busy.** Every screen should feel like a relief compared to a WhatsApp group. No badges everywhere, no red dots for everything, no unnecessary motion.

**Scannable in under 3 seconds.** A student opening an announcement should know the deadline, venue, and what they need to do before they finish reading the first card.

**Mobile-first, always.** Design for a 6-inch Android screen with one thumb. Desktop is a secondary concern.

**No chat.** ClassSpace is not a messaging platform. Do not add comments, replies, reactions, or anything that makes it feel like a social feed. The moment it becomes noisy, it loses its purpose.

**Nigerian context.** This is built for ASUU strikes, portal issues, WhatsApp-first classmates, and mid-range Android phones. Design and copy should reflect that reality.



## Colour palette

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0f0f11` | App background |
| `--s` | `#18181c` | Card backgrounds |
| `--s2` | `#1f1f25` | Nested surfaces |
| `--b` | `#2a2a32` | Borders |
| `--a` | `#e8ff47` | Primary accent (electric yellow-green) |
| `--a2` | `#5b6af0` | Secondary accent (indigo) |
| `--t` | `#f0f0f2` | Primary text |
| `--td` | `#7a7a88` | Dimmed text |
| `--tf` | `#3a3a45` | Faint text / disabled |
| `--r` | `#ff5252` | Urgent / error |
| `--g` | `#52ffa0` | Active / success |
| `--o` | `#ffb347` | Due soon / warning |

Typography: **Syne** (headings, labels, tags) and **DM Sans** (body text, inputs).



## Licence

MIT. Use it, fork it, build on it.



## Made by

Christian Smart — founder of ClassSpace, studying at UNIBEN, building for Nigerian students.

If you're a Nigerian university student and this resonates, reach out. The best product decisions come from people who live the problem every day.

