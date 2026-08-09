import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function BillGenerate() {
  const navigate = useNavigate();
  const [fromRef, setFromRef] = useState("");
  const [toRef, setToRef] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const digitsOnly = (v) => v.replace(/[^0-9]/g, "");

  useEffect(() => {
  const onKey = (e) => {
    if (e.key === "F4") {
      e.preventDefault();
      generate();
    }
    if (e.key === "F10") {
      e.preventDefault();
      navigate("/menu/bills");
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [fromRef, toRef, month]);


  const generate = async (e) => {
    e?.preventDefault();
    setError("");

    if (!month) return setError("Please enter bill month in MM/YYYY format.");
    if (!fromRef.trim()) return setError("Please enter a From Reference Number.");

    setLoading(true);
    try {
      const params = { from: fromRef.trim(), month };
      if (toRef.trim()) params.to = toRef.trim();

      const { bills } = await api.previewBills(params);
      navigate("/menu/bills/preview", { state: { bills } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Bill Generation</h1>
      <p className="dashboard__subtitle">Generate a printable bill or a range of bills</p>

      {error && <div className="flash error">{error}</div>}

      <form onSubmit={generate} className="auth-shell__body" style={{ padding: 0 }}>
        <div className="field">
          <label>From (Ref #)</label>
          <input
            value={fromRef}
            maxLength={9}
            onChange={(e) => setFromRef(digitsOnly(e.target.value))}
            placeholder="Required"
            required
          />
        </div>

        <div className="field">
          <label>To (Ref #)</label>
          <input
            value={toRef}
            maxLength={9}
            onChange={(e) => setToRef(digitsOnly(e.target.value))}
            placeholder="Optional — leave blank for a single bill"
          />
        </div>

        <div className="field">
          <label>Bill Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
        </div>

        <div className="button-row">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Generating…" : "Generate"}&nbsp;&nbsp;
            <span className="btn-exit__key">F4</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/menu/bills")}>
            Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
          </button>
        </div>
      </form>
    </div>
  );
}