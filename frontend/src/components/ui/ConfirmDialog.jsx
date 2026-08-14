import { createContext, useCallback, useContext, useRef, useState } from "react";
import { InfoIcon } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { message, title }
  const resolver = useRef(null);

  const confirmDialog = useCallback((message, opts = {}) => {
    setDialog({ message, title: opts.title || "Please confirm" });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result) => {
    setDialog(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {dialog && (
        <div className="confirm-overlay" role="presentation" onClick={() => close(false)}>
          <div
            className="confirm-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-card__icon">
              <InfoIcon size={18} />
            </div>
            <h2 id="confirm-title" className="confirm-card__title">{dialog.title}</h2>
            <p className="confirm-card__message">{dialog.message}</p>
            <div className="confirm-card__actions">
              <button className="btn btn-secondary" onClick={() => close(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => close(true)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return ctx;
}
