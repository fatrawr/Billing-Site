import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tile from "../components/Tile.jsx";
import { api } from "../api.js";
import { useConfirm } from "../components/ui/ConfirmDialog.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

import { useAuth } from "../components/AuthContext.jsx"; // adjust path if it actually lives elsewhere

const ACCENTS = { forest: "#1c6b37", navy: "#2c3f68" };

export default function BillProcessMenu() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: "error"|"success", text }
  const confirmDialog = useConfirm();

  const runAction = async (label, fn) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn();
      setMessage({ type: "success", text: res.message || `${label} completed.` });
      notifySuccess(`${label} completed`, res.message);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      notifyError(`${label} failed`, err.message);
    } finally {
      setBusy(false);
    }
  };

  const ITEMS = [
    { number: 1, title: "Populate Payment Table", subtitle: "Add consumers in table", accent: ACCENTS.forest,
      adminOnly: true,
      onClick: async () => {
        if (await confirmDialog("This will permanently delete ALL rows in Payment_Tbl and regenerate them for the next billing month. This cannot be undone. Continue?"))
          runAction("Populate Payment Table", api.resetPayments);
      } },
    { number: 4, title: "Populate Reading Table", subtitle: "Add consumers in table", accent: ACCENTS.navy,
      adminOnly: true,
      onClick: async () => {
        if (await confirmDialog("This will permanently delete ALL rows in Reading Table and regenerate them for the next billing month based on Master_Tbl. This cannot be undone. Continue?"))
          runAction("Populate Reading Table", api.resetReadings);
      } },
    { number: 2, title: "Payment Entry", subtitle: "Payment of previous Bill", accent: ACCENTS.forest,
      to: "/menu/bills/payment-entry" },
    { number: 5, title: "Reading Entry", subtitle: "Reading of Current Month", accent: ACCENTS.navy,
      to: "/menu/bills/reading-entry" },
    { number: 3, title: "Payment Posting", subtitle: "Post in Master Table", accent: ACCENTS.forest,
      onClick: async () => {
        if (await confirmDialog("This will post payments into Master_Tbl for the current billing month. Continue?"))
          runAction("Payment Posting", api.postPayments);
      } },
    { number: 6, title: "Reading Posting", subtitle: "Post in Master Table", accent: ACCENTS.navy,
      adminOnly: true,
      onClick: async () => {
        if (await confirmDialog("This will post readings into Master_Tbl and compute this month's bills. Continue?"))
          runAction("Reading Posting", api.postReadings);
      } },
    { number: 7, title: "Bill Generation", subtitle: "Generate a Bill", accent: ACCENTS.forest,
      adminOnly: true,
      to: "/menu/bills/generate" },
  ];

  const visibleItems = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    const onKey = (e) => {
      const item = visibleItems.find((i) => e.key === String(i.number));
      if (item) (item.onClick ? item.onClick() : navigate(item.to));
      if (e.key === "F10" || e.key === "Escape") {
        e.preventDefault();
        navigate("/menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isAdmin]);

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Bills Processing</h1>
      <p className="dashboard__subtitle">Select an option to continue</p>

      {busy && <div className="flash">Working…</div>}
      {message && <div className={`flash ${message.type}`}>{message.text}</div>}

      <div className="tile-grid tile-grid--two-col">
        {visibleItems.map((item) => (
          <Tile key={item.number} {...item} />
        ))}
      </div>

      <p className="dashboard__hint">Press the number key, or click an option</p>

      <div className="dashboard__footer">
        <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu")}>
          Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}