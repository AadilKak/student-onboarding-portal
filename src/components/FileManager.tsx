// Reusable attachments manager backed by the real file endpoints. Lists a
// student's files and supports upload, download, and delete.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { FileMeta } from "../api/repository";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  studentId: string;
  // When false (e.g. a not-yet-saved new student), uploads are disabled.
  enabled?: boolean;
}

export default function FileManager({ studentId, enabled = true }: Props) {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() { setFiles(await api.listFiles(studentId)); }
  useEffect(() => { if (enabled) void refresh(); }, [studentId, enabled]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    const res = await api.uploadFile(studentId, file);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? "Upload failed."); return; }
    await refresh();
  }

  async function remove(id: string) {
    await api.deleteFile(id);
    await refresh();
  }

  if (!enabled) {
    return <p className="empty">Save the student first, then re-open to attach files.</p>;
  }

  return (
    <>
      <h3 className="step-h">File Attachments</h3>
      {files.length === 0 ? (
        <p className="empty">No files uploaded yet.</p>
      ) : (
        <table className="table">
          <thead><tr><th>File</th><th>Type</th><th>Size</th><th></th></tr></thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td><button className="linklike" onClick={() => api.downloadFile(f.id, f.filename)}>{f.filename}</button></td>
                <td>{f.contentType || "—"}</td>
                <td>{humanSize(f.size)}</td>
                <td><button className="btn btn--small btn--bad" onClick={() => remove(f.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <p className="auth-err">{error}</p>}
      <label className="btn btn--primary upload-btn">
        {busy ? "Uploading…" : "Upload File"}
        <input type="file" hidden onChange={onPick} disabled={busy} />
      </label>
    </>
  );
}
