// Admin/lead notes inbox. Open notes show first; respond + resolve clears them
// from the active list (notes are operational, not a permanent audit trail).
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { NoteRow } from "../api/repository";

function fmt(iso: string) { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

export default function NotesList() {
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function refresh() { setRows(await api.listAllNotes()); }
  useEffect(() => { void refresh(); }, []);

  async function resolve(n: NoteRow) {
    await api.resolveNote(n.id, true, drafts[n.id] ?? n.response ?? "");
    await refresh();
  }
  async function reopen(n: NoteRow) { await api.resolveNote(n.id, false); await refresh(); }
  async function remove(id: string) { if (confirm("Delete this note?")) { await api.deleteNote(id); await refresh(); } }

  const visible = rows.filter((n) => showResolved ? n.resolved : !n.resolved);

  return (
    <div>
      <div className="filterbar">
        <p className="subtitle" style={{ margin: 0 }}>Worker notes (e.g. missed clock-ins). Respond and resolve to clear them.</p>
        <label className="muted-count" style={{ marginLeft: "auto" }}>
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty">{showResolved ? "No resolved notes." : "No open notes. 🎉"}</p>
      ) : visible.map((n) => (
        <div key={n.id} className="note-card">
          <div className="note-card-head">
            <strong>{n.subjectName || n.subjectEmail}</strong>
            <span className="muted-count">{fmt(n.at)}</span>
          </div>
          <p className="note-body">{n.body}</p>

          {n.resolved ? (
            <>
              {n.response && <p className="note-response">Admin: {n.response}</p>}
              <div className="row-actions">
                <span className="badge badge--ok">resolved</span>
                <button className="btn btn--small" onClick={() => reopen(n)}>Reopen</button>
                <button className="btn btn--small btn--bad" onClick={() => remove(n.id)}>Delete</button>
              </div>
            </>
          ) : (
            <div className="note-resolve">
              <input className="ef-input" placeholder="Response (optional, e.g. 'Added your 8am clock-in')"
                value={drafts[n.id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [n.id]: e.target.value })} />
              <button className="btn btn--small btn--ok" onClick={() => resolve(n)}>Resolve</button>
              <button className="btn btn--small btn--bad" onClick={() => remove(n.id)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
