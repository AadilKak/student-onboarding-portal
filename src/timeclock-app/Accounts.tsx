// Admin: create contractor / lead accounts and manage rates.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { UserRow } from "../api/repository";
import type { Role } from "../types";

export default function Accounts() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("contractor");
  const [rate, setRate] = useState("0");
  const [msg, setMsg] = useState("");

  async function refresh() { setUsers(await api.listUsers()); }
  useEffect(() => { void refresh(); }, []);

  async function add() {
    if (!username || !pin) { setMsg("Username and PIN are required."); return; }
    const res = await api.createAccount({ name, username, pin, role, hourlyRate: role === "contractor" ? (parseFloat(rate) || 0) : 0 });
    if (!res.ok) { setMsg(res.error ?? "Failed."); return; }
    setMsg(`Created ${username}.`);
    setName(""); setUsername(""); setPin(""); setRate("0");
    await refresh();
  }
  async function changeRate(id: string, value: string) {
    const r = parseFloat(value); if (Number.isNaN(r)) return;
    await api.setUserRate(id, r); await refresh();
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Remove account ${label}?`)) return;
    const res = await api.deleteAccount(id);
    if (!res.ok) { setMsg(res.error ?? "Failed."); return; }
    await refresh();
  }

  // Only show workers (contractor / lead / staff) here.
  const workers = users.filter((u) => ["contractor", "lead", "staff"].includes(u.role));

  return (
    <div>
      <h3 className="step-h">Add account</h3>
      <div className="acct-form">
        <input className="ef-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="ef-input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="ef-input" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
        <select className="ef-input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="contractor">contractor</option>
          <option value="lead">lead</option>
        </select>
        {role === "contractor" && <input className="ef-input" style={{ width: 90 }} type="number" min="0" step="0.5" placeholder="$/hr"
          value={rate} onChange={(e) => setRate(e.target.value)} />}
        <button className="btn btn--primary" onClick={add}>Add</button>
      </div>
      {msg && <p className="muted-count">{msg}</p>}

      <h3 className="step-h">Accounts</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Rate</th><th></th></tr></thead>
        <tbody>
          {workers.map((u) => (
            <tr key={u.id}>
              <td>{u.name || "—"}</td>
              <td className="muted-count">{u.email}</td>
              <td>{u.role}</td>
              <td>{u.role === "contractor"
                ? <span>$<input className="ef-input" style={{ width: 74 }} type="number" min="0" step="0.5"
                    defaultValue={u.hourlyRate} onBlur={(e) => changeRate(u.id, e.target.value)} /></span>
                : <span className="muted-count">—</span>}</td>
              <td><button className="btn btn--small btn--bad" onClick={() => remove(u.id, u.name || u.email)}>Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
