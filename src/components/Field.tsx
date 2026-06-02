// A reusable labeled input. Used on every step so all fields look and
// behave consistently. Shows an error message underneath when present.
interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
  placeholder?: string;
}

export default function Field({ label, value, onChange, type = "text", error, placeholder }: Props) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className={error ? "field-input field-input--error" : "field-input"}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
