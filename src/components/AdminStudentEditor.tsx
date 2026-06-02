// Full admin student editor. Reuses the enrollment wizard's section
// components so admins can view and edit EVERY field a parent submitted,
// organized into tabs. Also works for legacy records that have no `details`
// yet (it derives a starting document from the core fields).
import { useState } from "react";
import type { StudentRecord, Status } from "../types";
import { emptyEnrollment } from "../enroll/model";
import type { EnrollmentDetails } from "../enroll/model";
import {
  StudentStep, ParentsStep, FamilyContactsStep, SchoolsStep, MedicalStep, InfoStep,
} from "../enroll/steps";
import FileManager from "./FileManager";

const TABS = [
  { id: "student", label: "Student", Comp: StudentStep },
  { id: "parents", label: "Parents", Comp: ParentsStep },
  { id: "family", label: "Family & Contacts", Comp: FamilyContactsStep },
  { id: "schools", label: "Schools", Comp: SchoolsStep },
  { id: "medical", label: "Medical", Comp: MedicalStep },
  { id: "info", label: "Information", Comp: InfoStep },
  { id: "attachments", label: "Attachments", Comp: null },
] as const;

const STATUSES: Status[] = ["submitted", "approved", "rejected"];

// Build an EnrollmentDetails from a record: use its details if present,
// otherwise seed one from the core fields so nothing shows up blank.
function deriveDetails(r: StudentRecord): EnrollmentDetails {
  if (r.details) return { ...emptyEnrollment(), ...r.details }; // merge defaults for older records
  const e = emptyEnrollment();
  const parts = (r.guardianName || "").trim().split(" ");
  e.student.given = r.studentFirstName;
  e.student.last = r.studentLastName;
  e.student.enteringGrade = r.gradeLevel;
  e.student.birthDate = r.dateOfBirth;
  e.student.email = r.guardianEmail;
  e.parent1.firstName = parts[0] || "";
  e.parent1.lastName = parts.slice(1).join(" ");
  e.parent1.email = r.guardianEmail;
  e.parent1.mobile = r.guardianPhone;
  return e;
}

// Keep the queryable core columns in sync with the edited document.
function syncCore(r: StudentRecord, d: EnrollmentDetails, status: Status): StudentRecord {
  const c0 = d.contacts[0];
  return {
    ...r,
    status,
    studentFirstName: d.student.given,
    studentLastName: d.student.last,
    gradeLevel: d.student.enteringGrade,
    dateOfBirth: d.student.birthDate,
    guardianName: `${d.parent1.firstName} ${d.parent1.lastName}`.trim(),
    guardianEmail: (d.student.email || d.parent1.email || r.guardianEmail || "").trim(),
    guardianPhone: d.parent1.mobile,
    allergies: d.medical.allergies ? "Yes" : "None",
    emergencyContact: c0 ? `${c0.firstName} ${c0.lastName}`.trim() : r.emergencyContact,
    emergencyPhone: c0 ? c0.phone : r.emergencyPhone,
    details: d,
  };
}

interface Props {
  record: StudentRecord;
  onSave: (updated: StudentRecord) => void;
  onClose: () => void;
  isNew?: boolean;
}

export default function AdminStudentEditor({ record, onSave, onClose, isNew = false }: Props) {
  const [details, setDetails] = useState<EnrollmentDetails>(() => deriveDetails(record));
  const [status, setStatus] = useState<Status>(record.status === "draft" ? "submitted" : record.status);
  const [tab, setTab] = useState(0);

  function patch(part: Partial<EnrollmentDetails>) {
    setDetails((prev) => ({ ...prev, ...part }));
  }

  const Current = TABS[tab].Comp;
  const title = `${details.student.given} ${details.student.last}`.trim() || "Student";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <div className="acct-status">
            <span className="ef-label">Status</span>
            <select className="ef-input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="expand" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-tabs">
          {TABS.map((t, i) => (
            <button key={t.id} className={i === tab ? "modal-tab modal-tab--active" : "modal-tab"} onClick={() => setTab(i)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-scroll">
          {TABS[tab].id === "attachments"
            ? <FileManager studentId={record.id} enabled={!isNew} />
            : Current && <Current data={details} patch={patch} />}
        </div>

        <div className="actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onSave(syncCore(record, details, status))}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
