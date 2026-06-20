"use client";

import { useActionState } from "react";
import { loginAction } from "../lib/actions";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});
  return (
    <form action={formAction} className="card">
      {state.error && <p className="error">{state.error}</p>}
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton>Log in</SubmitButton>
    </form>
  );
}

