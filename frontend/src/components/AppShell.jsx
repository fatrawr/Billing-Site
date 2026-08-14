import { useEffect, useState } from "react";
import { DoodleStarTrio } from "./Doodles.jsx";
import { Clock } from "./Clock.jsx";
import SiteFooter from "./SiteFooter.jsx";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";

export default function AppShell({ subtitle, children }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="app-shell">
      <header className="app-shell__topbar no-print">
        <span className="app-shell__date">{dateStr}</span>
        <div className="app-shell__brand">
          <img src="/logo.png" alt="Society logo" className="app-shell__seal" />
          <span className="app-shell__org">{SOCIETY_NAME}</span>
          <DoodleStarTrio className="app-shell__doodle" />
        </div>
        <Clock className="app-shell__time" />
      </header>

      {subtitle && (
        <div className="app-shell__subbar no-print">
          <span>{subtitle}</span>
        </div>
      )}

      <main className="app-shell__body">{children}</main>
      <div className="no-print"><SiteFooter /></div>
    </div>
  );
}