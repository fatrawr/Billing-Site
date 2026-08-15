import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { notifyError } from "../lib/toast.js";

export default function ConsumerDisplay() {
  const navigate = useNavigate();
  const [refNo, setRefNo] = useState("");
  const [result, setResult] = useState(null); // { consumer, meters }

  const search = async (e) => {
    e?.preventDefault();
    if (!refNo.trim()) return notifyError("Please enter a Reference No.");

    try {
      const data = await api.getConsumerDisplay(refNo.trim());
      setResult(data);
    } catch (err) {
      setResult(null);
      notifyError("Search failed", err.message);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F1") {
        e.preventDefault();
        search();
      }
      if (e.key === "F10") {
        e.preventDefault();
        navigate("/menu/consumers");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo]);

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Display Record</h1>
      <p className="dashboard__subtitle">Read-only lookup by Reference No.</p>

      <form onSubmit={search} className="button-row" style={{ marginBottom: 24 }}>
        <input
          value={refNo}
          onChange={(e) => setRefNo(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
          placeholder="Enter Reference No."
          style={{ flex: 2, padding: "11px 13px", borderRadius: 8, border: "1.5px solid var(--line)" }}
        />
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          Search&nbsp;&nbsp;<span className="btn-exit__key">F1</span>
        </button>
      </form>

      {result && (
        <>
          <div className="consumer-info-grid">
            <div><span className="consumer-info-grid__label">Reference No.</span>{result.consumer.referenceNo}</div>
            <div><span className="consumer-info-grid__label">Bill MF</span>{result.consumer.billMf}</div>
            <div><span className="consumer-info-grid__label">Name</span>{result.consumer.name}</div>
            <div><span className="consumer-info-grid__label">Address</span>{result.consumer.address}</div>
            <div><span className="consumer-info-grid__label">Connection Date</span>{result.consumer.connectionDate}</div>
          </div>

          <h2 className="consumer-section-title">Meter Details</h2>
          {result.meters.length === 0 ? (
            <div className="charges-table__empty" style={{ color: "#a12525", fontWeight: 700 }}>
              No Active Meter Found
            </div>
          ) : (
            <div className="meter-card-list">
              {result.meters.map((m) => (
                <div className="meter-card" key={m.id}>
                  <div><span className="meter-card__label">Meter No:</span> {m.meterNumber}</div>
                  <div>
                    <span className="meter-card__label">Status:</span>{" "}
                    <span className={m.statusCode === "A" ? "meter-card__status--active" : "meter-card__status--inactive"}>
                      {m.status}
                    </span>
                  </div>
                  <div><span className="meter-card__label">Phase:</span> {m.phase}</div>
                  <div><span className="meter-card__label">Residential:</span> {m.residentialDisplay}</div>
                  <div><span className="meter-card__label">Size of Plot:</span> {m.sizePlotDisplay}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="dashboard__footer">
        <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu/consumers")}>
          Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}
