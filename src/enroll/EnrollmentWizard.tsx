// Modern multi-step enrollment wizard. Replaces the flat all-fields-at-once
// form with a guided flow: free sidebar navigation, draft autosave/resume,
// per-submit validation, a dev autofill button, and a final review.
import { useState } from "react";
import type { StudentRecord } from "../types";
import { emptyEnrollment, sampleEnrollment } from "./model";
import type { EnrollmentDetails } from "./model";
import {
  StudentStep, ParentsStep, FamilyContactsStep, SchoolsStep, MedicalStep, InfoStep, AttachmentsStep, ReviewStep,
} from "./steps";

const DRAFT_KEY = "enrollment_draft";

const STEPS = [
  { id: "student", label: "Student", Comp: StudentStep },
  { id: "parents", label: "Parents", Comp: ParentsStep },
  { id: "family", label: "Family & Contacts", Comp: FamilyContactsStep },
  { id: "schools", label: "Schools", Comp: SchoolsStep },
  { id: "medical", label: "Medical", Comp: MedicalStep },
  { id: "info", label: "Information", Comp: InfoStep },
  { id: "attachments", label: "Attachments", Comp: AttachmentsStep },
  { id: "review", label: "Review", Comp: ReviewStep },
] as const;

function loadDraft(): EnrollmentDetails {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyEnrollment();
    // Merge with defaults so a draft saved before a field existed still works.
    return { ...emptyEnrollment(), ...(JSON.parse(raw) as EnrollmentDetails) };
  } catch {
    return emptyEnrollment();
  }
}

interface Props {
  onSubmit: (record: StudentRecord) => void | Promise<void>;
}

export default function EnrollmentWizard({ onSubmit }: Props) {
  const [data, setData] = useState<EnrollmentDetails>(loadDraft);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  // Update a section and autosave the draft so the parent can resume later.
  function patch(part: Partial<EnrollmentDetails>) {
    setData((prev) => {
      const next = { ...prev, ...part };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }

  function autofill() {
    setData(sampleEnrollment()); // fill in memory only; not saved as a draft
  }

  function clearForm() {
    localStorage.removeItem(DRAFT_KEY);
    setData(emptyEnrollment());
    setStep(0);
  }

  function buildRecord(): StudentRecord {
    const s = data.student, p1 = data.parent1, c0 = data.contacts[0];
    return {
      id: crypto.randomUUID(),
      status: "draft",
      submittedAt: "",
      guardianName: `${p1.firstName} ${p1.lastName}`.trim(),
      guardianEmail: (s.email || p1.email || "").trim(),
      guardianPhone: p1.mobile,
      studentFirstName: s.given,
      studentLastName: s.last,
      dateOfBirth: s.birthDate,
      gradeLevel: s.enteringGrade,
      allergies: data.medical.allergies ? "Yes" : "None",
      emergencyContact: c0 ? `${c0.firstName} ${c0.lastName}`.trim() : "",
      emergencyPhone: c0 ? c0.phone : "",
      details: data,
    };
  }

  async function submit() {
    const s = data.student;
    if (!s.given || !s.last || !s.enteringGrade) { setError("Student first name, last name, and entering grade are required."); setStep(0); return; }
    if (!data.parent1.mobile) { setError("Parent 1 mobile is required."); setStep(1); return; }
    if (!data.submit.initials) { setError("Please initial on the Review step to submit."); setStep(7); return; }
    setError("");
    await onSubmit(buildRecord());
    localStorage.removeItem(DRAFT_KEY);
    setData(emptyEnrollment());
    setStep(0);
  }

  const Current = STEPS[step].Comp;

  return (
    <div className="wiz">
      {/* Sidebar — click any step (free navigation, like the original) */}
      <aside className="wiz-nav">
        {STEPS.map((st, i) => (
          <button key={st.id} className={i === step ? "wiz-tab wiz-tab--active" : "wiz-tab"} onClick={() => setStep(i)}>
            {st.label}
          </button>
        ))}
        <button className="wiz-autofill" onClick={autofill}>⚡ Autofill sample (dev)</button>
        <button className="wiz-autofill" onClick={clearForm}>🗑 Clear form</button>
      </aside>

      <section className="wiz-body">
        <Current data={data} patch={patch} />
        {error && <p className="auth-err">{error}</p>}
        <div className="actions">
          {step > 0 && <button className="btn btn--ghost" onClick={() => setStep((s) => s - 1)}>Back</button>}
          {step < STEPS.length - 1
            ? <button className="btn btn--primary" onClick={() => setStep((s) => s + 1)}>Next</button>
            : <button className="btn btn--primary" onClick={submit}>Submit enrollment</button>}
        </div>
        <p className="wiz-saved">Draft saved automatically.</p>
      </section>
    </div>
  );
}
