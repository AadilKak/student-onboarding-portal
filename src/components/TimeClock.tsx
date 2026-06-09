// Staff time clock: a big clock in/out button plus a list of recent entries.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { TimeEntryRow, NoteRow } from "../api/repository";

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
  const [note, setNote] = useState("");
  const [noteMsg, setNoteMsg] = useState("");
  const [myNotes, setMyNotes] = useState<NoteRow[]>([]);

  async function refresh() { setEntries(await api.myTimeEntries()); setMyNotes(await api.myNotes()); setLoaded(true); }
  useEffect(() => { void refresh(); }, []);

  const open = entries.find((e) => e.open);

  async function sendNote() {
    if (!note.trim()) return;
    const res = await api.addNote(note.trim());
    setNoteMsg(res.ok ? "Sent to admin." : (res.error ?? "Failed."));
    if (res.ok) { setNote(""); await refresh(); }
  }

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

      <h3 className="step-h">Note to admin</h3>
      <p className="muted-count">Missed a clock-in or had a problem? Leave a note and the admin will see it.</p>
      <textarea className="ef-input" rows={3} placeholder="e.g. I forgot to clock in at 8am"
        value={note} onChange={(e) => setNote(e.target.value)} />
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={sendNote} disabled={!note.trim()}>Send note</button>
        {noteMsg && <span className="muted-count" style={{ marginLeft: 10 }}>{noteMsg}</span>}
      </div>

      {myNotes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {myNotes.map((n) => (
            <div key={n.id} className="note-card">
              <p className="note-body">{n.body}</p>
              {n.response && <p className="note-response">Admin: {n.response}</p>}
              <span className={n.resolved ? "badge badge--ok" : "badge badge--pending"}>{n.resolved ? "resolved" : "open"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
