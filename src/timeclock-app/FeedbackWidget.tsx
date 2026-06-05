// Floating "Feedback" button shown on every screen. Opens a small form with a
// star rating and a message, saved to the backend.
import { useState } from "react";
import * as api from "../api/repository";

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!message.trim()) { setError("Please enter a message."); return; }
    setBusy(true); setError("");
    const res = await api.submitFeedback(rating, message.trim());
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Failed."); return; }
    setSent(true); setMessage(""); setRating(0);
  }
  function close() { setOpen(false); setSent(false); setError(""); }

  return (
    <>
      <button className="fb-fab" onClick={() => setOpen(true)} aria-label="Send feedback">💬 Feedback</button>
      {open && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h2>Send feedback</h2><button className="expand" onClick={close}>✕</button></div>
            {sent ? (
              <>
                <p className="auth-sent">Thanks! Your feedback was sent.</p>
                <div className="actions"><button className="btn btn--primary" onClick={close}>Close</button></div>
              </>
            ) : (
              <>
                <div className="fb-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} className={n <= rating ? "fb-star fb-star--on" : "fb-star"} onClick={() => setRating(n)} aria-label={`${n} stars`}>★</button>
                  ))}
                </div>
                <textarea className="ef-input" rows={4} placeholder="What's working, what's confusing, what's broken?"
                  value={message} onChange={(e) => setMessage(e.target.value)} />
                {error && <p className="auth-err">{error}</p>}
                <div className="actions">
                  <button className="btn btn--ghost" onClick={close}>Cancel</button>
                  <button className="btn btn--primary" onClick={send} disabled={busy}>{busy ? "…" : "Send"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
