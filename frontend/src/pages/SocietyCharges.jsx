import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../componenets/AuthContext.jsx";
import { api } from "../api.js";

const EMPTY_AMOUNTS = { "2K": "", "1K": "", "10M": "" };

export default function SocietyCharges() {
  const navigate = useNavigate();

  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [addVisible, setAddVisible] = useState(false);
  const [addDesc, setAddDesc] = useState("");
  const [addAmounts, setAddAmounts] = useState(EMPTY_AMOUNTS);

  const [editingDesc, setEditingDesc] = useState(null);
  const [editAmounts, setEditAmounts] = useState(EMPTY_AMOUNTS);
  const { isAdmin } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCharges();
      setCharges(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── F4 add/save, F10 back ──────────────────────────────────
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
  }, [addVisible, addDesc, addAmounts, navigate]);

  const digitsOnly = (value) => value.replace(/[^0-9]/g, "");

  const openAdd = () => {
    setAddVisible(true);
    setNotice("");
    setError("");
  };

  const submitAdd = async () => {
    const desc = addDesc.trim();
    if (!desc) return setError("Description is required.");
    const hasAny = Object.values(addAmounts).some((v) => v.trim() !== "");
    if (!hasAny) return setError("Enter at least one amount (2K, 1K, or 10 Marla).");

    try {
      await api.addCharge({ description: desc, amounts: addAmounts });
      setAddDesc("");
      setAddAmounts(EMPTY_AMOUNTS);
      setAddVisible(false);
      setError("");
      setNotice("Record added successfully!");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (row) => {
    setEditingDesc(row.description);
    setEditAmounts({ "2K": row["2K"], "1K": row["1K"], "10M": row["10M"] });
    setNotice("");
    setError("");
  };

  const cancelEdit = () => setEditingDesc(null);

  const saveEdit = async (description) => {
    try {
      await api.updateCharge({ description, amounts: editAmounts });
      setEditingDesc(null);
      setNotice("Record updated successfully!");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCharge = async (description) => {
    if (!window.confirm(`Delete all entries for '${description}'?`)) return;
    try {
      await api.deleteCharge({ description });
      setNotice("Deleted successfully!");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard dashboard--wide">
      <h1 className="dashboard__title">Society Charges Details</h1>
      <p className="dashboard__subtitle">Manage per-category charge amounts</p>

      {error && <div className="flash error">{error}</div>}
      {notice && <div className="flash success">{notice}</div>}

      <div className="charges-table">
        <div className="charges-table__header">
          <span>Description</span>
          <span>2K</span>
          <span>1K</span>
          <span>10 Marla</span>
          <span>Actions</span>
        </div>

        {loading && <div className="charges-table__empty">Loading…</div>}

        {!loading && charges.length === 0 && (
          <div className="charges-table__empty">No data found.</div>
        )}

        {!loading && charges.map((row) => {
          const isEditing = editingDesc === row.description;
          return (
            <div className={`charges-row ${isEditing ? "charges-row--editing" : ""}`} key={row.description}>
              {isEditing ? (
                <>
                  <span className="charges-row__desc">{row.description}</span>
                  {["2K", "1K", "10M"].map((cat) => (
                    <input
                      key={cat}
                      className="charges-row__input"
                      value={editAmounts[cat]}
                      onChange={(e) =>
                        setEditAmounts((a) => ({ ...a, [cat]: digitsOnly(e.target.value) }))
                      }
                    />
                  ))}
                  <span className="charges-row__actions">
                    <button className="btn-chip btn-chip--save" onClick={() => saveEdit(row.description)}>Save</button>
                    <button className="btn-chip btn-chip--cancel" onClick={cancelEdit}>Cancel</button>
                  </span>
                </>
              ) : (
                <>
                  <span className="charges-row__desc">{row.description}</span>
                  <span>{row["2K"] || "—"}</span>
                  <span>{row["1K"] || "—"}</span>
                  <span>{row["10M"] || "—"}</span>
                  <span className="charges-row__actions">
                    {isAdmin && (
                      <button className="btn-chip btn-chip--update" onClick={() => startEdit(row)}>Update</button>
                    )}
                    {isAdmin && (
                      <button className="btn-chip btn-chip--delete" onClick={() => removeCharge(row.description)}>Delete</button>
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
              className="charges-row__input charges-row__input--desc"
              placeholder="Description"
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              autoFocus
            />
            {["2K", "1K", "10M"].map((cat) => (
              <input
                key={cat}
                className="charges-row__input"
                placeholder={cat}
                value={addAmounts[cat]}
                onChange={(e) => setAddAmounts((a) => ({ ...a, [cat]: digitsOnly(e.target.value) }))}
              />
            ))}
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