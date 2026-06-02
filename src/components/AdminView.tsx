// The school-admin view: a table of all submitted applications with the
// ability to approve or reject each one. Demonstrates a status workflow.
import type { StudentRecord, Status } from "../types";

interface Props {
  records: StudentRecord[];
  onSetStatus: (id: string, status: Status) => void;
}

const badgeClass: Record<Status, string> = {
  draft: "badge",
  submitted: "badge badge--pending",
  approved: "badge badge--ok",
  rejected: "badge badge--bad",
};

export default function AdminView({ records, onSetStatus }: Props) {
  if (records.length === 0) {
    return <p className="empty">No applications yet. Switch to the Parent view to submit one.</p>;
  }
  return (
    <table className="table">
      <thead>
        <tr><th>Student</th><th>Grade</th><th>Guardian</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.id}>
            <td>{r.studentFirstName} {r.studentLastName}</td>
            <td>{r.gradeLevel}</td>
            <td>{r.guardianName}</td>
            <td><span className={badgeClass[r.status]}>{r.status}</span></td>
            <td className="row-actions">
              <button className="btn btn--small btn--ok" onClick={() => onSetStatus(r.id, "approved")}>Approve</button>
              <button className="btn btn--small btn--bad" onClick={() => onSetStatus(r.id, "rejected")}>Reject</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
