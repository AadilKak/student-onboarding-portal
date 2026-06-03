// "Complete Enrollment" tab: a login form for parents who already created an
// account, so they can start a new application or continue an existing one.
import { useState } from "react";
import * as api from "../api/repository";

interface Props {
  schoolName: string;
  onLogin: (email: string, role: string) => void;
}

export default function CompleteEnrollment({ schoolName, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = emailValid && password.length > 0;

  async function submit() {
    setTouched(true);
    if (!canSubmit) return;
    const res = await api.loginUser(email, password);
    if (res.ok) onLogin(email, res.role ?? "parent");
    else setError(res.error ?? "Login failed.");
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">If your account has been created, you can login here to start new student applications</h2>
      <h2 className="auth-title">Or you can continue a previously started application</h2>

      <div className="auth-single">
        <label className="auth-label">School</label>
        <p className="auth-school-name">{schoolName}</p>

        <label className="auth-label">Email Address</label>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {touched && !emailValid && <span className="auth-err">Enter a valid email</span>}

        <label className="auth-label">Password</label>
        <div className="auth-input-wrap">
          <input className="auth-input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password">{showPw ? "🙈" : "👁"}</button>
        </div>

        {touched && error && <span className="auth-err">{error}</span>}
        <div className="auth-center">
          <button className="btn btn--primary auth-pill-btn" onClick={submit} disabled={!canSubmit}>Login</button>
        </div>
        <div className="auth-demo">
          Quick test login:
          <button type="button" className="linklike" onClick={() => { setEmail("admin@demo.school"); setPassword("Demo1234!"); }}>admin</button>
          <span> · </span>
          <button type="button" className="linklike" onClick={() => { setEmail("teacher@demo.school"); setPassword("Demo1234!"); }}>teacher</button>
          <span> · </span>
          <button type="button" className="linklike" onClick={() => { setEmail("staff@demo.school"); setPassword("Demo1234!"); }}>staff</button>
          <span> · </span>
          <button type="button" className="linklike" onClick={() => { setEmail("parent@demo.school"); setPassword("Demo1234!"); }}>parent</button>
        </div>
      </div>
    </div>
  );
}
