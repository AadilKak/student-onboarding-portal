// Pure validation functions per step. Each returns a map of
// field name -> error message. An empty map means the step is valid.
import type { StudentRecord } from "../types";

export type Errors = Partial<Record<keyof StudentRecord, string>>;

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function validateStep(step: number, r: StudentRecord): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!r.guardianName.trim()) e.guardianName = "Required";
    if (!isEmail(r.guardianEmail)) e.guardianEmail = "Enter a valid email";
    if (!r.guardianPhone.trim()) e.guardianPhone = "Required";
  }
  if (step === 1) {
    if (!r.studentFirstName.trim()) e.studentFirstName = "Required";
    if (!r.studentLastName.trim()) e.studentLastName = "Required";
    if (!r.dateOfBirth) e.dateOfBirth = "Required";
    if (!r.gradeLevel.trim()) e.gradeLevel = "Required";
  }
  if (step === 2) {
    if (!r.emergencyContact.trim()) e.emergencyContact = "Required";
    if (!r.emergencyPhone.trim()) e.emergencyPhone = "Required";
  }
  return e;
}
