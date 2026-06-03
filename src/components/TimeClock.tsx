// Staff time clock: a big clock in/out button plus a list of recent entries.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { TimeEntryRow } from "../api/repository";

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function duration(a: string | null, b: string | null): string {
  if (!a || !b) return "—";
  const mins = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m}m`;
}

export default function TimeClock() {
  const [entries, setEntries] = useState<TimeEntryRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function refresh() { setEntries(await api.myTimeEntries()); setLoaded(true); }
  useEffect(() => { void refresh(); }, []);

  const open = entries.find((e) => e.open);

  async function toggle() {
    setBusy(true); setError("");
    const res = open ? await api.clockOut() : await api.clockIn();
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Failed."); return; }
    await refresh();
  }

  return (
    <div className="form-card">
      <h2>Time Clock</h2>
      <div className="clock-status">
        {!loaded
          ? <p className="muted-count">Loading…</p>
          : open
            ? <p>You are <strong className="clocked-in">clocked in</strong> since {fmt(open.clockIn)}.</p>
            : <p>You are <strong className="clocked-out">clocked out</strong>.</p>}
        <button className={open ? "btn btn--bad clock-btn" : "btn btn--primary clock-btn"} onClick={toggle} disabled={busy || !loaded}>
          {busy ? "…" : open ? "Clock out" : "Clock in"}
        </button>
      </div>
      {error && <p className="auth-err">{error}</p>}

      <h3 className="step-h">Recent entries</h3>
      {entries.length === 0 ? (
        <p className="empty">No time entries yet.</p>
      ) : (
        <table className="table">
          <thead><tr><th>Clock in</th><th>Clock out</th><th>Duration</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{fmt(e.clockIn)}</td>
                <td>{e.open ? <span className="badge badge--pending">in progress</span> : fmt(e.clockOut)}</td>
                <td>{duration(e.clockIn, e.clockOut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
