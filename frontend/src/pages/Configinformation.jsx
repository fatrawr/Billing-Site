import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

const ALLOWED_USER = "fat123";
const CONFIG_CODES = ["UR", "CM", "SC", "LP", "OM"];
const CONFIG_DEFAULTS = { UR: "0", CM: "0", SC: "0", LP: "10", OM: "1" };
const CONFIG_DESCS = {
  UR: "Residential Unit Rate",
  CM: "Commercial Unit Rate",
  SC: "Semi-Commercial Unit Rate",
  LP: "LP % of Total Bill Amount",
  OM: "OM charges",
};

export default function ConfigInformation() {
  const navigate = useNavigate();

  const [authStatus, setAuthStatus] = useState("checking");

  const [month, setMonth] = useState(null);
  const [monthDisplay, setMonthDisplay] = useState(null);
  const [rows, setRows] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);

  // "latest" = viewing/editing the current saved month
  // "draft"  = viewing a not-yet-saved next month (always shows Save)
  // "past"   = viewing a previous month (editable only if not actually past today)
  const [mode, setMode] = useState("latest");

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then((user) => {
        if (cancelled) return;
        setAuthStatus(user?.userId === ALLOWED_USER ? "allowed" : "denied");
      })
      .catch(() => { if (!cancelled) setAuthStatus("denied"); });
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLatestConfig();
      setMonth(data.month);
      setMonthDisplay(data.monthDisplay);
      setRows(data.rows);
      setMode("latest");
      setDirty(false);
      const v = {};
      data.rows.forEach((r) => { v[r.configCode] = String(r.configValue); });
      setValues(v);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "allowed") load();
  }, [authStatus, load]);

  const prevMonth = (yyyymm) => {
    let yyyy = Math.floor(yyyymm / 100);
    let mm = (yyyymm % 100) - 1;
    if (mm === 0) { mm = 12; yyyy -= 1; }
    return yyyy * 100 + mm;
  };
  const nextMonth = (yyyymm) => {
    let yyyy = Math.floor(yyyymm / 100);
    let mm = (yyyymm % 100) + 1;
    if (mm === 13) { mm = 1; yyyy += 1; }
    return yyyy * 100 + mm;
  };
  const currentYYYYMM = () => {
    const now = new Date();
    return now.getFullYear() * 100 + (now.getMonth() + 1);
  };
  const monthDisplayFor = (yyyymm) => {
    const yyyy = Math.floor(yyyymm / 100);
    const mm = yyyymm % 100;
    return new Date(yyyy, mm - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };

  const updateValue = (code, raw) => {
    setValues((v) => ({ ...v, [code]: raw.replace(/[^0-9.]/g, "") }));
    setDirty(true);
    setNotice("");
  };

  const checkPreviousMonth = async () => {
    if (month == null) return;
    const target = prevMonth(month);
    try {
      const data = await api.getConfigForMonth(target);
      setMonth(data.month);
      setMonthDisplay(data.monthDisplay);
      setRows(data.rows);
      setMode("past");
      setDirty(false);
      const v = {};
      data.rows.forEach((r) => { v[r.configCode] = String(r.configValue); });
      setValues(v);
      setError(data.rows.length === 0 ? `No config found for ${data.monthDisplay}.` : "");
      setNotice("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Build the next month's rows LOCALLY — nothing saved to the DB yet.
  const addNextMonth = () => {
    const base = month ?? currentYYYYMM();
    const target = month == null ? base : nextMonth(base);
    const draftRows = CONFIG_CODES.map((code) => ({
      configCode: code,
      configDesc: CONFIG_DESCS[code],
    }));
    const v = {};
    CONFIG_CODES.forEach((code) => { v[code] = CONFIG_DEFAULTS[code]; });

    setMonth(target);
    setMonthDisplay(monthDisplayFor(target));
    setRows(draftRows);
    setValues(v);
    setMode("draft");
    setDirty(false);
    setNotice("Draft created — edit values below, then Save to write to the database.");
    setError("");
  };

  const saveAll = async () => {
    try {
      const payload = {
        month,
        rows: CONFIG_CODES.map((code) => ({
          configCode: code,
          configDesc: CONFIG_DESCS[code],
          configValue: values[code],
        })),
      };
      const data = await api.bulkSaveConfig(payload);
      setMonth(data.month);
      setMonthDisplay(data.monthDisplay);
      setRows(data.rows);
      setMode("latest");
      setDirty(false);
      const v = {};
      data.rows.forEach((r) => { v[r.configCode] = String(r.configValue); });
      setValues(v);
      setNotice("Saved successfully!");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const showSave = mode === "draft" || dirty;

  useEffect(() => {
    if (authStatus !== "allowed") return;
    const onKey = (e) => {
      if (e.key === "F4") {
        e.preventDefault();
        if (showSave) saveAll();
        else addNextMonth();
      }
      if (e.key === "F3") {
        e.preventDefault();
        checkPreviousMonth();
      }
      if (e.key === "F10") {
        e.preventDefault();
        navigate("/menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, showSave, month, values]);

  if (authStatus === "checking") {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">Config Information</h1>
        <p className="dashboard__subtitle">Checking access…</p>
      </div>
    );
  }

  if (authStatus === "denied") {
    return (
      <div className="dashboard dashboard--narrow">
        <h1 className="dashboard__title">Configuration Settings</h1>
        <p className="dashboard__subtitle">You're not authorized to access this page.</p>
        <div className="dashboard__footer">
          <button className="btn btn-primary btn-exit" onClick={() => navigate("/menu")}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const editableRow = mode === "draft" || mode === "latest" || (mode === "past" && month >= currentYYYYMM());

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Configuration Settings</h1>
      <p className="dashboard__subtitle">
        {monthDisplay
          ? `${mode === "draft" ? "Draft (unsaved)" : "Viewing"}: ${monthDisplay}${dirty ? " — unsaved changes" : ""}`
          : "No configuration set up yet"}
      </p>

      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      <div className="charges-table charges-table--config">
        <div className="charges-table__header">
          <span>Month</span>
          <span>Code</span>
          <span>Description</span>
          <span>Value</span>
        </div>

        {loading && <div className="charges-table__empty">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="charges-table__empty">No config found — click "Add next month" to create one.</div>
        )}

        {!loading && rows.map((row) => (
          <div className="charges-row" key={row.configCode}>
            <span className="charges-row__desc">{monthDisplay}</span>
            <span>{row.configCode}</span>
            <span className="charges-row__ellipsis" title={row.configDesc}>{row.configDesc}</span>
            {editableRow ? (
              <input
                className="charges-row__input"
                value={values[row.configCode] ?? ""}
                onChange={(e) => updateValue(row.configCode, e.target.value)}
              />
            ) : (
              <span>{values[row.configCode] ?? ""}</span>
            )}
          </div>
        ))}
      </div>

      <div className="config-toolbar">
        <button type="button" className="btn-chip btn-chip--update" onClick={checkPreviousMonth}>
          Check previous month&nbsp;<span className="btn-exit__key">F3</span>
        </button>

        {showSave ? (
          <button type="button" className="btn-chip btn-chip--save" onClick={saveAll}>
            Save&nbsp;<span className="btn-exit__key">F4</span>
          </button>
        ) : (
          <button type="button" className="btn-chip btn-chip--update" onClick={addNextMonth}>
            Add next month&nbsp;<span className="btn-exit__key">F4</span>
          </button>
        )}

        <button type="button" className="btn-chip btn-chip--delete" onClick={() => navigate("/menu")}>
          Back&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}