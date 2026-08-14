import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { DoodleStarTrio } from "./Doodles.jsx";
import { Clock } from "./Clock.jsx";
import SiteFooter from "./SiteFooter.jsx";
import SideNav from "./SideNav.jsx";
import AnimatedTabs from "./ui/AnimatedTabs.jsx";
import { useAuth } from "./AuthContext.jsx";

const SOCIETY_NAME = "The Co-operative Engineers Town Society Ltd., Lahore";
const TABS = ["Home", "About", "Services", "Contact"];

export default function AppShell({ subtitle, children }) {
  const [now, setNow] = useState(new Date());
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const { status, logout: doLogout } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  const goToTab = (tab) => {
    if (tab === "Contact") return navigate("/contact");
    if (tab === "Home") return navigate("/");
    navigate(`/#${tab.toLowerCase()}`);
  };

  const logout = async () => { await doLogout(); navigate("/"); };

  return (
    <div className={`app-shell${status === "authed" ? " main-bg" : ""}`}>
      <header className="app-shell__topbar no-print">
        <span className="app-shell__date">{dateStr}</span>
        <div className="app-shell__brand">
          <img src="/logo.png" alt="Society logo" className="app-shell__seal" />
          <span className="app-shell__org">{SOCIETY_NAME}</span>
          <DoodleStarTrio className="app-shell__doodle" />
        </div>
        <Clock className="app-shell__time" />
      </header>

      {status === "authed" ? (
      <div className="app-shell__subbar no-print">
        <button type="button" className="app-shell__hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu">
          <Menu size={18} />
        </button>

        <AnimatedTabs tabs={TABS} defaultValue="Home" onSelect={goToTab} className="app-shell__tabs" />

        {subtitle && <span className="app-shell__subtitle">{subtitle}</span>}

        <button type="button" className="app-shell__logout" onClick={logout}>
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </div>
      ) : (
        subtitle && (
          <div className="app-shell__subbar app-shell__subbar--plain no-print">
            <span>{subtitle}</span>
          </div>
        )
      )}

      {status === "authed" && <SideNav open={navOpen} onClose={() => setNavOpen(false)} />}

      <main className="app-shell__body">{children}</main>
      <div className="no-print"><SiteFooter /></div>
    </div>
  );
}