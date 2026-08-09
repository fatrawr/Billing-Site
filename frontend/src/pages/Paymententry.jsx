import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function PaymentEntry() {
  const navigate = useNavigate();
  const [refs, setRefs] = useState([]);
  const [idx, setIdx] = useState(-1);
  const [targetMonth, setTargetMonth] = useState(null);
  const [form, setForm] = useState({ paymentDue: 0, paymentMade: "0", paymentDate: "" });
  const [error, setError] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const load = useCallback(async (ref) => {
    const data = await api.getPaymentEntry(ref);
    setForm({ paymentDue: data.paymentDue, paymentMade: String(data.paymentMade), paymentDate: data.paymentDate });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const init = await api.getPaymentEntryInit();
        setRefs(init.refNumbers);
        setTargetMonth(init.targetMonth);
        const i = init.refNumbers.indexOf(init.startRef);
        setIdx(i);
        await load(init.startRef);
      } catch (err) { setError(err.message); }
    })();
  }, [load]);

  const validate = () => {
    const made = parseFloat(form.paymentMade);
    if (isNaN(made) || made < 0) return "Payment Made must be a valid non-negative number.";
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return false; }
    setError("");
    await api.savePaymentEntry(refs[idx], form);
    return true;
  };

  const goTo = async (i) => {
    setIdx(i);
    await load(refs[i]);
  };

  const goNext = async () => {
    if (!(await save())) return;
    if (idx + 1 < refs.length) goTo(idx + 1);
    else setError("This is the last record.");
  };
  const goPrev = () => (idx - 1 >= 0 ? goTo(idx - 1) : setError("This is the first record."));
  const goFirst = () => goTo(0);
  const goLast = () => goTo(refs.length - 1);

  const runSearch = () => {
    const ref = parseInt(searchVal, 10);
    const i = refs.indexOf(ref);
    if (i === -1) setError("Reference number not found.");
    else { setError(""); goTo(i); }
    setSearchMode(false);
  };

  const openSearch = () => { setSearchMode(true); setSearchVal(String(refs[idx] || "")); };

  useEffect(() => {
    const onKey = (e) => {
      if (["F1", "F2", "F3", "F4", "F5", "F10"].includes(e.key)) e.preventDefault();
      if (e.key === "F1") goFirst();
      if (e.key === "F2") goNext();
      if (e.key === "F3") goPrev();
      if (e.key === "F5") goLast();
      if (e.key === "F10") navigate("/menu/bills");
      if (e.key === "F4") {
        if (!searchMode) openSearch();
        else runSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, refs, searchMode, searchVal, form]);

  if (idx === -1) return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Payment Entry</h1>
      {error && <div className="flash error">{error}</div>}
    </div>
  );

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Payment Entry</h1>
      <p className="dashboard__subtitle">Billing month {targetMonth} — record {idx + 1} of {refs.length}</p>

      {error && <div className="flash error">{error}</div>}

      <div className="payment-entry-card">
        <div className="field">
          <label>Reference #</label>
          {searchMode ? (
            <input
              autoFocus
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
            />
          ) : (
            <input value={refs[idx]} disabled />
          )}
        </div>

        <div className="field">
          <label>Payment Due</label>
          <input value={form.paymentDue.toFixed ? form.paymentDue.toFixed(2) : form.paymentDue} disabled />
        </div>

        <div className="field">
          <label>Payment Made</label>
          <input
            value={form.paymentMade}
            onChange={(e) => setForm((f) => ({ ...f, paymentMade: e.target.value.replace(/[^0-9.]/g, "") }))}
          />
        </div>

        <div className="field">
          <label>Payment Date</label>
          <input
            type="date"
            value={form.paymentDate}
            onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="payment-entry-nav">
        <button type="button" className="btn-chip btn-chip--update" onClick={goFirst}>
          First&nbsp;<span className="btn-exit__key">F1</span>
        </button>
        <button type="button" className="btn-chip btn-chip--update" onClick={goPrev}>
          Prev&nbsp;<span className="btn-exit__key">F3</span>
        </button>
        <button type="button" className="btn-chip btn-chip--save" onClick={goNext}>
          Next&nbsp;<span className="btn-exit__key">F2</span>
        </button>
        <button type="button" className="btn-chip btn-chip--update" onClick={goLast}>
          Last&nbsp;<span className="btn-exit__key">F5</span>
        </button>
        <button type="button" className="btn-chip btn-chip--cancel" onClick={searchMode ? runSearch : openSearch}>
          {searchMode ? "Go" : "Search"}&nbsp;<span className="btn-exit__key">F4</span>
        </button>
        <button type="button" className="btn-chip btn-chip--delete" onClick={() => navigate("/menu/bills")}>
          Back&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}