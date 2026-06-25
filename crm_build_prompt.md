# Claude Code Build Prompt: Stevie De Gala Mortgage CRM

You are building a clean, professional, single-user CRM for a mortgage broker. Build it incrementally, milestone by milestone, and confirm the dev server runs locally before we deploy. Ask me before installing anything unusual or making structural decisions not covered here.

---

## 1. Project Overview

A personal CRM with two jobs:

1. **A home dashboard** that tracks a daily goal of **10 meaningful conversations**, Monday through Saturday (Sunday is off and is excluded from all stats). I check off conversations as I have them and the dashboard shows my progress and my historical averages.
2. **A contact manager** with two separate record types: **Referral Partners** (real estate agents and other referral sources) and a **Pipeline** of clients I am actively working with. Records open into an Attio-style profile view where I edit fields inline and add timestamped notes.

It will be hosted on Vercel, with the repo on GitHub, and accessed from multiple devices (desktop and phone), so the UI must be fully responsive.

---

## 2. Tech Stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Prisma** ORM
- **PostgreSQL** — use Vercel Postgres (Neon). Local dev can use the same hosted database or a local Postgres; keep the connection string in `DATABASE_URL`.
- **Recharts** for the dashboard charts
- **Auth:** a single shared password (no user accounts). Store the password in an env var `APP_PASSWORD`. On the login page, if the password matches, set a signed, httpOnly session cookie. Use Next.js middleware to protect every route except `/login`. Use `iron-session` or an equivalent lightweight signed-cookie approach. Keep this simple and secure, no user table.

Repo should deploy cleanly to Vercel with environment variables: `DATABASE_URL`, `APP_PASSWORD`, and a `SESSION_SECRET`.

---

## 3. Design System

The look is monochrome and minimal, in the spirit of Attio: lots of whitespace, thin light-gray borders, subtle hover states, no color.

- **Palette:** black, white, and a gray scale only. No accent colors. Use grays for borders, secondary text, and fills.
- **Font:** Inter for everything. Load it via `next/font`.
- **Branding:** the text "Stevie De Gala" in the top corner of the app shell (top left), set in Inter, clean and understated.
- **Components:** cards and panels with `1px` light-gray borders and generous padding. Tags render as small monochrome pills (light gray fill, dark text). Buttons are simple, mostly black-on-white or white-on-black for the single primary action per screen.
- **Microcopy:** clean and plain. Do not use em dashes or en dashes anywhere in the copy. No emojis.
- **Responsive:** works well on desktop and on a phone. The contact lists collapse gracefully on small screens.

---

## 4. Data Model (Prisma schema starting point)

```prisma
model DailyLog {
  id        String   @id @default(cuid())
  date      DateTime @unique @db.Date  // one row per calendar day
  count     Int      @default(0)        // 0 to 10 meaningful conversations
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ReferralPartner {
  id              String   @id @default(cuid())
  name            String
  email           String?
  phone           String?
  birthday        DateTime? @db.Date
  role            String?              // free text, e.g. "Buyer's agent"
  markets         String[]             // tags, e.g. "Northern Colorado"
  specializations String[]             // tags, e.g. "DSCR", "Multifamily"
  notes           Note[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PipelineContact {
  id             String   @id @default(cuid())
  name           String
  email          String?
  phone          String?
  mailingAddress String?
  occupation     String?              // what they do for work
  birthday       DateTime? @db.Date
  stage          String?              // see suggested stages below
  notes          Note[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Note {
  id                String           @id @default(cuid())
  body              String
  createdAt         DateTime         @default(now())
  referralPartner   ReferralPartner? @relation(fields: [referralPartnerId], references: [id], onDelete: Cascade)
  referralPartnerId String?
  pipelineContact   PipelineContact? @relation(fields: [pipelineContactId], references: [id], onDelete: Cascade)
  pipelineContactId String?
}
```

**Tags (markets and specializations):** stored as string arrays on the record. In the UI, when I add a tag, offer an autocomplete of values already used elsewhere so tags stay reusable, plus let me type a brand new one. Seed the market suggestions list (not the database) with: Northern Colorado, East Texas, Utah. These are suggestions only, I can add others.

**Pipeline stages (suggested, editable in the UI):** New Lead, Pre-Approval, Application, Processing, Underwriting, Closing, Funded. Render as a dropdown. I should be able to change the stage from both the list and the profile.

