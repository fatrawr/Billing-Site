import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowRight, Play, FileText, Gauge, Wallet, Users, X } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../api.js";
import AnimatedTabs from "../components/ui/AnimatedTabs.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { Clock } from "../components/Clock.jsx";
import { notifyError } from "../lib/toast.js";

const SOCIETY_NAME = "CETS";
const TABS = ["Home", "About", "Services", "Contact"];

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const bgVariants = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 50, damping: 16, mass: 1.5 } },
};
const navVariants = {
  hidden: { opacity: 0, y: -24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 20, mass: 0.8 } },
};
const copyVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 28, mass: 0.9 } },
};
const ctaGroupVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.15, delayChildren: 0.05 } } };
const ctaVariants = {
  hidden: { opacity: 0, scale: 0.78, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 22, mass: 0.7 } },
};

export default function Welcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const goToTab = (tab) => {
    if (tab === "Contact") return navigate("/contact");
    if (tab === "Home") return window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById(tab.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
  };

  const digitsOnly = (v) => v.replace(/[^0-9]/g, "").slice(0, 9);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (refNo.length !== 9) return setError("Reference number must be exactly 9 digits.");
    if (!month) return setError("Please select the bill month.");

    setLoading(true);
    try {
      const { bills } = await api.previewBills({ from: refNo, month });
      navigate("/menu/bills/preview", { state: { bills } });
    } catch (err) {
      setError(err.message);
      notifyError("Could not generate bill", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing">
      <div className="landing__nav-wrap">
        <motion.nav
          className="hero__nav"
          initial="hidden"
          animate="visible"
          variants={navVariants}
        >
          <div className="hero__nav-brand">
            <img src="/logo.png" alt="Society logo" />
            <span>{SOCIETY_NAME}</span>
          </div>

          <AnimatedTabs tabs={TABS} defaultValue="Home" onSelect={goToTab} className="hero__nav-tabs" />

          <div className="hero__nav-right">
            <Clock className="hero__clock" />
            <Link className="hero__login-btn" to="/login">
              <ShieldCheck size={15} />
              Login as Admin
            </Link>
          </div>
        </motion.nav>
      </div>

      <section className="hero">
        <motion.div
          className="hero__inner"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <motion.img
            variants={bgVariants}
            src="/sparkle-bg.jpg"
            alt=""
            className="hero__bg"
          />

          <div className="hero__body">
            <div className="hero__copy">
              <motion.h1 variants={copyVariants} className="hero__title">
                <span className="block">Bill management,</span>
                <span className="block">made <em>effortless</em>.</span>
              </motion.h1>

              <motion.p variants={copyVariants} className="hero__subtitle">
                Look up and print a consumer bill in seconds — no login required for members.
              </motion.p>

              {!showForm ? (
                <motion.div variants={ctaGroupVariants} className="hero__cta-row">
                  <motion.button variants={ctaVariants} className="hero__cta-primary" onClick={() => setShowForm(true)}>
                    Generate Bill
                  </motion.button>
                  <motion.button variants={ctaVariants} aria-label="Generate a bill" className="hero__cta-icon" onClick={() => setShowForm(true)}>
                    <Play size={15} style={{ marginLeft: 2 }} />
                  </motion.button>
                </motion.div>
              ) : (
                <form className="generate-bill-card" onSubmit={submit}>
                  <button
  type="button"
  className="generate-bill-card__close"
  aria-label="Close"
  onClick={() => { setShowForm(false); setError(""); setRefNo(""); }}
>
  <X size={16} />
</button>
                  {error && <div className="flash error">{error}</div>}

                  <div className="field">
                    <label>Reference Number (9 digits)</label>
                    <input
                      value={refNo}
                      onChange={(e) => setRefNo(digitsOnly(e.target.value))}
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="e.g. 000012345"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="field">
                    <label>Bill Month</label>
                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
                  </div>

                  <div className="button-row">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? "Generating…" : "Generate Bill"}&nbsp;<ArrowRight size={15} style={{ verticalAlign: -2 }} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="about" className="site-section">
        <div className="site-section__inner">
          <div className="site-section__eyebrow">About Us</div>
          <h2 className="site-section__title">Who we are</h2>
          <p className="site-section__body">
            CETS is a member-owned co-operative society serving engineers across Lahore. This portal
            keeps consumer records, meter readings, and monthly billing transparent and easy to reach
            for every member — whether you're settling a bill or checking your account.
          </p>
        </div>
      </section>

      <section id="services" className="site-section site-section--alt">
        <div className="site-section__inner">
          <div className="site-section__eyebrow">Services</div>
          <h2 className="site-section__title">What you can do here</h2>
          <div className="service-grid">
            <div className="service-card">
              <FileText size={20} />
              <h3>Bill Generation</h3>
              <p>Look up and print a consumer's monthly bill by reference number.</p>
            </div>
            <div className="service-card">
              <Gauge size={20} />
              <h3>Meter Readings</h3>
              <p>Monthly readings are logged and tied directly to each consumer's bill.</p>
            </div>
            <div className="service-card">
              <Wallet size={20} />
              <h3>Payments</h3>
              <p>Payment records, arrears, and surcharges are tracked automatically.</p>
            </div>
            <div className="service-card">
              <Users size={20} />
              <h3>Consumer Records</h3>
              <p>A single source of truth for every member's account and meter details.</p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
