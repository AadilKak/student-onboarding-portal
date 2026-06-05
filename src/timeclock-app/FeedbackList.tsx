// Admin view of submitted feedback.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { FeedbackRow } from "../api/repository";

function fmt(iso: string) { return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }

export default function FeedbackList() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  useEffect(() => { (async () => setRows(await api.listFeedback()))(); }, []);

  return (
    <div>
      <p className="subtitle">Feedback from users, newest first.</p>
      {rows.length === 0 ? <p className="empty">No feedback yet.</p> : (
        <table className="table">
          <thead><tr><th>When</th><th>From</th><th>Rating</th><th>Message</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted-count">{fmt(r.at)}</td>
                <td>{r.email}<div className="muted-count">{r.role}</div></td>
                <td>{r.rating ? "★".repeat(r.rating) : "—"}</td>
                <td>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
