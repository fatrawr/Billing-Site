import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Tile from "../components/Tile.jsx";

const ACCENTS = {
  forest: "#1c6b37",
  navy: "#2c3f68",
};

const ITEMS = [
  { number: 1, title: "List of Consumers", subtitle: "with meter details", accent: ACCENTS.forest, to: "/menu/reports/consumers" },
];

export default function ReportsMenu() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      const item = ITEMS.find((i) => e.key === String(i.number));
      if (item) navigate(item.to);
      if (e.key === "F10") {
        e.preventDefault();
        navigate("/menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <div className="dashboard dashboard--narrow">
      <h1 className="dashboard__title">Reports</h1>
      <p className="dashboard__subtitle">Select a report to continue</p>

      <div className="tile-grid tile-grid--one-col">
        {ITEMS.map((item) => (
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
