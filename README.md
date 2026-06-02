# Student Onboarding & Records Portal

A web application for managing student enrollment at a school. Parents complete
a guided, multi-step form to enroll a student; school administrators review each
submission and approve or reject it. Inspired by school-information systems such
as GradeLink.

## Features

- **Multi-step enrollment form** — guardian details, student details, and
  emergency/medical information, collected across four steps with a progress
  indicator and per-step validation.
- **Role-based views** — a parent view for submitting applications and an
  administrator view for reviewing them.
- **Application workflow** — each record moves through `submitted → approved`
  or `rejected`.
- **Admin dashboard** — summary counts (total, pending, approved, rejected),
  search by student or guardian name, and filtering by status.
- **Expandable detail rows** — view a submission's full information inline.
- **Local persistence** — submissions are stored in the browser via
  `localStorage`, so they survive a page refresh.

## Tech stack

- React 18
- TypeScript
- Vite

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Additional scripts:

```bash
npm run build      # production build
npm run preview    # serve the production build locally
npm run typecheck  # type-check without emitting
```

> Note: avoid running `npm install` inside a cloud-synced folder
> (OneDrive, Dropbox, etc.). Sync clients lock files while `node_modules`
> is being written, which causes install errors. Keep the project in a
> local, non-synced directory.

## Project structure

```
src/
  App.tsx                  Top-level component; owns records and current role
  types.ts                 Shared data types (StudentRecord, Status, Role)
  storage.ts               localStorage read/write helpers
  index.css                Styles
  components/
    OnboardingForm.tsx     Multi-step parent enrollment form
    Field.tsx              Reusable labeled input with error display
    validation.ts          Per-step validation rules
    AdminView.tsx          Admin dashboard, table, and review actions
```

## Architecture notes

State is owned by `App` and passed down to child components as props; child
components report changes back through callback props (`onSubmit`,
`onSetStatus`, `onDelete`). All form inputs are controlled, with React state as
the single source of truth. The persistence layer is isolated in `storage.ts`
so components never access `localStorage` directly.

## Possible extensions

- Edit existing submissions in addition to creating new ones.
- Replace `localStorage` with a backend API and database.
- Add automated tests for the validation logic.
- Add authentication for real parent and administrator accounts.
