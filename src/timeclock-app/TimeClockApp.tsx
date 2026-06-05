// Minimal Time Clock app shell. Reuses the same backend and several existing
// components, but shows only what each role needs. The full school app
// (App.tsx) is kept in the codebase, just not rendered.
import { useState } from "react";
import * as api from "../api/repository";
import MiniLogin from "./MiniLogin";
import Accounts from "./Accounts";
import TimeClock from "../components/TimeClock";
import TimeEntriesAdmin from "../components/TimeEntriesAdmin";
import Payroll from "../components/Payroll";
import FeedbackWidget from "./FeedbackWidget";
import FeedbackList from "./FeedbackList";

export default function TimeClockApp() {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<string>("contractor");
  const [view, setView] = useState<string>("");

  function onLogin(username: string, r: string) {
    setUser(username);
    setRole(r);
    setView(r === "admin" ? "accounts" : r === "lead" ? "review" : "clock");
  }
  function logout() { api.clearToken(); setUser(null); }

  if (!user) return <MiniLogin onLogin={onLogin} />;

  // Tabs only for admin (contractors/leads have a single screen).
  const adminTabs = [
    { id: "accounts", label: "Accounts" },
    { id: "entries", label: "Time Entries" },
    { id: "payroll", label: "Payroll" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Al-Huda Time Clock</h1>
          <p className="subtitle">{user} · {role}</p>
        </div>
        <button className="pill" onClick={logout}>Log out</button>
      </header>

      {role === "admin" && (
        <>
          <nav className="tabs">
            {adminTabs.map((t) => (
              <button key={t.id} className={view === t.id ? "tab tab--active" : "tab"} onClick={() => setView(t.id)}>{t.label}</button>
            ))}
          </nav>
          {view === "accounts" && <Accounts />}
          {view === "entries" && <TimeEntriesAdmin canDelete />}
          {view === "payroll" && <Payroll />}
          {view === "feedback" && <FeedbackList />}
        </>
      )}

      {role === "lead" && <TimeEntriesAdmin canDelete={false} />}

      {(role === "contractor" || role === "staff" || role === "teacher") && <TimeClock />}

      <FeedbackWidget />
    </div>
  );
}
