import { DoodleWave } from "./Doodles.jsx";

export default function AuthCard({ eyebrow, title, subtitle, children, footer, wide = false }) {
  return (
    <div className="auth-card">
      <div className={`auth-card__shell${wide ? " auth-card__shell--wide" : ""}`}>
        <div className="auth-card__inner">
          <div className="auth-card__header">
            {eyebrow && <div className="auth-shell__eyebrow">{eyebrow}</div>}
            <h1 className="auth-card__title">{title}</h1>
            <DoodleWave className="auth-shell__wave" />
            {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <div className="auth-card__footer">{footer}</div>}
      </div>
    </div>
  );
}
