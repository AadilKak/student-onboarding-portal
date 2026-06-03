// The full create-account / login landing screen: school header, three tabs,
// the active tab's content, a shared-device toggle, and a footer.
import { useState } from "react";
import CreateAccount from "./CreateAccount";
import CompleteEnrollment from "./CompleteEnrollment";
import PasswordReset from "./PasswordReset";

type Tab = "enrollment" | "create" | "reset";

interface Props {
  onAuthenticated: (email: string, role: string) => void;
}

// School details — edit these for a different school.
const SCHOOL = {
  name: "Maplewood School",
  address: "1007 Rana Villa Ave, Camp Hill, PA 17011",
  phone: "(717) 737-5395",
  website: "www.maplewood.org",
};

export default function AuthPage({ onAuthenticated }: Props) {
  const [tab, setTab] = useState<Tab>("create");
  const [shared, setShared] = useState(false);

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="auth-contact auth-contact--left">{SCHOOL.address}</div>
        <div className="auth-brand">
          {/* Simple logo mark (book + pencil) */}
          <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 6 L40 20 H24 Z" fill="#f5b301" />
            <rect x="30" y="18" width="4" height="14" fill="#1f4e79" />
            <path d="M10 40 q22 -10 44 0 v10 q-22 -10 -44 0 Z" fill="#1f4e79" />
            <path d="M32 40 v10" stroke="#fff" strokeWidth="1.5" />
          </svg>
          <strong className="auth-school">{SCHOOL.name}</strong>
        </div>
        <div className="auth-contact auth-contact--right">{SCHOOL.phone}<br />{SCHOOL.website}</div>
      </header>

      <nav className="auth-tabs">
        <button className={tab === "enrollment" ? "auth-tab auth-tab--active" : "auth-tab"} onClick={() => setTab("enrollment")}>Complete Enrollment</button>
        <button className={tab === "create" ? "auth-tab auth-tab--active" : "auth-tab"} onClick={() => setTab("create")}>Create Account</button>
        <button className={tab === "reset" ? "auth-tab auth-tab--active" : "auth-tab"} onClick={() => setTab("reset")}>Password Reset</button>
      </nav>

      {tab === "create" && <CreateAccount onRegister={onAuthenticated} />}
      {tab === "enrollment" && <CompleteEnrollment schoolName={SCHOOL.name} onLogin={onAuthenticated} />}
      {tab === "reset" && <PasswordReset />}

      <div className="auth-shared">
        <span>Is this a shared/public device?</span>
        <div className="toggle">
          <button className={shared ? "toggle-opt toggle-opt--on" : "toggle-opt"} onClick={() => setShared(true)}>Yes</button>
          <button className={!shared ? "toggle-opt toggle-opt--on" : "toggle-opt"} onClick={() => setShared(false)}>No</button>
        </div>
      </div>

      <footer className="auth-footer">
        By using these services you agree to the Terms of Service and Privacy Policy.
      </footer>
    </div>
  );
}
