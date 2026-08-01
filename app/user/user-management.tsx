"use client";

import { useActionState } from "react";
import {
  ArrowUpRight,
  Check,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/lib/admin-users";
import {
  changeUserRole,
  createUser,
  deleteUser,
  type CreateUserState,
} from "./actions";

const initialState: CreateUserState = { status: "idle", message: "" };

export type UserManagementRecord = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  createdAt: string;
  canChangeRole: boolean;
  canDelete: boolean;
  roleOptions: AdminRole[];
};

type UserManagementProps = {
  users: UserManagementRecord[];
  creatableRoleOptions: AdminRole[];
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  if (!value) return "Existing account";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function UserManagement({ users, creatableRoleOptions }: UserManagementProps) {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <div className="user-management-grid">
      <section className="user-create-panel" aria-labelledby="create-user-heading">
        <header>
          <span><UserPlus aria-hidden="true" /></span>
          <div>
            <p>Account provisioning</p>
            <h2 id="create-user-heading">ADD NEW USER.</h2>
          </div>
        </header>

        <form action={formAction} className="user-create-form">
          <label>
            <span>Name *</span>
            <input name="name" minLength={2} maxLength={100} required placeholder="Full name" autoComplete="name" />
          </label>
          <label>
            <span>Username (email) *</span>
            <div className="user-input-wrap">
              <Mail aria-hidden="true" />
              <input name="email" type="email" maxLength={254} required placeholder="name@company.com" autoComplete="off" />
            </div>
          </label>
          <label>
            <span>Password *</span>
            <div className="user-input-wrap">
              <KeyRound aria-hidden="true" />
              <input
                name="password"
                type="password"
                minLength={8}
                maxLength={128}
                required
                placeholder="Enter a case-sensitive password"
                autoComplete="new-password"
                aria-describedby="new-user-password-help"
              />
            </div>
            <small id="new-user-password-help">Minimum 8 characters. Uppercase and lowercase letters remain different.</small>
          </label>
          <label>
            <span>Role *</span>
            <select name="role" required defaultValue={creatableRoleOptions[0]}>
              {creatableRoleOptions.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}
            </select>
          </label>

          <button type="submit" className="user-create-button" disabled={pending}>
            {pending ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <ArrowUpRight aria-hidden="true" />}
            {pending ? "Creating user…" : "Create user"}
          </button>
        </form>

        {state.status !== "idle" && (
          <div className={`user-create-result is-${state.status}`} role="status" aria-live="polite">
            {state.status === "success" ? <Check aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            <p>{state.message}</p>
          </div>
        )}
      </section>

      <section className="user-directory" aria-labelledby="user-directory-heading">
        <header>
          <div>
            <p>Permission directory</p>
            <h2 id="user-directory-heading">ACTIVE USERS.</h2>
          </div>
          <span>{users.length} {users.length === 1 ? "USER" : "USERS"}</span>
        </header>

        <div className="user-directory-list">
          {users.map((user) => (
            <article key={user.id}>
              <div className="user-avatar" aria-hidden="true">{initials(user.name)}</div>
              <div className="user-identity">
                <span>{ADMIN_ROLE_LABELS[user.role]}</span>
                <h3>{user.name}</h3>
                <p><Mail aria-hidden="true" />{user.email}</p>
                <small>Added {formatDate(user.createdAt)}</small>
              </div>

              <div className="user-row-actions">
                {user.canChangeRole ? (
                  <form action={changeUserRole} className="user-role-form">
                    <input type="hidden" name="targetId" value={user.id} />
                    <label>
                      <span>Assigned role</span>
                      <select name="role" defaultValue={user.role}>
                        {user.roleOptions.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}
                      </select>
                    </label>
                    <button type="submit">Update role</button>
                  </form>
                ) : (
                  <div className="user-role-locked"><ShieldCheck aria-hidden="true" /><span>{ADMIN_ROLE_LABELS[user.role]}</span></div>
                )}

                {user.canDelete && (
                  <form
                    action={deleteUser}
                    onSubmit={(event) => {
                      if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) event.preventDefault();
                    }}
                  >
                    <input type="hidden" name="targetId" value={user.id} />
                    <button type="submit" className="user-delete-button"><Trash2 aria-hidden="true" />Delete user</button>
                  </form>
                )}
              </div>
            </article>
          ))}

          {!users.length && <p className="user-directory-empty">No users are visible for this role.</p>}
        </div>
      </section>
    </div>
  );
}
