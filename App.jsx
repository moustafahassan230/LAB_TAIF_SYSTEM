import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./lib/supabase.js";
import FormsPage from "./FormsPage.jsx";
import LoginPage from "./LoginPage.jsx";
import { initNotifications } from "./notifications.js";

import "./index.css";
import "./App.css";
import "./AdminPages.css";
import "./AboutPremium.css";
import "./MobileResponsive.css";
import ChangePassword from "./ChangePassword";
/* =========================================================
   INTERNAL USERS
   ========================================================= */

const USERS_KEY = "labtaif-users";
const CURRENT_USER_KEY = "labtaif-current-user";
const QUICK_LOGIN_CONFIGURED_KEY = "LAB_TAIF_QUICK_LOGIN_CONFIGURED";

const COMPANIES_KEY = "labtaif-companies";
const DEFAULT_COMPANIES = [
  "CDS",
  "Mindray",
  "Carepioneers",
  "Almajher",
  "Wateen Elhayah",
  "kLNZ",
  "Amjad Alseha",
  "laborax",
  "YHLO",
  "Zybio",
  "Dymind",
  "Roche",
  "Siemens",
  "Beckman Coulter",
  "Sysmex",
  "Bio-Rad",
  "BD",
  "Abbott",
  "Other",
];

function getStoredCompanies() {
  try {
    const saved = localStorage.getItem(COMPANIES_KEY);
    if (!saved) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
      return [...DEFAULT_COMPANIES];
    }
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.length) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
      return [...DEFAULT_COMPANIES];
    }
    return [...new Set(parsed.map((x) => String(x).trim()).filter(Boolean))];
  } catch {
    return [...DEFAULT_COMPANIES];
  }
}

function saveStoredCompanies(companies) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

const DEFAULT_USERS = [
  {
    id: "mustafa",
    name: "Mustafa Hassan",
    username: "mustafa",
    role: "Administrator",
    permissions: "full",
    active: true,
  },
  {
    id: "amira",
    name: "DR / AMIRA ABOUELKHAIR",
    username: "amira",
    role: "Administrator",
    permissions: "full",
    active: true,
  },
  {
    id: "klares",
    name: "Klares Madrid",
    username: "klares",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "abeer",
    name: "Abeer",
    username: "abeer",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "suhad",
    name: "Suhad",
    username: "suhad",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "fares",
    name: "Fares",
    username: "fares",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "fahd",
    name: "Fahd",
    username: "fahd",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "hadeel",
    name: "Hadeel",
    username: "hadeel",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
  {
    id: "mohamed",
    name: "Mohamed",
    username: "mohamed",
    role: "Limited User",
    permissions: "consume",
    active: true,
  },
];

function getStoredUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY);

    if (!saved) {
      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(DEFAULT_USERS)
      );

      return DEFAULT_USERS;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed) || !parsed.length) {
      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(DEFAULT_USERS)
      );

      return DEFAULT_USERS;
    }

    return parsed;
  } catch {
    localStorage.setItem(
      USERS_KEY,
      JSON.stringify(DEFAULT_USERS)
    );

    return DEFAULT_USERS;
  }
}

function saveUsers(users) {
  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}

/* =========================================================
   MENU
   ========================================================= */

