import { Link } from "react-router-dom";
import AuthShell from "../components/Authshell.jsx";

export default function Welcome() {
  return (
    <AuthShell
      title="Welcome"
    >
      <p className="welcome-copy">Please sign up or log in to continue.</p>
      <div className="button-row">
        <Link className="btn btn-primary" to="/signup">Sign Up</Link>
        <Link className="btn btn-primary" to="/login">Log In</Link>

      </div>
    </AuthShell>
  );
}