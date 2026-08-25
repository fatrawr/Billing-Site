import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

function formatMonthName(yyyymm) {
  if (!yyyymm) return "";
  const yyyy = Math.floor(yyyymm / 100);
  const mm = yyyymm % 100;
  const d = new Date(yyyy, mm - 1, 1);
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatRate(configCode, value) {
  switch (configCode) {
    case "LP":
      return `${value}%`;
    case "OM":
      return `${value}`;
    default: // CM, SC, UR — unit rates
      return `Rs. ${value}`;
  }
}

export default function MonthlyRatesPreview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const month = state?.month;
  const rows = state?.rows || [];

  // Portrait override — same trick as the (landscape) consumers report:
  // swap the default @page while this component is mounted instead of
  // assigning a named @page, to avoid Chrome inserting a blank leading
  // page when it switches page contexts mid-document.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@media print { @page { size: A4 portrait; margin: 15mm; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/menu/reports/monthly-rates");
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
        <h1 className="dashboard__title">Monthly Rates</h1>
        <p className="dashboard__subtitle">No data to show — generate a report first.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu/reports/monthly-rates")}>
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
        <span className="report-preview__count">Monthly Rates — {formatMonthName(month)}</span>
        <div className="report-preview__actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print&nbsp;&nbsp;<span className="btn-exit__key">Ctrl+P</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/menu/reports/monthly-rates")}>
            Close&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
          </button>
        </div>
      </div>

      <div className="report-page report-page--portrait report-page--rates">
        <table className="report-table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "60%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={3} style={{ padding: 0, border: "none", background: "transparent" }}>
                <div className="report-masthead">
                  <span className="report-masthead__date">{dateStr}</span>
                  <span className="report-masthead__brand">{SOCIETY_NAME}</span>
                  <span className="report-masthead__time">{timeStr}</span>
                </div>
                <div className="report-masthead__subtitle report-masthead__subtitle--stacked">
                  <div className="report-masthead__subtitle-line1">Monthly Rates Reports</div>
                  <div className="report-masthead__subtitle-line2">For: {formatMonthName(month)}</div>
                </div>
              </th>
            </tr>
            <tr>
              <th>Sr.</th>
              <th>Description</th>
              <th>Rates</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.configCode}>
                <td className="report-table__sr">{i + 1}</td>
                <td className="report-table__desc">{r.configDesc}</td>
                <td>{formatRate(r.configCode, r.configValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}