import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

const RESIDENTIAL_OPTIONS = ["Residential", "Commercial", "Semi Commercial"];
const PHASE_OPTIONS = ["1", "3"];
const SIZE_PLOT_OPTIONS = [
  { value: "1K", label: "1 Kanal" },
  { value: "2K", label: "2 Kanal" },
  { value: "10M", label: "10 Marla" },
];

const sanitizeDateInput = (value) => {
  if (!value) return value;
  const [y, m, d] = value.split("-");
  let result = (y || "").slice(0, 4);
  if (m !== undefined) result += `-${m}`;
  if (d !== undefined) result += `-${d}`;
  return result;
};

export default function ConsumerUpdate() {
  const navigate = useNavigate();
  const [refNo, setRefNo] = useState("");
  const [consumer, setConsumer] = useState(null);
  const [meters, setMeters] = useState([]);
  const [form, setForm] = useState(null); // consumer edit fields
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingMeterId, setEditingMeterId] = useState(null);
  const [meterForm, setMeterForm] = useState(null);

  const [addingMeter, setAddingMeter] = useState(false);
  const [newMeterForm, setNewMeterForm] = useState(null);

const EMPTY_NEW_METER = {
  meterNumber: "", initialReading: "", status: "Inactive",
  phase: PHASE_OPTIONS[0], residentialDisplay: RESIDENTIAL_OPTIONS[0], sizePlot: SIZE_PLOT_OPTIONS[0].value,
};

  const search = async (e) => {
    e?.preventDefault();
    setError(""); setNotice("");
    if (!refNo.trim()) return setError("Please enter a Reference No.");

    try {
      const data = await api.getConsumer(refNo.trim());
      setConsumer(data.consumer);
      setMeters(data.meters);
      setForm({
        billMf: String(data.consumer.billMf),
        name: data.consumer.name,
        address: data.consumer.address,
        connectionDate: data.consumer.connectionDate,
      });
    } catch (err) {
      setConsumer(null);
      setError(err.message);
    }
  };

  useEffect(() => {
  if (!error && !notice) return;
  const t = setTimeout(() => { setError(""); setNotice(""); }, 5000);
  return () => clearTimeout(t);
}, [error, notice]);

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

  const saveConsumer = async (e) => {
    e.preventDefault();
    try {
      await api.updateConsumer(consumer.referenceNo, form);
      setNotice("Record Successfully Updated!");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditMeter = (m) => {
    setEditingMeterId(m.meterNumber);
    setMeterForm({
      meterNumber: String(m.meterNumber),
      status: m.status,
      phase: m.phase,
      residentialDisplay: m.residentialDisplay,
      sizePlot: m.sizePlot,
    });
  };

  const openAddMeter = () => { setAddingMeter(true); setNewMeterForm(EMPTY_NEW_METER); };

const submitNewMeter = async () => {
  try {
    const data = await api.addMeter(consumer.referenceNo, newMeterForm);
    setMeters(data.meters);
    setAddingMeter(false);
    setNotice("Meter added successfully!");
    setError("");
  } catch (err) {
    setError(err.message);
  }
};

  const saveMeter = async (meterNo) => {
    try {
      const data = await api.updateMeter(consumer.referenceNo, meterNo, meterForm);
      setMeters(data.meters);
      setEditingMeterId(null);
      setNotice("Meter updated successfully!");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Update Record</h1>
      <p className="dashboard__subtitle">Search a consumer, then edit their details or meters</p>

      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

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

      {consumer && form && (
        <>
          <form onSubmit={saveConsumer}>
            <div className="field">
              <label>Reference No.</label>
              <input value={consumer.referenceNo} disabled />
            </div>
            <div className="field">
              <label>Bill MF</label>
              <input value={form.billMf} onChange={(e) => setForm((f) => ({ ...f, billMf: e.target.value }))} />
            </div>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={30} />
            </div>
            <div className="field">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="field">
              <label>Connection Date</label>
              <input
              type="date"
              value={form.connectionDate}
              onChange={(e) => setForm((f) => ({ ...f, connectionDate: sanitizeDateInput(e.target.value) }))}
            />
            </div>
            <div className="button-row">
              <button type="submit" className="btn btn-primary">Save Consumer Details</button>
            </div>
          </form>

          <div className="button-row" style={{ alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
  <h2 className="consumer-section-title" style={{ margin: 0 }}>Meter Details</h2>
  {!addingMeter && (
    <button type="button" className="btn-chip btn-chip--update" onClick={openAddMeter}>
      + Add Meter
    </button>
  )}
</div>

<div className="meter-card-list">
  {meters.map((m) => {
              const isEditing = editingMeterId === m.meterNumber;
              return (
                <div className="meter-card" key={m.meterNumber}>
                  {isEditing ? (
                    <>
                      <div className="field">
                        <label>Meter Number (7 digits)</label>
                        <input
                          value={meterForm.meterNumber}
                          onChange={(e) => setMeterForm((f) => ({ ...f, meterNumber: e.target.value.replace(/[^0-9]/g, "").slice(0, 7) }))}
                        />
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select value={meterForm.status} onChange={(e) => setMeterForm((f) => ({ ...f, status: e.target.value }))}>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Phase</label>
                        <select value={meterForm.phase} onChange={(e) => setMeterForm((f) => ({ ...f, phase: e.target.value }))}>
                          {PHASE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Residential</label>
                        <select value={meterForm.residentialDisplay} onChange={(e) => setMeterForm((f) => ({ ...f, residentialDisplay: e.target.value }))}>
                          {RESIDENTIAL_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Size of Plot</label>
                        <select value={meterForm.sizePlot} onChange={(e) => setMeterForm((f) => ({ ...f, sizePlot: e.target.value }))}>
                          {SIZE_PLOT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="button-row">
                        <button className="btn-chip btn-chip--save" onClick={() => saveMeter(m.meterNumber)}>Save</button>
                        <button className="btn-chip btn-chip--cancel" onClick={() => setEditingMeterId(null)}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div><span className="meter-card__label">Meter No:</span> {m.meterNumber}</div>
                      <div>
                        <span className="meter-card__label">Status:</span>{" "}
                        <span className={m.statusCode === "A" ? "meter-card__status--active" : "meter-card__status--inactive"}>
                          {m.status}
                        </span>
                      </div>
                      <div><span className="meter-card__label">Phase:</span> {m.phase}</div>
                      <div><span className="meter-card__label">Residential:</span> {m.residentialDisplay}</div>
                      <div><span className="meter-card__label">Size of Plot:</span> {m.sizePlot}</div>
                      <div className="button-row">
                        <button className="btn-chip btn-chip--update" onClick={() => startEditMeter(m)}>Update</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

  {addingMeter && (
    <div className="meter-card">
      <div className="field">
        <label>Meter Number (7 digits)</label>
        <input
          value={newMeterForm.meterNumber}
          onChange={(e) => setNewMeterForm((f) => ({ ...f, meterNumber: e.target.value.replace(/[^0-9]/g, "").slice(0, 7) }))}
        />
      </div>
      <div className="field">
        <label>Initial Reading</label>
        <input
          value={newMeterForm.initialReading}
          onChange={(e) => setNewMeterForm((f) => ({ ...f, initialReading: e.target.value.replace(/[^0-9]/g, "").slice(0, 6) }))}
        />
      </div>
      <div className="field">
        <label>Status</label>
        <select value={newMeterForm.status} onChange={(e) => setNewMeterForm((f) => ({ ...f, status: e.target.value }))}>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>
      <div className="field">
        <label>Phase</label>
        <select value={newMeterForm.phase} onChange={(e) => setNewMeterForm((f) => ({ ...f, phase: e.target.value }))}>
          {PHASE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Residential</label>
        <select value={newMeterForm.residentialDisplay} onChange={(e) => setNewMeterForm((f) => ({ ...f, residentialDisplay: e.target.value }))}>
          {RESIDENTIAL_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Size of Plot</label>
        <select value={newMeterForm.sizePlot} onChange={(e) => setNewMeterForm((f) => ({ ...f, sizePlot: e.target.value }))}>
          {SIZE_PLOT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="button-row">
        <button className="btn-chip btn-chip--save" onClick={submitNewMeter}>Save</button>
        <button className="btn-chip btn-chip--cancel" onClick={() => setAddingMeter(false)}>Cancel</button>
      </div>
    </div>
  )}
</div>
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



