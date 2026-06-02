import type { EnrollmentDetails } from "./enroll/model";

// The shape of all our data, defined once so every component agrees.

export type Status = "draft" | "submitted" | "approved" | "rejected";

// Three real user roles the app serves.
export type Role = "admin" | "teacher" | "parent";

export interface StudentRecord {
  id: string;
  status: Status;
  submittedAt: string; // ISO timestamp set when the parent submits

  // Guardian (also used as the parent's identity in the portal)
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;

  // Student
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;
  gradeLevel: string;

  // Medical / emergency
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  details?: EnrollmentDetails;
}

export function emptyRecord(): StudentRecord {
  return {
    id: crypto.randomUUID(),
    status: "draft",
    submittedAt: "",
    guardianName: "", guardianEmail: "", guardianPhone: "",
    studentFirstName: "", studentLastName: "", dateOfBirth: "", gradeLevel: "",
    allergies: "", emergencyContact: "", emergencyPhone: "",
  };
}
