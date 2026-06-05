// Top-level component. Owns the current role, the active view within that
// role, and the list of student records (loaded from the data layer).
// All data access goes through src/api/repository — never localStorage directly.
import { useEffect, useState, useCallback } from "react";
import type { StudentRecord, Role, Status } from "./types";
import * as api from "./api/repository";
import EnrollmentWizard from "./enroll/EnrollmentWizard";
import AdminView from "./components/AdminView";
import Roster from "./components/Roster";
import ParentPortal from "./components/ParentPortal";
import Users from "./components/Users";
import TimeClock from "./components/TimeClock";
import TimeEntriesAdmin from "./components/TimeEntriesAdmin";
import Payroll from "./components/Payroll";
import Audit from "./components/Audit";
import AuthPage from "./auth/AuthPage";

// Which views each role can navigate between.
const VIEWS: Record<Role, { id: string; label: string }[]> = {
  admin: [
    { id: "applications", label: "Applications" },
    { id: "roster", label: "Roster" },
    { id: "users", label: "Users" },
    { id: "time", label: "Time Entries" },
    { id: "payroll", label: "Payroll" },
    { id: "audit", label: "Audit" },
    { id: "timeclock", label: "Time Clock" },
  ],
  teacher: [
    { id: "roster", label: "Roster" },
    { id: "timeclock", label: "Time Clock" },
  ],
  staff: [{ id: "timeclock", label: "Time Clock" }],
  contractor: [{ id: "timeclock", label: "Time Clock" }],
  lead: [
    { id: "time", label: "Time Entries" },
    { id: "timeclock", label: "Time Clock" },
  ],
  parent: [
    { id: "enroll", label: "Enroll a Student" },
    { id: "portal", label: "My Students" },
  ],
};

export default function App() {
  const [role, setRole] = useState<Role>("parent");
  const [view, setView] = useState<string>("enroll");
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [session, setSession] = useState<string | null>(null); // logged-in email, null = signed out

  // Load records from the data layer on mount.
  const refresh = useCallback(async () => {
    setRecords(await api.listStudents());
  }, []);
  useEffect(() => { if (session) void refresh(); }, [session, refresh]);

  // When the role changes, jump to that role's first view.
  function switchRole(next: Role) {
    setRole(next);
    setView(VIEWS[next][0].id);
  }

  async function addApplication(record: StudentRecord) {
    const r = await api.createApplication(record);
    if (!r.ok) { alert(r.error); return; }
    await refresh();
    setView("portal"); // show the parent their submission in their portal
  }
  async function setStatus(id: string, status: Status) {
    const r = await api.setStatus(id, status);
    if (!r.ok) alert(r.error);
    await refresh();
  }
  async function remove(id: string) { await api.deleteStudent(id); await refresh(); }
  async function save(updated: StudentRecord) { await api.updateStudent(updated); await refresh(); }
  async function createStudent(record: StudentRecord) {
    const r = await api.createStudent(record);
    if (!r.ok) alert(r.error);
    await refresh();
  }

  // Derived lists.
  const applications = records.filter((r) => r.status !== "approved");
  const enrolled = records.filter((r) => r.status === "approved");

  if (!session) {
    return <AuthPage onAuthenticated={(email, role) => { setSession(email); switchRole(role as Role); }} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Al-Huda School · Information System</h1>
          <p className="subtitle">Enrollment, student records, and family portal</p>
        </div>
        <div className="role-switch">
          <span className="acct">{session}</span>
          <span className="role-badge">{role[0].toUpperCase() + role.slice(1)}</span>
          <button className="pill" onClick={() => { api.clearToken(); setSession(null); }}>Sign out</button>
        </div>
      </header>

      <nav className="tabs">
        {VIEWS[role].map((v) => (
          <button key={v.id} className={view === v.id ? "tab tab--active" : "tab"} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </nav>

      {role === "parent" && view === "enroll" && <EnrollmentWizard onSubmit={addApplication} />}
      {role === "parent" && view === "portal" && <ParentPortal lookup={api.listByGuardianEmail} />}
      {role === "admin" && view === "applications" && (
        <AdminView records={applications} onSetStatus={setStatus} onDelete={remove} onSave={save} />
      )}
      {role === "admin" && view === "roster" && <Roster students={enrolled} onSave={save} onCreate={createStudent} onDelete={remove} />}
      {role === "teacher" && view === "roster" && <Roster students={enrolled} onSave={save} readOnly />}
      {role === "admin" && view === "users" && <Users />}
      {role === "admin" && view === "time" && <TimeEntriesAdmin canDelete />}
      {role === "lead" && view === "time" && <TimeEntriesAdmin canDelete={false} />}
      {role === "admin" && view === "payroll" && <Payroll />}
      {role === "admin" && view === "audit" && <Audit />}
      {role === "staff" && view === "timeclock" && <TimeClock />}
      {role === "contractor" && view === "timeclock" && <TimeClock />}
      {role === "teacher" && view === "timeclock" && <TimeClock />}
      {role === "admin" && view === "timeclock" && <TimeClock />}
      {role === "lead" && view === "timeclock" && <TimeClock />}
    </div>
  );
}
