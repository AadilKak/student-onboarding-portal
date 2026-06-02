// "Password Reset" tab: collects an email and (in this prototype) confirms
// that reset instructions would be sent.
import { useState } from "react";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="auth-card">
      <h2 className="auth-title">Enter the email address that you used to establish your enrollment account</h2>
      <h2 className="auth-title">Click the button and you will receive instructions on how to reset your password</h2>

      <div className="auth-single">
        <label className="auth-label">Email Address</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setSent(false); }} />

        <div className="auth-center">
          <button className="btn btn--primary auth-pill-btn" onClick={() => emailValid && setSent(true)} disabled={!emailValid}>Send Email</button>
        </div>
        {sent && <p className="auth-sent">If an account exists for {email}, reset instructions have been sent.</p>}
      </div>
    </div>
  );
}
