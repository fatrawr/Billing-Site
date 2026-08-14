import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js"
import { useAuth } from "../components/AuthContext.jsx";
import { useConfirm } from "../components/ui/ConfirmDialog.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";

export default function StaffPhoneNumbers() {
  const confirmDialog = useConfirm();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [addVisible, setAddVisible] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStaff(await api.getStaff());
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
  }, [addVisible, addName, addPhone, navigate]);

  const digitsOnly = (v) => v.replace(/[^0-9]/g, "").slice(0, 11);

  const openAdd = () => { setAddVisible(true); setError(""); setNotice(""); };

  const submitAdd = async () => {
    try {
      await api.addStaff({ staffName: addName.trim(), phoneNumber: addPhone.trim() });
      setAddName(""); setAddPhone(""); setAddVisible(false);
      setNotice("Record added successfully!"); setError("");
      notifySuccess("Record added successfully");
      load();
    } catch (err) {
      setError(err.message);
      notifyError("Add failed", err.message);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditName(row.staffName);
    setEditPhone(row.phoneNumber);
    setError(""); setNotice("");
  };

  const saveEdit = async (id) => {
    try {
      await api.updateStaff({ id, staffName: editName.trim(), phoneNumber: editPhone.trim() });
      setEditingId(null);
      setNotice("Updated successfully!");
      notifySuccess("Updated successfully");
      load();
    } catch (err) {
      setError(err.message);
      notifyError("Update failed", err.message);
    }
  };

  const removeStaff = async (id) => {
    if (!(await confirmDialog("Delete this record?"))) return;
    try {
      await api.deleteStaff({ id });
      setNotice("Deleted successfully!");
      notifySuccess("Deleted successfully");
      load();
    } catch (err) {
      setError(err.message);
      notifyError("Delete failed", err.message);
    }
  };

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Staff Phone Numbers</h1>
      <p className="dashboard__subtitle">Contact directory for society staff</p>

      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      <div className="charges-table charges-table--staff">
        <div className="charges-table__header">
          <span>Staff</span>
          <span>Phone Number</span>
          <span>Actions</span>
        </div>

        {loading && <div className="charges-table__empty">Loading…</div>}
        {!loading && staff.length === 0 && (
          <div className="charges-table__empty">No data found.</div>
        )}

        {!loading && staff.map((row) => {
          const isEditing = editingId === row.id;
          return (
            <div className={`charges-row ${isEditing ? "charges-row--editing" : ""}`} key={row.id}>
              {isEditing ? (
                <>
                  <input
                    className="charges-row__input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    className="charges-row__input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(digitsOnly(e.target.value))}
                  />
                  <span className="charges-row__actions">
                     <button className="btn-chip btn-chip--save" onClick={() => saveEdit(row.id)}>Save</button>
                     <button className="btn-chip btn-chip--cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </span>
                </>
              ) : (
                <>
                  <span className="charges-row__desc">{row.staffName}</span>
                  <span>{row.phoneNumber}</span>
                  <span className="charges-row__actions">
                  {isAdmin && (
                    <button className="btn-chip btn-chip--update" onClick={() => startEdit(row)}>Update</button>
                  )}
                  {isAdmin && (
                    <button className="btn-chip btn-chip--delete" onClick={() => removeStaff(row)}>Delete</button>
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
              className="charges-row__input"
              placeholder="Staff name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              autoFocus
            />
            <input
              className="charges-row__input"
              placeholder="11-digit phone number"
              value={addPhone}
              onChange={(e) => setAddPhone(digitsOnly(e.target.value))}
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