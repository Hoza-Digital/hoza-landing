"use client";

import { ArrowUpRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { loginAdmin, type LoginState } from "./actions";

const initialState: LoginState = { error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <label>
        <span>Email</span>
        <div className="admin-input-wrap">
          <Mail aria-hidden="true" />
          <input
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            required
            autoFocus
          />
        </div>
      </label>

      <label>
        <span>Password</span>
        <div className="admin-input-wrap">
          <LockKeyhole aria-hidden="true" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Admin password"
            required
          />
        </div>
      </label>

      {state.error ? (
        <p className="admin-login-error" role="alert">
          SYSTEM / {state.error}
        </p>
      ) : null}

      <button className="admin-primary-button" type="submit" disabled={pending}>
        <span>{pending ? "Authenticating" : "Enter dashboard"}</span>
        {pending ? <LoaderCircle className="admin-spin" /> : <ArrowUpRight />}
      </button>
    </form>
  );
}
