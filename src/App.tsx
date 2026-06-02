// Top-level component. Owns the list of records and the current role,
// loads/saves to storage, and switches between the Parent form and the
// Admin table based on the selected role.
import { useEffect, useState } from "react";
import type { StudentRecord, Role, Status } from "./types";
import { loadRecords, saveRecords } from "./storage";
import OnboardingForm from "./components/OnboardingForm";
import AdminView from "./components/AdminView";

export default function App() {
  const [role, setRole] = useState<Role>("parent");
  const [records, setRecords] = useState<StudentRecord[]>(() => loadRecords());

  // Whenever records change, persist them. The effect runs after render.
  useEffect(() => { saveRecords(records); }, [records]);

  function addRecord(record: StudentRecord) {
    setRecords((prev) => [record, ...prev]);
    setRole("admin"); // jump to admin so you can see it land
  }
  function setStatus(id: string, status: Status) {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Maplewood School · Onboarding Portal</h1>
          <p className="subtitle">Enroll a student and track application status</p>
        </div>
        {/* Role switcher — stands in for real authentication */}
        <div className="role-switch">
          <button className={role === "parent" ? "pill pill--active" : "pill"} onClick={() => setRole("parent")}>Parent</button>
          <button className={role === "admin" ? "pill pill--active" : "pill"} onClick={() => setRole("admin")}>School Admin</button>
        </div>
      </header>

      {role === "parent"
        ? <OnboardingForm onSubmit={addRecord} />
        : <AdminView records={records} onSetStatus={setStatus} />}
    </div>
  );
}
