// School-admin view: summary stats, search + status filtering, a table of
// applications with expandable detail rows, and approve/reject/delete actions.
import { Fragment, useMemo, useState } from "react";
import AdminStudentEditor from "./AdminStudentEditor";
import type { StudentRecord, Status } from "../types";

interface Props {
  records: StudentRecord[];
  onSetStatus: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
  onSave: (updated: StudentRecord) => void;
}

const STATUS_FILTERS: (Status | "all")[] = ["all", "submitted", "approved", "rejected"];

const badgeClass: Record<Status, string> = {
  draft: "badge",
  submitted: "badge badge--pending",
  approved: "badge badge--ok",
  rejected: "badge badge--bad",
};

export default function AdminView({ records, onSetStatus, onDelete, onSave }: Props) {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudentRecord | null>(null);

  // Counts for the summary cards.
  const counts = useMemo(() => ({
    total: records.length,
    submitted: records.filter((r) => r.status === "submitted").length,
    approved: records.filter((r) => r.status === "approved").length,
    rejected: records.filter((r) => r.status === "rejected").length,
  }), [records]);

  // Apply the status filter and name search.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const name = `${r.studentFirstName} ${r.studentLastName} ${r.guardianName}`.toLowerCase();
      return matchStatus && (q === "" || name.includes(q));
    });
  }, [records, statusFilter, query]);

  return (
    <div>
      <div className="cards">
        <div className="card"><span className="card-label">Total</span><span className="card-value">{counts.total}</span></div>
        <div className="card"><span className="card-label">Pending</span><span className="card-value">{counts.submitted}</span></div>
        <div className="card"><span className="card-label">Approved</span><span className="card-value">{counts.approved}</span></div>
        <div className="card"><span className="card-label">Rejected</span><span className="card-value">{counts.rejected}</span></div>
      </div>

      <div className="filterbar">
        <input className="search" placeholder="Search by student or guardian..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "all")}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="empty">No applications match. Switch to the Parent view to submit one.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th></th><th>Student</th><th>Grade</th><th>Guardian</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visible.map((r) => (
                <Fragment key={r.id}>
                <tr>
                  <td>
                    <button className="expand" onClick={() => setOpenId(openId === r.id ? null : r.id)} aria-label="Toggle details">
                      {openId === r.id ? "▾" : "▸"}
                    </button>
                  </td>
                  <td>{r.studentFirstName} {r.studentLastName}</td>
                  <td>{r.gradeLevel}</td>
                  <td>{r.guardianName}</td>
                  <td><span className={badgeClass[r.status]}>{r.status}</span></td>
                  <td className="row-actions">
                    <button className="btn btn--small" onClick={() => setEditing(r)}>Open</button>
                    <button className="btn btn--small btn--ok" onClick={() => onSetStatus(r.id, "approved")}>Approve</button>
                    <button className="btn btn--small btn--bad" onClick={() => onSetStatus(r.id, "rejected")}>Reject</button>
                    <button className="btn btn--small btn--ghost" onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
                {openId === r.id && (
                  <tr className="detail-row">
                    <td colSpan={6}>
                      <div className="detail-grid">
                        <div><span className="detail-k">Email</span>{r.guardianEmail}</div>
                        <div><span className="detail-k">Guardian phone</span>{r.guardianPhone}</div>
                        <div><span className="detail-k">Date of birth</span>{r.dateOfBirth}</div>
                        <div><span className="detail-k">Allergies / medical</span>{r.allergies || "None"}</div>
                        <div><span className="detail-k">Emergency contact</span>{r.emergencyContact}</div>
                        <div><span className="detail-k">Emergency phone</span>{r.emergencyPhone}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <AdminStudentEditor
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => { onSave(updated); setEditing(null); }}
        />
      )}
    </div>
  );
}
