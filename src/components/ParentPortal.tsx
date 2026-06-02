// Parent-facing view. Automatically loads the logged-in parent's own
// children (scoped server-side by the JWT email claim) and shows each
// child's status and details.
import { useEffect, useState } from "react";
import type { StudentRecord } from "../types";
import FileManager from "./FileManager";

interface Props {
  // Returns the caller's own children. The argument is unused now that the
  // backend scopes results by the auth token, but kept for compatibility.
  lookup: (email: string) => Promise<StudentRecord[]>;
}

const badgeClass: Record<string, string> = {
  submitted: "badge badge--pending", approved: "badge badge--ok",
  rejected: "badge badge--bad", draft: "badge",
};

export default function ParentPortal({ lookup }: Props) {
  const [students, setStudents] = useState<StudentRecord[] | null>(null);

  async function load() {
    setStudents(await lookup(""));
  }
  useEffect(() => { void load(); }, []); // load once on mount

  return (
    <div className="form-card">
      <div className="portal-head">
        <h2>My Students</h2>
        <button className="btn btn--small" onClick={load}>Refresh</button>
      </div>
      <p className="subtitle">Applications submitted under your account.</p>

      {students === null && <p className="empty">Loading…</p>}
      {students !== null && students.length === 0 && (
        <p className="empty">No applications yet. Use "Enroll a Student" to submit one.</p>
      )}
      {students !== null && students.map((s) => (
        <div key={s.id} className="portal-card">
          <div className="portal-head">
            <strong>{s.studentFirstName} {s.studentLastName}</strong>
            <span className={badgeClass[s.status]}>{s.status}</span>
          </div>
          <div className="detail-grid">
            <div><span className="detail-k">Grade</span>{s.gradeLevel}</div>
            <div><span className="detail-k">Date of birth</span>{s.dateOfBirth}</div>
            <div><span className="detail-k">Allergies / medical</span>{s.allergies || "None"}</div>
            <div><span className="detail-k">Emergency contact</span>{s.emergencyContact} · {s.emergencyPhone}</div>
          </div>
          <FileManager studentId={s.id} />
        </div>
      ))}
    </div>
  );
}
