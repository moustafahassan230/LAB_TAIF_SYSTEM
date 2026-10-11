import "./LoginPage.css";

function QuickLoginSetup({
  setupBiometricAvailable,
  setupBiometric,
  setSetupBiometric,
  setupPinEnabled,
  setSetupPinEnabled,
  setupPin,
  setSetupPin,
  setupPinConfirm,
  setSetupPinConfirm,
  setupLoading,
  error,
  finishQuickLoginSetup,
  skipQuickLoginSetup,
}) {
  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        overflowY: "auto",
      }}
    >
      <div className="login-grid"></div>

      <div className="login-orb orb-one"></div>
      <div className="login-orb orb-two"></div>
      <div className="login-orb orb-three"></div>

      <div
        className="login-shell"
        style={{
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <section
          className="login-panel"
          style={{
            width: "100%",
            minHeight: "100vh",
          }}
        >
          <div
            className="login-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              margin: "auto",
            }}
          >
            <div className="mobile-brand">
              <div className="mobile-logo">
                🧪
              </div>

              <div>
                <strong>LAB TAIF</strong>

                <span>
                  MEDICAL CENTER
                </span>
              </div>
            </div>

            <div className="quick-setup-icon">
              🔐
            </div>

            <div className="quick-setup-heading">
              <span>
                FIRST DEVICE SETUP
              </span>

              <h2>
                Quick Login
              </h2>

              <p>
                Your first login was successful.
                Choose the quick login methods
                you want to use on this device.
              </p>
            </div>

            {/* FINGERPRINT */}

            {setupBiometricAvailable && (
              <button
                type="button"
                className={
                  setupBiometric
                    ? "setup-method active"
                    : "setup-method"
                }
                onClick={() =>
                  setSetupBiometric(
                    (previous) => !previous
                  )
                }
                disabled={setupLoading}
              >
                <div className="setup-method-icon">
                  👆
                </div>

                <div className="setup-method-text">
                  <strong>
                    Fingerprint
                  </strong>

                  <small>
                    Use your device fingerprint
                    to sign in quickly.
                  </small>
                </div>

                <div className="setup-check">
                  {setupBiometric ? "✓" : ""}
                </div>
              </button>
            )}

            {/* PIN */}

            <button
              type="button"
              className={
                setupPinEnabled
                  ? "setup-method active"
                  : "setup-method"
              }
              onClick={() =>
                setSetupPinEnabled(
                  (previous) => !previous
                )
              }
              disabled={setupLoading}
            >
              <div className="setup-method-icon">
                🔢
              </div>

              <div className="setup-method-text">
                <strong>
                  6-Digit PIN
                </strong>

                <small>
                  Sign in using your personal
                  6-digit PIN.
                </small>
              </div>

              <div className="setup-check">
                {setupPinEnabled ? "✓" : ""}
              </div>
            </button>

            {/* PIN FIELDS */}

            {setupPinEnabled && (
              <div className="setup-pin-fields">
                <div className="field">
                  <label>
                    Create PIN
                  </label>

                  <div className="input-wrap">
                    <span className="input-icon">
                      🔢
                    </span>

                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupPin}
                      onChange={(e) =>
                        setSetupPin(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="6 digits"
                      disabled={setupLoading}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>
                    Confirm PIN
                  </label>

                  <div className="input-wrap">
                    <span className="input-icon">
                      ✓
                    </span>

                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={setupPinConfirm}
                      onChange={(e) =>
                        setSetupPinConfirm(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="Repeat PIN"
                      disabled={setupLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="login-error">
                <span className="error-icon">
                  !
                </span>

                <span>
                  {error}
                </span>
              </div>
            )}

            <button
              type="button"
              className="login-button"
              onClick={finishQuickLoginSetup}
              disabled={setupLoading}
            >
              {setupLoading ? (
                <>
                  <span className="login-spinner"></span>

                  <span>
                    Saving...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Save Quick Login
                  </span>

                  <span className="login-arrow">
                    →
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              className="quick-back-button"
              onClick={skipQuickLoginSetup}
              disabled={setupLoading}
            >
              Skip for now
            </button>

            <div className="access-note">
              <div className="access-icon">
                ✓
              </div>

              <div>
                <strong>
                  Secure Device Login
                </strong>

                <small>
                  Your PIN and fingerprint access
                  are protected by the secure
                  storage of your device.
                </small>
              </div>
            </div>

            <small className="quick-setup-security">
              Your Supabase password is never
              stored for Quick Login.
            </small>
          </div>
        </section>
      </div>
    </div>
  );
}

export default QuickLoginSetup;