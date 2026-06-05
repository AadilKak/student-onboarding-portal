// Simple username + PIN login. No account creation — admins create accounts.
import { useState } from "react";
import * as api from "../api/repository";

interface Props { onLogin: (username: string, role: string) => void; }

export default function MiniLogin({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!username || !pin) { setError("Enter your username and PIN."); return; }
    setBusy(true); setError("");
    const res = await api.loginUser(username, pin);
    setBusy(false);
    if (res.ok) onLogin(username, res.role ?? "contractor");
    else setError(res.error ?? "Login failed.");
  }

  return (
    <div className="tc-login">
      <div className="tc-login-card">
        <h1 className="tc-title">Al-Huda School Time Clock</h1>
        <p className="tc-sub">Log in to clock in or out.</p>
        <label className="tc-label">Username</label>
        <input className="tc-input" value={username} autoFocus
          onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <label className="tc-label">PIN</label>
        <input className="tc-input" type="password" value={pin}
          onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {error && <p className="auth-err">{error}</p>}
        <button className="btn btn--primary tc-loginbtn" onClick={submit} disabled={busy}>
          {busy ? "…" : "Log in"}
        </button>
        <div className="tc-demo">
          Demo:
          <button type="button" className="linklike" onClick={() => { setUsername("admin@demo.school"); setPin("Demo1234!"); }}>admin</button>
          <span> · </span>
          <button type="button" className="linklike" onClick={() => { setUsername("lead@demo.school"); setPin("Demo1234!"); }}>lead</button>
          <span> · </span>
          <button type="button" className="linklike" onClick={() => { setUsername("contractor"); setPin("1234"); }}>contractor</button>
        </div>
      </div>
    </div>
  );
}
