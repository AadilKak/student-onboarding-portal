// The shape of all our data, defined once so every component agrees.

// A submission moves through these stages.
export type Status = "draft" | "submitted" | "approved" | "rejected";

// Which view the user is in. A real app would use real auth; here we
// just toggle between the two roles to demonstrate role-based views.
export type Role = "parent" | "admin";

// Everything one parent enters about one child.
export interface StudentRecord {
  id: string;            // unique id we generate
  status: Status;

  // Step 1 — guardian
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;

  // Step 2 — student
  studentFirstName: string;
  studentLastName: string;
  dateOfBirth: string;   // ISO date
  gradeLevel: string;

  // Step 3 — medical / emergency
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
}

// A blank record used to start a new form.
export function emptyRecord(): StudentRecord {
  return {
    id: crypto.randomUUID(),
    status: "draft",
    guardianName: "", guardianEmail: "", guardianPhone: "",
    studentFirstName: "", studentLastName: "", dateOfBirth: "", gradeLevel: "",
    allergies: "", emergencyContact: "", emergencyPhone: "",
  };
}
