import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api.js";
import { notifyError } from "../lib/toast.js";

export default function MonthlyRatesInput() {
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!month) return notifyError("Please select a month.");

    const [yyyy, mm] = month.split("-");
    const monthInt = parseInt(yyyy, 10) * 100 + parseInt(mm, 10);

    setLoading(true);
    try {
      const data = await api.getConfigForMonth(monthInt);
      if (!data.rows || data.rows.length === 0) {
        notifyError("No rates found for that month.");
        return;
      }
      navigate("/menu/reports/monthly-rates/preview", { state: data });
    } catch (err) {
      notifyError("Could not generate report", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Monthly Rates</h1>
      <p className="dashboard__subtitle">Config rates for a given month</p>

      <form onSubmit={generate}>
        <div className="field">
          <label>Month</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} autoFocus required />
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