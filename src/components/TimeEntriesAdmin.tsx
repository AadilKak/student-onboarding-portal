// Admin time dashboard: summary stats, a simple selectable list of staff
// names, and the selected staff member's clock in/out details.
import { useEffect, useMemo, useState } from "react";
import * as api from "../api/repository";
import type { TimeEntryRow } from "../api/repository";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function hours(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

interface Props { canDelete?: boolean; }

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function TimeEntriesAdmin({ canDelete = true }: Props) {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [selected, setSelected] = useState<string>("all");

  async function refresh() { setEntries(await api.allTimeEntries()); }
  useEffect(() => { void refresh(); }, []);

  async function approve(id: string, approved: boolean) { await api.approveEntry(id, approved); await refresh(); }
  async function remove(id: string) { if (confirm("Delete this entry?")) { await api.deleteTimeEntry(id); await refresh(); } }
  async function approveAll() {
    const row = entries.find((e) => e.email === selected);
    if (row) { await api.approveAllForUser(row.userId); await refresh(); }
  }

  const [editId, setEditId] = useState<string | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");
  function openEdit(e: TimeEntryRow) {
    setEditId(e.id);
    setEditIn(toLocalInput(e.clockIn));
    setEditOut(toLocalInput(e.clockOut));
  }
  async function saveEdit() {
    if (!editId) return;
    const ci = editIn ? new Date(editIn).toISOString() : null;
    const co = editOut ? new Date(editOut).toISOString() : null;
    await api.editTimeEntry(editId, ci, co);
    setEditId(null);
    await refresh();
  }

  // Unique staff (display name falls back to email), with a "currently in" flag.
  const staff = useMemo(() => {
    const map = new Map<string, { label: string; open: boolean }>();
    for (const e of entries) {
      const key = e.email ?? "unknown";
      const label = e.name || e.email || "unknown";
      const prev = map.get(key);
      map.set(key, { label, open: (prev?.open ?? false) || e.open });
    }
    return Array.from(map.entries()).map(([email, v]) => ({ email, label: v.label, open: v.open })).sort((a, b) => a.label.localeCompare(b.label));
  }, [entries]);

  const totals = useMemo(() => ({
    staff: staff.length,
    clockedIn: entries.filter((e) => e.open).length,
    entries: entries.length,
    hours: entries.reduce((n, e) => n + hours(e.clockIn, e.clockOut), 0),
  }), [entries, staff]);

  const visible = selected === "all" ? entries : entries.filter((e) => e.email === selected);
  const selectedHours = visible.reduce((n, e) => n + hours(e.clockIn, e.clockOut), 0);

  return (
    <div>
      <div className="cards">
        <div className="card"><span className="card-label">Staff</span><span className="card-value">{totals.staff}</span></div>
        <div className="card"><span className="card-label">Clocked in now</span><span className="card-value">{totals.clockedIn}</span></div>
        <div className="card"><span className="card-label">Total entries</span><span className="card-value">{totals.entries}</span></div>
        <div className="card"><span className="card-label">Total hours</span><span className="card-value">{totals.hours.toFixed(1)}</span></div>
      </div>

      <div className="time-layout">
        {/* Left: list of staff names */}
        <aside className="staff-list">
          <button className={selected === "all" ? "staff-item staff-item--active" : "staff-item"} onClick={() => setSelected("all")}>
            All staff
          </button>
          {staff.map((s) => (
            <button key={s.email} className={selected === s.email ? "staff-item staff-item--active" : "staff-item"} onClick={() => setSelected(s.email)}>
              {s.open && <span className="dot" />}{s.label}
            </button>
          ))}
        </aside>

        {/* Right: details for the selection */}
        <section className="staff-detail">
          <div className="detail-header">
            <h3>{selected === "all" ? "All staff" : (staff.find((x) => x.email === selected)?.label ?? selected)}</h3>
            <div>
              <span className="muted-count">{visible.length} entries · {selectedHours.toFixed(2)} hours  </span>
              {selected !== "all" && <button className="btn btn--small btn--ok" onClick={approveAll}>Approve all</button>}
            </div>
          </div>
          {visible.length === 0 ? (
            <p className="empty">No entries to show.</p>
          ) : (
            <table className="table">
              <thead><tr>{selected === "all" && <th>Staff</th>}<th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    {selected === "all" && <td>{e.name || e.email}</td>}
                    <td>{fmt(e.clockIn)}</td>
                    <td>{e.open ? <span className="badge badge--pending">in progress</span> : fmt(e.clockOut)}</td>
                    <td>{e.open ? "—" : hours(e.clockIn, e.clockOut).toFixed(2)}</td>
                    <td>
                      {e.flag === "long" && <span className="badge badge--bad" title="Over 12h — likely missed clock-out">long</span>}
                      {e.flag === "short" && <span className="badge badge--pending" title="Under 5 min — likely accidental">short</span>}
                      {!e.open && (e.approved ? <span className="badge badge--ok">approved</span> : <span className="badge">pending</span>)}
                    </td>
                    <td className="row-actions">
                      {!e.open && (e.approved
                        ? <button className="btn btn--small" onClick={() => approve(e.id, false)}>Unapprove</button>
                        : <button className="btn btn--small btn--ok" onClick={() => approve(e.id, true)}>Approve</button>)}
                      <button className="btn btn--small" onClick={() => openEdit(e)}>Edit</button>
                      {canDelete && <button className="btn btn--small btn--bad" onClick={() => remove(e.id)}>Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {editId && (
        <div className="modal-backdrop" onClick={() => setEditId(null)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-head"><h2>Edit time entry</h2><button className="expand" onClick={() => setEditId(null)}>✕</button></div>
            <p className="muted-count">Fix a missed or wrong clock-out here. Leave clock-out empty to keep the shift open.</p>
            <div className="step-body">
              <label className="ef"><span className="ef-label">Clock in</span>
                <input className="ef-input" type="datetime-local" value={editIn} onChange={(e) => setEditIn(e.target.value)} /></label>
              <label className="ef"><span className="ef-label">Clock out</span>
                <input className="ef-input" type="datetime-local" value={editOut} onChange={(e) => setEditOut(e.target.value)} /></label>
            </div>
            <div className="actions">
              <button className="btn btn--ghost" onClick={() => setEditId(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
