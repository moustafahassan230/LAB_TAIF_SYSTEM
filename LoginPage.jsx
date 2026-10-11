import { useEffect, useState } from "react";
import "./LoginPage.css";
import { supabase } from "./lib/supabase.js";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";

/*
 * ============================================================
 * LAB TAIF QUICK LOGIN
 * ============================================================
 *
 * NO SUPABASE REFRESH TOKEN
 *
 * Quick Login uses secure native credentials stored on the
 * device.
 *
 * Fingerprint:
 *   Android biometric verification -> secure credentials
 *
 * PIN:
 *   6 digit PIN -> secure credentials
 *
 * The Supabase username/password is NEVER stored in:
 *   - localStorage
 *   - sessionStorage
 *
 * It is stored only through NativeBiometric secure storage.
 * ============================================================
 */

const BIOMETRIC_LOGIN_SERVER =
  "lab-taif-biometric-login-v5";

const PIN_LOGIN_SERVER =
  "lab-taif-pin-login-v5";

const PIN_SERVER =
  "lab-taif-pin-v5";

const QUICK_LOGIN_PENDING_KEY =
  "LAB_TAIF_QUICK_LOGIN_SETUP_PENDING";

const QUICK_LOGIN_CONFIGURED_KEY =
  "LAB_TAIF_QUICK_LOGIN_CONFIGURED";

/* ============================================================
   ICONS
   ============================================================ */

function FingerprintIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 5.5c-8.8 0-16 6.8-16 15.3 0 2.8.8 5.5 2.2 7.8"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M24 10.5c-5.9 0-10.7 4.5-10.7 10.3 0 3.1 1 5.8 2.2 8.4 1.3 2.9 2.5 5.6 2.5 9"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M24 15.5c-3.1 0-5.6 2.4-5.6 5.4 0 3.8 2.8 6.7 3.4 10.7.4 2.3.1 4.1-.4 5.9"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M24 20.4c.6 0 1.1.5 1.1 1.1 0 4.8 4.8 8.1 4.8 14.4 0 2.4-.5 4.4-1.2 6.4"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M30.2 13.4c4 2.1 6.7 6.2 6.7 11 0 5.3 2.1 8.6 2.1 13.4 0 1.8-.2 3.2-.6 4.7"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
      <path
        d="M34.3 9.2c5.1 3.4 8.2 8.9 8.2 15.2 0 3.3.9 5.9 1.4 8.1"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KeypadIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="5"
        width="32"
        height="38"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="17" cy="16" r="2" fill="currentColor" />
      <circle cx="24" cy="16" r="2" fill="currentColor" />
      <circle cx="31" cy="16" r="2" fill="currentColor" />
      <circle cx="17" cy="24" r="2" fill="currentColor" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
      <circle cx="31" cy="24" r="2" fill="currentColor" />
      <circle cx="17" cy="32" r="2" fill="currentColor" />
      <circle cx="24" cy="32" r="2" fill="currentColor" />
      <circle cx="31" cy="32" r="2" fill="currentColor" />
    </svg>
  );
}

function LabIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 6h12M21 6v12.5L10.5 36.2A4.7 4.7 0 0 0 14.6 43h18.8a4.7 4.7 0 0 0 4.1-6.8L27 18.5V6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4 32h19.2M17.2 27.2c2.7 1.2 5.2 1.6 7.3 1.6 2.6 0 4.6-.5 6.5-1.6"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 5l15 6v11.2c0 9.5-6 17.7-15 20.8C15 39.9 9 31.7 9 22.2V11l15-6Z"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinejoin="round"
      />
      <path
        d="m16.5 24 5 5 10.5-11"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 3 18 18M10.6 5.9A10.8 10.8 0 0 1 12 5.8c6.1 0 9.5 6.2 9.5 6.2a17 17 0 0 1-3.1 3.8M6.4 6.5C3.8 8.1 2.5 12 2.5 12s3.4 6 9.5 6c1.1 0 2.1-.2 3-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [biometricAvailable, setBiometricAvailable] =
    useState(false);

  const [biometricSaved, setBiometricSaved] =
    useState(false);

  const [pinSaved, setPinSaved] =
    useState(false);

  const [quickLoginChecked, setQuickLoginChecked] =
    useState(false);

  const [loginMode, setLoginMode] =
    useState("password");

  const [pin, setPin] =
    useState("");

  const [pinLoading, setPinLoading] =
    useState(false);

  const [setupOpen, setSetupOpen] =
    useState(false);

  const [setupUser, setSetupUser] =
    useState(null);

  const [setupPin, setSetupPin] =
    useState("");

  const [setupPinConfirm, setSetupPinConfirm] =
    useState("");

  const [setupBiometricAvailable, setSetupBiometricAvailable] =
    useState(false);

  const [setupBiometric, setSetupBiometric] =
    useState(false);

  const [setupPinEnabled, setSetupPinEnabled] =
    useState(true);

  const [setupLoading, setSetupLoading] =
    useState(false);

  /*
   * IMPORTANT
   *
   * This prevents the Quick Login landing screen from
   * immediately appearing when the user explicitly chooses
   * Username & Password.
   */
  const [forcePasswordLogin, setForcePasswordLogin] =
    useState(false);

  /* ============================================================
     INITIALIZE
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!Capacitor.isNativePlatform()) {
        if (mounted) {
          setQuickLoginChecked(true);
        }

        return;
      }

      try {
        await checkQuickLogin();
      } catch (err) {
        console.error(
          "LAB TAIF: Quick Login initialization error:",
          err
        );

        if (mounted) {
          setQuickLoginChecked(true);
        }
      }
    };

    void init();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     CHECK QUICK LOGIN
     ============================================================ */

  const checkQuickLogin = async () => {
    if (!Capacitor.isNativePlatform()) {
      setQuickLoginChecked(true);
      return;
    }

    let available = false;
    let savedBiometric = false;
    let savedPin = false;

    /* Fingerprint availability */

    try {
      const result =
        await NativeBiometric.isAvailable({
          useFallback: false,
        });

      available =
        result?.isAvailable === true;

      setBiometricAvailable(available);
    } catch (err) {
      console.warn(
        "LAB TAIF: Fingerprint availability check failed:",
        err
      );

      setBiometricAvailable(false);
    }

    /* Fingerprint credentials */

    try {
      const result =
        await NativeBiometric.isCredentialsSaved({
          server: BIOMETRIC_LOGIN_SERVER,
        });

      savedBiometric =
        result?.isSaved === true;

      setBiometricSaved(savedBiometric);
    } catch {
      setBiometricSaved(false);
    }

    /* PIN credentials */

    try {
      const result =
        await NativeBiometric.isCredentialsSaved({
          server: PIN_SERVER,
        });

      savedPin =
        result?.isSaved === true;

      setPinSaved(savedPin);
    } catch {
      setPinSaved(false);
    }

    if (
      savedBiometric ||
      savedPin
    ) {
      localStorage.setItem(
        QUICK_LOGIN_CONFIGURED_KEY,
        "true"
      );
    } else {
      localStorage.removeItem(
        QUICK_LOGIN_CONFIGURED_KEY
      );
    }

    setQuickLoginChecked(true);
  };

  /* ============================================================
     BUILD USER
     ============================================================ */

  const buildApplicationUser = async (
    authUserId
  ) => {
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("user_profiles")
      .select(
        "id, username, full_name, role, access_level, active"
      )
      .eq("id", authUserId)
      .single();

    if (
      profileError ||
      !profile
    ) {
      console.error(
        "LAB TAIF: Failed to load profile:",
        profileError
      );

      await supabase.auth.signOut({
        scope: "local",
      });

      throw new Error(
        "Login succeeded, but your user profile could not be loaded."
      );
    }

    if (
      profile.active === false
    ) {
      await supabase.auth.signOut({
        scope: "local",
      });

      throw new Error(
        "This account is disabled."
      );
    }

    return {
      id: profile.id,
      username: profile.username,
      name: profile.full_name,
      role: profile.role,

      permissions:
        profile.access_level === "FULL ACCESS"
          ? "full"
          : "consume",

      active:
        profile.active !== false,

      accessLevel:
        profile.access_level,

      authUserId,
    };
  };

  /* ============================================================
     SAVE BIOMETRIC LOGIN
     ============================================================ */

  const saveBiometricLogin = async (
  authEmail,
  authPassword
) => {
  if (!authEmail || !authPassword) {
    throw new Error(
      "Login credentials are unavailable."
    );
  }

  const availability =
    await NativeBiometric.isAvailable({
      useFallback: false,
    });

  if (!availability?.isAvailable) {
    throw new Error(
      "Fingerprint is not available on this device."
    );
  }

  /*
   * IMPORTANT:
   * Remove any old/unprotected credential first.
   *
   * isCredentialsSaved() only tells us that something
   * exists under this server. It does NOT guarantee that
   * the credential is protected with biometric access.
   */
  try {
    await NativeBiometric.deleteCredentials({
      server: BIOMETRIC_LOGIN_SERVER,
    });
  } catch {
    // Nothing old to delete.
  }

  /*
   * Store a NEW biometric-protected credential.
   */
  await NativeBiometric.setCredentials({
    username: authEmail,
    password: authPassword,
    server: BIOMETRIC_LOGIN_SERVER,
    accessControl: "BIOMETRY_ANY",
  });

  console.log(
    "LAB TAIF: Biometric credential saved."
  );

  /*
   * Verify that the credential can actually be accessed
   * through the protected biometric storage.
   *
   * This will invoke Android's fingerprint prompt.
   */
  try {
    const verification =
      await NativeBiometric.getSecureCredentials({
        server: BIOMETRIC_LOGIN_SERVER,
        reason:
          "Confirm fingerprint access for LAB TAIF",
        title:
          "LAB TAIF",
        subtitle:
          "Enable Fingerprint Login",
        description:
          "Touch the fingerprint sensor to confirm fingerprint login.",
        negativeButtonText:
          "Cancel",
      });

    if (
      !verification?.username ||
      !verification?.password
    ) {
      throw new Error(
        "Fingerprint credential verification failed."
      );
    }

    console.log(
      "LAB TAIF: Fingerprint protected credential verified successfully."
    );
  } catch (err) {
    /*
     * Do NOT leave a broken credential behind.
     */
    try {
      await NativeBiometric.deleteCredentials({
        server: BIOMETRIC_LOGIN_SERVER,
      });
    } catch {}

    throw new Error(
      err?.message ||
        "Fingerprint registration could not be completed."
    );
  }
};

  /* ============================================================
     SAVE PIN
     ============================================================ */

  const savePin = async (
    authEmail,
    authPassword,
    pinValue
  ) => {
    if (
      !authEmail ||
      !authPassword
    ) {
      throw new Error(
        "Login credentials are unavailable."
      );
    }

    if (
      !/^\d{6}$/.test(pinValue)
    ) {
      throw new Error(
        "PIN must contain exactly 6 digits."
      );
    }

    /*
     * Store the PIN itself.
     */
    await NativeBiometric.setCredentials({
      username: authEmail,
      password: pinValue,
      server: PIN_SERVER,
    });

    /*
     * Store the Supabase email/password pair separately.
     *
     * This store is NOT biometric-protected because the
     * PIN is the protection layer for this flow.
     */
    await NativeBiometric.setCredentials({
      username: authEmail,
      password: authPassword,
      server: PIN_LOGIN_SERVER,
    });

    console.log(
      "LAB TAIF: PIN Quick Login saved securely."
    );
  };

  /* ============================================================
     GET PIN LOGIN CREDENTIALS
     ============================================================ */

  const getPinLoginCredentials =
    async () => {
      try {
        const credentials =
          await NativeBiometric.getCredentials({
            server: PIN_LOGIN_SERVER,
          });

        if (
          !credentials?.username ||
          !credentials?.password
        ) {
          return null;
        }

        return credentials;
      } catch (err) {
        console.error(
          "LAB TAIF: Failed to read PIN login credentials:",
          err
        );

        return null;
      }
    };

  /* ============================================================
     DELETE QUICK LOGIN
     ============================================================ */

  const clearQuickLoginSecureData =
    async () => {
      const servers = [
        BIOMETRIC_LOGIN_SERVER,
        PIN_LOGIN_SERVER,
        PIN_SERVER,
      ];

      for (
        const server of servers
      ) {
        try {
          await NativeBiometric.deleteCredentials({
            server,
          });
        } catch {
          /*
           * Nothing saved on this server.
           */
        }
      }

      localStorage.removeItem(
        QUICK_LOGIN_CONFIGURED_KEY
      );

      sessionStorage.removeItem(
        QUICK_LOGIN_PENDING_KEY
      );

      setBiometricSaved(false);
      setPinSaved(false);
    };

  /* ============================================================
     LOGIN USING STORED CREDENTIALS
     ============================================================ */

  const loginWithStoredCredentials =
    async (
      authEmail,
      authPassword
    ) => {
      if (
        !authEmail ||
        !authPassword
      ) {
        throw new Error(
          "Quick Login credentials are unavailable."
        );
      }

      console.log(
        "LAB TAIF: Signing in using secure Quick Login credentials..."
      );

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

      if (
        authError
      ) {
        console.error(
          "LAB TAIF: Quick Login Supabase error:",
          authError
        );

        /*
         * The stored password may have been changed.
         *
         * Clear ONLY the Quick Login data.
         */
        await clearQuickLoginSecureData();

        /*
         * Force the normal login screen.
         */
        setForcePasswordLogin(true);
        setLoginMode("password");

        throw new Error(
          "Quick Login credentials are no longer valid. Please sign in with your username and password, then set up Quick Login again."
        );
      }

      if (
        !authData?.user?.id
      ) {
        throw new Error(
          "Quick Login could not identify the account."
        );
      }

      const loggedInUser =
        await buildApplicationUser(
          authData.user.id
        );

      console.log(
        "LAB TAIF: Quick Login successful."
      );

      return loggedInUser;
    };

  /* ============================================================
     PASSWORD LOGIN
     ============================================================ */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");

    const cleanUsername =
      username
        .trim()
        .toLowerCase();

    if (
      !cleanUsername ||
      !password
    ) {
      setError(
        "Please enter your username and password."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * Username -> Supabase Auth email.
       */
      const {
        data: account,
        error: rpcError,
      } =
        await supabase.rpc(
          "get_auth_email_by_username",
          {
            p_username:
              cleanUsername,
          }
        );

      if (rpcError) {
        console.error(
          "LAB TAIF: Username lookup error:",
          rpcError
        );

        setError(
          "Unable to verify the username. Please contact the administrator."
        );

        return;
      }

      const userAccount =
        Array.isArray(account)
          ? account[0]
          : account;

      if (!userAccount) {
        setError(
          "Invalid username/password or this account is disabled."
        );

        return;
      }

      if (
        userAccount.active === false
      ) {
        setError(
          "This account is disabled."
        );

        return;
      }

      if (
        !userAccount.auth_email
      ) {
        setError(
          "This username is not correctly linked to Supabase Auth."
        );

        return;
      }

      if (
        Capacitor.isNativePlatform()
      ) {
        sessionStorage.setItem(
          QUICK_LOGIN_PENDING_KEY,
          "true"
        );
      }

      /*
       * Normal Supabase login.
       */
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword({
          email:
            userAccount.auth_email,
          password,
        });

      if (authError) {
        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setError(
          authError.message ||
            "Invalid username or password."
        );

        return;
      }

      if (
        !authData?.user
      ) {
        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setError(
          "Unable to identify the logged-in user."
        );

        return;
      }

      if (
        userAccount.auth_id !==
        authData.user.id
      ) {
        await supabase.auth.signOut({
          scope: "local",
        });

        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setError(
          "Your account profile is not correctly linked to Supabase Auth."
        );

        return;
      }

      const loggedInUser =
        await buildApplicationUser(
          authData.user.id
        );

      /*
       * Successful normal login means that the password
       * is currently valid.
       *
       * This is also the point where Quick Login can
       * be created or refreshed.
       */
      await afterSuccessfulPasswordLogin(
        loggedInUser,
        userAccount.auth_email,
        password
      );
    } catch (err) {
      console.error(
        "LAB TAIF: Unexpected login error:",
        err
      );

      sessionStorage.removeItem(
        QUICK_LOGIN_PENDING_KEY
      );

      setError(
        err?.message ||
          "An unexpected error occurred while signing in."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     AFTER PASSWORD LOGIN
     ============================================================ */

  const afterSuccessfulPasswordLogin =
    async (
      loggedInUser,
      authEmail,
      authPassword
    ) => {
      /*
       * We are now definitely authenticated with the
       * current password.
       *
       * Therefore, reset this flag.
       */
      setForcePasswordLogin(false);

      if (
        !Capacitor.isNativePlatform()
      ) {
        onLogin(loggedInUser);
        return;
      }

      let canUseBiometric =
        false;

      try {
        const availability =
          await NativeBiometric.isAvailable({
            useFallback: false,
          });

        canUseBiometric =
          availability?.isAvailable === true;
      } catch {
        canUseBiometric = false;
      }

      setSetupBiometricAvailable(
        canUseBiometric
      );

      /*
       * Check whether Quick Login was already configured.
       */
      let biometricAlreadySaved =
        false;

      let pinAlreadySaved =
        false;

      try {
        const [
          biometricResult,
          pinResult,
        ] = await Promise.all([
          NativeBiometric.isCredentialsSaved({
            server:
              BIOMETRIC_LOGIN_SERVER,
          }),

          NativeBiometric.isCredentialsSaved({
            server:
              PIN_SERVER,
          }),
        ]);

        biometricAlreadySaved =
          biometricResult?.isSaved === true;

        pinAlreadySaved =
          pinResult?.isSaved === true;
      } catch (err) {
        console.warn(
          "LAB TAIF: Quick Login configuration check failed:",
          err
        );
      }

      /*
       * IMPORTANT:
       *
       * If Quick Login already exists, refresh the stored
       * credentials with the NEW password.
       *
       * This solves the password-change problem whenever
       * the user logs in normally after changing password.
       */
      try {
        if (pinAlreadySaved) {
          const pinCredentials =
            await NativeBiometric.getCredentials({
              server: PIN_SERVER,
            });

          if (
            pinCredentials?.password
          ) {
            await NativeBiometric.setCredentials({
              username: authEmail,
              password: authPassword,
              server: PIN_LOGIN_SERVER,
            });
          }
        }

        if (biometricAlreadySaved) {
          /*
           * Updating biometric credentials may require
           * biometric authentication depending on the
           * Android security implementation.
           *
           * We intentionally do not force an authentication
           * during a normal password login.
           *
           * The user can reconfigure fingerprint if needed.
           */
        }
      } catch (err) {
        console.warn(
          "LAB TAIF: Could not refresh stored Quick Login credentials:",
          err
        );
      }

      /*
       * If PIN or fingerprint is already configured,
       * don't show setup again.
       */
      if (
        biometricAlreadySaved ||
        pinAlreadySaved
      ) {
        localStorage.setItem(
          QUICK_LOGIN_CONFIGURED_KEY,
          "true"
        );

        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        onLogin(loggedInUser);
        return;
      }

      /*
       * First successful login on this device.
       *
       * Open Quick Login setup.
       */
      setSetupUser({
        loggedInUser,
        authEmail,
        authPassword,
      });

      setSetupPin("");
      setSetupPinConfirm("");

      setSetupBiometric(
        canUseBiometric
      );

      setSetupPinEnabled(
        true
      );

      setError("");
      setSetupOpen(true);
    };

  /* ============================================================
     FINGERPRINT LOGIN
     ============================================================ */

  const handleBiometricLogin =
    async () => {
      setError("");
      setLoading(true);

      try {
        if (
          !Capacitor.isNativePlatform()
        ) {
          throw new Error(
            "Fingerprint login is available in the mobile app only."
          );
        }

        const availability =
          await NativeBiometric.isAvailable({
            useFallback: false,
          });

        if (
          !availability?.isAvailable
        ) {
          throw new Error(
            "Fingerprint authentication is not available on this device."
          );
        }

        console.log(
          "LAB TAIF: Requesting fingerprint..."
        );

        /*
         * Android biometric authentication.
         *
         * The actual Supabase password is returned only
         * after successful biometric authentication.
         */
        const credentials =
          await NativeBiometric.getSecureCredentials(
            {
              server:
                BIOMETRIC_LOGIN_SERVER,

              reason:
                "Use your fingerprint to access LAB TAIF",

              title:
                "LAB TAIF",

              subtitle:
                "Fingerprint Login",

              description:
                "Authenticate with your fingerprint to continue.",

              negativeButtonText:
                "Cancel",
            }
          );

        if (
          !credentials?.username ||
          !credentials?.password
        ) {
          throw new Error(
            "Fingerprint login credentials are unavailable."
          );
        }

        const loggedInUser =
          await loginWithStoredCredentials(
            credentials.username,
            credentials.password
          );

        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setForcePasswordLogin(false);

        onLogin(loggedInUser);
      } catch (err) {
        console.error(
          "LAB TAIF: Fingerprint login error:",
          err
        );

        const message =
          String(
            err?.message || ""
          ).toLowerCase();

        if (
          message.includes("cancel") ||
          message.includes("canceled") ||
          message.includes("cancelled")
        ) {
          setError(
            "Fingerprint authentication was cancelled."
          );
        } else if (
          message.includes(
            "no protected credentials"
          )
        ) {
          setError(
            "Fingerprint Quick Login is not configured. Please use Username & Password."
          );
        } else if (
          message.includes(
            "no credentials"
          )
        ) {
          setError(
            "Fingerprint Quick Login is not configured. Please use Username & Password."
          );
        } else if (
          message.includes(
            "no longer valid"
          )
        ) {
          setError(
            err.message
          );
        } else if (
          message.includes(
            "not available"
          )
        ) {
          setError(
            "Fingerprint authentication is not available on this device."
          );
        } else {
          setError(
            "Fingerprint authentication failed. Please try again or use your PIN."
          );
        }
      } finally {
        setLoading(false);
      }
    };

  /* ============================================================
     PIN LOGIN
     ============================================================ */

  const handlePinLogin =
    async () => {
      setError("");

      if (
        !/^\d{6}$/.test(pin)
      ) {
        setError(
          "Please enter your 6-digit PIN."
        );

        return;
      }

      setPinLoading(true);

      try {
        /*
         * First verify the user's PIN.
         */
        const pinCredentials =
          await NativeBiometric.getCredentials({
            server:
              PIN_SERVER,
          });

        if (
          !pinCredentials?.password
        ) {
          throw new Error(
            "No PIN account is registered on this device."
          );
        }

        if (
          pin !==
          pinCredentials.password
        ) {
          setError(
            "Incorrect PIN."
          );

          setPin("");

          return;
        }

        /*
         * PIN is correct.
         *
         * Now retrieve the securely stored Supabase
         * email/password pair.
         */
        const loginCredentials =
          await getPinLoginCredentials();

        if (
          !loginCredentials
        ) {
          throw new Error(
            "PIN Quick Login credentials are unavailable. Please sign in with your username and password and set up Quick Login again."
          );
        }

        const loggedInUser =
          await loginWithStoredCredentials(
            loginCredentials.username,
            loginCredentials.password
          );

        setPin("");

        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setForcePasswordLogin(false);

        onLogin(loggedInUser);
      } catch (err) {
        console.error(
          "LAB TAIF: PIN login error:",
          err
        );

        setError(
          err?.message ||
            "PIN authentication failed."
        );
      } finally {
        setPinLoading(false);
      }
    };

  /* ============================================================
     FINISH QUICK LOGIN SETUP
     ============================================================ */

  const finishQuickLoginSetup =
    async () => {
      if (!setupUser) {
        return;
      }

      setError("");

      if (
        !setupPinEnabled &&
        !setupBiometric
      ) {
        setError(
          "Please enable at least one quick login method."
        );

        return;
      }

      if (
        !setupPinEnabled
      ) {
        setSetupPin("");
        setSetupPinConfirm("");
      }

      if (
        setupPinEnabled
      ) {
        if (
          !/^\d{6}$/.test(
            setupPin
          )
        ) {
          setError(
            "PIN must contain exactly 6 digits."
          );

          return;
        }

        if (
          setupPin !==
          setupPinConfirm
        ) {
          setError(
            "PIN confirmation does not match."
          );

          return;
        }
      }

      if (
        !setupUser.authEmail ||
        !setupUser.authPassword
      ) {
        setError(
          "Secure login credentials are unavailable. Please sign in again."
        );

        return;
      }

      setSetupLoading(true);

      try {
        /*
         * Save PIN Quick Login.
         */
        if (
          setupPinEnabled
        ) {
          await savePin(
            setupUser.authEmail,
            setupUser.authPassword,
            setupPin
          );
        }

        /*
         * Save Fingerprint Quick Login.
         */
        if (
          setupBiometric
        ) {
          await saveBiometricLogin(
            setupUser.authEmail,
            setupUser.authPassword
          );
        }

        localStorage.setItem(
          QUICK_LOGIN_CONFIGURED_KEY,
          "true"
        );

        /*
         * Refresh UI state.
         */
        await checkQuickLogin();

        const userToLogin =
          setupUser.loggedInUser;

        setSetupOpen(false);
        setSetupUser(null);

        setSetupPin("");
        setSetupPinConfirm("");

        sessionStorage.removeItem(
          QUICK_LOGIN_PENDING_KEY
        );

        setForcePasswordLogin(false);

        onLogin(userToLogin);
      } catch (err) {
        console.error(
          "LAB TAIF: Quick Login setup error:",
          err
        );

        /*
         * If setup failed halfway, inspect the current
         * state instead of silently leaving stale UI.
         */
        try {
          await checkQuickLogin();
        } catch {}

        setError(
          err?.message ||
            "Unable to save Quick Login settings."
        );
      } finally {
        setSetupLoading(false);
      }
    };

  /* ============================================================
     SKIP QUICK LOGIN
     ============================================================ */

  const skipQuickLoginSetup =
    () => {
      const userToLogin =
        setupUser?.loggedInUser;

      setSetupOpen(false);
      setSetupUser(null);

      setSetupPin("");
      setSetupPinConfirm("");

      sessionStorage.removeItem(
        QUICK_LOGIN_PENDING_KEY
      );

      if (
        userToLogin
      ) {
        onLogin(userToLogin);
      }
    };

  /* ============================================================
     RESET TO PASSWORD
     ============================================================ */

  const resetToPassword =
    () => {
      /*
       * CRITICAL FIX:
       *
       * Without this flag, the component immediately sees
       * biometricSaved/pinSaved and renders the Quick Login
       * landing screen again.
       */
      setForcePasswordLogin(true);

      setLoginMode(
        "password"
      );

      setError("");
      setPin("");
      setUsername("");
      setPassword("");
    };

  /* ============================================================
     FIRST DEVICE SETUP UI
     ============================================================ */

  if (
    setupOpen &&
    Capacitor.isNativePlatform()
  ) {
    return (
      <div className="quick-setup-overlay">
        <div className="quick-setup-card">

          <div className="quick-setup-brand">

            <div className="quick-setup-brand-icon">
              <LabIcon size={29} />
            </div>

            <div>
              <strong>
                LAB TAIF
              </strong>

              <span>
                MEDICAL CENTER
              </span>
            </div>

          </div>

          <div className="quick-setup-heading">

            <span>
              FIRST DEVICE SETUP
            </span>

            <h2>
              Choose your Quick Login
            </h2>

            <p>
              Enable one or both secure
              methods for faster access
              on this device.
            </p>

          </div>

          {setupBiometricAvailable && (
            <button
              type="button"
              className={`setup-method ${
                setupBiometric
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setSetupBiometric(
                  (v) => !v
                )
              }
              disabled={setupLoading}
            >

              <span className="setup-method-icon fingerprint">
                <FingerprintIcon size={27} />
              </span>

              <span className="setup-method-text">

                <strong>
                  Fingerprint
                </strong>

                <small>
                  Use your device fingerprint
                  for secure access.
                </small>

              </span>

              <span className="setup-check">
                {setupBiometric
                  ? "✓"
                  : ""}
              </span>

            </button>
          )}

          <button
            type="button"
            className={`setup-method ${
              setupPinEnabled
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSetupPinEnabled(
                (v) => !v
              )
            }
            disabled={setupLoading}
          >

            <span className="setup-method-icon pin">
              <KeypadIcon size={27} />
            </span>

            <span className="setup-method-text">

              <strong>
                6-Digit PIN
              </strong>

              <small>
                Use a private six-digit
                PIN stored securely on
                this device.
              </small>

            </span>

            <span className="setup-check">
              {setupPinEnabled
                ? "✓"
                : ""}
            </span>

          </button>

          {setupPinEnabled && (
            <div className="setup-pin-fields">

              <div className="field">

                <label>
                  Create PIN
                </label>

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
                  placeholder="••••••"
                  disabled={setupLoading}
                />

              </div>

              <div className="field">

                <label>
                  Confirm PIN
                </label>

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
                  placeholder="••••••"
                  disabled={setupLoading}
                />

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
            onClick={
              finishQuickLoginSetup
            }
            disabled={setupLoading}
          >

            {setupLoading ? (
              <>
                <span className="login-spinner" />

                <span>
                  Saving secure settings...
                </span>
              </>
            ) : (
              <>
                <span>
                  Save Quick Login
                </span>

                <ArrowIcon />
              </>
            )}

          </button>

          <button
            type="button"
            className="quick-back-button"
            onClick={
              skipQuickLoginSetup
            }
            disabled={setupLoading}
          >
            Skip for now
          </button>

          <div className="quick-setup-security">

            <ShieldIcon size={17} />

            <span>
              Your login credentials are stored
              only inside secure native
              device storage. They are not
              stored in browser storage.
            </span>

          </div>

        </div>
      </div>
    );
  }

  /* ============================================================
     QUICK LOGIN LANDING
     ============================================================ */

  if (
    Capacitor.isNativePlatform() &&
    quickLoginChecked &&
    (biometricSaved ||
      pinSaved) &&
    loginMode === "password" &&
    !setupOpen &&
    !forcePasswordLogin
  ) {
    return (
      <div className="login-page">

        <div className="login-grid" />

        <div className="login-orb orb-one" />
        <div className="login-orb orb-two" />
        <div className="login-orb orb-three" />

        <div className="quick-login-shell">

          <div className="quick-login-card">

            <div className="mobile-brand quick-brand">

              <div className="mobile-logo">
                <LabIcon size={26} />
              </div>

              <div>

                <strong>
                  LAB TAIF
                </strong>

                <span>
                  MEDICAL CENTER
                </span>

              </div>

            </div>

            <div className="quick-login-top">

              <div className="quick-login-badge">
                <ShieldIcon size={18} />
              </div>

              <span>
                SECURE DEVICE ACCESS
              </span>

              <h2>
                Welcome Back
              </h2>

              <p>
                Choose your preferred
                secure login method.
              </p>

            </div>

            <div className="quick-methods">

              {biometricSaved &&
                biometricAvailable && (
                  <button
                    type="button"
                    className="quick-method-card fingerprint"
                    onClick={
                      handleBiometricLogin
                    }
                    disabled={loading}
                  >

                    <span className="quick-method-icon">
                      <FingerprintIcon size={34} />
                    </span>

                    <span className="quick-method-copy">

                      <strong>
                        Fingerprint
                      </strong>

                      <small>
                        Biometric secure access
                      </small>

                    </span>

                    <span className="quick-method-arrow">
                      <ArrowIcon />
                    </span>

                  </button>
                )}

              {pinSaved && (
                <button
                  type="button"
                  className="quick-method-card pin"
                  onClick={() => {
                    setError("");
                    setPin("");
                    setLoginMode("pin");
                  }}
                  disabled={loading}
                >

                  <span className="quick-method-icon">
                    <KeypadIcon size={34} />
                  </span>

                  <span className="quick-method-copy">

                    <strong>
                      6-Digit PIN
                    </strong>

                    <small>
                      Secure device PIN
                    </small>

                  </span>

                  <span className="quick-method-arrow">
                    <ArrowIcon />
                  </span>

                </button>
              )}

            </div>

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
              className="password-fallback"
              onClick={
                resetToPassword
              }
            >

              <span className="fallback-icon">
                ↗
              </span>

              <span>

                <strong>
                  Use Username &amp; Password
                </strong>

                <small>
                  Standard Supabase Auth login
                </small>

              </span>

              <ArrowIcon />

            </button>

            <div className="access-note quick-access-note">

              <div className="access-icon">
                <ShieldIcon size={16} />
              </div>

              <div>

                <strong>
                  Secure Device Login
                </strong>

                <small>
                  Quick Login credentials are
                  protected by the device.
                </small>

              </div>

            </div>

            <div className="login-credits">

              <div className="credit-box">

                <span>
                  SUPERVISED BY
                </span>

                <strong>
                  Dr.Amira Abouelkhair
                </strong>

              </div>

              <div className="credit-divider" />

              <div className="credit-box">

                <span>
                  DEVELOPED BY
                </span>

                <strong>
                  Moustafa Hassan
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* ============================================================
     PIN LOGIN
     ============================================================ */

  if (
    loginMode === "pin"
  ) {
    return (
      <div className="login-page">

        <div className="login-grid" />

        <div className="login-orb orb-one" />
        <div className="login-orb orb-two" />
        <div className="login-orb orb-three" />

        <div className="quick-login-shell">

          <div className="quick-login-card pin-login-card">

            <div className="mobile-brand quick-brand">

              <div className="mobile-logo">
                <KeypadIcon size={25} />
              </div>

              <div>

                <strong>
                  LAB TAIF
                </strong>

                <span>
                  MEDICAL CENTER
                </span>

              </div>

            </div>

            <div className="quick-login-top">

              <div className="quick-login-badge pin">
                <KeypadIcon size={19} />
              </div>

              <span>
                QUICK LOGIN
              </span>

              <h2>
                Enter PIN
              </h2>

              <p>
                Enter your six-digit device
                PIN to continue.
              </p>

            </div>

            <div
              className="pin-display"
              aria-label="PIN input"
            >

              <div className="pin-dots">

                {[0, 1, 2, 3, 4, 5].map(
                  (i) => (
                    <span
                      key={i}
                      className={
                        i < pin.length
                          ? "filled"
                          : ""
                      }
                    />
                  )
                )}

              </div>

            </div>

            <input
              className="pin-hidden-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) =>
                setPin(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter"
                ) {
                  void handlePinLogin();
                }
              }}
              autoFocus
              disabled={pinLoading}
              aria-label="6-digit PIN"
            />

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
              onClick={
                handlePinLogin
              }
              disabled={
                pinLoading ||
                pin.length !== 6
              }
            >

              {pinLoading ? (
                <>
                  <span className="login-spinner" />

                  <span>
                    Signing in...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Sign In with PIN
                  </span>

                  <ArrowIcon />
                </>
              )}

            </button>

            {biometricSaved &&
              biometricAvailable && (
                <button
                  type="button"
                  className="quick-method-card compact"
                  onClick={
                    handleBiometricLogin
                  }
                  disabled={pinLoading}
                >

                  <span className="quick-method-icon">
                    <FingerprintIcon size={25} />
                  </span>

                  <span className="quick-method-copy">

                    <strong>
                      Use Fingerprint
                    </strong>

                    <small>
                      Biometric secure access
                    </small>

                  </span>

                  <ArrowIcon />

                </button>
              )}

            <button
              type="button"
              className="quick-back-button"
              onClick={
                resetToPassword
              }
            >
              ← Use Username &amp; Password
            </button>

            <div className="access-note">

              <div className="access-icon">
                <ShieldIcon size={16} />
              </div>

              <div>

                <strong>
                  Secure Device Login
                </strong>

                <small>
                  Your PIN is stored securely
                  on this device.
                </small>

              </div>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* ============================================================
     NORMAL USERNAME + PASSWORD LOGIN
     ============================================================ */

  return (
    <div className="login-page">

      <div className="login-grid" />

      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-orb orb-three" />

      <div className="login-shell">

        <section className="login-showcase">

          <div className="showcase-content">

            <div className="brand-large">

              <div className="brand-logo-large">
                <LabIcon size={34} />
              </div>

              <div>

                <h1>
                  LAB TAIF
                </h1>

                <p>
                  MEDICAL CENTER
                </p>

              </div>

            </div>

            <div className="showcase-line" />

            <div className="showcase-title">

              <span className="eyebrow">
                LABORATORY MANAGEMENT SYSTEM
              </span>

              <h2>
                Smarter
                <br />

                <strong>
                  Laboratory Operations.
                </strong>

              </h2>

              <p>
                A secure and modern management
                platform designed to simplify
                inventory operations, monitor
                stock, manage laboratory resources
                and maintain complete operational
                visibility.
              </p>

            </div>

            <div className="showcase-features">

              <div className="feature-item">

                <div className="feature-icon">
                  ▣
                </div>

                <div>

                  <b>
                    Smart Inventory
                  </b>

                  <small>
                    Real-time stock monitoring
                    and control
                  </small>

                </div>

              </div>

              <div className="feature-item">

                <div className="feature-icon">
                  ↕
                </div>

                <div>

                  <b>
                    Stock Operations
                  </b>

                  <small>
                    Secure receiving and
                    consumption tracking
                  </small>

                </div>

              </div>

              <div className="feature-item">

                <div className="feature-icon">
                  ◷
                </div>

                <div>

                  <b>
                    Complete History
                  </b>

                  <small>
                    Track every inventory
                    movement
                  </small>

                </div>

              </div>

            </div>

          </div>

          <div className="showcase-footer">

            <span className="footer-dot">
              ●
            </span>

            <span>
              SECURE • CONTROLLED • PROFESSIONAL
            </span>

          </div>

        </section>

        <section className="login-panel">

          <div className="login-card">

            <div className="mobile-brand">

              <div className="mobile-logo">
                <LabIcon size={25} />
              </div>

              <div>

                <strong>
                  LAB TAIF
                </strong>

                <span>
                  MEDICAL CENTER
                </span>

              </div>

            </div>

            <div className="login-heading">

              <span className="welcome-label">
                WELCOME BACK
              </span>

              <h2>
                Sign in
              </h2>

              <p>
                Sign in to your LAB TAIF
                Management System account
                to continue.
              </p>

            </div>

            <form
              className="login-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="field">

                <label htmlFor="username">
                  Username
                </label>

                <div className="input-wrap">

                  <span className="input-icon">
                    ◉
                  </span>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                  />

                </div>

              </div>

              <div className="field">

                <div className="password-label-row">

                  <label htmlFor="password">
                    Password
                  </label>

                  <span>
                    SECURE LOGIN
                  </span>

                </div>

                <div className="input-wrap">

                  <span className="input-icon">
                    ◆
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (v) => !v
                      )
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    <EyeIcon
                      open={
                        showPassword
                      }
                    />

                  </button>

                </div>

              </div>

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
                type="submit"
                className="login-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="login-spinner" />

                    <span>
                      Signing in...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Sign In
                    </span>

                    <ArrowIcon />
                  </>
                )}

              </button>

            </form>

            {(biometricSaved ||
              pinSaved) && (
              <div className="quick-login-section">

                <div className="quick-login-divider">

                  <span>
                    OR QUICK LOGIN
                  </span>

                </div>

                <div className="quick-login-buttons">

                  {biometricSaved &&
                    biometricAvailable && (
                      <button
                        type="button"
                        className="quick-login-button biometric"
                        onClick={
                          handleBiometricLogin
                        }
                        disabled={loading}
                      >

                        <span className="quick-login-icon">
                          <FingerprintIcon size={23} />
                        </span>

                        <span>
                          Fingerprint
                        </span>

                      </button>
                    )}

                  {pinSaved && (
                    <button
                      type="button"
                      className="quick-login-button pin"
                      onClick={() => {
                        setError("");
                        setPin("");
                        setLoginMode(
                          "pin"
                        );
                      }}
                      disabled={loading}
                    >

                      <span className="quick-login-icon">
                        <KeypadIcon size={23} />
                      </span>

                      <span>
                        6-Digit PIN
                      </span>

                    </button>
                  )}

                </div>

              </div>
            )}

            <div className="access-note">

              <div className="access-icon">
                <ShieldIcon size={16} />
              </div>

              <div>

                <strong>
                  Authorized Access Only
                </strong>

                <small>
                  This system is restricted
                  to authorized LAB TAIF
                  personnel.
                </small>

              </div>

            </div>

            <div className="login-credits">

              <div className="credit-box">

                <span>
                  SUPERVISED BY
                </span>

                <strong>
                  Dr.Amira Abouelkhair
                </strong>

              </div>

              <div className="credit-divider" />

              <div className="credit-box">

                <span>
                  DEVELOPED BY
                </span>

                <strong>
                  Moustafa Hassan
                </strong>

              </div>

            </div>

            <div className="login-bottom">

              <span>
                LAB TAIF MEDICAL CENTER
              </span>

              <span>
                SECURE MANAGEMENT PLATFORM
              </span>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default LoginPage;