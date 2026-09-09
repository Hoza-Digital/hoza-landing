"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Edit3, LoaderCircle, RefreshCw, Save, ShieldAlert, ShieldCheck, X } from "lucide-react";
import type { MatrixRow } from "@/lib/role-permissions";
import {
  resetPermissionsMatrix,
  updatePermissionsMatrix,
  type UpdateMatrixResult,
} from "./actions";

type PermissionsMatrixProps = {
  isSuperAdmin: boolean;
  initialRows: MatrixRow[];
};

const initialState: UpdateMatrixResult = { status: "idle", message: "" };

export function PermissionsMatrix({ isSuperAdmin, initialRows }: PermissionsMatrixProps) {
  const [rows, setRows] = useState<MatrixRow[]>(initialRows);
  const [isDirty, setIsDirty] = useState(false);
  const [state, formAction, pending] = useActionState(updatePermissionsMatrix, initialState);
  const [isResetting, startResetTransition] = useTransition();

  const togglePermission = (rowId: string, roleKey: "admin" | "marketing" | "writer") => {
    if (!isSuperAdmin) return;
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            [roleKey]: !row[roleKey],
          };
        }
        return row;
      }),
    );
    setIsDirty(true);
  };

  const handleReset = () => {
    if (!window.confirm("Are you sure you want to reset the permissions matrix to factory defaults?")) {
      return;
    }
    startResetTransition(async () => {
      const res = await resetPermissionsMatrix();
      if (res.status === "success") {
        setIsDirty(false);
      }
    });
  };

  return (
    <section className="role-matrix-section">
      <header className="role-matrix-header">
        <div>
          <p>Detailed matrix</p>
          <h2>PERMISSIONS MATRIX.</h2>
        </div>
        {isSuperAdmin && (
          <div className="role-matrix-super-badge">
            <Edit3 aria-hidden="true" />
            <span>Super Admin Edit Mode</span>
          </div>
        )}
      </header>

      {isSuperAdmin && (
        <div className="role-matrix-banner">
          <ShieldAlert aria-hidden="true" />
          <div>
            <strong>Interactive Mode Enabled</strong>
            <p>As a Super Admin, click on any role cell (Admin, Marketing, or Content Writer) to toggle permission state between <em>Allowed</em> and <em>None</em>.</p>
          </div>
        </div>
      )}

      {state.status !== "idle" && (
        <div className={`role-matrix-toast is-${state.status}`} role="status" aria-live="polite">
          {state.status === "success" ? <ShieldCheck aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
          <span>{state.message}</span>
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="matrixData" value={JSON.stringify(rows)} />

        <div className="role-matrix-table-wrap">
          <table className="role-matrix-table">
            <thead>
              <tr>
                <th>Feature / Capability</th>
                <th>Super Admin</th>
                <th>Admin</th>
                <th>Marketing</th>
                <th>Content Writer</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="role-matrix-feature">
                      <strong>{row.feature}</strong>
                      <span>{row.description}</span>
                    </div>
                  </td>
                  <td>
                    <div className="role-matrix-cell is-locked">
                      <span className="role-check"><Check aria-hidden="true" /> Full</span>
                      <small>Protected</small>
                    </div>
                  </td>
                  <td>
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        className={`role-toggle-btn ${row.admin ? "is-allowed" : "is-none"}`}
                        onClick={() => togglePermission(row.id, "admin")}
                        title={`Click to toggle Admin permission for ${row.feature}`}
                      >
                        {row.admin ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                        <span className="role-toggle-hint">Click to change</span>
                      </button>
                    ) : (
                      <div>
                        {row.admin ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        className={`role-toggle-btn ${row.marketing ? "is-allowed" : "is-none"}`}
                        onClick={() => togglePermission(row.id, "marketing")}
                        title={`Click to toggle Marketing permission for ${row.feature}`}
                      >
                        {row.marketing ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                        <span className="role-toggle-hint">Click to change</span>
                      </button>
                    ) : (
                      <div>
                        {row.marketing ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {isSuperAdmin ? (
                      <button
                        type="button"
                        className={`role-toggle-btn ${row.writer ? "is-allowed" : "is-none"}`}
                        onClick={() => togglePermission(row.id, "writer")}
                        title={`Click to toggle Writer permission for ${row.feature}`}
                      >
                        {row.writer ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                        <span className="role-toggle-hint">Click to change</span>
                      </button>
                    ) : (
                      <div>
                        {row.writer ? (
                          <span className="role-check"><Check aria-hidden="true" /> Allowed</span>
                        ) : (
                          <span className="role-cross"><X aria-hidden="true" /> None</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSuperAdmin && (
          <footer className="role-matrix-actions">
            <div>
              {isDirty ? (
                <span className="role-dirty-badge">● Unsaved matrix changes</span>
              ) : (
                <span className="role-clean-badge">✓ Permissions up to date</span>
              )}
            </div>
            <div className="role-matrix-buttons">
              <button
                type="button"
                className="role-reset-btn"
                onClick={handleReset}
                disabled={isResetting || pending}
              >
                {isResetting ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                Reset defaults
              </button>
              <button
                type="submit"
                className="role-save-btn"
                disabled={pending || !isDirty}
              >
                {pending ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {pending ? "Saving matrix…" : "Save matrix changes"}
              </button>
            </div>
          </footer>
        )}
      </form>
    </section>
  );
}
