// Admin payroll: pick a pay period, compute each employee's regular +
// overtime hours and gross pay, and print a summary.
import { useEffect, useState } from "react";
import * as api from "../api/repository";
import type { PayrollRow } from "../api/repository";

// Default to the last 14 days (a biweekly period ending today).
function iso(d: Date) { return d.toISOString().slice(0, 10); }
const TODAY = new Date();
const TWO_WEEKS_AGO = new Date(TODAY.getTime() - 13 * 86400000);

export default function Payroll() {
  const [start, setStart] = useState(iso(TWO_WEEKS_AGO));
  const [end, setEnd] = useState(iso(TODAY));
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function run() {
    setLoaded(false);
    const res = await api.getPayroll(start, end);
    setRows(res.rows);
    setLoaded(true);
  }
  useEffect(() => { void run(); /* eslint-disable-next-line */ }, []);

  const totalGross = rows.reduce((n, r) => n + r.grossPay, 0);

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
        <button className="btn btn--primary" style={{ alignSelf: "end" }} onClick={run}>Calculate</button>
        <button className="btn" style={{ alignSelf: "end" }} onClick={() => window.print()}>Print</button>
      </div>

      <div className="print-area">
        <h3 className="step-h">Payroll · {start} to {end}</h3>
        {!loaded ? <p className="empty">Calculating…</p> : rows.length === 0 ? (
          <p className="empty">No paid hours in this period.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Rate</th><th>Regular hrs</th><th>OT hrs</th><th>Gross pay</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td>{r.email}</td>
                  <td>{r.role}</td>
                  <td>${r.hourlyRate.toFixed(2)}</td>
                  <td>{r.regularHours.toFixed(2)}</td>
                  <td>{r.overtimeHours.toFixed(2)}</td>
                  <td>${r.grossPay.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={5}><strong>Total gross</strong></td>
                <td><strong>${totalGross.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="muted-count">Overtime = hours over 40 in a workweek, paid at 1.5×. Set hourly rates in the Users tab.</p>
      </div>
    </div>
  );
}
