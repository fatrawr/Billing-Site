import { DoodleSparkle, DoodleWave } from "./Doodles.jsx";

export default function AuthShell({ eyebrow, title, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__header">
        {eyebrow && <div className="auth-shell__eyebrow">{eyebrow}</div>}
        <h1 className="auth-shell__title">{title}</h1>
        <DoodleWave className="auth-shell__wave" />
      </div>

      <div className="auth-shell__seal-wrap">
        <div className="auth-shell__seal" aria-hidden="true">
          <img src="/logo.png" alt="" className="auth-shell__seal-img" />
        </div>
        <DoodleSparkle className="auth-shell__sparkle" />
      </div>

      <div className="auth-shell__body">
        {children}
        {footer && <div className="auth-shell__footer">{footer}</div>}
      </div>
    </div>
  );
}