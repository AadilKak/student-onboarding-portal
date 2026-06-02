// The student roster: a searchable directory of enrolled students. Admins can
// add a new student, edit any profile, or delete; teachers see it read-only.
import { useMemo, useState } from "react";
import type { StudentRecord } from "../types";
import { emptyRecord } from "../types";
import StudentProfile from "./StudentProfile";
import AdminStudentEditor from "./AdminStudentEditor";

interface Props {
  students: StudentRecord[];
  readOnly?: boolean;
  onSave: (updated: StudentRecord) => void;
  onCreate?: (record: StudentRecord) => void;
  onDelete?: (id: string) => void;
}

export default function Roster({ students, readOnly = false, onSave, onCreate, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [creating, setCreating] = useState<StudentRecord | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => `${s.studentFirstName} ${s.studentLastName}`.toLowerCase().includes(q))
      .sort((a, b) => a.studentLastName.localeCompare(b.studentLastName));
  }, [students, query]);

  return (
    <div>
      <div className="filterbar">
        <input className="search" placeholder="Search students..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="muted-count">{visible.length} student{visible.length === 1 ? "" : "s"}</span>
        {!readOnly && onCreate && (
          <button className="btn btn--primary btn--small" onClick={() => setCreating(emptyRecord())}>+ Add Student</button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="empty">No enrolled students yet. Add one or approve an application.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Name</th><th>Grade</th><th>Guardian</th><th>Contact</th><th></th></tr></thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id}>
                <td>{s.studentLastName}, {s.studentFirstName}</td>
                <td>{s.gradeLevel}</td>
                <td>{s.guardianName}</td>
                <td>{s.guardianEmail}</td>
                <td className="row-actions">
                  <button className="btn btn--small" onClick={() => setEditing(s)}>{readOnly ? "View" : "Edit"}</button>
                  {!readOnly && onDelete && (
                    <button className="btn btn--small btn--bad" onClick={() => onDelete(s.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && readOnly && (
        <StudentProfile
          record={editing}
          onClose={() => setEditing(null)}
          onSave={() => setEditing(null)}
        />
      )}
      {editing && !readOnly && (
        <AdminStudentEditor
          record={editing}
          onClose={() => setEditing(null)}
          onSave={(updated) => { onSave(updated); setEditing(null); }}
        />
      )}
      {creating && onCreate && (
        <AdminStudentEditor
          record={creating}
          isNew
          onClose={() => setCreating(null)}
          onSave={(record) => { onCreate(record); setCreating(null); }}
        />
      )}
    </div>
  );
}
