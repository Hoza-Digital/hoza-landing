"use client";

import Image from "next/image";
import { useActionState, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowUpRight,
  Camera,
  Check,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
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
import { formatAvatarBytes, processUserAvatar } from "./avatar-processing";

const initialState: CreateUserState = { status: "idle", message: "" };

export type UserManagementRecord = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl: string | null;
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

function isEmailFormat(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function UserManagement({ users, creatableRoleOptions }: UserManagementProps) {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState({
    status: "idle" as "idle" | "processing" | "ready" | "error",
    dataUrl: "",
    fileName: "",
    message: "Optional · JPG, PNG or WebP · automatically cropped and optimized",
  });

  const passwordChecks = [
    { key: "length", label: "Minimum 8 characters", met: password.length >= 8 },
    { key: "uppercase", label: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
    { key: "lowercase", label: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
    { key: "alphabet", label: "At least 1 alphabetic character", met: /[A-Za-z]/.test(password) },
    { key: "numeric", label: "At least 1 numeric character", met: /[0-9]/.test(password) },
    { key: "special", label: "At least 1 special character", met: /[^A-Za-z0-9\s]/.test(password) },
  ];
  const nameIsValid = name.trim().length >= 2;
  const passwordIsValid = passwordChecks.every((check) => check.met);

  const flashInvalidField = (field: "name" | "email" | "password") => {
    const input = {
      name: nameInputRef.current,
      email: emailInputRef.current,
      password: passwordInputRef.current,
    }[field];
    if (!input) return;
    input.classList.remove("is-invalid-flash");
    void input.offsetWidth;
    input.classList.add("is-invalid-flash");
    window.setTimeout(() => input.classList.remove("is-invalid-flash"), 1150);
  };

  const validateUserFields = () => {
    const emailIsValid = isEmailFormat(email);
    if (!nameIsValid) flashInvalidField("name");
    if (!emailIsValid) flashInvalidField("email");
    if (!passwordIsValid) flashInvalidField("password");
    return nameIsValid && emailIsValid && passwordIsValid;
  };

  const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!validateUserFields()) event.preventDefault();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatar((current) => ({ ...current, status: "processing", message: "Preparing profile photo…" }));
    try {
      const processed = await processUserAvatar(file);
      setAvatar({
        status: "ready",
        dataUrl: processed.dataUrl,
        fileName: processed.fileName,
        message: `${formatAvatarBytes(processed.sizeBytes)} WebP · ready to save`,
      });
    } catch (error) {
      setAvatar({
        status: "error",
        dataUrl: "",
        fileName: "",
        message: error instanceof Error ? error.message : "The profile photo could not be prepared.",
      });
    }
  };

  const removeAvatar = () => {
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setAvatar({
      status: "idle",
      dataUrl: "",
      fileName: "",
      message: "Optional · JPG, PNG or WebP · automatically cropped and optimized",
    });
  };

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

        <form action={formAction} className="user-create-form" onSubmit={handleCreateSubmit}>
          <label>
            <span>Name *</span>
            <input
              ref={nameInputRef}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onInvalid={(event) => {
                event.preventDefault();
                flashInvalidField("name");
              }}
              minLength={2}
              maxLength={100}
              required
              placeholder="Full name"
              autoComplete="name"
              aria-invalid={name.length > 0 && !nameIsValid}
            />
          </label>
          <label>
            <span>Username (email) *</span>
            <div className="user-input-wrap">
              <Mail aria-hidden="true" />
              <input
                ref={emailInputRef}
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onInvalid={(event) => {
                  event.preventDefault();
                  flashInvalidField("email");
                }}
                pattern={"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}
                maxLength={254}
                required
                placeholder="name@company.com"
                autoComplete="off"
                aria-invalid={email.length > 0 && !isEmailFormat(email)}
              />
            </div>
          </label>
          <label>
            <span>Password *</span>
            <div className="user-input-wrap">
              <KeyRound aria-hidden="true" />
              <input
                ref={passwordInputRef}
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onInvalid={(event) => {
                  event.preventDefault();
                  flashInvalidField("password");
                }}
                minLength={8}
                maxLength={128}
                pattern={"(?=.*[A-Z])(?=.*[a-z])(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,128}"}
                required
                placeholder="Enter a case-sensitive password"
                autoComplete="new-password"
                aria-describedby="new-user-password-help"
                aria-invalid={password.length > 0 && !passwordIsValid}
                title="Use at least 8 characters with an uppercase letter, a lowercase letter, a numeric character and a special character."
              />
            </div>
            <ul id="new-user-password-help" className="user-password-rules">
              {passwordChecks.map((check) => (
                <li key={check.key} className={check.met ? "is-met" : ""}>{check.label}</li>
              ))}
            </ul>
          </label>
          <label>
            <span>Role *</span>
            <select name="role" required defaultValue={creatableRoleOptions[0]}>
              {creatableRoleOptions.map((role) => <option key={role} value={role}>{ADMIN_ROLE_LABELS[role]}</option>)}
            </select>
          </label>

          <div className="user-photo-field">
            <span>Profile photo <em>Optional</em></span>
            <div className={`user-photo-picker is-${avatar.status}`}>
              <div className="user-photo-preview" aria-hidden={!avatar.dataUrl}>
                {avatar.dataUrl ? (
                  <Image src={avatar.dataUrl} alt="Selected profile" width={64} height={64} unoptimized />
                ) : (
                  <Camera aria-hidden="true" />
                )}
              </div>
              <div>
                <label htmlFor="new-user-avatar" className="user-photo-select">
                  {avatar.status === "processing" ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
                  {avatar.dataUrl ? "Change photo" : "Choose photo"}
                </label>
                <input
                  ref={avatarInputRef}
                  id="new-user-avatar"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => void handleAvatarChange(event)}
                  disabled={avatar.status === "processing" || pending}
                />
                {avatar.dataUrl && (
                  <button type="button" className="user-photo-remove" onClick={removeAvatar}>
                    <X aria-hidden="true" /> Remove
                  </button>
                )}
                <small role="status" aria-live="polite">{avatar.message}</small>
              </div>
            </div>
            <input type="hidden" name="avatarData" value={avatar.dataUrl} />
            <input type="hidden" name="avatarFileName" value={avatar.fileName} />
          </div>

          <button
            type="submit"
            className="user-create-button"
            disabled={pending || avatar.status === "processing"}
            onClick={() => void validateUserFields()}
          >
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
              <div className={`user-avatar${user.avatarUrl ? " has-photo" : ""}`} aria-hidden="true">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" width={52} height={52} unoptimized />
                ) : initials(user.name)}
              </div>
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
