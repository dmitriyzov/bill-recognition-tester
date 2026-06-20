import { LoginForm } from "../../components/LoginForm";
import { APP_NAME } from "../../lib/config";

export default function LoginPage() {
  return (
    <main className="container narrow">
      <h1>{APP_NAME}</h1>
      <p className="muted">Enter the shared tester password.</p>
      <LoginForm />
    </main>
  );
}

