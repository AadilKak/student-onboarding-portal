// Admin payroll: pick a pay period, see every employee's regular + overtime
// hours and gross pay, or drill into a single person's shift-by-shift hours.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { PayrollRow, TimeEntryRow } from "../api/repository";

function iso(d: Date) { return d.toISOString().slice(0, 10); }
const TODAY = new Date();
const TWO_WEEKS_AGO = new Date(TODAY.getTime() - 13 * 86400000);

function fmt(isoStr: string | null): string {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function hrs(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

export default function Payroll() {
  const [start, setStart] = useState(iso(TWO_WEEKS_AGO));
  const [end, setEnd] = useState(iso(TODAY));
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntryRow[]>([]);
  const [selected, setSelected] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);

  async function run() {
    setLoaded(false);
    const [pay, entries] = await Promise.all([api.getPayroll(start, end), api.allTimeEntries()]);
    setRows(pay.rows);
    setAllEntries(entries);
    setLoaded(true);
  }
  useEffect(() => { void run(); /* eslint-disable-next-line */ }, []);

  function csvCell(v: string | number): string {
    const str = String(v);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }
  function download(name: string, content: string) {
    // Prepend BOM so Excel reads UTF-8 correctly.
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  function exportExcel() {
    const lines: string[] = [];
    lines.push(`Payroll,${start} to ${end}`);
    lines.push("");
    lines.push(["Employee", "Role", "Rate", "Regular hrs", "OT hrs", "Unapproved hrs", "Gross pay"].join(","));
    for (const r of visibleRows) {
      lines.push([r.name || r.email, r.role, r.hourlyRate.toFixed(2), r.regularHours.toFixed(2),
        r.overtimeHours.toFixed(2), r.unapprovedHours.toFixed(2), r.grossPay.toFixed(2)].map(csvCell).join(","));
    }
    if (selected === "all") {
      lines.push(["", "", "", "", "Total gross", totalGross.toFixed(2)].map(csvCell).join(","));
    } else {
      lines.push("");
      lines.push(`Shifts,${rows.find((r) => r.userId === selected)?.name || selected}`);
      lines.push(["Clock in", "Clock out", "Hours"].join(","));
      for (const e of personShifts) {
        lines.push([fmt(e.clockIn), fmt(e.clockOut), hrs(e.clockIn, e.clockOut).toFixed(2)].map(csvCell).join(","));
      }
    }
    const who = selected === "all" ? "all" : (rows.find((r) => r.userId === selected)?.name || "employee").replace(/\s+/g, "_");
    download(`payroll_${who}_${start}_to_${end}.csv`, lines.join("\n"));
  }

  const visibleRows = selected === "all" ? rows : rows.filter((r) => r.userId === selected);
  const totalGross = visibleRows.reduce((n, r) => n + r.grossPay, 0);

  // Shift-by-shift detail for one selected employee, within the period.
  const startD = new Date(start), endD = new Date(end + "T23:59:59");
  const personShifts = selected === "all" ? [] : allEntries.filter((e) => {
    if (e.userId !== selected || !e.clockIn || !e.clockOut) return false;
    const d = new Date(e.clockIn);
    return d >= startD && d <= endD;
  });

  return (
    <div>
      <div className="filterbar no-print">
        <label className="ef" style={{ marginBottom: 0 }}>
          <span className="ef-label">Pay period start</span>
          <input className="ef-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="ef" style={{ marginBottom: 0 }}>
          <span className="ef-label">End</span>
          <input className="ef-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="ef" style={{ marginBottom: 0 }}>
          <span className="ef-label">Employee</span>
          <select className="ef-input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="all">All employees</option>
            {rows.map((r) => <option key={r.userId} value={r.userId}>{r.name || r.email}</option>)}
          </select>
        </label>
        <button className="btn btn--primary" style={{ alignSelf: "end" }} onClick={run}>Calculate</button>
        <button className="btn btn--ok" style={{ alignSelf: "end" }} onClick={exportExcel}>Download Excel</button>
        <button className="btn no-print" style={{ alignSelf: "end" }} onClick={() => window.print()}>Print</button>
      </div>

      <div className="print-area">
        <h3 className="step-h">Payroll · {start} to {end}{selected !== "all" && ` · ${rows.find((r) => r.userId === selected)?.name || rows.find((r) => r.userId === selected)?.email || ""}`}</h3>
        {!loaded ? <p className="empty">Calculating…</p> : visibleRows.length === 0 ? (
          <p className="empty">No paid hours in this period.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Rate</th><th>Regular hrs</th><th>OT hrs</th><th>Unapproved</th><th>Gross pay</th></tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => (
                <tr key={r.userId}>
                  <td>{r.name || r.email}</td><td>{r.role}</td><td>${r.hourlyRate.toFixed(2)}</td>
                  <td>{r.regularHours.toFixed(2)}</td><td>{r.overtimeHours.toFixed(2)}</td>
                  <td>{r.unapprovedHours > 0 ? <span className="badge badge--pending">{r.unapprovedHours.toFixed(2)} h</span> : "—"}</td>
                  <td>${r.grossPay.toFixed(2)}</td>
                </tr>
              ))}
              {selected === "all" && (
                <tr className="total-row">
                  <td colSpan={6}><strong>Total gross</strong></td>
                  <td><strong>${totalGross.toFixed(2)}</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Per-person shift breakdown */}
        {selected !== "all" && loaded && (
          <>
            <h3 className="step-h">Shifts for {rows.find((r) => r.userId === selected)?.name || rows.find((r) => r.userId === selected)?.email}</h3>
            {personShifts.length === 0 ? (
              <p className="empty">No shifts in this period.</p>
            ) : (
              <table className="table">
                <thead><tr><th>Clock in</th><th>Clock out</th><th>Hours</th></tr></thead>
                <tbody>
                  {personShifts.map((e) => (
                    <tr key={e.id}>
                      <td>{fmt(e.clockIn)}</td><td>{fmt(e.clockOut)}</td><td>{hrs(e.clockIn, e.clockOut).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2}><strong>Total hours</strong></td>
                    <td><strong>{personShifts.reduce((n, e) => n + hrs(e.clockIn, e.clockOut), 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            )}
          </>
        )}

        <p className="muted-count">Only <strong>approved</strong> hours are paid. Unapproved hours are shown for review — approve them in the Time Entries tab. Overtime = hours over 40 in a workweek at 1.5×.</p>
      </div>
    </div>
  );
}
