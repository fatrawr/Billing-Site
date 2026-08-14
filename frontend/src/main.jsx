import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./components/AuthContext.jsx";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfirmDialogProvider>
        <Toaster position="top-center" richColors={false} />
        <App />
      </ConfirmDialogProvider>
    </AuthProvider>
  </React.StrictMode>
);