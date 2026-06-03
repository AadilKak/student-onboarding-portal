// Admin-only user management, grouped into sections by role.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { UserRow } from "../api/repository";
import type { Role } from "../types";

const ROLES: Role[] = ["admin", "teacher", "parent", "staff"];

// Sections shown in order; each lists the users with that role.
const SECTIONS: { role: Role; label: string; payable: boolean }[] = [
  { role: "admin", label: "Administrators", payable: false },
  { role: "teacher", label: "Teachers", payable: true },
  { role: "staff", label: "Staff", payable: true },
  { role: "parent", label: "Parents", payable: false },
];

export default function Users() {
  const owner = api.isOwner();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");

  async function refresh() { setUsers(await api.listUsers()); }
  useEffect(() => { void refresh(); }, []);

  async function changeRate(id: string, value: string) {
    const rate = parseFloat(value);
    if (Number.isNaN(rate)) return;
    const res = await api.setUserRate(id, rate);
    if (!res.ok) setError(res.error ?? "Failed."); else setError("");
    await refresh();
  }
  async function change(id: string, role: Role) {
    const res = await api.setUserRole(id, role);
    setError(res.ok ? "" : (res.error ?? "Failed."));
    await refresh();
  }

  return (
    <div>
      <p className="subtitle">Manage account access by group. Role changes take effect the next time that user logs in.</p>
      {error && <p className="auth-err">{error}</p>}

      {SECTIONS.map(({ role, label, payable }) => {
        const group = users.filter((u) => u.role === role);
        return (
          <div key={role} className="user-section">
            <h3 className="step-h">{label} <span className="muted-count">({group.length})</span></h3>
            {group.length === 0 ? (
              <p className="empty">No {label.toLowerCase()}.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Name</th><th>Role</th>{payable && <th>Hourly rate ($)</th>}</tr></thead>
                <tbody>
                  {group.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div>{u.name || <span className="muted-count">—</span>}</div>
                        <div className="muted-count">{u.email}{u.isOwner && <span className="badge" style={{ marginLeft: 6 }}>owner</span>}</div>
                      </td>
                      <td>
                        <select className="ef-input" style={{ width: "auto" }} value={u.role}
                          disabled={!owner && (u.role === "admin" || u.isOwner)}
                          onChange={(e) => change(u.id, e.target.value as Role)}>
                          {ROLES.filter((r) => owner || r !== "admin").map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      {payable && (
                        <td>
                          <input className="ef-input" style={{ width: 90 }} type="number" min="0" step="0.5"
                            defaultValue={u.hourlyRate} onBlur={(e) => changeRate(u.id, e.target.value)} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
