// =========================================================
// LAB TAIF USERS & PERMISSIONS
// =========================================================

export const USERS = [
  {
    id: "moustafa",
    name: "Moustafa Hassan",
    role: "admin",
  },
  {
    id: "amira",
    name: "Dr. Amira Abouelkhair",
    role: "admin",
  },

  {
    id: "klares",
    name: "Klares Madrid",
    role: "deduct_only",
  },
  {
    id: "abeer",
    name: "Abeer",
    role: "deduct_only",
  },
  {
    id: "suhad",
    name: "Suhad",
    role: "deduct_only",
  },
  {
    id: "fares",
    name: "Fares",
    role: "deduct_only",
  },
  {
    id: "fahd",
    name: "Fahd",
    role: "deduct_only",
  },
  {
    id: "hadeel",
    name: "Hadeel",
    role: "deduct_only",
  },
  {
    id: "mohamed",
    name: "Mohamed",
    role: "deduct_only",
  },
];

// =========================================================
// PERMISSION RULES
// =========================================================

export const PERMISSIONS = {
  admin: {
    dashboard: true,

    viewInventory: true,

    stockIn: true,
    stockOut: true,

    requestList: true,
    inventoryHistory: true,

    forms: true,
    reports: true,
    staff: true,
    audit: true,
    settings: true,
    about: true,

    add: true,
    edit: true,
    delete: true,
  },

  deduct_only: {
    dashboard: true,

    viewInventory: true,

    stockIn: false,
    stockOut: true,

    requestList: true,
    inventoryHistory: true,

    forms: false,
    reports: true,
    staff: false,
    audit: false,
    settings: true,
    about: true,

    add: false,
    edit: false,
    delete: false,
  },
};

// =========================================================
// HELPERS
// =========================================================

export function getUserPermissions(user) {
  if (!user) {
    return PERMISSIONS.deduct_only;
  }

  return (
    PERMISSIONS[user.role] ||
    PERMISSIONS.deduct_only
  );
}

export function isAdmin(user) {
  return user && user.role === "admin";
}