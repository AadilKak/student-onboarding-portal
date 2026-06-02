// An editable student profile panel. Admins open this from the roster to
// view and update a student's full record.
import { useState } from "react";
import type { StudentRecord } from "../types";
import Field from "./Field";

interface Props {
  record: StudentRecord;
  onSave: (updated: StudentRecord) => void;
  onClose: () => void;
}

export default function StudentProfile({ record, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<StudentRecord>(record);

  function set<K extends keyof StudentRecord>(key: K, value: StudentRecord[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{draft.studentFirstName || draft.studentLastName ? `${draft.studentFirstName} ${draft.studentLastName}` : "New Student"}</h2>
          <button className="expand" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="step-body">
          <div className="two-col">
            <Field label="First name" value={draft.studentFirstName} onChange={(v) => set("studentFirstName", v)} />
            <Field label="Last name" value={draft.studentLastName} onChange={(v) => set("studentLastName", v)} />
          </div>
          <div className="two-col">
            <Field label="Date of birth" type="date" value={draft.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} />
            <Field label="Grade level" value={draft.gradeLevel} onChange={(v) => set("gradeLevel", v)} />
          </div>
          <Field label="Guardian name" value={draft.guardianName} onChange={(v) => set("guardianName", v)} />
          <div className="two-col">
            <Field label="Guardian email" value={draft.guardianEmail} onChange={(v) => set("guardianEmail", v)} />
            <Field label="Guardian phone" value={draft.guardianPhone} onChange={(v) => set("guardianPhone", v)} />
          </div>
          <Field label="Allergies / medical" value={draft.allergies} onChange={(v) => set("allergies", v)} />
          <div className="two-col">
            <Field label="Emergency contact" value={draft.emergencyContact} onChange={(v) => set("emergencyContact", v)} />
            <Field label="Emergency phone" value={draft.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} />
          </div>
        </div>
        <div className="actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onSave(draft)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
