import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Clock } from "../components/Clock.jsx";
import { notifyError } from "../lib/toast.js";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
    if (c.state === "Deleted") deletedConsumers += 1;
    if (c.meter?.status === "Active") activeMeters += 1;
    if (c.meter?.status === "Inactive") inactiveMeters += 1;
  }

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
          <thead>
            <tr>
              <th colSpan={7} style={{ padding: 0, border: "none", background: "transparent" }}>
                <div className="report-masthead">
                  <span className="report-masthead__date">{dateStr}</span>
                  <span className="report-masthead__brand">{SOCIETY_NAME}</span>
                  <span className="report-masthead__time">{timeStr}</span>
                </div>
                <div className="report-masthead__subtitle">
                  <p className="report-footnote">* MF = Multiplying Factor &nbsp;&nbsp;·&nbsp;&nbsp; TOP = Type of Property</p>
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

          {consumers.map((c, i) => (
            <tbody className="report-table__record" key={c.referenceNo}>
              <tr>
                <td rowSpan={2} className="report-table__sr">{i + 1}</td>
                <td rowSpan={2} className="report-table__ref">{c.referenceNo}</td>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{formatDate(c.connectionDate)}</td>
                <td>{c.state}</td>
                <td>{c.multiplyingFactor ?? "—"}</td>
              </tr>
              <tr className="report-table__meter-row">
                <td>{c.meter?.meterNumber ?? "—"}</td>
                <td>{c.meter?.status ?? "—"}</td>
                <td>{c.meter?.phase ?? "—"}</td>
                <td>{c.meter?.typeOfProperty ?? "—"}</td>
                <td>{c.meter?.plotSize ?? "—"}</td>
              </tr>
            </tbody>
          ))}
        </table>

        

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