import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Play } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <section className="hero" >
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

          <motion.nav variants={navVariants} className="hero__nav">
            <div className="hero__nav-brand">
              <img src="/logo.png" alt="Society logo" />
              <span>{SOCIETY_NAME}</span>
            </div>

            <AnimatedTabs tabs={TABS} defaultValue="Home" className="hero__nav-tabs" />

            <div className="hero__nav-right">
              <Clock className="hero__clock" />
              <Link className="hero__login-btn" to="/login">
                <ShieldCheck size={15} />
                Login as Admin
              </Link>
            </div>
          </motion.nav>

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
                  <motion.a variants={ctaVariants} href="#about" aria-label="Learn more" className="hero__cta-icon">
                    <Play size={15} style={{ marginLeft: 2 }} />
                  </motion.a>
                </motion.div>
              ) : (
                <form className="generate-bill-card" onSubmit={submit}>
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

      <SiteFooter />
    </div>
  );
}
