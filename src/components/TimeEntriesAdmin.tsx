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

export default function TimeEntriesAdmin() {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [selected, setSelected] = useState<string>("all");

  useEffect(() => { (async () => setEntries(await api.allTimeEntries()))(); }, []);

  // Unique staff names (with a "currently in" flag for the dot).
  const staff = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const e of entries) {
      const key = e.email ?? "unknown";
      map.set(key, map.get(key) || e.open);
    }
    return Array.from(map.entries()).map(([email, open]) => ({ email, open })).sort((a, b) => a.email.localeCompare(b.email));
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
              {s.open && <span className="dot" />}{s.email}
            </button>
          ))}
        </aside>

        {/* Right: details for the selection */}
        <section className="staff-detail">
          <div className="detail-header">
            <h3>{selected === "all" ? "All staff" : selected}</h3>
            <span className="muted-count">{visible.length} entries · {selectedHours.toFixed(2)} hours</span>
          </div>
          {visible.length === 0 ? (
            <p className="empty">No entries to show.</p>
          ) : (
            <table className="table">
              <thead><tr><th>Staff</th><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e.id}>
                    <td>{e.email}</td>
                    <td>{fmt(e.clockIn)}</td>
                    <td>{e.open ? <span className="badge badge--pending">in progress</span> : fmt(e.clockOut)}</td>
                    <td>{e.open ? "—" : hours(e.clockIn, e.clockOut).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
