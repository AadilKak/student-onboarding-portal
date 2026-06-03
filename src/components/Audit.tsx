// Admin audit log: recent actions on time entries (approve / edit / delete).
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { AuditRow } from "../api/repository";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => { (async () => setRows(await api.getAudit()))(); }, []);

  return (
    <div>
      <p className="subtitle">Recent administrative actions on time entries.</p>
      {rows.length === 0 ? <p className="empty">No audit events yet.</p> : (
        <table className="table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{fmt(r.at)}</td>
                <td>{r.actor}</td>
                <td><span className="badge">{r.action}</span></td>
                <td className="muted-count">{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
