// The multi-step parent form. It holds the in-progress record in state,
// validates the current step before letting you advance, and calls
// onSubmit() when the final review step is confirmed.
import { useState } from "react";
import type { StudentRecord } from "../types";
import { emptyRecord } from "../types";
import { validateStep, type Errors } from "./validation";
import Field from "./Field";

const STEPS = ["Guardian", "Student", "Emergency", "Review"];

interface Props {
  onSubmit: (record: StudentRecord) => void;
}

export default function OnboardingForm({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [record, setRecord] = useState<StudentRecord>(emptyRecord());
  const [errors, setErrors] = useState<Errors>({});

  // Update one field by name. Generic keeps it type-safe.
  function set<K extends keyof StudentRecord>(key: K, value: StudentRecord[K]) {
    setRecord((r) => ({ ...r, [key]: value }));
  }

  function next() {
    const e = validateStep(step, record);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() { setErrors({}); setStep((s) => Math.max(s - 1, 0)); }

  function submit() {
    onSubmit({ ...record, status: "submitted" });
    setRecord(emptyRecord());
    setStep(0);
  }

  return (
    <div className="form-card">
      {/* Step indicator */}
      <ol className="steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "step step--active" : i < step ? "step step--done" : "step"}>
            <span className="step-num">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="step-body">
          <Field label="Guardian full name" value={record.guardianName} error={errors.guardianName} onChange={(v) => set("guardianName", v)} />
          <Field label="Guardian email" type="email" value={record.guardianEmail} error={errors.guardianEmail} onChange={(v) => set("guardianEmail", v)} />
          <Field label="Guardian phone" value={record.guardianPhone} error={errors.guardianPhone} onChange={(v) => set("guardianPhone", v)} />
        </div>
      )}

      {step === 1 && (
        <div className="step-body">
          <Field label="Student first name" value={record.studentFirstName} error={errors.studentFirstName} onChange={(v) => set("studentFirstName", v)} />
          <Field label="Student last name" value={record.studentLastName} error={errors.studentLastName} onChange={(v) => set("studentLastName", v)} />
          <Field label="Date of birth" type="date" value={record.dateOfBirth} error={errors.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
          <Field label="Grade level" placeholder="e.g. 5" value={record.gradeLevel} error={errors.gradeLevel} onChange={(v) => set("gradeLevel", v)} />
        </div>
      )}

      {step === 2 && (
        <div className="step-body">
          <Field label="Allergies / medical notes" placeholder="None" value={record.allergies} onChange={(v) => set("allergies", v)} />
          <Field label="Emergency contact name" value={record.emergencyContact} error={errors.emergencyContact} onChange={(v) => set("emergencyContact", v)} />
          <Field label="Emergency contact phone" value={record.emergencyPhone} error={errors.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} />
        </div>
      )}

      {step === 3 && (
        <div className="step-body review">
          <h3>Review &amp; submit</h3>
          <p><strong>Guardian:</strong> {record.guardianName} · {record.guardianEmail} · {record.guardianPhone}</p>
          <p><strong>Student:</strong> {record.studentFirstName} {record.studentLastName} · DOB {record.dateOfBirth} · Grade {record.gradeLevel}</p>
          <p><strong>Emergency:</strong> {record.emergencyContact} · {record.emergencyPhone}</p>
          <p><strong>Allergies:</strong> {record.allergies || "None"}</p>
        </div>
      )}

      <div className="actions">
        {step > 0 && <button className="btn btn--ghost" onClick={back}>Back</button>}
        {step < STEPS.length - 1
          ? <button className="btn" onClick={next}>Next</button>
          : <button className="btn btn--primary" onClick={submit}>Submit application</button>}
      </div>
    </div>
  );
}
