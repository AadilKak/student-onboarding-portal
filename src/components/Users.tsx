// Admin-only user management: list accounts and change their role.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { UserRow } from "../api/repository";
import type { Role } from "../types";

const ROLES: Role[] = ["admin", "teacher", "parent", "staff"];

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
    if (!res.ok) { setError(res.error ?? "Failed."); }
    else setError("");
    await refresh();
  }

  return (
    <div>
      <p className="subtitle">Manage account access. Changing a role takes effect the next time that user logs in.</p>
      {error && <p className="auth-err">{error}</p>}
      <table className="table">
        <thead><tr><th>Email</th><th>Role</th><th>Hourly rate ($)</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>
                <select className="ef-input" style={{ width: "auto" }} value={u.role}
                  disabled={!owner && (u.role === "admin" || u.isOwner)}
                  onChange={(e) => change(u.id, e.target.value as Role)}>
                  {ROLES.filter((r) => owner || r !== "admin").map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {u.isOwner && <span className="badge" style={{ marginLeft: 6 }}>owner</span>}
              </td>
              <td>
                <input className="ef-input" style={{ width: 90 }} type="number" min="0" step="0.5"
                  defaultValue={u.hourlyRate} onBlur={(e) => changeRate(u.id, e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
