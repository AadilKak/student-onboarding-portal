// Admin-to-admin messaging.
import { useEffect, useMemo, useState } from "react";
import * as api from "../api/repository";
import type { MessageRow, UserRow } from "../api/repository";

function fmt(iso: string) { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

interface Props { me: string; }

export default function Messages({ me }: Props) {
  const meLower = me.toLowerCase();
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [admins, setAdmins] = useState<UserRow[]>([]);
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  async function refresh() {
    setMsgs(await api.listMessages());
    await api.markMessagesRead();
  }
  useEffect(() => {
    (async () => {
      const all = await api.listUsers();
      const others = all.filter((u) => u.role === "admin" && u.email.toLowerCase() !== meLower);
      setAdmins(others);
      if (others[0]) setTo(others[0].email);
      await refresh();
    })();
  }, []);

  async function send() {
    if (!to || !body.trim()) { setErr("Pick a recipient and write a message."); return; }
    const res = await api.sendMessage(to, body.trim());
    if (!res.ok) { setErr(res.error ?? "Failed."); return; }
    setErr(""); setBody(""); await refresh();
  }

  const nameFor = useMemo(() => {
    const m = new Map(admins.map((a) => [a.email.toLowerCase(), a.name || a.email]));
    m.set(meLower, "You");
    return (email: string) => m.get(email.toLowerCase()) || email;
  }, [admins, meLower]);

  return (
    <div>
      <h3 className="step-h">New message</h3>
      <div className="acct-form">
        <select className="ef-input" value={to} onChange={(e) => setTo(e.target.value)}>
          {admins.length === 0 && <option value="">No other admins</option>}
          {admins.map((a) => <option key={a.id} value={a.email}>{a.name || a.email}</option>)}
        </select>
        <input className="ef-input" style={{ flex: 1, minWidth: 220 }} placeholder="Message…"
          value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn btn--primary" onClick={send} disabled={admins.length === 0}>Send</button>
      </div>
      {err && <p className="auth-err">{err}</p>}

      <h3 className="step-h">Conversation</h3>
      {msgs.length === 0 ? <p className="empty">No messages yet.</p> : (
        <div>
          {msgs.map((m) => {
            const mine = m.sender.toLowerCase() === meLower;
            return (
              <div key={m.id} className={mine ? "msg msg--mine" : "msg"}>
                <div className="msg-meta">{mine ? `You → ${nameFor(m.recipient)}` : `${nameFor(m.sender)} → You`} · {fmt(m.at)}</div>
                <div className="msg-body">{m.body}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
