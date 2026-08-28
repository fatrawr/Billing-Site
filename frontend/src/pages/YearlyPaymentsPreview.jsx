import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

export default function YearlyPaymentsPreview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const rows = state?.rows || [];
  const rangeDisplay = state?.rangeDisplay || "";

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@media print { @page { size: A4 portrait; margin: 15mm; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/menu/reports/yearly-payments");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (rows.length === 0) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">Yearly Payments Report</h1>
        <p className="dashboard__subtitle">No data to show — generate a report first.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu/reports/yearly-payments")}>
            Go to Report
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="report-preview">
      <div className="report-preview__toolbar no-print">
        <span className="report-preview__count">Yearly Payments Report — {rangeDisplay}</span>
        <div className="report-preview__actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print&nbsp;&nbsp;<span className="btn-exit__key">Ctrl+P</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/menu/reports/yearly-payments")}>
            Close&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
          </button>
        </div>
      </div>

      <div className="report-page report-page--portrait report-page--payments">
        <table className="report-table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "21%" }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={5} style={{ padding: 0, border: "none", background: "transparent" }}>
                <div className="report-masthead">
                  <span className="report-masthead__date">{dateStr}</span>
                  <span className="report-masthead__brand">{SOCIETY_NAME}</span>
                  <span className="report-masthead__time">{timeStr}</span>
                </div>
                <div className="report-masthead__subtitle report-masthead__subtitle--stacked">
                  <div className="report-masthead__subtitle-line1">Yearly Payments Report (Month wise)</div>
                  <div className="report-masthead__subtitle-line2">For: {rangeDisplay}</div>
                </div>
              </th>
            </tr>
            <tr>
              <th>Sr.</th>
              <th>Month</th>
              <th>
                <div className="report-table__col-head">Payment Due</div>
                <div className="report-table__col-subhead">(in million Rs.)</div>
              </th>
              <th>
                <div className="report-table__col-head">Payment</div>
                <div className="report-table__col-subhead">(in million Rs.)</div>                
              </th>
              <th>
                <div className="report-table__col-head">Difference/Arrear</div>
                <div className="report-table__col-subhead">(in Rs.)</div> 
              </th>             
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.month}>
                <td className="report-table__sr">{i + 1}</td>
                <td>{r.monthDisplay}</td>
                <td>{r.due.toFixed(2)}</td>
                <td>{r.made.toFixed(2)}</td>
                <td>{r.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}