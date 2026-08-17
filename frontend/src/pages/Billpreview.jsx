import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BillDocument from "../components/Billdocument.jsx";

export default function BillPreview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const bills = state?.bills || [];
  const backTo = state?.from === "welcome" ? "/" : "/menu/bills";

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate(backTo);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, backTo]);

  if (bills.length === 0) {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">Bill Preview</h1>
        <p className="dashboard__subtitle">No bills to show — generate one first.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate(backTo)}>
            Go to Bill Generation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-preview">
      <div className="bill-preview__toolbar no-print">
        <span className="bill-preview__count">
          {bills.length === 1 ? "Bill Preview" : `Bill Preview (${bills.length} bills)`}
        </span>
        <div className="bill-preview__actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print&nbsp;&nbsp;<span className="btn-exit__key">Ctrl+P</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(backTo)}>
            Close&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
          </button>
        </div>
      </div>

      <div className="bill-preview__stack">
        {bills.map((bill) => (
          <BillDocument key={bill.consumer.referenceNo} bill={bill} />
        ))}
      </div>
    </div>
  );
}