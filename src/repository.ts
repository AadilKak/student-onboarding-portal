// Data layer — now backed by the Flask API instead of localStorage.
// Because every component calls these functions (never `fetch` directly),
// this is the ONLY file that changed when we moved to the real backend.
import type { StudentRecord, Status, Role } from "../types";

// Where the API lives. Override at build time with VITE_API_URL if needed.
const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// --- token storage (the JWT returned by login/register) ---
const TOKEN_KEY = "token";
export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}
function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Build headers, attaching the bearer token when we have one.
function authHeaders(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

// ===== Auth =====
export interface AuthResult { ok: boolean; error?: string; role?: Role; }

export async function registerUser(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Could not create account." };
    setToken(data.token);
    return { ok: true, role: data.role as Role };
  } catch {
    return { ok: false, error: "Cannot reach the server. Is the backend running?" };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Login failed." };
    setToken(data.token);
    return { ok: true, role: data.role as Role };
  } catch {
    return { ok: false, error: "Cannot reach the server. Is the backend running?" };
  }
}

// ===== Students / applications =====
export async function listStudents(): Promise<StudentRecord[]> {
  try {
    const res = await fetch(`${API}/students`, { headers: authHeaders() });
    if (!res.ok) return []; // e.g. 401 before login
    return res.json();
  } catch {
    return [];
  }
}

export async function createApplication(record: StudentRecord): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/applications`, {
      method: "POST", headers: authHeaders(true), body: JSON.stringify(record),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not submit." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function createStudent(record: StudentRecord): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/students`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ ...record, status: "approved" }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not add student." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function updateStudent(updated: StudentRecord): Promise<void> {
  await fetch(`${API}/students/${updated.id}`, {
    method: "PUT", headers: authHeaders(true), body: JSON.stringify(updated),
  });
}

export async function setStatus(id: string, status: Status): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/students/${id}/status`, {
      method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not update status." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function deleteStudent(id: string): Promise<void> {
  await fetch(`${API}/students/${id}`, { method: "DELETE", headers: authHeaders() });
}

// Parent portal: the logged-in parent's own children (scoped server-side by
// the JWT email claim). The email argument is kept for signature compatibility.
export async function listByGuardianEmail(_email: string): Promise<StudentRecord[]> {
  try {
    const res = await fetch(`${API}/parents/me/students`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ===== File attachments (real storage) =====
export interface FileMeta { id: string; studentId: string; filename: string; contentType: string; size: number; uploadedAt: string; }

export async function listFiles(studentId: string): Promise<FileMeta[]> {
  try {
    const res = await fetch(`${API}/students/${studentId}/files`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function uploadFile(studentId: string, file: File): Promise<AuthResult> {
  try {
    const form = new FormData();
    form.append("file", file);
    // NOTE: don't set Content-Type; the browser sets the multipart boundary.
    const res = await fetch(`${API}/students/${studentId}/files`, {
      method: "POST", headers: authHeaders(), body: form,
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Upload failed." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function deleteFile(fileId: string): Promise<void> {
  await fetch(`${API}/files/${fileId}`, { method: "DELETE", headers: authHeaders() });
}

// Download via authed fetch -> blob, so the JWT is sent (an <a href> can't).
export async function downloadFile(fileId: string, filename: string): Promise<void> {
  const res = await fetch(`${API}/files/${fileId}`, { headers: authHeaders() });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ===== User management (admin only) =====
export interface UserRow { id: string; email: string; role: Role; hourlyRate: number; }

export async function listUsers(): Promise<UserRow[]> {
  try {
    const res = await fetch(`${API}/users`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function setUserRate(id: string, hourlyRate: number): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users/${id}/rate`, {
      method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ hourlyRate }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not update rate." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export interface PayrollRow { userId: string; email: string; role: Role; hourlyRate: number; regularHours: number; overtimeHours: number; grossPay: number; }
export interface PayrollResult { start: string; end: string; rows: PayrollRow[]; }

export async function getPayroll(start: string, end: string): Promise<PayrollResult> {
  try {
    const res = await fetch(`${API}/payroll?start=${start}&end=${end}`, { headers: authHeaders() });
    if (!res.ok) return { start, end, rows: [] };
    return res.json();
  } catch { return { start, end, rows: [] }; }
}

export async function setUserRole(id: string, role: Role): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users/${id}/role`, {
      method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ role }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not update role." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

// ===== Time clock =====
export interface TimeEntryRow { id: string; userId: string; email: string | null; clockIn: string | null; clockOut: string | null; open: boolean; }

export async function clockIn(): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/time/clock-in`, { method: "POST", headers: authHeaders() });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not clock in." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function clockOut(): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/time/clock-out`, { method: "POST", headers: authHeaders() });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not clock out." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function myTimeEntries(): Promise<TimeEntryRow[]> {
  try {
    const res = await fetch(`${API}/time/me`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function allTimeEntries(): Promise<TimeEntryRow[]> {
  try {
    const res = await fetch(`${API}/time/entries`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}
