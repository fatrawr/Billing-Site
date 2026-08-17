import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Home, Mail, LayoutGrid, Users, Coins, Landmark, Phone,
  CalendarDays, Settings, Receipt, FileBarChart, ChevronRight,
} from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

const NAV_TREE = [
  { type: "page", name: "Home", icon: Home, to: "/" },
  { type: "page", name: "Contact Us", icon: Mail, to: "/contact" },
  { type: "page", name: "Main Menu", icon: LayoutGrid, to: "/menu" },
  {
    type: "category", name: "Consumer Information", icon: Users,
    children: [
      { name: "Add New Consumer", to: "/menu/consumers/add" },
      { name: "Update Consumer Record", to: "/menu/consumers/update" },
      { name: "Display Consumer Record", to: "/menu/consumers/browse" },
    ],
  },
  { type: "page", name: "Society Charges", icon: Coins, to: "/menu/charges" },
  { type: "page", name: "Bank Information", icon: Landmark, to: "/menu/bank" },
  { type: "page", name: "Staff Phone Numbers", icon: Phone, to: "/menu/staff" },
  { type: "page", name: "Billing Schedule", icon: CalendarDays, to: "/menu/dates" },
  { type: "page", name: "Configuration Setting", icon: Settings, to: "/menu/config" },
  {
    type: "category", name: "Bills Processing", icon: Receipt,
    children: [
      {name: "Populate Payment Table", to: "/menu/bills/populate-payment", adminOnly: true },
      {name: "Populate Reading Table", to: "/menu/bills/populate-reading", adminOnly: true },
      { name: "Payment Entry", to: "/menu/bills/payment-entry", adminOnly: true },
      { name: "Reading Entry", to: "/menu/bills/reading-entry", adminOnly: true },
      {name: "Payment Posting", to: "/menu/bills/payment-posting", adminOnly: true },
      {name: "Reading Posting", to: "/menu/bills/reading-posting", adminOnly: true },
      { name: "Bill Generation", to: "/menu/bills/generate" },
    ],
  },
  {
    type: "category", name: "Reports", icon: FileBarChart,
    children: [
      { name: "List of Consumers", to: "/menu/reports/consumers" },
    ],
  },
];

function NavRow({ item, isAdmin, onNavigate }) {
  const [open, setOpen] = useState(false);

  if (item.type === "page") {
    if (item.adminOnly && !isAdmin) return null;
    const Icon = item.icon;
    return (
      <button type="button" className="side-nav__row" onClick={() => onNavigate(item.to)}>
        <Icon size={17} />
        <span>{item.name}</span>
      </button>
    );
  }

  const children = item.children.filter((c) => !c.adminOnly || isAdmin);
  if (children.length === 0) return null;

  const Icon = item.icon;
  return (
    <div className="side-nav__category">
      <button type="button" className="side-nav__row" onClick={() => setOpen((v) => !v)}>
        <Icon size={17} />
        <span className="side-nav__row-label">{item.name}</span>
        <ChevronRight size={15} className={`side-nav__chevron${open ? " side-nav__chevron--open" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {children.map((child) => (
              <button
                key={child.to}
                type="button"
                className="side-nav__row side-nav__row--sub"
                onClick={() => onNavigate(child.to)}
              >
                <span>{child.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SideNav({ open, onClose }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const goTo = (to) => { navigate(to); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="side-nav__backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="side-nav"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="side-nav__header">
              <span>Workspace</span>
              <button type="button" className="side-nav__close" onClick={onClose} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <nav className="side-nav__list">
              {NAV_TREE.map((item) => (
                <NavRow key={item.name} item={item} isAdmin={isAdmin} onNavigate={goTo} />
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}