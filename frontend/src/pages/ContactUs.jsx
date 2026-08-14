import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Headphones, Wallet, MapPin, Megaphone } from "lucide-react";
import AnimatedTabs from "../components/ui/AnimatedTabs.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { Clock } from "../components/Clock.jsx";

const TABS = ["Home", "About", "Services", "Contact"];

const CONTACT_METHODS = [
  {
    id: "support",
    icon: Headphones,
    title: "Consumer Support",
    description: "Questions about your bill, meter reading, or account.",
    actionLabel: "support@cets.org.pk",
    actionUrl: "mailto:support@cets.org.pk",
  },
  {
    id: "billing",
    icon: Wallet,
    title: "Billing & Payments",
    description: "Help with payments, arrears, or surcharge disputes.",
    actionLabel: "billing@cets.org.pk",
    actionUrl: "mailto:billing@cets.org.pk",
  },
  {
    id: "office",
    icon: MapPin,
    title: "Society Office",
    description: "Visit us in person for in-office assistance.",
    actionLabel: "Get Directions",
    actionUrl: "https://maps.google.com/?q=Lahore",
  },
  {
    id: "feedback",
    icon: Megaphone,
    title: "Feedback & Complaints",
    description: "Share concerns or suggestions with the management committee.",
    actionLabel: "feedback@cets.org.pk",
    actionUrl: "mailto:feedback@cets.org.pk",
  },
];

export default function ContactUs() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToTab = (tab) => {
    if (tab === "Contact") return;
    if (tab === "Home") return navigate("/");
    navigate(`/#${tab.toLowerCase()}`);
  };

  return (
    <div className="landing">
      <nav className="hero__nav hero__nav--plain">
        <div className="hero__nav-brand">
          <img src="/logo.png" alt="Society logo" />
          <span>CETS</span>
        </div>

        <AnimatedTabs tabs={TABS} defaultValue="Contact" onSelect={goToTab} className="hero__nav-tabs" />

        <div className="hero__nav-right">
          <Clock className="hero__clock" />
          <Link className="hero__login-btn" to="/login">
            <ShieldCheck size={15} />
            Login as Admin
          </Link>
        </div>
      </nav>

      <section className="site-section">
        <div className="site-section__inner">
          <div className="site-section__eyebrow">Connect With Us</div>
          <h2 className="site-section__title">How can we assist you today?</h2>
          <p className="site-section__body">
            Reach out to the right team at CETS — from billing questions to general feedback,
            we're here to help.
          </p>
        </div>
      </section>

      <section className="site-section site-section--alt">
        <div className="contact-grid">
          {CONTACT_METHODS.map(({ id, icon: Icon, title, description, actionLabel, actionUrl }) => (
            <div key={id} className="contact-card">
              <div className="contact-card__icon">
                <Icon size={22} />
              </div>
              <h3 className="contact-card__title">{title}</h3>
              <p className="contact-card__desc">{description}</p>
              <a className="contact-card__action" href={actionUrl} target="_blank" rel="noreferrer">
                {actionLabel}
              </a>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
