
import { useState } from "react";
import "./ChangePassword.css";
import { supabase } from "./lib/supabase.js";

function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------
      // 1. Get CURRENT Supabase session
      // --------------------------------------------------
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("LAB TAIF: Current session:", session);
      console.log("LAB TAIF: Session error:", sessionError);

      if (sessionError) {
        console.error(
          "LAB TAIF: Session error:",
          sessionError
        );

        setError(
          sessionError.message ||
            "Unable to verify your current session."
        );

        setLoading(false);
        return;
      }

      if (!session || !session.user) {
        console.error(
          "LAB TAIF: No active Supabase session."
        );

        setError(
          "Your login session is not active. Please logout and login again."
        );

        setLoading(false);
        return;
      }

      console.log(
        "LAB TAIF: Authenticated user ID:",
        session.user.id
      );

      console.log(
        "LAB TAIF: Authenticated user email:",
        session.user.email
      );

      // --------------------------------------------------
      // 2. Update password in Supabase Auth
      // --------------------------------------------------
      console.log(
        "LAB TAIF: Sending password update to Supabase..."
      );

      const {
        data: updateData,
        error: updateError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log(
        "LAB TAIF: updateUser data:",
        updateData
      );

      console.log(
        "LAB TAIF: updateUser error:",
        updateError
      );

      // --------------------------------------------------
      // 3. IMPORTANT:
      //    Only show success if Supabase returned NO error
      // --------------------------------------------------
      if (updateError) {
        console.error(
          "LAB TAIF: PASSWORD UPDATE FAILED:",
          updateError
        );

        setError(
          updateError.message ||
            "Supabase could not change your password."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // 4. Verify that we still have a valid session
      // --------------------------------------------------
      const {
        data: {
          session: verifiedSession,
        },
      } = await supabase.auth.getSession();

      console.log(
        "LAB TAIF: Session after password update:",
        verifiedSession
      );

      if (!verifiedSession) {
        setError(
          "Password update could not be verified. Please login again."
        );

        setLoading(false);
        return;
      }

      // --------------------------------------------------
      // 5. REAL SUCCESS
      // --------------------------------------------------
      console.log(
        "LAB TAIF: PASSWORD UPDATE COMPLETED SUCCESSFULLY"
      );

      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Password changed successfully. Please logout and login again using your new password."
      );

      setLoading(false);

    } catch (err) {
      console.error(
        "LAB TAIF: Unexpected password change error:",
        err
      );

      setError(
        err?.message ||
          "An unexpected error occurred while changing your password."
      );

      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">

      <div className="change-password-card">

        <div className="change-password-header">

          <div className="change-password-icon">
            🔐
          </div>

          <div>

            <span className="change-password-eyebrow">
              ACCOUNT SECURITY
            </span>

            <h2>
              Change Password
            </h2>

            <p>
              Update your LAB TAIF account password securely.
            </p>

          </div>

        </div>

        <div className="password-security-note">

          <div className="security-note-icon">
            ✓
          </div>

          <div>

            <strong>
              Secure Account Protection
            </strong>

            <span>
              Your password is managed securely by
              Supabase Authentication.
            </span>

          </div>

        </div>

        <form
          className="change-password-form"
          onSubmit={handleChangePassword}
        >

          <div className="password-field">

            <label htmlFor="new-password">
              New Password
            </label>

            <div className="password-input-wrap">

              <span className="password-field-icon">
                🔒
              </span>

              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-show-button"
                onClick={() =>
                  setShowNew((previous) => !previous)
                }
                disabled={loading}
                aria-label={
                  showNew
                    ? "Hide new password"
                    : "Show new password"
                }
              >
                {showNew ? "🙈" : "👁"}
              </button>

            </div>

            <small className="password-hint">
              Minimum 6 characters
            </small>

          </div>

          <div className="password-field">

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <div className="password-input-wrap">

              <span className="password-field-icon">
                ✓
              </span>

              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={loading}
              />

              <button
                type="button"
                className="password-show-button"
                onClick={() =>
                  setShowConfirm((previous) => !previous)
                }
                disabled={loading}
                aria-label={
                  showConfirm
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirm ? "🙈" : "👁"}
              </button>

            </div>

          </div>

          {error && (
            <div className="change-password-message error">
              <span className="message-icon">
                !
              </span>

              <span>
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="change-password-message success">
              <span className="message-icon">
                ✓
              </span>

              <span>
                {success}
              </span>
            </div>
          )}

          <button
            type="submit"
            className="change-password-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="change-password-spinner"></span>

                <span>
                  Updating Password...
                </span>
              </>
            ) : (
              <>
                <span>
                  Change Password
                </span>

                <span className="change-password-arrow">
                  →
                </span>
              </>
            )}

          </button>

        </form>

        <div className="password-rules">

          <div className="password-rules-title">
            <span>◈</span>
            <strong>Password Requirements</strong>
          </div>

          <div className="password-rule">
            <span>✓</span>
            <span>At least 6 characters</span>
          </div>

          <div className="password-rule">
            <span>✓</span>
            <span>Use a password that you can remember</span>
          </div>

          <div className="password-rule">
            <span>✓</span>
            <span>Do not share your password with others</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default ChangePassword;
