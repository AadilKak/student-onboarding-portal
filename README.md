# Student Onboarding & Records Portal

A small React + TypeScript web app where **parents** complete a multi-step
form to enroll a student, and a **school admin** reviews submissions and
approves or rejects them. Built to mirror tools like GradeLink.

Built with: **React 18 · TypeScript · Vite**. No backend — submissions are
saved in the browser via `localStorage`, so they survive a page refresh.

---

## Run it locally

You need Node.js (v18+). Then:

```bash
npm install      # download dependencies (one time)
npm run dev      # start the dev server, open the URL it prints (usually http://localhost:5173)
```

Other commands:
```bash
npm run build      # production build into dist/
npm run typecheck  # check types without building
```

---

## How it works (read in this order)

Think of the app as a tree of components. Data lives near the top and flows
**down** as props; events flow **up** through callback functions.

1. **`src/types.ts`** — the shape of the data. `StudentRecord` is everything
   one parent enters about one child, plus a `status`
   (`draft → submitted → approved/rejected`). Defining it once means every
   file agrees and the compiler catches mistakes.

2. **`src/storage.ts`** — `loadRecords()` / `saveRecords()` read and write
   `localStorage`. Keeping this in one file means no component touches storage
   directly; they just call these two functions.

3. **`src/App.tsx`** — the top-level component. It owns two pieces of state:
   the current `role` (parent vs admin) and the list of `records`. A
   `useEffect` saves records whenever they change. It renders the form for
   parents and the table for admins.

4. **`src/components/OnboardingForm.tsx`** — the multi-step form. It keeps the
   in-progress record in state, validates the current step before letting you
   advance (`next()`), and calls `onSubmit` on the final step. The `set()`
   helper updates one field at a time in a type-safe way.

5. **`src/components/validation.ts`** — pure functions that return which
   fields are invalid for a given step. Kept separate so it's easy to read and
   reuse.

6. **`src/components/Field.tsx`** — one reusable labeled input with an error
   message. Used on every step so all fields behave the same — this is the
   "reusable, composable component" idea.

7. **`src/components/AdminView.tsx`** — the admin table. Shows each submission
   with a status badge and Approve/Reject buttons that call back up to `App`.

8. **`src/index.css`** — all the styling. Plain CSS with a few variables.

### The two concepts worth understanding for an interview
- **Lifting state up:** `App` owns the records; children receive data and send
  changes back via callbacks (`onSubmit`, `onSetStatus`). This is the core
  React data-flow pattern.
- **Controlled inputs:** every input's value comes from state and every
  keystroke updates state via `onChange`. React is the single source of truth.

---

## Push it to GitHub

```bash
git init
git add .
git commit -m "Student onboarding & records portal"
git branch -M main
git remote add origin https://github.com/AadilKak/student-onboarding-portal.git
git push -u origin main
```
(Create the empty repo on GitHub first, named `student-onboarding-portal`.)

---

## Ideas to extend it (good talking points)
- Edit an existing submission instead of only creating new ones.
- Search/filter the admin table by status or grade.
- Swap `localStorage` for a real API (e.g. a small Flask backend — on Ramp's stack).
- Add unit tests for `validation.ts`.
