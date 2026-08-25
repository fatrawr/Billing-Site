import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api.js";
import { notifyError } from "../lib/toast.js";

export default function YearlyPaymentsInput() {
  const navigate = useNavigate();
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!fromMonth) return notifyError("Please select a starting month.");

    setLoading(true);
    try {
      const params = { from: fromMonth };
      if (toMonth) params.to = toMonth;

      const data = await api.getYearlyPaymentsReport(params);
      navigate("/menu/reports/yearly-payments/preview", { state: data });
    } catch (err) {
      notifyError("Could not generate report", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Yearly Payments Report</h1>
      <p className="dashboard__subtitle">Billed vs paid amounts, month wise</p>

      <form onSubmit={generate}>
        <div className="field">
          <label>From Month</label>
          <input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} autoFocus required />
        </div>

        <div className="field">
          <label>To Month (optional)</label>
          <input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} />
          <p className="dashboard__hint" style={{ marginTop: 6, textAlign: "left" }}>
            Leave blank to run through the latest billed month of the starting year.
          </p>
        </div>

        <div className="dashboard__footer dashboard__footer--row">
          <button type="submit" className="btn btn-primary btn-exit" disabled={loading}>
            {loading ? "Generating…" : "Generate Report"}&nbsp;<ArrowRight size={15} style={{ verticalAlign: -2 }} />
          </button>
          <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu/reports")}>
            Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
          </button>
        </div>
      </form>
    </div>
  );
}