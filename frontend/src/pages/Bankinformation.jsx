import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useConfirm } from "../components/ui/ConfirmDialog.jsx";
import { notifySuccess, notifyError } from "../lib/toast.js";
import { useAuth } from "../components/AuthContext.jsx";


export default function BankInformation() {
  const confirmDialog = useConfirm();
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addVisible, setAddVisible] = useState(false);
  const [addName, setAddName] = useState("");
  const [addAcct, setAddAcct] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAcct, setEditAcct] = useState("");
    const { isAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBanks(await api.getBanks());
    } catch (err) {
      notifyError("Could not load banks", err.message);
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
  }, [addVisible, addName, addAcct, navigate]);

  const digitsOnly = (v) => v.replace(/[^0-9]/g, "").slice(0, 16);

  const openAdd = () => { setAddVisible(true); };

  const submitAdd = async () => {
    try {
      await api.addBank({ bankName: addName.trim(), accountNo: addAcct.trim() });
      setAddName(""); setAddAcct(""); setAddVisible(false);
      notifySuccess("Record added successfully");
      load();
    } catch (err) {
      notifyError("Add failed", err.message);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditName(row.bankName);
    setEditAcct(row.accountNo);
  };

  const saveEdit = async (id) => {
    try {
      await api.updateBank({ id, bankName: editName.trim(), accountNo: editAcct.trim() });
      setEditingId(null);
      notifySuccess("Updated successfully");
      load();
    } catch (err) {
      notifyError("Update failed", err.message);
    }
  };

  const removeBank = async (id) => {
    if (!(await confirmDialog("Delete this record?"))) return;
    try {
      await api.deleteBank({ id });
      notifySuccess("Deleted successfully");
      load();
    } catch (err) {
      notifyError("Delete failed", err.message);
    }
  };

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Bank Information</h1>
      <p className="dashboard__subtitle">Bank accounts consumers can pay bills into</p>

      <div className="charges-table charges-table--staff">
        <div className="charges-table__header">
          <span>Bank Name</span>
          <span>Account #</span>
          <span>Actions</span>
        </div>

        {loading && <div className="charges-table__empty">Loading…</div>}
        {!loading && banks.length === 0 && (
          <div className="charges-table__empty">No data found.</div>
        )}

        {!loading && banks.map((row) => {
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
                    value={editAcct}
                    onChange={(e) => setEditAcct(digitsOnly(e.target.value))}
                  />
                  <span className="charges-row__actions">
                    <button className="btn-chip btn-chip--save" onClick={() => saveEdit(row.id)}>Save</button>
                    <button className="btn-chip btn-chip--cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </span>
                </>
              ) : (
                <>
                  <span className="charges-row__desc">{row.bankName}</span>
                  <span>{row.accountNo}</span>
                  <span className="charges-row__actions">
                    {isAdmin && (<button className="btn-chip btn-chip--update" onClick={() => startEdit(row)}>Update</button>)}
                    {isAdmin && (<button className="btn-chip btn-chip--delete" onClick={() => removeBank(row.id)}>Delete</button>)}
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
              placeholder="Bank name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              autoFocus
            />
            <input
              className="charges-row__input"
              placeholder="16-digit account number"
              value={addAcct}
              onChange={(e) => setAddAcct(digitsOnly(e.target.value))}
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