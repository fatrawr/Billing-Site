import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tile from "../components/Tile.jsx";
import { useAuth } from "../components/AuthContext.jsx"; 

const ACCENTS = {
  forest: "#1c6b37",
  navy: "#2c3f68",
  gold: "#9c7a3f",
};

const ITEMS = [
  { number: 1, title: "Consumer Information", subtitle: "Manage consumer records",   accent: ACCENTS.forest, to: "/menu/consumers" },
  { number: 2, title: "Society Charges",      subtitle: "Configure charge settings", accent: ACCENTS.navy,   to: "/menu/charges" },
  { number: 3, title: "Bank Information",     subtitle: "Manage bank details",       accent: ACCENTS.forest, to: "/menu/bank" },
  { number: 4, title: "Staff Phone Numbers",  subtitle: "Contact directory",         accent: ACCENTS.navy,   to: "/menu/staff" },
  { number: 5, title: "Billing Schedule",     subtitle: "Set billing dates",         accent: ACCENTS.forest, to: "/menu/dates" },
  { number: 6, title: "Configuration Setting",   subtitle: "Enter configurations",   accent: ACCENTS.navy,   to: "/menu/config" },
  { number: 7, title: "Bills Processing",     subtitle: "Bills Process",             accent: ACCENTS.forest, to: "/menu/bills" },
  { number: 8, title: "Billing Reports",      subtitle: "Consumer & billing reports", accent: ACCENTS.navy,   to: "/menu/reports" },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const { logout: doLogout } = useAuth();

  const logout = async () => { await doLogout(); navigate("/"); };

  useEffect(() => {
    const onKey = async (e) => {
      const item = ITEMS.find((i) => e.key === String(i.number));
      if (item) navigate(item.to);
      if (e.key === "F10" || e.key === "Escape") {
        e.preventDefault();
        await logout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="dashboard">
      
      <h1 className="dashboard__title">Main Menu</h1>
      <p className="dashboard__subtitle">Select an option to continue</p>

      <div className="tile-grid tile-grid--two-col">
        {ITEMS.map((item) => (
          <Tile key={item.number} {...item} />
        ))}
      </div>

      <p className="dashboard__hint">Press the number key, or click an option</p>

      <div className="dashboard__footer">
        <button type="button" className="btn btn-primary btn-exit" onClick={logout}>
          Log Out&nbsp;&nbsp;<span className="btn-exit__key">Esc</span>
        </button>
      </div>
    </div>
  );
}