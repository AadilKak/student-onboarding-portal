// Small reusable form controls used across every wizard step. Keeping them
// here means each step stays compact and the whole form looks consistent.
import type { ReactNode } from "react";

export function TextField({ label, value, onChange, type = "text", placeholder }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="ef">
      <span className="ef-label">{label}</span>
      <input className="ef-input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function TextArea({ label, value, onChange }:
  { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="ef ef--full">
      <span className="ef-label">{label}</span>
      <textarea className="ef-input" rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }:
  { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="ef">
      <span className="ef-label">{label}</span>
      <select className="ef-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value=""></option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

// Yes/No radio pair (the form uses these everywhere).
export function YesNo({ label, value, onChange }:
  { label: ReactNode; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="ef ef--full yesno">
      <span className="ef-label">{label}</span>
      <div className="yesno-opts">
        <label><input type="radio" checked={value} onChange={() => onChange(true)} /> Yes</label>
        <label><input type="radio" checked={!value} onChange={() => onChange(false)} /> No</label>
      </div>
    </div>
  );
}

export function CheckBox({ label, checked, onChange }:
  { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="ef-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}
