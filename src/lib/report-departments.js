// Department metadata used by the report exports. Each entry provides:
//   - the human label
//   - a default signatory (name + title) used when the CompanySetting has
//     no override
//   - the brand colour for the report header band
//
// Reports are routed to a department via the `department` key on the
// `reports` array in src/pages/Reports.jsx.

export const DEPARTMENTS = {
  direction: {
    id: "direction",
    label: "Direction Générale",
    color: [15, 23, 42], // navy
    defaultSignatory: { name: "", title: "Directeur Général" },
  },
  finance: {
    id: "finance",
    label: "Direction Financière",
    color: [124, 58, 237], // purple
    defaultSignatory: { name: "", title: "Directeur Financier" },
  },
  commercial: {
    id: "commercial",
    label: "Direction Commerciale",
    color: [37, 99, 235], // blue
    defaultSignatory: { name: "", title: "Directeur Commercial" },
  },
  transport: {
    id: "transport",
    label: "Direction Transport & Exploitation",
    color: [217, 119, 6], // amber
    defaultSignatory: { name: "", title: "Directeur Transport & Exploitation" },
  },
  stock: {
    id: "stock",
    label: "Direction Logistique & Stock",
    color: [22, 163, 74], // green
    defaultSignatory: { name: "", title: "Responsable Logistique & Stock" },
  },
  rh: {
    id: "rh",
    label: "Direction Ressources Humaines",
    color: [79, 70, 229], // indigo
    defaultSignatory: { name: "", title: "Directeur des Ressources Humaines" },
  },
  maintenance: {
    id: "maintenance",
    label: "Direction Maintenance",
    color: [220, 38, 38], // red
    defaultSignatory: { name: "", title: "Responsable Maintenance" },
  },
  achats: {
    id: "achats",
    label: "Direction des Achats",
    color: [8, 145, 178], // cyan
    defaultSignatory: { name: "", title: "Responsable des Achats" },
  },
  soustraitance: {
    id: "soustraitance",
    label: "Direction Sous-traitance",
    color: [234, 88, 12], // orange
    defaultSignatory: { name: "", title: "Responsable Sous-traitance" },
  },
  production: {
    id: "production",
    label: "Direction Production",
    color: [99, 102, 241], // indigo-500
    defaultSignatory: { name: "", title: "Directeur de Production" },
  },
  qualite: {
    id: "qualite",
    label: "Direction Qualité",
    color: [220, 38, 38], // red
    defaultSignatory: { name: "", title: "Responsable Qualité" },
  },
  audit: {
    id: "audit",
    label: "Audit & Conformité",
    color: [71, 85, 105], // slate
    defaultSignatory: { name: "", title: "Auditeur Interne" },
  },
};

export const DEFAULT_DEPARTMENT_ID = "direction";

// Resolve a department by id; falls back to "direction" if unknown.
export function getDepartment(id) {
  return DEPARTMENTS[id] || DEPARTMENTS[DEFAULT_DEPARTMENT_ID];
}

// Pick the right department signatory. The CompanySetting may override the
// default by storing a JSON blob on `department_signatories`:
//   { "finance": { "name": "Mohamed X", "title": "..." }, ... }
export function getDepartmentSignatory(id, company) {
  const dept = getDepartment(id);
  const overrides =
    company?.department_signatories &&
    safeParseJson(company.department_signatories);
  const o = overrides?.[id];
  return {
    name: (o?.name || "").trim(),
    title: (o?.title || dept.defaultSignatory.title).trim(),
  };
}

function safeParseJson(s) {
  if (!s) return null;
  if (typeof s !== "string") return s;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Map a report title to its department. Used by Reports.jsx and the export
// routines. Keep keys in sync with the `reports` array there.
export const REPORT_DEPARTMENT_MAP = {
  "Rapport des ventes": "commercial",
  "Rapport des stocks": "stock",
  "Rapport financier": "finance",
  "Rapport de transport": "transport",
  "Rapport RH": "rh",
  "Rapport maintenance": "maintenance",
  "Rapport des achats": "achats",
  "Rapport sous-traitance": "soustraitance",
  "Rapport CRM": "commercial",
  "Rapport articles": "stock",
  "Tableau de bord": "direction",
  "IA & Prévoyances": "direction",
  "Business Intelligence": "direction",
  Carburant: "transport",
  "Factures & Avoirs": "finance",
  Production: "production",
  "Contrôle Qualité": "qualite",
  "Journaux d'Audit": "audit",
};
