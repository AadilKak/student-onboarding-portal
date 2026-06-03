// The "Create Account" form. Shows live password requirements, a confirm
// field, and show/hide toggles. Calls onRegister with the email when valid.
import { useState } from "react";
import { checkPassword, categoriesMet, isPasswordValid } from "./password";
import Requirement from "./Requirement";
import * as api from "../api/repository";

interface Props {
  onRegister: (email: string, role: string) => void;
}

export default function CreateAccount({ onRegister }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const checks = checkPassword(password);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const match = password.length > 0 && password === confirm;
  const canSubmit = emailValid && isPasswordValid(password) && match;

  async function submit() {
    setTouched(true);
    if (!canSubmit) return;
    const res = await api.registerUser(email, password, fullName);
    if (res.ok) onRegister(email, res.role ?? "parent");
    else setError(res.error ?? "Could not create account.");
  }

  return (
    <div className="auth-card">
      <h2 className="auth-title">Welcome to the online enrollment site for Maplewood School</h2>
      <p className="auth-sub">If this is your first time here, you will need to register using your email address</p>

      <div className="auth-grid">
        {/* Left: the form */}
        <div className="auth-form">
          <label className="auth-label">Full Name</label>
          <input className="auth-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label className="auth-label">Email Address</label>
          <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {touched && !emailValid && <span className="auth-err">Enter a valid email</span>}

          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <input className="auth-input" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label="Toggle password">
              {showPw ? "🙈" : "👁"}
            </button>
          </div>

          <label className="auth-label">Confirm Password</label>
          <div className="auth-input-wrap">
            <input className="auth-input" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button type="button" className="auth-eye" onClick={() => setShowConfirm((s) => !s)} aria-label="Toggle confirm password">
              {showConfirm ? "🙈" : "👁"}
            </button>
          </div>
          {touched && !match && <span className="auth-err">Passwords do not match</span>}

          {error && <span className="auth-err">{error}</span>}
          <button className="btn btn--primary auth-submit" onClick={submit} disabled={!canSubmit}>Register</button>
        </div>

        {/* Right: live requirements */}
        <div className="auth-reqs">
          <p className="reqs-head">Password Requirements:</p>
          <ul className="req-list">
            <Requirement met={checks.length}>At least 6 characters</Requirement>
          </ul>
          <p className="reqs-head">Include 3 of the following:</p>
          <ul className="req-list">
            <Requirement met={checks.upper}>UPPERCASE letters</Requirement>
            <Requirement met={checks.lower}>lowercase letters</Requirement>
            <Requirement met={checks.number}>numbers (1234…)</Requirement>
            <Requirement met={checks.symbol}>symbols (@#$%…)</Requirement>
          </ul>
          <p className="reqs-count">{categoriesMet(checks)} of 4 categories met</p>
        </div>
      </div>
    </div>
  );
}
