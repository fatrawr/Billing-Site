import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "../api.js";
import { notifyError } from "../lib/toast.js";

export default function ListOfConsumers() {
  const navigate = useNavigate();
  const [refNo, setRefNo] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [loading, setLoading] = useState(false);

  const digitsOnly = (v) => v.replace(/[^0-9]/g, "").slice(0, 9);

  const generate = async (e) => {
    e.preventDefault();
    if (!refNo.trim()) return notifyError("Please enter a Reference Number.");

    setLoading(true);
    try {
      const params = { from: refNo.trim() };
      if (rangeTo.trim()) params.to = rangeTo.trim();

      const { consumers } = await api.getConsumersReport(params);
      navigate("/menu/reports/consumers/preview", { state: { consumers } });
    } catch (err) {
      notifyError("Could not generate report", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">List of Consumers</h1>
      <p className="dashboard__subtitle">with meter details</p>

      <form onSubmit={generate}>
        <div className="field">
          <label>Reference Number</label>
          <input
            value={refNo}
            onChange={(e) => setRefNo(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="e.g. 121300123"
            autoFocus
          />
        </div>

        <div className="field">
          <label>Range To (optional)</label>
          <input
            value={rangeTo}
            onChange={(e) => setRangeTo(digitsOnly(e.target.value))}
            inputMode="numeric"
            placeholder="Leave blank for a single consumer"
          />
        </div>

        <div className="dashboard__footer dashboard__footer--row">
          <button type="submit" className="btn btn-primary btn-exit" disabled={loading}>
            {loading ? "Generating…" : "Generate Report"}&nbsp;<ArrowRight size={15} style={{ verticalAlign: -2 }} />
          </button>
          <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu/reports")}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