---

## 5. Pages and Features

### App shell
Persistent top bar with "Stevie De Gala" branding top left and nav links: **Dashboard**, **Referral Partners**, **Pipeline**. A logout link. Everything behind the password gate.

### Dashboard (home, `/`)
- **Today's goal:** a row of 10 circles. Empty circles are an outline; clicking one fills it in solid black. Clicking fills up to that position; clicking a filled one toward the start sets the count back. Show "X / 10" and a percentage. This updates today's `DailyLog.count`. If today is Sunday, show a simple "Day off" state and do not count it.
- **History panel** with a toggle for **Week / Month / Year**. For the selected range, show **both** metrics side by side:
  1. **Completion rate:** the percentage of working days (Mon to Sat) in the range where I hit all 10.
  2. **Average conversations per day:** total conversations divided by the number of working days in the range.
  Exclude Sundays from both numerators and denominators. Days with no log count as 0 conversations and as a non-completed day.
- A simple monochrome **bar chart** (Recharts) of daily conversation counts across the selected range.
- **Upcoming birthdays** widget: the next ~30 days of birthdays across both Referral Partners and Pipeline, each linking to its profile.

### Referral Partners (`/partners`)
- A clean list/table: name, role, markets, phone. Search by name and filter by market tag and specialization tag.
- "Add partner" button opens a form (name required, the rest optional).
- Clicking a row opens the profile.

### Pipeline (`/pipeline`)
- A clean list/table: name, stage, phone, occupation. Search by name and filter by stage.
- "Add contact" button opens a form.
- Clicking a row opens the profile.

### Profile view (Attio-style, for both record types)
- A focused page showing the record name as a header.
- Attributes shown as a stacked list of label/value rows that are **editable inline** (click the value to edit, blur or enter to save). Fields per the data model for each type.
- Tags (markets, specializations for partners) render as pills with inline add/remove. Stage for pipeline contacts is editable here.
- A **Notes section**: a text box to add a new note plus a reverse-chronological list of existing notes, each stamped with its date. Notes are timestamped on creation.
- Editing any field saves immediately (optimistic UI is fine, but persist to the database).

### Login (`/login`)
Single password field. On success set the session cookie and redirect to the dashboard.

---

## 6. Build Order

Build and verify each milestone before moving on.

1. Scaffold Next.js + TypeScript + Tailwind. Configure Inter and the monochrome theme. Build the app shell, nav, and a placeholder for each page.
2. Add Prisma and the schema above. Connect to Postgres, run the first migration.
3. Build the password gate (login page, session cookie, middleware).
4. Dashboard: today's 10-circle tracker writing to `DailyLog`, then the Week/Month/Year stats, chart, and upcoming birthdays.
5. Referral Partners: list, add, and the profile view with inline editing, tags, and notes.
6. Pipeline: list, add, and the profile view with inline editing, stage, and notes.
7. Polish responsiveness and empty states. Confirm everything runs locally.
8. Prepare for deployment (next section).

---

## 7. Setup and Deployment

I am newer to the terminal, so spell out the commands and tell me when I need to do something in a browser (like Vercel or GitHub).

1. Get the app running locally and confirm I can log in, check off conversations, and add a contact.
2. Initialize a git repo and walk me through pushing it to a new GitHub repo.
3. Walk me through importing the repo into Vercel, provisioning Vercel Postgres, and setting the env vars: `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`.
4. Run the Prisma migration against the production database and confirm the live site works.

Include a short `README.md` with the local dev commands and the env vars.

---

## 8. Acceptance Criteria

- The whole app sits behind a single password and is responsive on desktop and phone.
- The dashboard's 10 circles fill on click, persist for the day, and show "X / 10" plus a percentage. Sunday is excluded.
- Week/Month/Year shows both completion rate and average per day, with Sundays excluded from the math.
- I can add, view, inline-edit, tag, and add timestamped notes to both Referral Partners and Pipeline contacts.
- Upcoming birthdays surface on the dashboard and link to profiles.
- The UI is strictly black, white, and gray, in Inter, with "Stevie De Gala" branding, and no dashes in the copy.
- The app deploys to Vercel from GitHub and works against Vercel Postgres.
