import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

const EMPTY_ADD = { month: "", rdgDate: "", issDate: "", dueDate: "" };

// "2025-01-15" -> "15/01/2025", for display parity with the C# grid
function toDMY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const sanitizeMonthInput = (value) => {
  if (!value) return value;
  const [y, m] = value.split("-");
  const yTrimmed = (y || "").slice(0, 4);
  return m !== undefined ? `${yTrimmed}-${m}` : yTrimmed;
};

const sanitizeDateInput = (value) => {
  if (!value) return value;
  const [y, m, d] = value.split("-");
  let result = (y || "").slice(0, 4);
  if (m !== undefined) result += `-${m}`;
  if (d !== undefined) result += `-${d}`;
  return result;
};

export default function BillingSchedule() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [addVisible, setAddVisible] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_ADD);

  const [editingMonth, setEditingMonth] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_ADD);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.getDates());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F4") {
        e.preventDefault();
        if (addVisible) submitAdd();
        else openAdd();
      }
      if (e.key === "F10") {
        e.preventDefault();
        navigate("/menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addVisible, addForm, navigate]);

  const openAdd = () => { setAddVisible(true); setError(""); setNotice(""); };

  const submitAdd = async () => {
    try {
      await api.addDate(addForm);
      setAddForm(EMPTY_ADD);
      setAddVisible(false);
      setNotice("Record added successfully!");
      setError("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (row) => {
    setEditingMonth(row.month);
    const yyyy = Math.floor(row.month / 100);
    const mm = String(row.month % 100).padStart(2, "0");
    setEditForm({
      month: `${yyyy}-${mm}`,
      rdgDate: row.rdgDate,
      issDate: row.issDate,
      dueDate: row.dueDate,
    });
    setError(""); setNotice("");
  };

  const saveEdit = async (oldMonth) => {
    try {
      await api.updateDate({ oldMonth, ...editForm });
      setEditingMonth(null);
      setNotice("Updated successfully!");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Billing Schedule</h1>
      <p className="dashboard__subtitle">Set reading, issue, and due dates for each billing month</p>

      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      <div className="charges-table charges-table--dates">
        <div className="charges-table__header">
          <span>Month</span>
          <span>Reading Date</span>
          <span>Issue Date</span>
          <span>Due Date</span>
          <span>Actions</span>
        </div>

        {loading && <div className="charges-table__empty">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="charges-table__empty">No data found.</div>
        )}

        {!loading && rows.map((row) => {
          const isEditing = editingMonth === row.month;
          return (
            <div className={`charges-row ${isEditing ? "charges-row--editing" : ""}`} key={row.month}>
              {isEditing ? (
                <>
                  <input
                    type="month"
                    className="charges-row__input"
                    value={editForm.month}
                    onChange={(e) => setEditForm((f) => ({ ...f, month: sanitizeMonthInput(e.target.value) }))}
                  />
                  <input
                    type="date"
                    className="charges-row__input"
                    value={editForm.rdgDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, rdgDate: sanitizeDateInput(e.target.value)  }))}
                  />
                  <input
                    type="date"
                    className="charges-row__input"
                    value={editForm.issDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, issDate: sanitizeDateInput(e.target.value)  }))}
                  />
                  <input
                    type="date"
                    className="charges-row__input"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm((f) => ({ ...f, dueDate: sanitizeDateInput(e.target.value) }))}
                  />
                  <span className="charges-row__actions">
                    <button className="btn-chip btn-chip--save" onClick={() => saveEdit(row.month)}>Save</button>
                    <button className="btn-chip btn-chip--cancel" onClick={() => setEditingMonth(null)}>Cancel</button>
                  </span>
                </>
              ) : (
                <>
                  <span className="charges-row__desc">{row.monthDisplay}</span>
                  <span>{toDMY(row.rdgDate)}</span>
                  <span>{toDMY(row.issDate)}</span>
                  <span>{toDMY(row.dueDate)}</span>
                  <span className="charges-row__actions">
                    {!row.monthPassed && (
                      <button className="btn-chip btn-chip--update" onClick={() => startEdit(row)}>Update</button>
                    )}
                  </span>
                </>
              )}
            </div>
          );
        })}

        {addVisible && (
          <div className="charges-row charges-row--add">
            <input
              type="month"
              className="charges-row__input"
              value={addForm.month}
              onChange={(e) => setAddForm((f) => ({ ...f, month: sanitizeMonthInput(e.target.value) }))}
              autoFocus
            />
            <input
              type="date"
              className="charges-row__input"
              value={addForm.rdgDate}
              onChange={(e) => setAddForm((f) => ({ ...f, rdgDate: sanitizeDateInput(e.target.value)  }))}
            />
            <input
              type="date"
              className="charges-row__input"
              value={addForm.issDate}
              onChange={(e) => setAddForm((f) => ({ ...f, issDate: sanitizeDateInput(e.target.value)  }))}
            />
            <input
              type="date"
              className="charges-row__input"
              value={addForm.dueDate}
              onChange={(e) => setAddForm((f) => ({ ...f, dueDate: sanitizeDateInput(e.target.value)  }))}
            />
            <span />
          </div>
        )}
      </div>

      <div className="dashboard__footer dashboard__footer--row">
        <button
          type="button"
          className="btn btn-primary btn-exit"
          onClick={() => (addVisible ? submitAdd() : openAdd())}
        >
          {addVisible ? "Save" : "Add"}&nbsp;&nbsp;<span className="btn-exit__key">F4</span>
        </button>
        <button type="button" className="btn btn-secondary btn-exit" onClick={() => navigate("/menu")}>
          Back&nbsp;&nbsp;<span className="btn-exit__key">F10</span>
        </button>
      </div>
    </div>
  );
}