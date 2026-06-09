// Admin: view/edit a worker's profile (name, title, phone, address) and read
// the notes they've submitted (plus add an admin note).
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { UserRow, NoteRow } from "../api/repository";

function fmt(iso: string) { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

interface Props { user: UserRow; onClose: () => void; onSaved: () => void; }

export default function ContractorEditor({ user, onClose, onSaved }: Props) {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [newNote, setNewNote] = useState("");
  const [msg, setMsg] = useState("");

  async function loadNotes() { setNotes(await api.listUserNotes(user.id)); }
  useEffect(() => { void loadNotes(); }, [user.id]);

  async function save() {
    const res = await api.updateProfile(user.id, { name, title, phone, address });
    if (!res.ok) { setMsg(res.error ?? "Failed."); return; }
    setMsg("Saved."); onSaved();
  }
  async function addNote() {
    if (!newNote.trim()) return;
    await api.addNote(newNote.trim(), user.id);
    setNewNote(""); await loadNotes();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{user.name || user.email}</h2><button className="expand" onClick={onClose}>✕</button></div>
        <div className="modal-scroll">
          <h3 className="step-h">Profile</h3>
          <div className="two-col">
            <label className="ef"><span className="ef-label">Full name</span><input className="ef-input" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="ef"><span className="ef-label">Job title</span><input className="ef-input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          </div>
          <div className="two-col">
            <label className="ef"><span className="ef-label">Phone number</span><input className="ef-input" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="ef"><span className="ef-label">Username</span><input className="ef-input" value={user.email} disabled /></label>
          </div>
          <label className="ef"><span className="ef-label">Address</span><input className="ef-input" value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          {msg && <p className="muted-count">{msg}</p>}

          <h3 className="step-h">Notes</h3>
          {notes.length === 0 ? <p className="empty">No notes yet.</p> : (
            <ul className="note-list">
              {notes.map((n) => (
                <li key={n.id} className="note-item">
                  <div>{n.body}</div>
                  <div className="muted-count">{n.author} · {fmt(n.at)}</div>
                </li>
              ))}
            </ul>
          )}
          <div className="two-col" style={{ gridTemplateColumns: "1fr auto" }}>
            <input className="ef-input" placeholder="Add an admin note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <button className="btn" onClick={addNote}>Add note</button>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn--ghost" onClick={onClose}>Close</button>
          <button className="btn btn--primary" onClick={save}>Save profile</button>
        </div>
      </div>
    </div>
  );
}
