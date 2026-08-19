import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Clock } from "../components/Clock.jsx";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function todayAsDMY() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${now.getFullYear()}`;
}

export default function ConsumersReportPreview() {
  const navigate = useNavigate();
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dateStr = todayAsDMY();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getConsumersReport({});
        setConsumers(data.consumers);
        setError("");
      } catch (err) {
        setError(err.message);
        setConsumers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("/menu/reports/consumers");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">List of Consumers</h1>
        <p className="dashboard__subtitle">Loading report…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">List of Consumers</h1>
        <div className="flash error">{error}</div>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu/reports/consumers")}>
            Back to Report
          </button>
        </div>
      </div>
    );
  }

  if (consumers.length === 0) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">List of Consumers</h1>
        <p className="dashboard__subtitle">No records to show — generate a report first.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu/reports/consumers")}>
            Go to Report
          </button>
        </div>
      </div>
    );
  }

  let activeMeters = 0, inactiveMeters = 0, deletedConsumers = 0;
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
          <button className="btn btn-secondary" onClick={() => navigate("/menu/reports/consumers")}>
            Close&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
          </button>
        </div>
      </div>

      <div className="report-page">
        <header className="report-page__header">
          <span className="report-page__header-date">{dateStr}</span>
          <span className="report-page__header-brand">{SOCIETY_NAME}</span>
          <Clock className="report-page__header-time" />
        </header>

        <h1 className="report-page__title">List of Consumers <span>with meter details</span></h1>

        <table className="report-table">
          <thead>
            <tr>
              <th rowSpan={2}>Sr.</th>
              <th rowSpan={2}>Reference No.</th>
              <th>Name</th>
              <th>Address</th>
              <th>Connection Date</th>
              <th>State</th>
              <th>Multiplying Factor</th>
            </tr>
            <tr>
              <th>Meter No.</th>
              <th>Status</th>
              <th>Phase</th>
              <th>Type of Property</th>
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
          <div className="report-summary__grid">
            <div className="report-summary__item">
              <span className="report-summary__label">Total Active Meters</span>
              <span className="report-summary__value">{activeMeters}</span>
            </div>
            <div className="report-summary__item">
              <span className="report-summary__label">Total Inactive Meters</span>
              <span className="report-summary__value">{inactiveMeters}</span>
            </div>
            <div className="report-summary__item">
              <span className="report-summary__label">Total Deleted Consumers</span>
              <span className="report-summary__value">{deletedConsumers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}