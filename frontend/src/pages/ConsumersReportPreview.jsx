import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { notifyError } from "../lib/toast.js";

// How many *physical table rows* we deliberately fit per printed page
// (not consumer records — a consumer with 3 meters now takes 4 rows:
// one info row + one row per meter). Records are packed whole onto a
// page; if a record wouldn't fully fit, it moves entirely to the next
// page rather than splitting across the page break. Tune this if real
// printouts show it's leaving too much/too little room.
const ROWS_PER_PAGE = 24;
const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ReportTableHead({ dateStr, timeStr, pageNum, totalPages }) {
  return (
    <thead>
      <tr>
        <th colSpan={7} style={{ padding: 0, border: "none", background: "transparent" }}>
          <div className="report-masthead">
            <span className="report-masthead__date">{dateStr}</span>
            <span className="report-masthead__brand">{SOCIETY_NAME}</span>
            <span className="report-masthead__time">{timeStr}</span>
          </div>
          <div className="report-masthead__subtitle">
            <span className="report-masthead__subtitle-footnote">
              * MF = Multiplying Factor &nbsp;·&nbsp; TOP = Type of Property
            </span>
            <span className="report-masthead__subtitle-text">
              List of Consumers <span>with meter details</span>
            </span>
            <span className="report-masthead__subtitle-page">Page {pageNum} of {totalPages}</span>
          </div>
        </th>
      </tr>
      <tr>
        <th rowSpan={2}>Sr.</th>
        <th rowSpan={2}>Reference No.</th>
        <th>Name</th>
        <th>Address</th>
        <th>Connection Date</th>
        <th>State</th>
        <th>MF*</th>
      </tr>
      <tr>
        <th>Meter No.</th>
        <th>Status</th>
        <th>Phase</th>
        <th>TOP*</th>
        <th>Plot Size</th>
      </tr>
    </thead>
  );
}

export default function ConsumersReportPreview() {
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState(null); // null = loading
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getConsumersReport({});
        setConsumers(data.consumers);
      } catch (err) {
        notifyError("Could not load report", err.message);
        setConsumers([]);
      }
    })();
  }, []);

  // This report prints landscape while every other printed page in the
  // app (bills) is portrait. Rather than assigning a named CSS @page
  // (which makes Chrome insert a blank leading page when it switches
  // page contexts mid-document), we swap the *default* @page definition
  // only while this component is mounted, then restore it on unmount.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "@media print { @page { size: A4 landscape; margin: 10mm 12mm; } }";
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/menu/reports");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const dateStr = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (consumers === null) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">List of Consumers</h1>
        <p className="dashboard__subtitle">Loading report…</p>
      </div>
    );
  }

  if (consumers.length === 0) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">List of Consumers</h1>
        <p className="dashboard__subtitle">No consumers found.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu/reports")}>
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  // Summary counts for the footer.
  let activeMeters = 0;
  let inactiveMeters = 0;
  let deletedConsumers = 0;
  for (const c of consumers) {
    if (c.state === "Disconnected") deletedConsumers += 1;
    for (const m of c.meters || []) {
      if (m.status === "Active") activeMeters += 1;
      if (m.status === "Inactive") inactiveMeters += 1;
    }
  }

  // Pack whole consumer records onto pages, keyed by how many physical
  // <tr> rows each record needs (1 info row + one row per meter, or 1
  // placeholder row if the consumer has no meters at all). A record is
  // never split across the page boundary — if it doesn't fit in the
  // remaining space, the whole thing moves to the next page.
  let srCounter = 0;
  const pages = [];
  let current = [];
  let currentRows = 0;
  for (const c of consumers) {
    const meterRows = Math.max((c.meters || []).length, 1);
    const recordRows = 1 + meterRows;
    if (currentRows + recordRows > ROWS_PER_PAGE && current.length > 0) {
      pages.push(current);
      current = [];
      currentRows = 0;
    }
    srCounter += 1;
    current.push({ consumer: c, sr: srCounter });
    currentRows += recordRows;
  }
  if (current.length > 0) pages.push(current);

  return (
    <div className="report-preview">
      <div className="report-preview__toolbar no-print">
        <span className="report-preview__count">
          List of Consumers ({consumers.length} record{consumers.length === 1 ? "" : "s"})
        </span>
        <div className="report-preview__actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print&nbsp;&nbsp;<span className="btn-exit__key">Ctrl+P</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/menu/reports")}>
            Close&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
          </button>
        </div>
      </div>

      <div className="report-page">
        {pages.map((pageEntries, pageIdx) => (
          <div
              className={`report-print-page${pageIdx === pages.length - 1 ? " report-print-page--last" : ""}`}
              key={pageIdx}>
            <table className="report-table">
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "27%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <ReportTableHead dateStr={dateStr} timeStr={timeStr} pageNum={pageIdx + 1} totalPages={pages.length} />

              {pageEntries.map(({ consumer: c, sr }) => {
                const meters = c.meters && c.meters.length > 0 ? c.meters : [null];
                const totalRows = meters.length + 1;
                return (
                  <tbody className="report-table__record" key={c.referenceNo}>
                    <tr>
                      <td rowSpan={totalRows} className="report-table__sr">{sr}</td>
                      <td rowSpan={totalRows} className="report-table__ref">{c.referenceNo}</td>
                      <td>{c.name}</td>
                      <td>{c.address}</td>
                      <td>{formatDate(c.connectionDate)}</td>
                      <td>{c.state}</td>
                      <td>{c.multiplyingFactor ?? "—"}</td>
                    </tr>
                    {meters.map((m, mi) => (
                      <tr className="report-table__meter-row" key={mi}>
                        <td>{m?.meterNumber ?? "—"}</td>
                        <td>{m?.status ?? "—"}</td>
                        <td>{m?.phase ?? "—"}</td>
                        <td>{m?.typeOfProperty ?? "—"}</td>
                        <td>{m?.plotSize ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        ))}

        <div className="report-summary">
          <h2 className="report-summary__title">Summary</h2>
          <div className="report-summary__list">
            <div className="report-summary__row">
              <span className="report-summary__label">Total Active Meters</span>
              <span className="report-summary__value">{activeMeters}</span>
            </div>
            <div className="report-summary__row">
              <span className="report-summary__label">Total Inactive Meters</span>
              <span className="report-summary__value">{inactiveMeters}</span>
            </div>
            <div className="report-summary__row">
              <span className="report-summary__label">Total Deleted Consumers</span>
              <span className="report-summary__value">{deletedConsumers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}