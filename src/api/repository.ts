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
  localStorage.removeItem("isOwner");
}

export function isOwner(): boolean {
  return localStorage.getItem("isOwner") === "1";
}

// Build headers, attaching the bearer token when we have one.
function authHeaders(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

// Wake a sleeping (free-tier) backend early, overlapping cold start with typing.
export function prewarm(): void {
  fetch(`${API}/health`).catch(() => {});
}

// ===== Auth =====
export interface AuthResult { ok: boolean; error?: string; role?: Role; }

export async function registerUser(email: string, password: string, name = ""): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST", headers: authHeaders(true),
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? "Could not create account." };
    setToken(data.token);
    localStorage.setItem("isOwner", data.isOwner ? "1" : "0");
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
export interface UserRow { id: string; email: string; name: string; title: string; phone: string; address: string; role: Role; hourlyRate: number; isOwner: boolean; }

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

export async function setUserName(id: string, name: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users/${id}/name`, {
      method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ name }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not update name." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function deleteAccount(id: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users/${id}`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok && res.status !== 204) return { ok: false, error: (await res.json()).error ?? "Could not remove." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function createAccount(opts: { name: string; username: string; pin: string; role: Role; hourlyRate: number; title?: string; phone?: string; address?: string }): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users`, {
      method: "POST", headers: authHeaders(true), body: JSON.stringify(opts),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not create account." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export interface PayrollRow { userId: string; email: string; name: string; role: Role; hourlyRate: number; regularHours: number; overtimeHours: number; unapprovedHours: number; grossPay: number; }
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
export interface TimeEntryRow { id: string; userId: string; email: string | null; name: string | null; clockIn: string | null; clockOut: string | null; open: boolean; approved: boolean; flag: string | null; }

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


// ===== Time-entry admin controls =====
export interface AuditRow { id: string; actor: string; action: string; detail: string; at: string; }

export async function approveEntry(id: string, approved: boolean): Promise<void> {
  await fetch(`${API}/time/entries/${id}/approve`, {
    method: "PATCH", headers: authHeaders(true), body: JSON.stringify({ approved }),
  });
}
export async function approveAllForUser(userId: string): Promise<void> {
  await fetch(`${API}/time/approve-all`, {
    method: "POST", headers: authHeaders(true), body: JSON.stringify({ userId }),
  });
}
export async function editTimeEntry(id: string, clockIn: string | null, clockOut: string | null): Promise<AuthResult> {
  try {
    const body: Record<string, string> = {};
    if (clockIn) body.clockIn = clockIn;
    if (clockOut) body.clockOut = clockOut;
    const res = await fetch(`${API}/time/entries/${id}`, {
      method: "PATCH", headers: authHeaders(true), body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not save." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await fetch(`${API}/time/entries/${id}`, { method: "DELETE", headers: authHeaders() });
}
export async function getAudit(): Promise<AuditRow[]> {
  try {
    const res = await fetch(`${API}/audit`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}


// ===== Feedback =====
export interface FeedbackRow { id: string; email: string; role: string; rating: number; message: string; at: string; }

export async function submitFeedback(rating: number, message: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/feedback`, {
      method: "POST", headers: authHeaders(true), body: JSON.stringify({ rating, message }),
    });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not send." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}

export async function listFeedback(): Promise<FeedbackRow[]> {
  try {
    const res = await fetch(`${API}/feedback`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}


// ===== Notes + profile =====
export interface NoteRow { id: string; subjectId: string; author: string; body: string; at: string; resolved: boolean; response: string; subjectName?: string; subjectEmail?: string; }

export async function addNote(body: string, subjectUserId?: string): Promise<AuthResult> {
  try {
    const payload: Record<string, string> = { body };
    if (subjectUserId) payload.subjectUserId = subjectUserId;
    const res = await fetch(`${API}/notes`, { method: "POST", headers: authHeaders(true), body: JSON.stringify(payload) });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not save note." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}
export async function resolveNote(id: string, resolved: boolean, response?: string): Promise<AuthResult> {
  try {
    const body: Record<string, unknown> = { resolved };
    if (response !== undefined) body.response = response;
    const res = await fetch(`${API}/notes/${id}`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(body) });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not update." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}
export async function deleteNote(id: string): Promise<void> {
  await fetch(`${API}/notes/${id}`, { method: "DELETE", headers: authHeaders() });
}
export async function myNotes(): Promise<NoteRow[]> {
  try { const r = await fetch(`${API}/notes/me`, { headers: authHeaders() }); return r.ok ? r.json() : []; }
  catch { return []; }
}
export async function listAllNotes(): Promise<NoteRow[]> {
  try { const r = await fetch(`${API}/notes`, { headers: authHeaders() }); return r.ok ? r.json() : []; }
  catch { return []; }
}
export async function listUserNotes(userId: string): Promise<NoteRow[]> {
  try { const r = await fetch(`${API}/users/${userId}/notes`, { headers: authHeaders() }); return r.ok ? r.json() : []; }
  catch { return []; }
}
export async function updateProfile(userId: string, fields: { name?: string; title?: string; phone?: string; address?: string }): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/users/${userId}/profile`, { method: "PATCH", headers: authHeaders(true), body: JSON.stringify(fields) });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not save." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}


// ===== Admin messaging =====
export interface MessageRow { id: string; sender: string; recipient: string; body: string; read: boolean; at: string; }

export async function listMessages(): Promise<MessageRow[]> {
  try { const r = await fetch(`${API}/messages`, { headers: authHeaders() }); return r.ok ? r.json() : []; }
  catch { return []; }
}
export async function sendMessage(to: string, body: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API}/messages`, { method: "POST", headers: authHeaders(true), body: JSON.stringify({ to, body }) });
    if (!res.ok) return { ok: false, error: (await res.json()).error ?? "Could not send." };
    return { ok: true };
  } catch { return { ok: false, error: "Cannot reach the server." }; }
}
export async function markMessagesRead(): Promise<void> {
  await fetch(`${API}/messages/read`, { method: "POST", headers: authHeaders() });
}