const MENU = [
  {
    group: "MAIN",
    items: [
      ["dashboard", "⌂", "Dashboard"],
    ],
  },

  {
  group: "INVENTORY",
  items: [
    ["all", "▣", "All Items"],
    ["low", "⚠", "Low Stock"],
    ["out", "✕", "Out of Stock"],
    ["soon", "◷", "Expiring Soon"],
    ["expired", "▣", "Expired Items"],
    ["category", "▦", "Category"],
  ],
},

  {
    group: "OPERATIONS",
    items: [
      ["in", "↓", "Stock In (Receive)"],
      ["outop", "↑", "Stock Out (Consume)"],
      ["request", "🛒", "Request List"],
      ["history", "↻", "Inventory History"],
    ],
  },

  {
    group: "MANAGEMENT",
    items: [
      ["forms", "📋", "Forms Center"],
      ["reports", "▤", "Reports & Files"],
      ["staff", "♙", "Staff / Users"],
      ["audit", "◉", "Audit Log"],
      ["settings", "⚙", "Settings"],
      ["about", "ⓘ", "About System"],
    ],
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function expiryOf(item) {
  return item?.expiry_date || "";
}

function normalizeDate(value) {
  if (!value) return "";

  const str = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  const date = new Date(str);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function daysToExpiry(item) {
  const value = normalizeDate(
    expiryOf(item)
  );

  if (!value) return null;

  const expiry = new Date(
    `${value}T00:00:00`
  );

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  return Math.ceil(
    (expiry.getTime() -
      today.getTime()) /
      86400000
  );
}

function formatDate(value) {
  const date = normalizeDate(value);

  if (!date) return "-";

  const parts = date.split("-");

  if (parts.length !== 3) return "-";

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function inventoryExpiryEntries(item, inventoryBatches = {}) {
  const linked = inventoryBatches[String(item?.id)] || [];

  const batchEntries = linked
    .filter((batch) => normalizeDate(batch?.expiry_date))
    .map((batch) => ({
      date: normalizeDate(batch.expiry_date),
      days: daysToExpiry(batch),
      batchId: batch.id,
      batchNumber: batch.batch_number || "",
      supplier: batch.supplier || "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (batchEntries.length) return batchEntries;

  const itemDate = normalizeDate(item?.expiry_date);
  if (!itemDate) return [];

  return [{
    date: itemDate,
    days: daysToExpiry({ expiry_date: itemDate }),
    batchId: null,
    batchNumber: "",
    supplier: "",
  }];
}

function expiryDayText(days) {
  if (days === null || days === undefined) return "";
  if (days < 0) {
    const n = Math.abs(days);
    return `Expired ${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

function statusOf(item) {
  const remaining = num(
    item?.Remaining
  );

  const minimum = num(
    item?.Minimum
  );

  if (remaining <= 0) {
    return "OUT OF STOCK";
  }

  if (remaining <= minimum) {
    return "REQUEST";
  }

  return "IN STOCK";
}

function batchStatusOf(batch) {
  const remaining = num(batch?.remaining_quantity);
  if (remaining <= 0) return "DEPLETED";

  const expiry = normalizeDate(batch?.expiry_date);
  if (expiry) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(`${expiry}T00:00:00`);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate < today) {
      return "EXPIRED";
    }
  }

  return "ACTIVE";
}

function sortBatchesFEFO(list = []) {
  return [...list].sort((a, b) => {
    const ar = num(a?.remaining_quantity);
    const br = num(b?.remaining_quantity);
    if (ar <= 0 && br > 0) return 1;
    if (ar > 0 && br <= 0) return -1;

    const ae = normalizeDate(a?.expiry_date);
    const be = normalizeDate(b?.expiry_date);
    if (!ae && be) return 1;
    if (ae && !be) return -1;
    if (ae && be && ae !== be) return ae < be ? -1 : 1;
    return num(a?.id) - num(b?.id);
  });
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [users, setUsers] = useState(
    getStoredUsers
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [items, setItems] =
    useState([]);

  const [inventoryBatches, setInventoryBatches] = useState({});

  const [page, setPage] =
    useState("dashboard");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [dark, setDark] =
    useState(true);

  const [noticeOpen, setNoticeOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [modal, setModal] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [qty, setQty] =
    useState(1);

  const [stockExpiry, setStockExpiry] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [stockBatchId, setStockBatchId] = useState("");

  /* =======================================================
     PERMISSIONS
     ======================================================= */

  /* =======================================================
     FINAL PERMISSION MODEL
     Mustafa + Dr. Amira are the ONLY administrators.
     All other users can consume stock only.
     ======================================================= */

  const ownerAdminUsernames = [
    "mustafa",
    "amira",
  ];

  /* Mustafa + Dr. Amira own the administrative areas.
     A user promoted to FULL ACCESS can operate inventory,
     but Settings / History / Audit / User Management stay
     restricted to the two core administrators. */
  const isOwnerAdmin = ownerAdminUsernames.includes(
    String(currentUser?.username || "").trim().toLowerCase()
  );

  const hasFullAccess =
    isOwnerAdmin || String(currentUser?.permissions || "").toLowerCase() === "full";

  const isLimited = !hasFullAccess;

  /* Everyone can consume stock. */
  const canConsume = true;

  /* Full-access users can receive/edit/delete inventory. */
  const canReceive = hasFullAccess;
  const canEdit = hasFullAccess;
  const canDelete = hasFullAccess;

  /* ONLY Mustafa + Dr. Amira can enter these pages. */
  const canHistory = isOwnerAdmin;
  const canAudit = isOwnerAdmin;
  const canSettings = isOwnerAdmin;

  /* Staff is visible to everyone, but editable only by the two core admins. */
  const canStaff = true;
  const canManageUsers = isOwnerAdmin;

  const canReports = true;
  const canForms = true;
  const canExpiry = true;

  /* =======================================================
     AUDIT LOG
     ======================================================= */

const writeAudit = async (
  action,
  details = "",
  actor = currentUser
) => {
  const entry = {
    user_id: actor?.authUserId || null,
    user_name: actor?.name || "Unknown User",
    user_username: actor?.username || "",
    action,
    details,
    created_at: new Date().toISOString(),
  };

  try {
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([entry]);

    if (auditError) {
      console.warn(
        "LAB TAIF: Supabase audit log unavailable:",
        auditError.message
      );

      const localEntry = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...entry,
      };

      const existing = JSON.parse(
        localStorage.getItem("labtaif-audit-log") || "[]"
      );

      localStorage.setItem(
        "labtaif-audit-log",
        JSON.stringify([localEntry, ...existing].slice(0, 5000))
      );

      window.dispatchEvent(new Event("labtaif-audit-updated"));
    }
  } catch (e) {
    console.error("LAB TAIF: Audit error:", e);
  }
};


  /* =======================================================
     LOGIN
     ======================================================= */

  const handleLogin = (user) => {
  if (!user) return;

  // A new login must never inherit the previous user's page, filters, or open dialogs.
  setPage("dashboard");
  setSearch("");
  setCategory("All");
  setModal(null);
  setSelected(null);
  setQty(1);
  setStockExpiry("");
  setStockBatchId("");
  setNoticeOpen(false);
  setProfileOpen(false);
  document.body.classList.remove("sidebar-open");

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  );

  setCurrentUser(user);

  void writeAudit(
    "LOGIN",
    "User logged in successfully",
    user
  );

  void initNotifications().catch((error) => {
    console.warn(
      "LAB TAIF: Notification initialization skipped:",
      error
    );
  });
};

const handleLogout = async () => {
  const actor = currentUser;

  await writeAudit(
    "LOGOUT",
    "User logged out",
    actor
  );

  const { error: signOutError } =
    await supabase.auth.signOut({ scope: "local" });

  if (signOutError) {
    console.error(
      "LAB TAIF: Supabase logout error:",
      signOutError
    );
  }

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  // Clear user-scoped UI/data immediately; the next account starts fresh.
  setCurrentUser(null);
  setPage("dashboard");
  setSearch("");
  setCategory("All");
  setItems([]);
  setInventoryBatches({});
  setModal(null);
  setSelected(null);
  setQty(1);
  setStockExpiry("");
  setStockBatchId("");
  setNoticeOpen(false);
  setProfileOpen(false);
  document.body.classList.remove("sidebar-open");
};


  /* =======================================================
     LOAD INVENTORY
     ======================================================= */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        { data: inventoryData, error: inventoryError },
        { data: batchData, error: batchError },
      ] = await Promise.all([
        supabase
          .from("inventory")
          .select("*")
          .order("id", { ascending: true }),
        supabase
          .from("inventory_batches")
          .select(`
            id,
            inventory_id,
            batch_number,
            supplier,
            received_date,
            expiry_date,
            quantity,
            remaining_quantity,
            unit,
            status,
            notes,
            created_at,
            updated_at
          `)
          .order("expiry_date", {
            ascending: true,
            nullsFirst: false,
          }),
      ]);

      if (inventoryError) throw inventoryError;
      if (batchError) throw batchError;

      setItems(inventoryData || []);

      const batchMap = {};
      (batchData || []).forEach((batch) => {
        const key = String(batch.inventory_id);
        if (!batchMap[key]) batchMap[key] = [];
        batchMap[key].push(batch);
      });

      Object.keys(batchMap).forEach((key) => {
        batchMap[key] = sortBatchesFEFO(batchMap[key]);
      });

      setInventoryBatches(batchMap);
    } catch (loadError) {
      console.error("LAB TAIF: Inventory / batch load failed:", loadError);
      setError(loadError?.message || "Failed to load inventory.");
      setItems([]);
      setInventoryBatches({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (authUser) => {
      const quickLoginSetupPending =
  sessionStorage.getItem(
    "LAB_TAIF_QUICK_LOGIN_SETUP_PENDING"
  ) === "true";

if (quickLoginSetupPending) {
  return;
}
      if (!authUser) {
        if (mounted) {
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

      if (profileError || !profile) {
        console.error(
          "LAB TAIF: Failed to load user profile:",
          profileError
        );

        await supabase.auth.signOut();

        if (mounted) {
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }
        return;
      }

      if (profile.active === false) {
        await supabase.auth.signOut();

        if (mounted) {
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
        }

        alert("This account is disabled.");
        return;
      }

      const loggedInUser = {
        id: profile.id,
        username: profile.username,
        name: profile.full_name,
        role: profile.role,
        permissions:
          profile.access_level === "FULL ACCESS"
            ? "full"
            : "consume",
        active: profile.active !== false,
        accessLevel: profile.access_level,
        authUserId: authUser.id,
      };

      if (!mounted) return;

      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(loggedInUser)
      );

      setCurrentUser(loggedInUser);

      void initNotifications().catch((error) => {
        console.warn(
          "LAB TAIF: Notification initialization skipped:",
          error
        );
      });
    };

    const initializeAuth = async () => {
      try {
        const quickLoginSetupPending =
          sessionStorage.getItem("LAB_TAIF_QUICK_LOGIN_SETUP_PENDING") === "true";

        if (quickLoginSetupPending) {
          return;
        }

        const quickLoginConfigured =
          localStorage.getItem(QUICK_LOGIN_CONFIGURED_KEY) === "true";

        if (quickLoginConfigured) {
          if (mounted) {
            setCurrentUser(null);
          }
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            "LAB TAIF: Session restore error:",
            error
          );
        }

        await loadProfile(session?.user || null);
      } catch (error) {
        console.error(
          "LAB TAIF: Authentication initialization error:",
          error
        );

        if (mounted) {
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void loadProfile(session?.user || null);
      }
    );

    const saved =
      localStorage.getItem("labtaif-theme");

    if (saved) {
      setDark(saved !== "light");
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authReady && currentUser) {
      load();
    }
  }, [authReady, currentUser]);

  useEffect(() => {
    document.documentElement.dataset.theme =
      dark
        ? "dark"
        : "light";

    localStorage.setItem(
      "labtaif-theme",
      dark
        ? "dark"
        : "light"
    );
  }, [dark]);

  useEffect(() => {
  if (!modal) return undefined;

  const html = document.documentElement;
  const body = document.body;

  // Save current page scroll position
  const scrollY = window.scrollY;

  // Save previous styles
  const previousHtmlOverflow = html.style.overflow;
  const previousHtmlHeight = html.style.height;

  const previousBodyOverflow = body.style.overflow;
  const previousBodyHeight = body.style.height;
  const previousBodyPosition = body.style.position;
  const previousBodyTop = body.style.top;
  const previousBodyWidth = body.style.width;
  const previousBodyTouchAction = body.style.touchAction;

  // Lock HTML + BODY
  html.classList.add("lab-modal-open");
  body.classList.add("lab-modal-open");

  html.style.overflow = "hidden";
  html.style.height = "100%";

  body.style.overflow = "hidden";
  body.style.height = "100%";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.width = "100%";
  body.style.touchAction = "none";

  return () => {
    // Remove lock classes
    html.classList.remove("lab-modal-open");
    body.classList.remove("lab-modal-open");

    // Restore previous styles
    html.style.overflow = previousHtmlOverflow;
    html.style.height = previousHtmlHeight;

    body.style.overflow = previousBodyOverflow;
    body.style.height = previousBodyHeight;
    body.style.position = previousBodyPosition;
    body.style.top = previousBodyTop;
    body.style.width = previousBodyWidth;
    body.style.touchAction = previousBodyTouchAction;

    // Return to exact previous scroll position
    window.scrollTo(0, scrollY);
  };
}, [modal]);

  useEffect(() => {
    if (!currentUser) return;

    const restricted = [
      "settings",
      "history",
      "audit",
    ];

    if (
      restricted.includes(page) &&
      !isOwnerAdmin
    ) {
      setPage("dashboard");
    }
  }, [currentUser, page, isOwnerAdmin]);

  /* =======================================================
     STATS
     ======================================================= */

  const stats = useMemo(() => {
    const total =
      items.length;

    const inStock =
      items.filter(
        (x) =>
          num(
            x.Remaining
          ) >
          num(
            x.Minimum
          )
      ).length;

    const low =
      items.filter(
        (x) =>
          num(
            x.Remaining
          ) > 0 &&
          num(
            x.Remaining
          ) <=
            num(
              x.Minimum
            )
      ).length;

    const out =
      items.filter(
        (x) =>
          num(
            x.Remaining
          ) <= 0
      ).length;

    const expired =
      items.filter((x) =>
        inventoryExpiryEntries(x, inventoryBatches).some(
          (entry) => entry.days !== null && entry.days < 0
        )
      ).length;

    const soon =
      items.filter((x) =>
        inventoryExpiryEntries(x, inventoryBatches).some(
          (entry) => entry.days !== null && entry.days >= 0 && entry.days <= 90
        )
      ).length;

    return {
      total,
      inStock,
      low,
      out,
      expired,
      soon,
    };
  }, [items, inventoryBatches]);

  /* =======================================================
     CATEGORIES
     ======================================================= */

  const categories =
    useMemo(() => {
      return [
        "All",
        ...new Set(
          items
            .map(
              (x) =>
                x.Category
            )
            .filter(Boolean)
        ),
      ];
    }, [items]);

  /* =======================================================
     VISIBLE ITEMS
     ======================================================= */

  const visible =
    useMemo(() => {
      let result = [
        ...items,
      ];

      if (
        page === "low"
      ) {
        result =
          result.filter(
            (x) =>
              num(
                x.Remaining
              ) > 0 &&
              num(
                x.Remaining
              ) <=
                num(
                  x.Minimum
                )
          );
      }

      if (
        page === "out"
      ) {
        result =
          result.filter(
            (x) =>
              num(
                x.Remaining
              ) <= 0
          );
      }

      if (
        page === "soon"
      ) {
        result =
          result.filter(
            (x) =>
              inventoryExpiryEntries(x, inventoryBatches).some(
                (entry) => entry.days !== null && entry.days >= 0 && entry.days <= 90
              )
          );
      }

      if (
        page === "expired"
      ) {
        result =
          result.filter(
            (x) =>
              inventoryExpiryEntries(x, inventoryBatches).some(
                (entry) => entry.days !== null && entry.days < 0
              )
          );
      }

      if (category !== "All") {
  result = result.filter(
    (x) =>
      String(x.Category || "").toLowerCase() ===
      String(category || "").toLowerCase()
  );
}

      if (
        page ===
          "request"
      ) {
        result =
          result.filter(
            (x) =>
              num(
                x.Remaining
              ) <=
              num(
                x.Minimum
              )
          );
      }

      const q =
        search
          .trim()
          .toLowerCase();

      if (q) {
        result =
          result.filter(
            (x) => {
              const linkedBatches =
                inventoryBatches[String(x.id)] || [];

              const companyText = linkedBatches
                .map((b) => b.supplier || "")
                .join(" ");

              const lotText = linkedBatches
                .map((b) => b.batch_number || "")
                .join(" ");

              const text =
                `${x.Category || ""} ` +
                `${x.Item || ""} ` +
                `${x.Status || ""} ` +
                `${expiryOf(x) || ""} ` +
                `${companyText} ` +
                `${lotText}`;

              return text
                .toLowerCase()
                .includes(q);
            }
          );
      }

      return result;
    }, [
      items,
      inventoryBatches,
      page,
      category,
      search,
    ]);

  /* =======================================================
     NAVIGATION WITH PERMISSIONS
     ======================================================= */

  const navigate = (
    nextPage
  ) => {
    if (
      nextPage === "in" &&
      !canReceive
    ) {
      alert(
        "You do not have permission to receive stock."
      );
      return;
    }

    if (
      nextPage === "history" &&
      !canHistory
    ) {
      alert(
        "Inventory History is restricted."
      );
      return;
    }

    if (
      nextPage === "staff" &&
      !canStaff
    ) {
      alert(
        "Staff / Users is restricted."
      );
      return;
    }

    if (
      nextPage === "audit" &&
      !canAudit
    ) {
      alert(
        "Audit Log is restricted."
      );
      return;
    }

    if (
      nextPage === "settings" &&
      !canSettings
    ) {
      alert(
        "Settings is restricted."
      );
      return;
    }

    if (nextPage !== page) {
      void writeAudit(
        "NAVIGATE",
        `Opened ${pageTitle[nextPage] || nextPage}`
      );
    }

    setPage(
      nextPage
    );

    setSearch("");

    if (
      nextPage !==
      "category"
    ) {
      setCategory(
        "All"
      );
    }

    setNoticeOpen(
      false
    );

    setProfileOpen(
      false
    );
  };

  /* =======================================================
     STOCK MODAL
     ======================================================= */

  const openStock = (
    mode,
    item
  ) => {
    if (
      mode === "stock-in" &&
      !canReceive
    ) {
      alert(
        "Receive / Stock In is available for administrators only."
      );
      return;
    }

    if (
      mode === "stock-out" &&
      !canConsume
    ) {
      alert(
        "You do not have permission to consume stock."
      );
      return;
    }

    const linkedBatches =
      sortBatchesFEFO(
        inventoryBatches[String(item?.id)] || []
      );

    const availableBatches =
      linkedBatches.filter(
        (batch) =>
          num(batch.remaining_quantity) > 0
      );

    const firstBatch =
      availableBatches[0] ||
      linkedBatches[0] ||
      null;

    setSelected(item || null);
    setQty(1);
    setStockBatchId(
      firstBatch?.id
        ? String(firstBatch.id)
        : ""
    );

    if (mode === "stock-in") {
      setStockExpiry(
        normalizeDate(
          firstBatch?.expiry_date ||
          item?.expiry_date
        )
      );
    } else {
      setStockExpiry("");
    }

    setModal(mode);
  };

  /* =======================================================
     UPDATE STOCK
     ======================================================= */

  const updateStock = async () => {
    if (!selected) return;

    const quantity = num(qty);

    if (quantity < 1) {
      alert("Please enter a valid quantity.");
      return;
    }

    const isReceive = modal === "stock-in";

    if (isReceive && !canReceive) {
      alert("You do not have permission to receive stock.");
      return;
    }

    if (!isReceive && !canConsume) {
      alert("You do not have permission to consume stock.");
      return;
    }

    if (isReceive && !stockExpiry) {
      alert("Please select an expiry date.");
      return;
    }

    setSaving(true);

    try {
      const actorName =
        currentUser?.name ||
        currentUser?.username ||
        "Unknown User";

      const { data: freshBatches, error: batchLoadError } =
        await supabase
          .from("inventory_batches")
          .select(`
            id,
            inventory_id,
            batch_number,
            supplier,
            received_date,
            expiry_date,
            quantity,
            remaining_quantity,
            unit,
            status,
            notes
          `)
          .eq("inventory_id", selected.id)
          .order("expiry_date", {
            ascending: true,
            nullsFirst: false,
          });

      if (batchLoadError) throw batchLoadError;

      const availableBatches =
        sortBatchesFEFO(
          freshBatches || []
        ).filter(
          (batch) =>
            num(batch.remaining_quantity) > 0
        );

      if (!availableBatches.length) {
        throw new Error(
          "No available batch exists for this item. Please create a Batch / Lot first."
        );
      }

      if (isReceive) {
        const targetBatch =
          availableBatches.find(
            (batch) =>
              String(batch.id) ===
              String(stockBatchId)
          ) ||
          availableBatches[0];

        const { error: rpcError } =
          await supabase.rpc(
            "stock_in_batch",
            {
              p_inventory_id:
                Number(selected.id),
              p_batch_number:
                targetBatch.batch_number,
              p_quantity:
                quantity,
              p_supplier:
                targetBatch.supplier ||
                null,
              p_received_date:
                new Date()
                  .toISOString()
                  .slice(0, 10),
              p_expiry_date:
                normalizeDate(stockExpiry) ||
                null,
              p_unit:
                targetBatch.unit ||
                null,
              p_notes:
                `Stock In from Inventory — ${actorName}`,
            }
          );

        if (rpcError) throw rpcError;
      } else {
        const { error: rpcError } =
          await supabase.rpc(
            "stock_out_from_batches",
            {
              p_inventory_id:
                Number(selected.id),
              p_quantity:
                quantity,
              p_notes:
                `Stock Out from Inventory — ${actorName}`,
            }
          );

        if (rpcError) throw rpcError;
      }

      const historyAction =
        isReceive
          ? "STOCK IN"
          : "STOCK OUT";

      const { error: historyError } =
        await supabase
          .from("inventory_history")
          .insert([
            {
              user_name: actorName,
              action: historyAction,
              item_name:
                selected.Item ||
                "Unnamed item",
              quantity: String(quantity),
              notes: isReceive
                ? `Added ${quantity} through Batch / Lot`
                : `Consumed ${quantity} through FEFO Batch / Lot`,
            },
          ]);

      if (historyError) {
        console.warn(
          "LAB TAIF: Inventory history insert failed:",
          historyError.message
        );
      }

      const { error: notificationError } =
        await supabase.functions.invoke(
          "send-push-notification",
          {
            body: {
              title:
                isReceive
                  ? "🔔 LAB TAIF — Stock Added"
                  : "🔔 LAB TAIF — Stock Deducted",
              body:
                isReceive
                  ? `تم إضافة ${quantity} من ${selected.Item || "الصنف"} بواسطة ${actorName}`
                  : `تم خصم ${quantity} من ${selected.Item || "الصنف"} بواسطة ${actorName}`,
              type:
                isReceive
                  ? "stock-in"
                  : "stock-out",
              item_id:
                String(selected.id),
              item_name:
                selected.Item || "",
              quantity:
                String(quantity),
              action:
                historyAction,
            },
          }
        );

      if (notificationError) {
        console.warn(
          "LAB TAIF: Push notification failed:",
          notificationError.message
        );
      }

      setModal(null);
      setSelected(null);
      setQty(1);
      setStockExpiry("");
      setStockBatchId("");

      await load();
    } catch (error) {
      console.error(
        "LAB TAIF: Stock update failed:",
        error
      );
      alert(
        error?.message ||
        "Failed to update stock."
      );
    } finally {
      setSaving(false);
    }
  };

  const sendInventoryNotification = async ({
    action,
    itemName,
    quantity = "",
  }) => {
    const actorName =
      currentUser?.name ||
      currentUser?.username ||
      "Unknown User";

    const titles = {
      ADD: "🔔 LAB TAIF — Item Added",
      EDIT: "🔔 LAB TAIF — Item Updated",
      DELETE: "🔔 LAB TAIF — Item Deleted",
      "STOCK IN": "🔔 LAB TAIF — Stock Added",
      "STOCK OUT": "🔔 LAB TAIF — Stock Deducted",
    };

    const bodies = {
      ADD: `تم إضافة الصنف ${itemName} بواسطة ${actorName}`,
      EDIT: `تم تعديل الصنف ${itemName} بواسطة ${actorName}`,
      DELETE: `تم حذف الصنف ${itemName} بواسطة ${actorName}`,
      "STOCK IN": `تم إضافة ${quantity} من ${itemName} بواسطة ${actorName}`,
      "STOCK OUT": `تم خصم ${quantity} من ${itemName} بواسطة ${actorName}`,
    };

    try {
      const { error } = await supabase.functions.invoke(
        "send-push-notification",
        {
          body: {
            title: titles[action] || "🔔 LAB TAIF — Inventory Updated",
            body: bodies[action] || `تم تحديث ${itemName} بواسطة ${actorName}`,
            type: action.toLowerCase().replace(/\s+/g, "-"),
            item_name: itemName || "",
            quantity: String(quantity || ""),
            action,
          },
        }
      );

      if (error) {
        console.warn(
          "LAB TAIF: Inventory push notification failed:",
          error.message
        );
      }
    } catch (error) {
      console.warn(
        "LAB TAIF: Inventory push notification exception:",
        error?.message || error
      );
    }
  };

  const deleteItem = async (item) => {
    if (!item) return;

    if (!canDelete) {
      alert("Delete is restricted to administrators.");
      return;
    }

    const itemName = item.Item || "this item";

    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("inventory")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        throw deleteError;
      }

      await writeAudit(
        "DELETE ITEM",
        item.Item || ""
      );

      await sendInventoryNotification({
        action: "DELETE",
        itemName,
      });

      await load();
    } catch (error) {
      console.error("Delete item failed:", error);
      alert(error?.message || "Failed to delete item.");
    }
  };

  /* =======================================================
     PAGE TITLES
     ======================================================= */

  const pageTitle = {
  all: "All Inventory Items",
  low: "Low Stock",
  out: "Out of Stock",
  soon: "Expiring Soon",
  expired: "Expired Items",
  category: "Inventory by Category",
  request: "Request List",
  history: "Inventory History",
  forms: "Forms Center",
  reports: "Reports & Files",
  staff: "Staff / Users",
  audit: "Audit Log",
  settings: "Settings",
  about: "About System",
};
  const navClass = (
    key
  ) =>
    page === key
      ? "nav-item active"
      : "nav-item";

  /* =======================================================
     LOGIN
     ======================================================= */

  if (!authReady) {
    return (
      <div className="login-page">
        <div className="login-grid"></div>
        <div className="login-orb orb-one"></div>
        <div className="login-orb orb-two"></div>
        <div className="login-orb orb-three"></div>
        <div className="login-shell">
          <section className="login-panel" style={{ width: "100%" }}>
            <div className="login-card">
              <div className="login-heading">
                <span className="welcome-label">LAB TAIF</span>
                <h2>Loading...</h2>
                <p>Restoring secure session.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        users={users}
        onLogin={handleLogin}
      />
    );
  }

  /* =======================================================
     MAIN APP
     ======================================================= */

  return (
    <div className="app-shell labtaif-premium-shell">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-logo">
            🧪
          </div>

          <div>
            <b>
              LAB TAIF
            </b>

            <small>
              Management System
            </small>
          </div>

        </div>

        <nav className="nav">

          {MENU.map(
            (group) => (
              <div
                className="nav-group"
                key={
                  group.group
                }
              >

                <div className="nav-title">
                  {
                    group.group
                  }
                </div>

                {group.items.map(
                  ([
                    key,
                    icon,
                    label,
                  ]) => {

                    /* Only History and Audit are hidden from limited users.
                       Settings is also restricted below by navigate(). */
                    const hidden =
                      (
                        key === "history" &&
                        !canHistory
                      ) ||
                      (
                        key === "audit" &&
                        !canAudit
                      ) ||
                      (
                        key === "settings" &&
                        !canSettings
                      );

                    if (
                      hidden
                    ) {
                      return null;
                    }

                    return (
                      <button
                        className={navClass(
                          key
                        )}
                        key={
                          key
                        }
                        onClick={() => {
  navigate(key);
  document.body.classList.remove("sidebar-open");
}}
                      >

                        <span>
                          {
                            icon
                          }
                        </span>

                        <em>
                          {
                            label
                          }
                        </em>

                        {key ===
                          "request" &&
                          stats.low +
                            stats.out >
                            0 && (
                            <i>
                              {
                                stats.low +
                                  stats.out
                              }
                            </i>
                          )}

                      </button>
                    );
                  }
                )}

              </div>
            )
          )}

        </nav>

        <div className="side-user">

          <div className="avatar">
            {currentUser.name
              ? currentUser.name
                  .charAt(
                    0
                  )
                  .toUpperCase()
              : "M"}
          </div>

          <div>

            <b>
              {
                currentUser.name
              }
            </b>

            <small>
              {
                currentUser.role
              }
            </small>

            <small className="online">
              ● Online
            </small>

          </div>

        </div>

        <button
          className="logout"
          onClick={
            handleLogout
          }
        >
          ↪ Logout
        </button>

      </aside>

      {/* MAIN */}

      <main className="main">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            className="top-icon mobile-toggle"
            onClick={() =>
              document.body.classList.toggle(
                "sidebar-open"
              )
            }
          >
            ☰
          </button>

          <div className="global-search">

            ⌕

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search anything..."
            />

          </div>

          <div className="top-actions">

            <div className="dropdown-wrap">

              <button
  type="button"
  className="top-icon notification-btn"
  onClick={() => {
    setNoticeOpen((v) => !v);
    setProfileOpen(false);
  }}
  aria-label="Notifications"
>
  <span className="bell-icon">🔔</span>

  {stats.low + stats.out + stats.expired > 0 && (
    <span className="notify-dot">
      {stats.low + stats.out + stats.expired > 99
        ? "99+"
        : stats.low + stats.out + stats.expired}
    </span>
  )}
</button>

              {noticeOpen && (
  <div className="dropdown notification notification-panel">

                  <b>
                    Notifications
                  </b>

                  <p>
                    {
                      stats.out
                    }{" "}
                    out of stock
                  </p>

                  <p>
                    {
                      stats.low
                    }{" "}
                    low stock
                  </p>

                  <p>
                    {
                      stats.expired
                    }{" "}
                    expired
                  </p>

                </div>
              )}

            </div>

            <button
              className="top-icon"
              onClick={() =>
                window.print()
              }
            >
              🖨
            </button>

            <button
              className="top-icon"
              onClick={() =>
                setDark(
                  (v) => !v
                )
              }
            >
              {dark
                ? "☾"
                : "☀"}
            </button>

            <div className="dropdown-wrap">

              <button
                className="profile-btn"
                onClick={() =>
                  setProfileOpen(
                    (v) =>
                      !v
                  )
                }
              >

                <div className="avatar">
                  {currentUser.name
                    ? currentUser.name
                        .charAt(
                          0
                        )
                        .toUpperCase()
                    : "M"}
                </div>

                <span>

                  <b>
                    {
                      currentUser.name
                    }
                  </b>

                  <small>
                    {
                      currentUser.role
                    }
                  </small>

                </span>

                ⌄

              </button>

              {profileOpen && (
                <div className="dropdown profile-menu">

                  <b>
                    {
                      currentUser.name
                    }
                  </b>

                  <p>
                    {
                      currentUser.role
                    }
                  </p>

                  {canSettings && (
                    <button
                      onClick={() =>
                        navigate(
                          "settings"
                        )
                      }
                    >
                      ⚙ Settings
                    </button>
                  )}

                  <button
                    onClick={() =>
                      navigate(
                        "about"
                      )
                    }
                  >
                    ⓘ About
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="content labtaif-page-content">

  /* FORMS */

  {page === "forms" ? (
    <FormsPage />

  /* DASHBOARD */

  ) : page === "dashboard" ? (
            <DashboardContent
              items={items}
              stats={stats}
              openStock={
                openStock
              }
              deleteItem={
                deleteItem
              }
              navigate={
                navigate
              }
              canReceive={
                canReceive
              }
              canConsume={
                canConsume
              }
              inventoryBatches={
                inventoryBatches
              }
          />

          /* HISTORY */

          ) : page ===
            "history" && canHistory ? (
            <InventoryHistoryPage />

          /* STOCK OPERATIONS */

          ) : page ===
              "in" ||
            page ===
              "outop" ? (

            <OperationPage
              page={page}
              items={items}
              openStock={
                openStock
              }
              canReceive={
                canReceive
              }
              canConsume={
                canConsume
              }
            />

          /* STAFF */

          ) : page ===
            "staff" ? (

            <StaffUsersPage
              users={users}
              setUsers={
                setUsers
              }
              currentUser={
                currentUser
              }
              writeAudit={
                writeAudit
              }
              canManageUsers={
                canManageUsers
              }
            />

          /* SETTINGS */

          ) : page ===
            "settings" ? (

            <SettingsPage
              currentUser={
                currentUser
              }
              dark={dark}
              setDark={
                setDark
              }
              users={users}
              setUsers={
                setUsers
              }
              writeAudit={
                writeAudit
              }
            />

          /* ABOUT */

          ) : page ===
            "about" ? (

            <AboutPage />

          /* AUDIT */

          ) : page ===
            "audit" ? (

            <AuditLogPage />

          /* REPORTS */

          ) : page ===
            "reports" ? (

            <ReportsPage />

          /* CATEGORY */

          ) : page ===
            "category" ? (

            <InventoryPage
              title={
                pageTitle[
                  page
                ]
              }
              items={
                visible
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              category={
                category
              }
              setCategory={
                setCategory
              }
              categories={
                categories
              }
              onIn={
                canReceive
                  ? (x) =>
                      openStock(
                        "stock-in",
                        x
                      )
                  : null
              }
              onOut={
                canConsume
                  ? (x) =>
                      openStock(
                        "stock-out",
                        x
                      )
                  : null
              }
              onEdit={
                canEdit
              }
              onDelete={
                canDelete
              }
              onReload={
                load
              }
              onNotify={
                sendInventoryNotification
              }
              inventoryBatches={
                inventoryBatches
              }
            />

          /* INVENTORY */

          ) : [
              "all",
              "low",
              "out",
              "soon",
              "expired",
              "request",
            ].includes(
              page
            ) ? (

            <InventoryPage
              title={
                pageTitle[
                  page
                ]
              }
              items={
                visible
              }
              search={
                search
              }
              setSearch={
                setSearch
              }
              category={
                category
              }
              setCategory={
                setCategory
              }
              categories={
                categories
              }
              onIn={
                canReceive
                  ? (x) =>
                      openStock(
                        "stock-in",
                        x
                      )
                  : null
              }
              onOut={
                canConsume
                  ? (x) =>
                      openStock(
                        "stock-out",
                        x
                      )
                  : null
              }
              onEdit={
                canEdit
              }
              onDelete={
                canDelete
              }
              onReload={
                load
              }
              onNotify={
                sendInventoryNotification
              }
              inventoryBatches={
                inventoryBatches
              }
            />

          ) : (

            <div className="module-card">

              <div className="module-icon">
                🧪
              </div>

              <h1>
                {
                  pageTitle[
                    page
                  ]
                }
              </h1>

              <p>
                This module is
                reserved for
                the next build
                step.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "dashboard"
                  )
                }
              >
                ← Back to
                Dashboard
              </button>

            </div>
          )}

          {error && (
            <div className="error-box">
              Supabase error:
              {" "}
              {error}
            </div>
          )}

        </section>

        <footer>
          © 2026 LAB TAIF
          Medical Center.
          All rights reserved.

          <span>
            Version 1.0
          </span>
        </footer>

      </main>

      
      {/* STOCK MODAL */}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(
            e
          ) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setModal(
                null
              );
            }
          }}
        >

          <div className="modal">

            <button
              className="close"
              onClick={() =>
                setModal(
                  null
                )
              }
            >
              ×
            </button>

            <h2>
              {modal ===
              "stock-in"
                ? "Stock In"
                : "Stock Out"}
            </h2>

            <p>
              {
                selected?.Item
              }
            </p>

            <div className="current-stock">
              Current:
              {" "}
              <b>
                {num(
                  selected?.Remaining
                )}
              </b>
            </div>

            <label>
              Quantity
            </label>

            <input
              type="number"
              min="1"
              value={qty}
              onChange={(
                e
              ) =>
                setQty(
                  Math.max(
                    1,
                    Number(
                      e.target
                        .value
                    ) || 1
                  )
                )
              }
            />

            {modal ===
              "stock-in" ? (
              <div
                className="stock-expiry-box"
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "12px",
                  border:
                    "1px solid rgba(255,255,255,.15)",
                  borderRadius:
                    "10px",
                }}
              >

                <label>
                  Expiry Date 📅
                </label>

                <input
                  type="date"
                  value={
                    stockExpiry
                  }
                  onChange={(
                    e
                  ) =>
                    setStockExpiry(
                      e.target
                        .value
                    )
                  }
                />

              </div>
            ) : (
              <div
                className="stock-expiry-box"
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "12px",
                  border:
                    "1px solid rgba(255,255,255,.15)",
                  borderRadius:
                    "10px",
                }}
              >
                <b>FEFO Stock Out</b>
                <small
                  style={{
                    display:
                      "block",
                    marginTop:
                      "8px",
                    opacity:
                      0.75,
                  }}
                >
                  Stock Out automatically uses FEFO
                  from the available batches.
                  Manual lot selection and expired-lot
                  override remain available in
                  Batch / Lot Management.
                </small>
              </div>
            )}

            <button
              className={
                modal ===
                "stock-in"
                  ? "save green-btn"
                  : "save red-btn"
              }
              onClick={
                updateStock
              }
              disabled={
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Save to Supabase"}
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function DashboardContent({
  items,
  stats,
  openStock,
  deleteItem,
  navigate,
  canReceive,
  canConsume,
  inventoryBatches = {},
}) {
  return (
    <>
      <div className="heading">

        <div>
          <h1>
            Dashboard
          </h1>

          <p>
            LAB TAIF Management
            System
          </p>
        </div>

        <div className="heading-actions">

          <button
            className="outline-btn"
            onClick={() =>
              window.location.reload()
            }
          >
            ↻ Refresh
          </button>

          <button
            className="print-btn"
            onClick={() =>
              window.print()
            }
          >
            🖨 Print
          </button>

        </div>

      </div>

      <div className="stat-grid">

        <Stat
          title="Total Items"
          value={stats.total}
          sub="All inventory items"
          icon="📦"
          tone="blue"
        />

        <Stat
          title="In Stock"
          value={stats.inStock}
          sub="Items in good stock"
          icon="✓"
          tone="green"
        />

        <Stat
          title="Low Stock"
          value={stats.low}
          sub="Below minimum level"
          icon="⚠"
          tone="orange"
        />

        <Stat
          title="Out of Stock"
          value={stats.out}
          sub="Items out of stock"
          icon="×"
          tone="red"
        />

        <Stat
          title="Expiring Soon"
          value={stats.soon}
          sub="Within 90 days"
          icon="◷"
          tone="purple"
        />

      </div>

      <div className="dashboard-grid">

        <Panel
          title="Inventory Status Overview"
          sub="Current inventory condition"
        >

          <div className="donut-wrap">

            <div className="donut">
              <div>
                <b>
                  {stats.total}
                </b>

                <small>
                  Total
                </small>
              </div>
            </div>

            <div className="legend">

              <Legend
                c="green"
                t="In Stock"
                n={stats.inStock}
              />

              <Legend
                c="orange"
                t="Low Stock"
                n={stats.low}
              />

              <Legend
                c="red"
                t="Out of Stock"
                n={stats.out}
              />

            </div>

          </div>

          <button
            className="wide-btn"
            onClick={() =>
              navigate(
                "all"
              )
            }
          >
            View All Items →
          </button>

        </Panel>

        <Panel
          title="Expiry Alerts"
          sub="Items requiring attention"
        >

          <div className="expiry-box">

            <Legend
              c="red"
              t="Expired"
              n={stats.expired}
            />

            <Legend
              c="orange"
              t="≤ 30 Days"
              n={
                items.filter((x) =>
                inventoryExpiryEntries(x, inventoryBatches).some(
                  (entry) => entry.days !== null && entry.days >= 0 && entry.days <= 30
                )
              ).length
              }
            />

            <Legend
              c="yellow"
              t="≤ 90 Days"
              n={stats.soon}
            />

          </div>

          <button
            className="wide-btn"
            onClick={() =>
              navigate(
                "soon"
              )
            }
          >
            View Expiring Items →
          </button>

        </Panel>

        <Panel
          title={
            <span>
              Request List{" "}
              <mark>
                {stats.low +
                  stats.out}
              </mark>
            </span>
          }
          sub="Items below minimum stock"
        >

          <div className="request-box">

            {items
              .filter(
                (x) =>
                  num(
                    x.Remaining
                  ) <=
                  num(
                    x.Minimum
                  )
              )
              .slice(
                0,
                6
              )
              .map(
                (x) => (
                  <div
                    className="request-row"
                    key={
                      x.id
                    }
                  >

                    <b>
                      {
                        x.Item ||
                        "Unnamed item"
                      }
                    </b>

                    <span>
                      Remaining:
                      {" "}
                      {num(
                        x.Remaining
                      )}
                    </span>

                    <span>
                      Min:
                      {" "}
                      {num(
                        x.Minimum
                      )}
                    </span>

                    <button
                      onClick={() =>
                        alert(
                          "Request added: " +
                            x.Item
                        )
                      }
                    >
                      Request
                    </button>

                  </div>
                )
              )}

            {!stats.low &&
              !stats.out && (
                <div className="empty">
                  No requests.
                </div>
              )}

          </div>

        </Panel>

      </div>

      <div className="panel table-panel">

        <div className="panel-head">

          <div>
            <h3>
              Recent Inventory
            </h3>

            <small>
              Live data from
              Supabase
            </small>
          </div>

          <button
            className="text-btn"
            onClick={() =>
              navigate(
                "all"
              )
            }
          >
            View All
          </button>

        </div>

        <InventoryTable
          items={
            items.slice(
              0,
              10
            )
          }
          inventoryBatches={
            inventoryBatches
          }
          onIn={
            canReceive
              ? (x) =>
                  openStock(
                    "stock-in",
                    x
                  )
              : null
          }
          onOut={
            canConsume
              ? (x) =>
                  openStock(
                    "stock-out",
                    x
                  )
              : null
          }
          onEdit={
            canReceive
              ? () => navigate("all")
              : null
          }
          onDelete={
            canReceive
              ? deleteItem
              : null
          }
          allowEdit={
            canReceive
          }
          allowDelete={
            canReceive
          }
        />

      </div>
    </>
  );
}

/* =========================================================
   OPERATION PAGE
   ========================================================= */

function OperationPage({
  page,
  items,
  openStock,
  canReceive,
  canConsume,
}) {
  return (
    <div className="operation-page">

      <div className="heading">

        <div>
          <h1>
            {page === "in"
              ? "Stock In (Receive)"
              : "Stock Out (Consume)"}
          </h1>

          <p>
            Update inventory
            quantities directly
            in Supabase
          </p>
        </div>

      </div>

      <div className="panel">

        <div className="operation-list">

          {items.map(
            (x) => (
              <div
                className="operation-row"
                key={
                  x.id
                }
              >

                <div>
                  <b>
                    {x.Item}
                  </b>

                  <small>
                    {x.Category}
                  </small>
                </div>

                <strong>
                  {num(
                    x.Remaining
                  )}
                </strong>

                {canReceive && (
                  <button
                    className="green-btn"
                    onClick={() =>
                      openStock(
                        "stock-in",
                        x
                      )
                    }
                  >
                    + Receive
                  </button>
                )}

                {canConsume && (
                  <button
                    className="red-btn"
                    onClick={() =>
                      openStock(
                        "stock-out",
                        x
                      )
                    }
                  >
                    - Consume
                  </button>
                )}

              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   STAFF / USERS — PREMIUM ADMIN UI
   ========================================================= */
function StaffUsersPage({
  users,
  setUsers,
  currentUser,
  writeAudit,
  canManageUsers = false,
}) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", username: "", password: "", role: "Limited User",
    permissions: "consume", active: true,
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name:"", username:"", password:"", role:"Limited User", permissions:"consume", active:true });
  };
  const editUser = (u) => {
    setEditing(u.id);
    setForm({ name:u.name||"", username:u.username||"", password:u.password||"", role:u.role||"Limited User", permissions:u.permissions||"consume", active:u.active!==false });
    window.scrollTo({top:0, behavior:"smooth"});
  };
  const saveUser = async () => {
    if (!canManageUsers) return alert("Only Mustafa Hassan and DR / AMIRA ABOUELKHAIR can manage users.");
    if (!form.name.trim() || !form.username.trim() || !form.password) return alert("Please complete Name, Username and Password.");
    const protectedAdmin = editing === "mustafa" || editing === "amira";
    const duplicate = users.find(
      u =>
        String(u.username || "").toLowerCase() === form.username.trim().toLowerCase() &&
        u.id !== editing
    );
    if (duplicate) return alert("Username already exists.");

    /* The permission selected in Staff / Users is now actually saved.
       Only the two permanent administrator accounts are locked to FULL. */
    const selectedPermission = protectedAdmin ? "full" : form.permissions;
    const safe = {
      ...form,
      username: form.username.trim(),
      permissions: selectedPermission,
      role: selectedPermission === "full" ? "Administrator" : "Limited User",
    };
    const updated = editing
      ? users.map(u => u.id === editing ? {...u, ...safe} : u)
      : [...users, {id:`user-${Date.now()}`, ...safe}];
    setUsers(updated); saveUsers(updated);
    await writeAudit(
  editing ? "EDIT USER" : "ADD USER",
  `${safe.username} — Permission: ${safe.permissions === "full" ? "full" : "stock out only"} — Role: ${safe.role} — Status: ${safe.active ? "active" : "disabled"}`
);
    resetForm();
  };
  const deleteUser = async (u) => {
    if (!canManageUsers) return alert("Only Mustafa Hassan and DR / AMIRA ABOUELKHAIR can manage users.");
    if (u.id === currentUser.id) return alert("You cannot delete the account currently logged in.");
    if (u.permissions === "full" && users.filter(x=>x.permissions === "full").length <= 2) return alert("At least one administrator account must remain.");
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    const updated = users.filter(x=>x.id !== u.id);
    setUsers(updated); saveUsers(updated);
    await writeAudit("DELETE USER", u.username);
  };

  const filtered = users.filter(u => {
    const q=query.trim().toLowerCase();
    const matchesQ=!q || `${u.name} ${u.username} ${u.role}`.toLowerCase().includes(q);
    const matchesF=filter==="all" || (filter==="admin" && u.permissions==="full") || (filter==="limited" && u.permissions!=="full") || (filter==="inactive" && !u.active);
    return matchesQ && matchesF;
  });
  const admins=users.filter(u=>u.permissions==="full").length;
  const active=users.filter(u=>u.active!==false).length;
  const limited=users.length-admins;

  return <div className="lt-page lt-users-page">
    <div className="lt-page-head">
      <div><span className="lt-eyebrow">ACCESS MANAGEMENT</span><h1>Staff / Users</h1><p>Manage internal LAB TAIF users and permissions.</p></div>
      {canManageUsers && <button className="lt-primary" onClick={()=>{resetForm(); document.querySelector('.lt-user-editor')?.scrollIntoView({behavior:'smooth'});}}><span>＋</span> Add New User</button>}
    </div>

    <div className="lt-stat-grid">
      <div className="lt-stat-card blue"><span className="lt-stat-icon">♙</span><small>Total Users</small><strong>{users.length}</strong><em>All system users</em></div>
      <div className="lt-stat-card gold"><span className="lt-stat-icon">♛</span><small>Administrators</small><strong>{admins}</strong><em>Full access</em></div>
      <div className="lt-stat-card purple"><span className="lt-stat-icon">🔒</span><small>Limited Users</small><strong>{limited}</strong><em>Stock out only</em></div>
      <div className="lt-stat-card green"><span className="lt-stat-icon">✓</span><small>Active Users</small><strong>{active}</strong><em>Currently active</em></div>
    </div>

    <div className="lt-panel lt-user-editor">
      <div className="lt-panel-head"><div><h3>{editing ? "Edit User" : "Add New User"}</h3><p>Internal accounts are stored locally on this installation.</p></div><span className={`lt-badge ${canManageUsers?'success':'muted'}`}>{canManageUsers?'ADMIN CONTROL':'VIEW ONLY'}</span></div>
      <div className="lt-form-grid">
        {[["Full Name","name","text"],["Username","username","text"],["Password","password","password"]].map(([label,key,type])=><label key={key}><span>{label}</span><input disabled={!canManageUsers} type={type} value={form[key]} placeholder={key==='password'?'Minimum 8 characters':`Enter ${label.toLowerCase()}`} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
        <label><span>Role</span><select disabled={!canManageUsers} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>Limited User</option><option>Administrator</option></select></label>
        <label><span>Permissions</span><select disabled={!canManageUsers} value={form.permissions} onChange={e=>setForm({...form,permissions:e.target.value,role:e.target.value==='full'?'Administrator':'Limited User'})}><option value="consume">Stock Out Only</option>{canManageUsers && <option value="full">Full Access — Administrator</option>}</select></label>
        <label><span>Status</span><select disabled={!canManageUsers} value={form.active?'active':'inactive'} onChange={e=>setForm({...form,active:e.target.value==='active'})}><option value="active">Active</option><option value="inactive">Disabled</option></select></label>
      </div>
      {canManageUsers ? <div className="lt-actions"><button className="lt-primary" onClick={saveUser}>{editing?'✓ Save Changes':'＋ Add User'}</button>{editing&&<button className="lt-ghost" onClick={resetForm}>Cancel</button>}</div> : <div className="lt-lock-note">🔒 You can view users, but only Mustafa Hassan and DR / AMIRA ABOUELKHAIR can add, edit, delete, or change permissions.</div>}
    </div>

    <div className="lt-panel lt-users-table">
      <div className="lt-panel-head"><div><h3>System Users</h3><p>Showing {filtered.length} of {users.length} internal users.</p></div></div>
      <div className="lt-toolbar"><div className="lt-search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search users..."/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All Users</option><option value="admin">Administrators</option><option value="limited">Limited Users</option><option value="inactive">Disabled</option></select></div>
      <div className="lt-table-wrap"><table className="lt-table"><thead><tr><th>User</th><th>Username</th><th>Role</th><th>Permission</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><div className="lt-user-cell"><span className="lt-avatar">{u.name?.charAt(0).toUpperCase()||'U'}</span><div><b>{u.name}</b><small>{u.username}</small></div></div></td><td>{u.username}</td><td><span className="lt-role">{u.role}</span></td><td><span className={`lt-badge ${u.permissions==='full'?'success':'warning'}`}>{u.permissions==='full'?'FULL ACCESS':'STOCK OUT ONLY'}</span></td><td><span className={`lt-online ${u.active!==false?'on':'off'}`}><i/> {u.active!==false?'Active':'Disabled'}</span></td><td>{canManageUsers?<div className="lt-row-actions"><button title="Edit" onClick={()=>editUser(u)}>✎</button><button className="danger" title="Delete" onClick={()=>deleteUser(u)}>⌫</button></div>:<span className="lt-viewonly">VIEW ONLY</span>}</td></tr>)}</tbody></table></div>
    </div>
  </div>;
}


/* =========================================================
   SETTINGS — PREMIUM ADMIN UI
   ========================================================= */
function SettingsPage({ currentUser, dark, setDark, users, setUsers, writeAudit }) {
  const [tab, setTab] = useState("general");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const isAdmin = ["mustafa", "amira"].includes(
    String(currentUser?.username || "").toLowerCase()
  );


const changePassword = async () => {
  if (!currentUser) {
    alert("No active user session.");
    return;
  }

  if (password.length < 8) {
    alert("Use a password with at least 8 characters.");
    return;
  }

  if (password !== confirm) {
    alert("Passwords do not match.");
    return;
  }

  try {
    console.log("LAB TAIF: Starting Supabase password change...");

    // Make sure there is an active Supabase Auth session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("LAB TAIF: Current Supabase session:", session);
    console.log("LAB TAIF: Session error:", sessionError);

    if (sessionError) {
      console.error(
        "LAB TAIF: Could not get Supabase session:",
        sessionError
      );

      alert(
        sessionError.message ||
          "Could not verify your login session."
      );

      return;
    }

    if (!session?.user) {
      alert(
        "Your Supabase session is not active. Please logout and login again."
      );

      return;
    }

    console.log(
      "LAB TAIF: Auth user ID:",
      session.user.id
    );

    console.log(
      "LAB TAIF: Auth email:",
      session.user.email
    );

    // IMPORTANT:
    // Change the password in Supabase Authentication.
    // Nothing is stored in user_profiles or local users.
    const {
      data,
      error: updateError,
    } = await supabase.auth.updateUser({
      password: password,
    });

    console.log(
      "LAB TAIF: Password update response:",
      data
    );

    console.log(
      "LAB TAIF: Password update error:",
      updateError
    );

    if (updateError) {
      console.error(
        "LAB TAIF: Supabase password change FAILED:",
        updateError
      );

      alert(
        updateError.message ||
          "Supabase could not change your password."
      );

      return;
    }

    // Clear the form
    setPassword("");
    setConfirm("");

    // Show success
    setSaved(true);

    console.log(
      "LAB TAIF: PASSWORD CHANGED SUCCESSFULLY IN SUPABASE AUTH"
    );

    alert(
      "Password changed successfully.\n\nPlease logout and login again using your new password."
    );

    setTimeout(() => {
      setSaved(false);
    }, 2500);

  } catch (error) {
    console.error(
      "LAB TAIF: Unexpected password change error:",
      error
    );

    alert(
      error?.message ||
        "Unexpected error while changing password."
    );
  }
};



  const security = [
    ["Authentication", "SUPABASE AUTH", "success"],
    ["Supabase Auth", "CONNECTED", "success"],
    ["Inventory Database", "SUPABASE", "success"],
    ["Access Level", "OWNER / ADMINISTRATOR", "success"],
    ["History & Audit", "ADMIN ONLY", "warning"],
  ];

  return (
    <div className="lt-page">
      <div className="heading">
        <div>
          <h1>System Control Center</h1>
          <p>Manage system preferences, security and administrator controls.</p>
        </div>
      </div>

      <div className="lt-panel">
        <div className="lt-panel-head">
          <div>
            <h3>Authorized Admin</h3>
            <p>Current administrator account</p>
          </div>
          <span className="lt-badge success">FULL CONTROL</span>
        </div>

        <div className="lt-profile-large">
          <span className="lt-avatar big">
            {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
          </span>
          <div>
            <b>{currentUser?.name}</b>
            <small>
              @{currentUser?.username} · {currentUser?.role || "Administrator"}
            </small>
          </div>
        </div>
      </div>

      <div className="lt-stat-grid">
        <div className="lt-stat-card blue">
          <small>System Status</small>
          <strong>Online</strong>
          <em>Private installation</em>
        </div>

        <div className="lt-stat-card green">
          <small>Version</small>
          <strong>1.0.0</strong>
          <em>LAB TAIF release</em>
        </div>

        <div className="lt-stat-card purple">
          <small>Database</small>
          <strong>Connected</strong>
          <em>Supabase inventory</em>
        </div>

        <div className="lt-stat-card gold">
          <small>Access</small>
          <strong>2 Admins</strong>
          <em>Controlled access</em>
        </div>
      </div>

      <div className="lt-panel">
        <div className="lt-toolbar">
          {[
            ["general", "General"],
            ["account", "Account"],
            ["security", "Security"],
            ["system", "System"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`lt-ghost ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "general" && (
        <>
          <div className="lt-panel">
            <div className="lt-panel-head">
              <div>
                <h3>Laboratory Information</h3>
                <p>Core identity of this private installation.</p>
              </div>
            </div>

            <div className="lt-form-grid">
              <label>
                <span>Laboratory Name</span>
                <input value="LAB TAIF Medical Center" readOnly />
              </label>

              <label>
                <span>System Name</span>
                <input value="LAB TAIF Management System" readOnly />
              </label>

              <label>
                <span>System Language</span>
                <select defaultValue="English">
                  <option>English</option>
                  <option>Arabic</option>
                </select>
              </label>

              <label>
                <span>Date Format</span>
                <select defaultValue="DD/MM/YYYY">
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </label>
            </div>

            <button
              className="lt-primary"
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              ✓ Save Changes
            </button>

            {saved && <span className="lt-badge success">✓ Changes saved</span>}
          </div>

          <div className="lt-panel">
            <div className="lt-panel-head">
              <div>
                <h3>Appearance</h3>
                <p>Keep the premium LAB TAIF interface consistent.</p>
              </div>
            </div>

            <div className="lt-security-line">
              <span>
                <b>Dark Mode</b>
                <small>Professional dark laboratory interface.</small>
              </span>

              <button className="lt-toggle" onClick={() => setDark((v) => !v)}>
                <span className={dark ? "active" : ""} />
                {dark ? "Dark" : "Light"}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "account" && (
        <div className="lt-panel">
          <div className="lt-panel-head">
            <div>
              <h3>Administrator Account</h3>
              <p>Your current Supabase Auth account.</p>
            </div>
            <span className="lt-badge success">ACTIVE</span>
          </div>

          <div className="lt-profile-large">
            <span className="lt-avatar big">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <div>
              <b>{currentUser?.name}</b>
              <small>@{currentUser?.username}</small>
              <small>Administrator · Full Control</small>
            </div>
          </div>

          <div className="lt-security-line">
            <span>Supabase authentication</span>
            <b>Enabled</b>
          </div>

          <div className="lt-security-line">
            <span>Public account linking</span>
            <b>Disabled</b>
          </div>

          <div className="lt-security-line">
            <span>Administrator control</span>
            <b>2 accounts</b>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="lt-panel">
          <div className="lt-panel-head">
            <div>
              <h3>Administrator Password</h3>
              <p>Change your Supabase Auth password.</p>
            </div>
          </div>

          <div className="lt-form-grid">
            <label>
              <span>New Password</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
              />
            </label>
          </div>

          <div className="lt-actions">
            <button className="lt-ghost" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide" : "Show"}
            </button>

            <button className="lt-primary" onClick={changePassword}>
              🔒 Change Password
            </button>
          </div>

          {saved && <div className="lt-lock-note">✓ Changes saved successfully.</div>}

          <div className="lt-panel-head">
            <div>
              <h3>System Control & Security</h3>
              <p>Current configuration of this private installation.</p>
            </div>
          </div>

          {security.map(([name, value, tone]) => (
            <div className="lt-security-line" key={name}>
              <span>{name}</span>
              <span className={`lt-badge ${tone}`}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "system" && (
        <div className="lt-two-col">
          <div className="lt-panel">
            <div className="lt-panel-head">
              <div>
                <h3>Administrator Areas</h3>
                <p>Functions reserved for Mustafa and Dr. Amira.</p>
              </div>
            </div>

            {[
              "Stock Receive",
              "Inventory Edit / Delete",
              "Inventory History",
              "Audit Log",
              "Staff / Users Management",
            ].map((name) => (
              <div className="lt-security-line" key={name}>
                <span>{name}</span>
                <span className="lt-badge success">ENABLED</span>
              </div>
            ))}
          </div>

          <div className="lt-panel">
            <div className="lt-panel-head">
              <div>
                <h3>System Profile</h3>
                <p>Private deployment details.</p>
              </div>
            </div>

            {[
              ["Authentication", "Supabase Auth"],
              ["Database", "Supabase"],
              ["Deployment", "Private / Internal"],
              ["Version", "1.0.0"],
            ].map(([a, b]) => (
              <div className="lt-security-line" key={a}>
                <span>{a}</span>
                <b>{b}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AboutPage() {
  const features = [
    ["📦", "Inventory Management", "Real-time stock tracking and control"],
    ["◷", "Expiry Monitoring", "Smart expiry alerts and notifications"],
    ["📋", "Forms Center", "Digital forms & printable documents"],
    ["📊", "Reports & Files", "Advanced reports & data export"],
    ["◉", "Audit Trail", "Full activity traceability"],
    ["🔒", "Secure & Local", "Supabase Auth & access control"],
  ];

  return (
    <div className="lt-page">

      <div className="heading">

        <div>
          <span className="lt-eyebrow">
            SMART LABORATORY OPERATIONS
          </span>

          <h1>About System</h1>

          <p>
            Learn more about LAB TAIF Management System.
          </p>
        </div>

        <span className="lt-badge success">
          VERSION 1.0
        </span>

      </div>

      <section className="lt-about-hero">

        <div className="lt-about-visual lt-about-visual-premium">

          <div className="lt-about-glow lt-about-glow-one" />
          <div className="lt-about-glow lt-about-glow-two" />

          <div className="lt-lab-scene">

            <div className="lt-flask lt-flask-left">
              <i />
              <b />
            </div>

            <div className="lt-flask lt-flask-mid">
              <i />
              <b />
            </div>

            <div className="lt-microscope">
              <span className="scope-head" />
              <span className="scope-arm" />
              <span className="scope-stage" />
              <span className="scope-base" />
              <span className="scope-lens" />
            </div>

            <div className="lt-particles">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

          </div>

          <div className="lt-about-mark">🧪</div>

          <small>
            SMART LABORATORY OPERATIONS
          </small>

        </div>

        <div className="lt-about-copy">

          <span className="lt-eyebrow">
            PRIVATE LABORATORY PLATFORM
          </span>

          <h2>LAB TAIF</h2>

          <h3>Management System</h3>

          <p>
            A dedicated internal platform built to
            organize laboratory inventory, stock
            movements, expiry monitoring, forms,
            reports, users and operational
            traceability in one professional
            workspace.
          </p>

          <div className="lt-hero-tags">
            <span>🔒 PRIVATE INSTALLATION</span>
            <span>⚛ REACT</span>
            <span>◉ SUPABASE</span>
            <span>✓ SECURE AUTH</span>
          </div>

          <div className="lt-about-status">
            <span><i /> SYSTEM ONLINE</span>
            <span><i /> SUPABASE ACCESS CONTROL</span>
            <span><i /> AUDIT READY</span>
          </div>

        </div>

      </section>

      <div className="lt-feature-grid">

        {features.map(([icon, title, sub]) => (
          <div
            className="lt-feature-card lt-feature-card-premium"
            key={title}
          >
            <span>{icon}</span>
            <b>{title}</b>
            <small>{sub}</small>
            <em>→</em>
          </div>
        ))}

      </div>

      <div className="lt-two-col lt-about-info">

        <div className="lt-panel">

          <div className="lt-panel-head">
            <div>
              <h3>System Information</h3>
              <p>
                LAB TAIF private deployment profile.
              </p>
            </div>
          </div>

          {[
            ["Application", "LAB TAIF Management System"],
            ["Version", "1.0"],
            ["Release", "August 2026"],
            ["Frontend", "React"],
            ["Database", "Supabase"],
            ["Authentication", "Supabase Auth"],
            ["Deployment", "Private / Internal Use"],
          ].map(([name, value]) => (
            <div
              className="lt-security-line"
              key={name}
            >
              <span>{name}</span>
              <b>{value}</b>
            </div>
          ))}

        </div>

        <div className="lt-panel">

          <div className="lt-panel-head">

            <div>
              <h3>Controlled Access</h3>
              <p>Core administrator accounts.</p>
            </div>

            <span className="lt-badge success">
              SECURE
            </span>

          </div>

          <div className="lt-profile-large">

            <span className="lt-avatar big">
              M
            </span>

            <div>
              <b>Mustafa Hassan</b>
              <small>
                Owner · Administrator · Full Control
              </small>
            </div>

          </div>

          <div className="lt-profile-large">

            <span className="lt-avatar big amira">
              A
            </span>

            <div>
              <b>DR / AMIRA ABOUELKHAIR</b>
              <small>
                Supervisor · Administrator · Full Control
              </small>
            </div>

          </div>

        </div>

      </div>

      <div className="lt-credits lt-credits-premium">

        <span className="lt-eyebrow">
          PROJECT LEADERSHIP
        </span>

        <h2>LAB TAIF MEDICAL CENTER</h2>

        <div className="lt-credit-grid">

          <div className="lt-credit-person">
            <span>DEVELOPED & MANAGED BY</span>
            <b>MOUSTAFA HASSAN</b>
            <small>
              Owner · System Administrator
            </small>
          </div>

          <div className="lt-credit-separator">
            ✦
          </div>

          <div className="lt-credit-person">
            <span>SUPERVISED BY</span>
            <b>DR / AMIRA ABOUELKHAIR</b>
            <small>
              Laboratory Manager · Administrator
            </small>
          </div>

        </div>

        <small>
          © 2026 LAB TAIF Medical Center ·
          Private internal management system ·
          Version 1.0
        </small>

      </div>

    </div>
  );
}


function ReportsPage() {
  return (
    <div className="lt-page">

      <div className="heading">

        <div>
          <h1>Reports & Files</h1>

          <p>
            Reports and printable documents
          </p>
        </div>

        <button
          className="print-btn"
          onClick={() => window.print()}
        >
          🖨 Print
        </button>

      </div>

      <div className="dashboard-grid">

        <Panel
          title="Inventory Report"
          sub="Current inventory"
        >
          <button
            className="wide-btn"
            onClick={() => window.print()}
          >
            🖨 Print Report
          </button>
        </Panel>

        <Panel
          title="Forms Center"
          sub="Printable laboratory forms"
        >
          <p>
            Use Forms Center from the sidebar
            to access available forms.
          </p>
        </Panel>

      </div>

    </div>
  );
}

/* =========================================================
   AUDIT LOG — LOCAL ONLY
========================================================= */

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const loadAudit = () => {
    setLoading(true);

    try {
      const local = JSON.parse(
        localStorage.getItem("labtaif-audit-log") || "[]"
      );

      setLogs(
        Array.isArray(local)
          ? local
          : []
      );
    } catch (error) {
      console.error("Audit Log read error:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();

    const refreshAudit = () => {
      loadAudit();
    };

    window.addEventListener(
      "labtaif-audit-updated",
      refreshAudit
    );

    return () => {
      window.removeEventListener(
        "labtaif-audit-updated",
        refreshAudit
      );
    };
  }, []);

  const filtered = logs.filter((l) => {
    const text =
      `${l.user_name || ""} ${
        l.user_username || ""
      } ${l.action || ""} ${
        l.details || ""
      }`.toLowerCase();

    return (
      (!query ||
        text.includes(
          query.trim().toLowerCase()
        )) &&
      (
        action === "all" ||
        String(l.action || "").toLowerCase() ===
          action.toLowerCase()
      )
    );
  });

  const stockIn = logs.filter((l) =>
    /stock in|receive|add item/i.test(
      l.action || ""
    )
  ).length;

  const stockOut = logs.filter((l) =>
    /stock out|consume/i.test(
      l.action || ""
    )
  ).length;

  const userMgmt = logs.filter((l) =>
    /user|password|login|logout/i.test(
      l.action || ""
    )
  ).length;

  const systemEvents = logs.filter((l) =>
    /navigate|theme|settings/i.test(
      l.action || ""
    )
  ).length;

  return (
    <div className="audit-page">

      {/* HEADER */}
      <div className="heading">

        <div>
          <span className="lt-eyebrow">
            TRACEABILITY CENTER
          </span>

          <h1>Audit Log</h1>

          <p>
            Track administrative, inventory
            and system activity.
          </p>
        </div>

        <button
          className="lt-ghost"
          onClick={loadAudit}
        >
          ↻ Refresh
        </button>

      </div>

      {/* STATISTICS */}
      <div className="lt-stat-grid lt-audit-stats">

        <div className="lt-stat-card blue">
          <small>Total Activities</small>
          <strong>{logs.length}</strong>
          <em>All recorded events</em>
        </div>

        <div className="lt-stat-card green">
          <small>Stock In</small>
          <strong>{stockIn}</strong>
          <em>Received</em>
        </div>

        <div className="lt-stat-card orange">
          <small>Stock Out</small>
          <strong>{stockOut}</strong>
          <em>Consumed</em>
        </div>

        <div className="lt-stat-card purple">
          <small>Users & System</small>
          <strong>
            {userMgmt + systemEvents}
          </strong>
          <em>Administrative activity</em>
        </div>

      </div>

      {/* LOG TABLE */}
      <div className="lt-panel">

        <div className="lt-toolbar lt-audit-toolbar">

          {/* SEARCH */}
          <div className="lt-search">

            🔎

            <input
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              placeholder="Search activity, user or details..."
            />

          </div>

          {/* ACTION FILTER */}
          <select
            value={action}
            onChange={(e) =>
              setAction(e.target.value)
            }
          >

            <option value="all">
              All Actions
            </option>

            {[
              ...new Set(
                logs
                  .map((l) => l.action)
                  .filter(Boolean)
              ),
            ].map((a) => (
              <option
                key={a}
                value={a}
              >
                {a}
              </option>
            ))}

          </select>

          {/* PRINT */}
          <button
            className="lt-ghost"
            onClick={() =>
              window.print()
            }
          >
            ⇩ Export / Print
          </button>

        </div>

        <div className="lt-table-wrap">

          <table className="lt-table lt-audit-table">

            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="5"
                    className="lt-empty"
                  >
                    Loading Audit Log...
                  </td>
                </tr>

              ) : filtered.length ? (

                filtered.map((l, i) => {

                  const actionText =
                    String(
                      l.action || "EVENT"
                    );

                  let module =
                    "Inventory";

                  if (
                    /user|password|login|logout/i.test(
                      actionText
                    )
                  ) {
                    module =
                      "Authentication";
                  } else if (
                    /navigate|theme|settings/i.test(
                      actionText
                    )
                  ) {
                    module =
                      "System";
                  }

                  return (
                    <tr
                      key={
                        l.id ||
                        `${l.created_at}-${i}`
                      }
                    >

                      {/* DATE */}
                      <td>
                        {l.created_at
                          ? new Date(
                              l.created_at
                            ).toLocaleString(
                              "en-GB"
                            )
                          : "-"}
                      </td>

                      {/* USER */}
                      <td>

                        <div className="lt-user-cell">

                          <span className="lt-avatar">
                            {l.user_name
                              ?.charAt(0)
                              .toUpperCase() ||
                              "?"}
                          </span>

                          <div>

                            <b>
                              {l.user_name ||
                                "Unknown"}
                            </b>

                            <small>
                              {l.user_username ||
                                ""}
                            </small>

                          </div>

                        </div>

                      </td>

                      {/* ACTION */}
                      <td>

                        <span
                          className={`lt-action-pill ${
                            /delete/i.test(
                              actionText
                            )
                              ? "danger"
                              : /edit|password/i.test(
                                  actionText
                                )
                              ? "purple"
                              : /stock out|consume/i.test(
                                  actionText
                                )
                              ? "warning"
                              : "success"
                          }`}
                        >
                          {actionText}
                        </span>

                      </td>

                      {/* MODULE */}
                      <td>

                        <span className="lt-role">
                          {module}
                        </span>

                      </td>

                      {/* DETAILS */}
                      <td>
                        {l.details || "-"}
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="lt-empty"
                  >

                    No activity found.

                    <small className="lt-audit-empty-note">
                      Audit events are stored
                      locally on this browser.
                    </small>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}



function Stat({
  title,
  value,
  sub,
  icon,
  tone,
}) {
  return (
    <div className={`stat ${tone}`}>

      <div>
        <span>{title}</span>

        <b>{value}</b>

        <small>{sub}</small>
      </div>

      <i>{icon}</i>

    </div>
  );
}


function Panel({
  title,
  sub,
  children,
}) {
  return (
    <div className="panel">

      <div className="panel-head">

        <div>
          <h3>{title}</h3>

          {sub && (
            <small>{sub}</small>
          )}
        </div>

      </div>

      {children}

    </div>
  );
}


function Legend({
  c,
  t,
  n,
}) {
  return (
    <div className="legend">

      <span className={`dot ${c}`}>
        ●
      </span>

      <span>{t}</span>

      <b>{n}</b>

    </div>
  );
}

/* =========================================================
   INVENTORY PAGE
   ========================================================= */

function InventoryPage({
  title,
  items,
  search,
  setSearch,
  category,
  setCategory,
  categories,
  onIn,
  onOut,
  onReload,
  onEdit,
  onDelete,
  onNotify,
  onBatchManage,
  inventoryBatches = {},
}) {
  const [localEdit, setLocalEdit] = useState(null);
  const [localDelete, setLocalDelete] = useState(null);
  const [localAdd, setLocalAdd] = useState(null);
  const [detailsItem, setDetailsItem] = useState(null);
  const [batchManagerItem, setBatchManagerItem] = useState(null);
  const [scannerItem, setScannerItem] = useState(null);
  const [scannerSeed, setScannerSeed] = useState(null);

  useEffect(() => {
    const locked = Boolean(
      localEdit || localDelete || localAdd || detailsItem || batchManagerItem || scannerItem
    );
    if (!locked) return undefined;

    const pageContent = document.querySelector(".page-content");
    const mainContent = document.querySelector(".main-content");
    const lockedElements = [
      document.body,
      document.documentElement,
      pageContent,
      mainContent,
    ].filter(Boolean);

    const previous = lockedElements.map((el) => ({
      el,
      overflow: el.style.overflow,
      touchAction: el.style.touchAction,
      overscrollBehavior: el.style.overscrollBehavior,
    }));

    lockedElements.forEach((el) => {
      el.style.overflow = "hidden";
      el.style.touchAction = "none";
      el.style.overscrollBehavior = "none";
    });

    return () => {
      previous.forEach(({ el, overflow, touchAction, overscrollBehavior }) => {
        el.style.overflow = overflow;
        el.style.touchAction = touchAction;
        el.style.overscrollBehavior = overscrollBehavior;
      });
    };
  }, [localEdit, localDelete, localAdd, detailsItem, batchManagerItem, scannerItem]);

  const openBatchScanner = (item) => {
    setScannerSeed(null);
    setScannerItem(item);
  };

  const handleScannerDetected = (scan) => {
    const item = scannerItem;
    setScannerItem(null);
    setScannerSeed(scan || null);
    if (item) setBatchManagerItem(item);
  };

  const openAddItem = () => {
    if (!onEdit) {
      alert("Add New Item is restricted to administrators.");
      return;
    }

    const availableCategories = categories.filter(
      (c) => c && c !== "All"
    );

    setLocalAdd({
      Category: availableCategories[0] || "",
      Item: "",
      supplier: "",
      unit: "",
      Minimum: "1",
      Received: "0",
      Remaining: "0",
      batch_number: "",
      received_date: new Date().toISOString().slice(0, 10),
      expiry_date: "",
      batch_quantity: "0",
      notes: "",
    });
  };

  const saveNewItem = async () => {
    if (!localAdd) return;

    if (!localAdd.Category) {
      alert("Please select a Category.");
      return;
    }

    if (!localAdd.Item?.trim()) {
      alert("Please enter the Item name.");
      return;
    }

    const received = num(localAdd.Received);
    const remaining = num(localAdd.Remaining);
    const minimum = num(localAdd.Minimum);
    const batchQuantityInput = num(localAdd.batch_quantity);

    if (received < 0 || remaining < 0 || minimum < 0 || batchQuantityInput < 0) {
      alert("Quantities cannot be negative.");
      return;
    }

    if (remaining > received) {
      alert("Remaining cannot be greater than Received.");
      return;
    }

    const hasBatchDetails =
      String(localAdd.supplier || "").trim() ||
      String(localAdd.batch_number || "").trim() ||
      String(localAdd.unit || "").trim() ||
      normalizeDate(localAdd.received_date) ||
      normalizeDate(localAdd.expiry_date) ||
      batchQuantityInput > 0 ||
      String(localAdd.notes || "").trim();

    const batchQuantity =
      batchQuantityInput > 0 ? batchQuantityInput : received;

    if (batchQuantity < remaining) {
      alert("Batch quantity cannot be less than Remaining.");
      return;
    }

    if (
      hasBatchDetails &&
      !normalizeDate(localAdd.received_date)
    ) {
      alert("Please select the Batch Received Date.");
      return;
    }

    const status =
      remaining <= 0
        ? "OUT OF STOCK"
        : remaining <= minimum
          ? "REQUEST"
          : "IN STOCK";

    const payload = {
      Category: localAdd.Category,
      Item: localAdd.Item.trim(),
      Received: String(received),
      Remaining: String(remaining),
      Minimum: String(minimum),
      Status: status,
      expiry_date: normalizeDate(localAdd.expiry_date) || null,
    };

    let createdInventoryId = null;

    try {
      /*
       * IMPORTANT:
       * 1) Create inventory first.
       * 2) Get the generated inventory.id.
       * 3) Create the linked Batch / Lot using that id.
       */
      const { data: createdInventory, error: inventoryError } =
        await supabase
          .from("inventory")
          .insert([payload])
          .select("*")
          .single();

      if (inventoryError) {
        throw inventoryError;
      }

      createdInventoryId = createdInventory?.id;

      if (!createdInventoryId) {
        throw new Error(
          "Inventory item was created but no inventory ID was returned."
        );
      }

      if (hasBatchDetails) {
        const batchPayload = {
          inventory_id: Number(createdInventoryId),
          batch_number:
            String(localAdd.batch_number || "").trim() ||
            `LOT-${createdInventoryId}-${Date.now()}`,
          supplier:
            String(localAdd.supplier || "").trim() || null,
          received_date:
            normalizeDate(localAdd.received_date) ||
            new Date().toISOString().slice(0, 10),
          expiry_date:
            normalizeDate(localAdd.expiry_date) || null,
          quantity: batchQuantity,
          remaining_quantity: remaining,
          unit: String(localAdd.unit || "").trim() || null,
          status:
            remaining <= 0
              ? "DEPLETED"
              : "ACTIVE",
          notes:
            String(localAdd.notes || "").trim() || null,
        };

        const { error: batchError } = await supabase
          .from("inventory_batches")
          .insert([batchPayload]);

        if (batchError) {
          /*
           * Roll the inventory row back if the linked Batch / Lot
           * cannot be created, so the two tables stay synchronized.
           */
          await supabase
            .from("inventory")
            .delete()
            .eq("id", createdInventoryId);

          throw batchError;
        }
      }

      setLocalAdd(null);

      if (onNotify) {
        await onNotify({
          action: "ADD",
          itemName: payload.Item,
        });
      }

      if (onReload) {
        await onReload();
      }
    } catch (error) {
      console.error("LAB TAIF: Add inventory item failed:", error);
      alert(
        "لم تتم إضافة الصنف:\n" +
          (error?.message || "Unknown error")
      );
    }
  };

  const editItem = (item) => {
    if (!onEdit) {
      alert("Edit is restricted to administrators.");
      return;
    }

    const linkedBatches = sortBatchesFEFO(
      inventoryBatches[String(item.id)] || []
    );

    const batch =
      linkedBatches.find(
        (row) => num(row.remaining_quantity) > 0
      ) ||
      linkedBatches[0] ||
      null;

    setLocalEdit({
      ...item,
      expiry_date: normalizeDate(item.expiry_date),
      linkedBatchId: batch?.id ? String(batch.id) : "",
      supplier: batch?.supplier || "",
      batch_number: batch?.batch_number || "",
      unit: batch?.unit || "",
      received_date: normalizeDate(batch?.received_date),
      batch_quantity:
        batch?.quantity !== undefined
          ? String(batch.quantity)
          : String(item.Received || ""),
      notes: batch?.notes || "",
    });
  };

  const deleteItem = (item) => {
    if (!onDelete) {
      alert("Delete is restricted to administrators.");
      return;
    }

    if (
      window.confirm(
        "هل أنت متأكد من حذف:\n" +
          (item.Item || "هذا الصنف") +
          "؟"
      )
    ) {
      setLocalDelete(item);
    }
  };

  const saveLocalEdit = async () => {
    if (!localEdit) return;

    const payload = {
      Category: localEdit.Category || "",
      Item: localEdit.Item || "",
      Received: String(localEdit.Received || ""),
      Remaining: String(localEdit.Remaining || ""),
      Minimum: String(localEdit.Minimum || ""),
      Status: statusOf(localEdit),
      expiry_date: normalizeDate(localEdit.expiry_date) || null,
    };

    try {
      const existingLinkedBatches =
        inventoryBatches[String(localEdit.id)] || [];

      const result = await supabase
        .from("inventory")
        .update({
          ...payload,
          Remaining: existingLinkedBatches.length
            ? String(
                existingLinkedBatches.reduce(
                  (sum, batch) =>
                    sum + num(batch.remaining_quantity),
                  0
                )
              )
            : payload.Remaining,
        })
        .eq("id", localEdit.id);

      if (result.error) {
        throw result.error;
      }

      const supplier = String(
        localEdit.supplier || ""
      ).trim();

      const batchNumber = String(
        localEdit.batch_number || ""
      ).trim();

      if (localEdit.linkedBatchId) {
        const { error: batchError } = await supabase
          .from("inventory_batches")
          .update({
            supplier: supplier || null,
            batch_number:
              batchNumber ||
              `LOT-${localEdit.id}`,
            received_date:
              normalizeDate(localEdit.received_date) ||
              null,
            expiry_date:
              normalizeDate(localEdit.expiry_date) ||
              null,
            unit:
              String(localEdit.unit || "").trim() ||
              null,
            quantity:
              num(localEdit.batch_quantity) ||
              num(localEdit.Received),
            notes:
              String(localEdit.notes || "").trim() ||
              null,
          })
          .eq("id", localEdit.linkedBatchId);

        if (batchError) {
          throw batchError;
        }
      } else if (
        supplier ||
        batchNumber ||
        String(localEdit.unit || "").trim() ||
        normalizeDate(localEdit.received_date) ||
        normalizeDate(localEdit.expiry_date)
      ) {
        const remaining = num(localEdit.Remaining);
        const quantity =
          num(localEdit.batch_quantity) > 0
            ? num(localEdit.batch_quantity)
            : num(localEdit.Received);

        if (quantity < remaining) {
          throw new Error(
            "Batch quantity cannot be less than Remaining."
          );
        }

        const { error: batchError } = await supabase
          .from("inventory_batches")
          .insert([
            {
              inventory_id: Number(localEdit.id),
              batch_number:
                batchNumber ||
                `LOT-${localEdit.id}-${Date.now()}`,
              supplier: supplier || null,
              received_date:
                normalizeDate(localEdit.received_date) ||
                new Date().toISOString().slice(0, 10),
              expiry_date:
                normalizeDate(localEdit.expiry_date) ||
                null,
              quantity,
              remaining_quantity: remaining,
              unit:
                String(localEdit.unit || "").trim() ||
                null,
              status:
                remaining <= 0
                  ? "DEPLETED"
                  : "ACTIVE",
              notes:
                String(localEdit.notes || "").trim() ||
                "Created from Inventory Edit",
            },
          ]);

        if (batchError) {
          throw batchError;
        }
      }

      const { data: syncedBatches, error: syncError } =
        await supabase
          .from("inventory_batches")
          .select("remaining_quantity")
          .eq("inventory_id", localEdit.id);

      if (syncError) {
        throw syncError;
      }

      if (syncedBatches?.length) {
        const syncedRemaining = syncedBatches.reduce(
          (sum, batch) =>
            sum + num(batch.remaining_quantity),
          0
        );

        const syncedStatus =
          syncedRemaining <= 0
            ? "OUT OF STOCK"
            : syncedRemaining <= num(localEdit.Minimum)
              ? "REQUEST"
              : "IN STOCK";

        const { error: inventorySyncError } =
          await supabase
            .from("inventory")
            .update({
              Remaining: String(syncedRemaining),
              Status: syncedStatus,
            })
            .eq("id", localEdit.id);

        if (inventorySyncError) {
          throw inventorySyncError;
        }
      }

      setLocalEdit(null);

      if (onNotify) {
        await onNotify({
          action: "EDIT",
          itemName: payload.Item,
        });
      }

      if (onReload) {
        await onReload();
      }
    } catch (error) {
      console.error(
        "LAB TAIF: Inventory edit failed:",
        error
      );
      alert(
        "لم يتم التعديل:\n" +
          (error?.message || "Unknown error")
      );
    }
  };

  const confirmDelete = async () => {
    if (!localDelete) return;

    try {
      /*
       * Try the normal inventory delete first. If the database FK
       * does not cascade, remove the linked batches and retry.
       */
      let result = await supabase
        .from("inventory")
        .delete()
        .eq("id", localDelete.id);

      if (result.error) {
        const { error: batchDeleteError } = await supabase
          .from("inventory_batches")
          .delete()
          .eq("inventory_id", localDelete.id);

        if (batchDeleteError) {
          throw batchDeleteError;
        }

        result = await supabase
          .from("inventory")
          .delete()
          .eq("id", localDelete.id);

        if (result.error) {
          throw result.error;
        }
      }

      const deletedItem = localDelete;
      setLocalDelete(null);

      if (onNotify) {
        await onNotify({
          action: "DELETE",
          itemName: deletedItem.Item || "هذا الصنف",
        });
      }

      if (onReload) {
        await onReload();
      }
    } catch (error) {
      console.error("LAB TAIF: Inventory delete failed:", error);
      alert(
        "لم يتم الحذف:\n" +
          (error?.message || "Unknown error")
      );
    }
  };

  return (
    <div className="labtaif-inventory-page">
      <div className="heading">
        <div>
          <h1>{title}</h1>
          <p>{items.length} items found</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {onEdit && (
            <button
              className="lt-primary"
              onClick={openAddItem}
            >
              ＋ Add New Item
            </button>
          )}

          <button
            className="print-btn"
            onClick={() => window.print()}
          >
            🖨 Print
          </button>
        </div>
      </div>

      <div className="panel filters inventory-filter-panel">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search item or category..."
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="panel table-panel inventory-table-panel">
        <InventoryTable
          items={items}
          inventoryBatches={inventoryBatches}
          onIn={onIn}
          onOut={onOut}
          onEdit={onEdit ? editItem : null}
          onDelete={onDelete ? deleteItem : null}
          onDetails={setDetailsItem}
          onBatchManage={onEdit ? openBatchScanner : null}
          allowEdit={!!onEdit}
          allowDelete={!!onDelete}
        />
      </div>

      {localAdd && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setLocalAdd(null);
            }
          }}
        >
          <div className="modal">
            <button
              className="close"
              onClick={() => setLocalAdd(null)}
            >
              ×
            </button>

            <h2>Add New Inventory Item</h2>

            <p>
              Create the inventory item first, then create its linked
              Batch / Lot automatically.
            </p>

            <div className="edit-grid">
              <label>
                Category
                <select
                  className="lt-add-category-select"
                  value={localAdd.Category}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      Category: e.target.value,
                    })
                  }
                >
                  {categories
                    .filter((c) => c && c !== "All")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Item
                <input
                  value={localAdd.Item}
                  placeholder="Enter item name"
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      Item: e.target.value,
                    })
                  }
                />
              </label>

              <CompanySelect
                value={localAdd.supplier}
                onChange={(value) =>
                  setLocalAdd({
                    ...localAdd,
                    supplier: value,
                  })
                }
                canManage={!!onEdit}
              />
              <label>
                Unit
                <input
                  value={localAdd.unit}
                  placeholder="Box / Kit / Piece / Bottle..."
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      unit: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Minimum
                <input
                  type="number"
                  min="0"
                  value={localAdd.Minimum}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      Minimum: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Received
                <input
                  type="number"
                  min="0"
                  value={localAdd.Received}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      Received: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Remaining
                <input
                  type="number"
                  min="0"
                  value={localAdd.Remaining}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      Remaining: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                LOT / Batch Number
                <input
                  value={localAdd.batch_number}
                  placeholder="LOT / Batch Number"
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      batch_number: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Batch Received Date
                <input
                  type="date"
                  value={localAdd.received_date}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      received_date: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Expiry Date 📅
                <input
                  type="date"
                  value={localAdd.expiry_date}
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      expiry_date: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Batch Quantity
                <input
                  type="number"
                  min="0"
                  value={localAdd.batch_quantity}
                  placeholder="If empty, Received is used"
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      batch_quantity: e.target.value,
                    })
                  }
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                Notes
                <textarea
                  rows="3"
                  value={localAdd.notes}
                  placeholder="Batch / Lot notes"
                  onChange={(e) =>
                    setLocalAdd({
                      ...localAdd,
                      notes: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div
              className="lt-lock-note"
              style={{ marginTop: "12px" }}
            >
              Status is calculated automatically from Remaining and
              Minimum. If Batch / Lot information is entered, it is
              created and linked to the new inventory item.
            </div>

            <button
              className="lt-primary"
              style={{
                width: "100%",
                marginTop: "16px",
              }}
              onClick={saveNewItem}
            >
              ✓ Save New Item + Batch / Lot
            </button>

            <button
              className="wide-btn"
              onClick={() => setLocalAdd(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {localEdit && (
        <EditModal
          item={localEdit}
          setItem={setLocalEdit}
          onSave={saveLocalEdit}
          onClose={() => setLocalEdit(null)}
          canManageCompanies={!!onEdit}
        />
      )}

      {localDelete && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Confirm Delete</h2>

            <p>
              Delete{" "}
              <b>{localDelete.Item}</b>{" "}
              permanently?
              <br />
              <small>
                All linked Batch / Lot records will also be deleted.
              </small>
            </p>

            <button
              className="red-btn save"
              onClick={confirmDelete}
            >
              Delete
            </button>

            <button
              className="wide-btn"
              onClick={() => setLocalDelete(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {scannerItem && (
        <LotScannerModal
          item={scannerItem}
          onClose={() => setScannerItem(null)}
          onDetected={handleScannerDetected}
        />
      )}

      {batchManagerItem && (
        <InventoryBatchManager
          item={batchManagerItem}
          batches={inventoryBatches[String(batchManagerItem.id)] || []}
          initialScan={scannerSeed}
          onClose={() => {
            setBatchManagerItem(null);
            setScannerSeed(null);
          }}
          onReload={onReload}
          onNotify={onNotify}
        />
      )}

      {detailsItem && (
        <InventoryDetailsModal
          item={detailsItem}
          inventoryBatches={inventoryBatches}
          onClose={() => setDetailsItem(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   EDIT MODAL
   ========================================================= */

function EditModal({
  item,
  setItem,
  onSave,
  onClose,
  canManageCompanies = false,
}) {
  useEffect(() => {
    const pageContent = document.querySelector(".page-content");
    const mainContent = document.querySelector(".main-content");
    const previous = [];

    [document.body, document.documentElement, pageContent, mainContent]
      .filter(Boolean)
      .forEach((el) => {
        previous.push({ el, overflow: el.style.overflow, overscroll: el.style.overscrollBehavior });
        el.style.overflow = "hidden";
        el.style.overscrollBehavior = "none";
      });

    return () => {
      previous.forEach(({ el, overflow, overscroll }) => {
        el.style.overflow = overflow;
        el.style.overscrollBehavior = overscroll;
      });
    };
  }, []);

  const update = (key, value) =>
    setItem({ ...item, [key]: value });

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    color: "#8fa8c3",
  };

  const inputStyle = {
    width: "100%",
    minHeight: "46px",
    boxSizing: "border-box",
    borderRadius: "10px",
    border: "1px solid rgba(80,150,210,.28)",
    background: "#08233d",
    color: "#eaf4ff",
    padding: "0 13px",
    outline: "none",
    fontSize: "13px",
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        width: "100vw",
        height: "100vh",
        minHeight: "100dvh",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(1, 10, 20, .78)",
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="modal"
        style={{
          width: "min(780px, 94vw)",
          maxWidth: "780px",
          height: "min(88vh, 820px)",
          maxHeight: "88vh",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: "18px",
          border: "1px solid rgba(82,160,225,.30)",
          background: "linear-gradient(180deg, #071c31 0%, #06182a 100%)",
          boxShadow: "0 30px 90px rgba(0,0,0,.65), 0 0 0 1px rgba(0,120,210,.08)",
          color: "#eaf4ff",
          touchAction: "auto",
        }}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            flex: "0 0 auto",
            padding: "22px 26px 18px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            background: "rgba(8,35,61,.92)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "18px",
          }}
        >
          <div>
            <div style={{ color: "#38a9ff", fontSize: "10px", fontWeight: 900, letterSpacing: ".14em", marginBottom: "7px" }}>
              INVENTORY CONTROL
            </div>
            <h2 style={{ margin: 0, fontSize: "22px", lineHeight: 1.2, color: "#f3f8ff" }}>
              Edit Inventory Item
            </h2>
            <p style={{ margin: "7px 0 0", color: "#8fa8c3", fontSize: "12px", lineHeight: 1.5 }}>
              Update inventory and linked Batch / Lot information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flex: "0 0 auto",
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.05)",
              color: "#a9bfd5",
              fontSize: "22px",
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: "1 1 auto",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "22px 26px 24px",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Category</span>
              <input style={inputStyle} value={item.Category || ""} onChange={(e) => update("Category", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Item</span>
              <input style={inputStyle} value={item.Item || ""} onChange={(e) => update("Item", e.target.value)} />
            </label>

            <div style={fieldStyle}>
              <span style={labelStyle}>Company / Supplier</span>
              <CompanySelect
                value={item.supplier || ""}
                onChange={(value) => update("supplier", value)}
                canManage={canManageCompanies}
              />
            </div>

            <label style={fieldStyle}>
              <span style={labelStyle}>LOT / Batch Number</span>
              <input style={inputStyle} value={item.batch_number || ""} onChange={(e) => update("batch_number", e.target.value)} placeholder="LOT / Batch Number" />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Unit</span>
              <input style={inputStyle} value={item.unit || ""} onChange={(e) => update("unit", e.target.value)} placeholder="Box / Kit / Piece..." />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Batch Received Date</span>
              <input style={inputStyle} type="date" value={normalizeDate(item.received_date)} onChange={(e) => update("received_date", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Batch Quantity</span>
              <input style={inputStyle} type="number" min="0" value={item.batch_quantity || ""} onChange={(e) => update("batch_quantity", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Received</span>
              <input style={inputStyle} type="number" min="0" value={item.Received || ""} onChange={(e) => update("Received", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Remaining</span>
              <input style={inputStyle} type="number" min="0" value={item.Remaining || ""} onChange={(e) => update("Remaining", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Minimum</span>
              <input style={inputStyle} type="number" min="0" value={item.Minimum || ""} onChange={(e) => update("Minimum", e.target.value)} />
            </label>

            <label style={fieldStyle}>
              <span style={labelStyle}>Expiry Date</span>
              <input style={inputStyle} type="date" value={normalizeDate(item.expiry_date)} onChange={(e) => update("expiry_date", e.target.value)} />
            </label>

            <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Notes</span>
              <textarea
                rows="4"
                value={item.notes || ""}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Batch / Lot notes"
                style={{ ...inputStyle, minHeight: "100px", padding: "12px 13px", resize: "vertical" }}
              />
            </label>
          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(56,169,255,.14)",
              background: "rgba(20,105,170,.08)",
              color: "#8fa8c3",
              fontSize: "11px",
              lineHeight: 1.55,
            }}
          >
            Status is calculated automatically. Remaining is synchronized with the total remaining quantity of linked batches.
          </div>
        </div>

        <div
          style={{
            flex: "0 0 auto",
            padding: "14px 26px",
            borderTop: "1px solid rgba(255,255,255,.08)",
            background: "#06182a",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              minWidth: "110px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,.12)",
              background: "rgba(255,255,255,.05)",
              color: "#b9cce0",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              minWidth: "150px",
              height: "42px",
              borderRadius: "10px",
              border: "1px solid rgba(38,190,112,.35)",
              background: "linear-gradient(135deg,#0b8f55,#10b96b)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 8px 22px rgba(16,185,105,.18)",
            }}
          >
            ✓ Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY DETAILS MODAL
   ========================================================= */

function InventoryDetailsModal({
  item,
  inventoryBatches = {},
  onClose,
}) {
  if (!item) return null;

  const linkedBatches = sortBatchesFEFO(
    inventoryBatches[String(item.id)] || []
  );

  const status = statusOf(item);

  const expiryEntries = inventoryExpiryEntries(
    item,
    inventoryBatches
  );

  const getBatchDays = (batch) =>
    daysToExpiry({
      expiry_date: batch?.expiry_date,
    });

  const summaryBoxStyle = {
    padding: "14px",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: "12px",
    background: "rgba(255,255,255,.03)",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    opacity: 0.65,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    marginBottom: "5px",
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        style={{
          width: "min(1180px, 96vw)",
          maxWidth: "1180px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          className="close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Inventory Details</h2>

        <p style={{ marginBottom: "18px" }}>
          Complete information for{" "}
          <b>{item.Item || "-"}</b>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(145px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Item</span>
            <b>{item.Item || "-"}</b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Category</span>
            <b>{item.Category || "-"}</b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Company / Supplier</span>
            <b>
              {[...new Set(
                linkedBatches
                  .map((b) => b.supplier)
                  .filter(Boolean)
              )].join(" / ") || "-"}
            </b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Unit</span>
            <b>
              {[...new Set(
                linkedBatches
                  .map((b) => b.unit)
                  .filter(Boolean)
              )].join(" / ") || "-"}
            </b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Minimum</span>
            <b>{num(item.Minimum)}</b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Received</span>
            <b>{num(item.Received)}</b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Remaining</span>
            <b>{num(item.Remaining)}</b>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Status</span>
            <span
              className={
                "status " +
                (status.includes("OUT")
                  ? "out"
                  : status === "REQUEST"
                    ? "request"
                    : "in")
              }
            >
              {status}
            </span>
          </div>

          <div style={summaryBoxStyle}>
            <span style={labelStyle}>Expiry</span>
            <div>
              {expiryEntries.length ? (
                expiryEntries.map((entry, index) => (
                  <div
                    key={
                      entry.batchId ||
                      `${entry.date}-${index}`
                    }
                    style={{
                      marginBottom:
                        index === expiryEntries.length - 1
                          ? 0
                          : 6,
                    }}
                  >
                    <b>{formatDate(entry.date)}</b>
                    <small
                      style={{
                        display: "block",
                        marginTop: "3px",
                        fontWeight: 700,
                      }}
                    >
                      {expiryDayText(entry.days)}
                    </small>
                  </div>
                ))
              ) : (
                <b>-</b>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>
              Linked LOT / Batch Records
            </h3>
            <small style={{ opacity: 0.7 }}>
              {linkedBatches.length} linked batch
              {linkedBatches.length === 1 ? "" : "es"}
            </small>
          </div>
        </div>

        {linkedBatches.length ? (
          <div
            className="table-container"
            style={{
              maxHeight: "420px",
              overflow: "auto",
            }}
          >
            <table>
              <thead>
                <tr>
                  <th>LOT / Batch</th>
                  <th>Company / Supplier</th>
                  <th>Received Date</th>
                  <th>Expiry Date</th>
                  <th>Days</th>
                  <th>Total Qty</th>
                  <th>Remaining</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {linkedBatches.map((batch) => {
                  const days = getBatchDays(batch);
                  const batchStatus =
                    batchStatusOf(batch);

                  return (
                    <tr key={batch.id}>
                      <td>
                        <b>
                          {batch.batch_number || "-"}
                        </b>
                      </td>

                      <td>
                        {batch.supplier || "-"}
                      </td>

                      <td>
                        {formatDate(
                          batch.received_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          batch.expiry_date
                        )}
                      </td>

                      <td>
                        {days === null
                          ? "-"
                          : expiryDayText(days)}
                      </td>

                      <td>
                        {num(batch.quantity)}
                      </td>

                      <td>
                        {num(
                          batch.remaining_quantity
                        )}
                      </td>

                      <td>
                        {batch.unit || "-"}
                      </td>

                      <td>
                        <span
                          className={
                            "status " +
                            (batchStatus ===
                            "ACTIVE"
                              ? "in"
                              : "out")
                          }
                        >
                          {batchStatus}
                        </span>
                      </td>

                      <td>
                        {batch.notes || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            No linked LOT / Batch records found.
          </div>
        )}

        <button
          className="wide-btn"
          style={{ marginTop: "16px" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY TABLE
   ========================================================= */


function InventoryActionIcon({ type, title, onClick }) {
  const icons = {
    details: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),

    lot: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z" />
        <path d="M7 8v8M9 8v8M12 8v8M15 8v8M17 8v8" />
      </svg>
    ),

    in: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4v13" />
        <path d="m7 12 5 5 5-5" />
        <path d="M5 20h14" />
      </svg>
    ),

    out: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20V7" />
        <path d="m7 12 5-5 5 5" />
        <path d="M5 4h14" />
      </svg>
    ),

    edit: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z" />
        <path d="m13.8 6.7 3.5 3.5" />
      </svg>
    ),

    delete: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14" />
        <path d="M9 7V4h6v3" />
        <path d="m7 7 .8 13h8.4L17 7" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      className={`inventory-action-btn inventory-action-${type}`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      <span className="inventory-action-symbol">
        {icons[type] || icons.details}
      </span>

      <span className="inventory-action-label">
        {type === "details"
          ? "Details"
          : type === "lot"
            ? "LOT"
            : type === "in"
              ? "Stock In"
              : type === "out"
                ? "Stock Out"
                : type === "edit"
                  ? "Edit"
                  : "Delete"}
      </span>
    </button>
  );
}

function InventoryTable({
  items,
  inventoryBatches = {},
  onIn,
  onOut,
  onEdit,
  onDelete,
  onDetails,
  onBatchManage = null,
  allowEdit = true,
  allowDelete = true,
}) {
  return (
    <div className="table-container inventory-table-shell">
      <table className="inventory-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Item</th>
            <th>Company</th>
            <th>Lot</th>
            <th>Received</th>
            <th>Expiry</th>
            <th>Remaining</th>
            <th>Minimum</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const status = statusOf(item);

            const linkedBatches =
              inventoryBatches[String(item.id)] || [];

            const companies = [
              ...new Set(
                linkedBatches
                  .map((b) => b.supplier)
                  .filter(Boolean)
              ),
            ];

            const lots = [
              ...new Set(
                linkedBatches
                  .map((b) => b.batch_number)
                  .filter(Boolean)
              ),
            ];

            return (
              <tr key={item.id}>
                <td>{item.id}</td>

                <td>{item.Category || "-"}</td>

                <td>
                  <b>{item.Item || "-"}</b>
                </td>

                <td>
  {companies.length ? (
    <div className="inventory-inline-tags">
      {companies.map((company) => (
        <span
          key={company}
          className="inventory-inline-tag company-tag"
        >
          {company}
        </span>
      ))}
    </div>
  ) : (
    <span>-</span>
  )}
</td>

<td>
  {lots.length ? (
    <div className="inventory-inline-tags">
      {lots.map((lot) => (
        <span
          key={lot}
          className="inventory-inline-tag lot-tag"
        >
          {lot}
        </span>
      ))}
    </div>
  ) : (
    <span>-</span>
  )}
</td>

                <td>
                  {item.Received || "-"}
                </td>

                <td>
                  {(() => {
                    const expiryEntries =
                      inventoryExpiryEntries(
                        item,
                        inventoryBatches
                      );

                    if (!expiryEntries.length) {
                      return <span>-</span>;
                    }

                    return (
                      <div className="inventory-expiry-list">
                        {expiryEntries.map(
                          (entry, index) => (
                            <div
                              key={
                                entry.batchId ||
                                `${entry.date}-${index}`
                              }
                              className="inventory-expiry-entry"
                              style={{
                                marginBottom:
                                  index ===
                                  expiryEntries.length - 1
                                    ? 0
                                    : 8,
                              }}
                            >
                              <div>
                                <b>
                                  {formatDate(
                                    entry.date
                                  )}
                                </b>

                                {entry.batchNumber ? (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      opacity: 0.75,
                                    }}
                                  >
                                    • {entry.batchNumber}
                                  </span>
                                ) : null}
                              </div>

                              <small
                                style={{
                                  display: "block",
                                  marginTop: 3,
                                  fontWeight: 700,
                                  opacity: 0.85,
                                }}
                              >
                                {expiryDayText(
                                  entry.days
                                )}
                              </small>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })()}
                </td>

                <td>
                  {num(item.Remaining)}
                </td>

                <td>
                  {num(item.Minimum)}
                </td>

                <td>
                  <span
                    className={
                      "status " +
                      (status.includes("OUT")
                        ? "out"
                        : status === "REQUEST"
                          ? "request"
                          : "in")
                    }
                  >
                    {status}
                  </span>
                </td>

                <td>
                  <div className="inventory-actions">
                    {onDetails && (
                      <InventoryActionIcon
                        type="details"
                        title="View Details"
                        onClick={() =>
                          onDetails(item)
                        }
                      />
                    )}

                    {onBatchManage && (
                      <InventoryActionIcon
                        type="lot"
                        title="Manage LOT / Batches"
                        onClick={() =>
                          onBatchManage(item)
                        }
                      />
                    )}

                    {onIn && (
                      <InventoryActionIcon
                        type="in"
                        title="Stock In"
                        onClick={() =>
                          onIn(item)
                        }
                      />
                    )}

                    {onOut && (
                      <InventoryActionIcon
                        type="out"
                        title="Stock Out"
                        onClick={() =>
                          onOut(item)
                        }
                      />
                    )}

                    {allowEdit && onEdit && (
                      <InventoryActionIcon
                        type="edit"
                        title="Edit"
                        onClick={() =>
                          onEdit(item)
                        }
                      />
                    )}

                    {allowDelete && onDelete && (
                      <InventoryActionIcon
                        type="delete"
                        title="Delete"
                        onClick={() =>
                          onDelete(item)
                        }
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!items.length && (
        <div className="empty">
          No items found.
        </div>
      )}
    </div>
  );
}
/* =========================================================
   INVENTORY HISTORY
   ========================================================= */

function InventoryHistoryPage() {
  const [history, setHistory] =
    useState([]);

  const [loadingHistory, setLoadingHistory] =
    useState(true);

  const [historyError, setHistoryError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [actionFilter, setActionFilter] =
    useState("All");

  const [dateFilter, setDateFilter] =
    useState("");

  const loadHistory =
    async () => {
      setLoadingHistory(
        true
      );

      setHistoryError(
        ""
      );

      const result =
        await supabase
          .from(
            "inventory_history"
          )
          .select(
            "id,user_name,action,item_name,quantity,notes,created_at"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (
        result.error
      ) {
        setHistoryError(
          result.error.message
        );

        setHistory([]);
      } else {
        setHistory(
          result.data ||
            []
        );
      }

      setLoadingHistory(
        false
      );
    };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return history.filter(
        (row) => {
          const text =
            `${row.item_name || ""} ` +
            `${row.user_name || ""} ` +
            `${row.action || ""} ` +
            `${row.notes || ""}`;

          if (
            q &&
            !text
              .toLowerCase()
              .includes(q)
          ) {
            return false;
          }

          if (
            actionFilter !==
              "All" &&
            row.action !==
              actionFilter
          ) {
            return false;
          }

          if (
            dateFilter &&
            String(
              row.created_at ||
                ""
            ).substring(
              0,
              10
            ) !==
              dateFilter
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      history,
      search,
      actionFilter,
      dateFilter,
    ]);

  return (
    <div>

      <div className="heading">

        <div>
          <h1>
            Inventory History
          </h1>

          <p>
            Track all inventory
            movements
          </p>
        </div>

        <div className="heading-actions">

          <button
            className="outline-btn"
            onClick={
              loadHistory
            }
          >
            ↻ Refresh
          </button>

          <button
            className="print-btn"
            onClick={() =>
              window.print()
            }
          >
            🖨 Print
          </button>

        </div>

      </div>

      <div className="filters-card">

        <div className="search-box">

          🔍

          <input
            value={
              search
            }
            onChange={(
              e
            ) =>
              setSearch(
                e.target
                  .value
              )
            }
            placeholder="Search item, user, notes..."
          />

        </div>

        <select
          value={
            actionFilter
          }
          onChange={(
            e
          ) =>
            setActionFilter(
              e.target
                .value
            )
          }
        >

          <option value="All">
            All Actions
          </option>

          <option value="RECEIVE">
            RECEIVE
          </option>

          <option value="CONSUME">
            CONSUME
          </option>

        </select>

        <input
          type="date"
          value={
            dateFilter
          }
          onChange={(
            e
          ) =>
            setDateFilter(
              e.target
                .value
            )
          }
        />

      </div>

      <div className="panel table-panel">

        {loadingHistory ? (
          <div className="empty">
            Loading History...
          </div>
        ) : historyError ? (
          <div className="error-box">
            {historyError}
          </div>
        ) : (
          <table>

            <thead>
              <tr>
                <th>
                  Date & Time
                </th>

                <th>
                  Item
                </th>

                <th>
                  Action
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  User
                </th>

                <th>
                  Notes
                </th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                (row) => {

                  const receive =
                    row.action ===
                    "RECEIVE";

                  return (
                    <tr
                      key={
                        row.id
                      }
                    >

                      <td>
                        {row.created_at
                          ? new Date(
                              row.created_at
                            ).toLocaleString(
                              "en-GB"
                            )
                          : "-"}
                      </td>

                      <td>
                        <strong>
                          {
                            row.item_name
                          }
                        </strong>
                      </td>

                      <td>
                        <span
                          className={
                            "status " +
                            (
                              receive
                                ? "in"
                                : "request"
                            )
                          }
                        >
                          {
                            row.action
                          }
                        </span>
                      </td>

                      <td>
                        {receive
                          ? "+"
                          : "-"}
                        {
                          num(
                            row.quantity
                          )
                        }
                      </td>

                      <td>
                        {
                          row.user_name
                        }
                      </td>

                      <td>
                        {
                          row.notes ||
                          "—"
                        }
                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   EXPORT
   ========================================================= */

export default App;


