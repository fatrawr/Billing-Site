import { useState, useEffect  } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { notifySuccess, notifyError } from "../lib/toast.js";
import { useAuth } from "../components/AuthContext.jsx";

const RESIDENTIAL_OPTIONS = [
  { value: "R", label: "Residential" },
  { value: "C", label: "Commercial" },
  { value: "SC", label: "Semi Commercial" },
];
const PHASE_OPTIONS = ["1","2", "3"];
// NOTE: "10M" is used here instead of the original WinForm's literal
// "10 Marla" string - see consumers_routes.py's module docstring for why.
const SIZE_PLOT_OPTIONS = [
  { value: "1K", label: "1 Kanal" },
  { value: "2K", label: "2 Kanal" },
  { value: "10M", label: "10 Marla" },
];

const EMPTY = {
  referenceNo: "", billMf: "1", name: "", address: "", connectionDate: "",
  meterNumber: "", initialReading: "", phase: PHASE_OPTIONS[0],
  residentialDisplay: RESIDENTIAL_OPTIONS[0].value, sizePlot: SIZE_PLOT_OPTIONS[0].value,
};

const sanitizeDateInput = (value) => {
  if (!value) return value;
  const [y, m, d] = value.split("-");
  let result = (y || "").slice(0, 4);
  if (m !== undefined) result += `-${m}`;
  if (d !== undefined) result += `-${d}`;
  return result;
};

export default function ConsumerAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const { isAdmin } = useAuth();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const digitsOnly = (max) => (e) => e.target.value.replace(/[^0-9]/g, "").slice(0, max);

  const submit = async (e) => {
    e?.preventDefault();

    if (form.referenceNo.length !== 9) return notifyError("Reference No. must be exactly 9 digits!");
    if (!form.name.trim()) return notifyError("Name is required!");
    if (/^\d+$/.test(form.name.trim())) return notifyError("Name cannot be only numbers.");
    if (/^\d+$/.test(form.address.trim())) return notifyError("Address cannot be only numbers.");
    if (!/^20\d{2}-/.test(form.connectionDate)) return notifyError("Connection Date year must start with 20.");
    if (!form.address.trim()) return notifyError("Address is required!");
    if (form.address.trim().length > 100) return notifyError("Address must be less than or equal to 100 characters!");
    if (form.meterNumber.length !== 7) return notifyError("Meter Number must be exactly 7 digits!");
    if (!form.initialReading || form.initialReading.length > 6) return notifyError("Meter Reading must be <= 6 digits!");
    if (!form.connectionDate) return notifyError("Connection Date is required!");

    // Payload keys match WConsumer_Tbl / WMeterDetail_Tbl column names
    const payload = {
      ReferenceNo: parseInt(form.referenceNo, 10),
      Name: form.name.trim(),
      Address: form.address.trim(),
      ConnectionDate: form.connectionDate,
      Bill_MF: parseFloat(form.billMf),
      MeterNumber: parseInt(form.meterNumber, 10),
      Initial_reading: parseInt(form.initialReading, 10),
      Phase: form.phase,
      Residential: form.residentialDisplay,
      SizePlot: form.sizePlot,
    };

    try {
      await api.addConsumer(payload);
      notifySuccess("Consumer added successfully");
      setForm(EMPTY);
    } catch (err) {
      notifyError("Add failed", err.message);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F1") { e.preventDefault(); submit(); }
      if (e.key === "F9") { e.preventDefault(); setForm(EMPTY); }
      if (e.key === "F10") { e.preventDefault(); navigate("/menu/consumers"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, navigate]);

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Add New Consumer</h1>
      <p className="dashboard__subtitle">Register a new consumer and their first meter</p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Reference No. (9 digits)</label>
          <input value={form.referenceNo} onChange={(e) => setForm((f) => ({ ...f, referenceNo: digitsOnly(9)(e) }))} required />
        </div>

        <div className="field">
          <label>Bill MF</label>
          <input value={form.billMf} onChange={set("billMf")} />
        </div>

        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={set("name")} maxLength={30} required />
        </div>

        <div className="field">
          <label>Address</label>
          <input value={form.address} onChange={set("address")} maxLength={100} required />
        </div>

        <div className="field">
          <label>Connection Date</label>
          <input
          type="date"
          value={form.connectionDate}
          onChange={(e) => setForm((f) => ({ ...f, connectionDate: sanitizeDateInput(e.target.value) }))}
          required
        />
        </div>

        <div className="field">
          <label>Meter Number (7 digits)</label>
          <input value={form.meterNumber} onChange={(e) => setForm((f) => ({ ...f, meterNumber: digitsOnly(7)(e) }))} required />
        </div>

        <div className="field">
          <label>Initial Reading</label>
          <input value={form.initialReading} onChange={(e) => setForm((f) => ({ ...f, initialReading: digitsOnly(6)(e) }))} required />
        </div>

        <div className="field">
          <label>Phase</label>
          <select value={form.phase} onChange={set("phase")}>
            {PHASE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Residential</label>
          <select value={form.residentialDisplay} onChange={set("residentialDisplay")}>
            {RESIDENTIAL_OPTIONS.map((r) => <option key={r} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Size of Plot</label>
          <select value={form.sizePlot} onChange={set("sizePlot")}>
            {SIZE_PLOT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="button-row">
          {isAdmin && (
            <button type="submit" className="btn btn-primary">
              Add&nbsp;&nbsp;<span className="btn-exit__key">F1</span>
            </button>
          )}
          {isAdmin && (<button type="button" className="btn btn-secondary" onClick={() => setForm(EMPTY)}>
            Clear&nbsp;&nbsp;<span className="btn-exit__key">F9</span>
          </button>)}
        </div>
      </form>

      <div className="dashboard__footer">
        <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu/consumers")}>
          Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}