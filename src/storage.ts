// Persistence layer. We save submitted records to localStorage so they
// survive a page refresh. Isolating this here means components never
// touch localStorage directly — they call these functions instead.
import type { StudentRecord } from "./types";

const KEY = "student_records";

export function loadRecords(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudentRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: StudentRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(records));
}
