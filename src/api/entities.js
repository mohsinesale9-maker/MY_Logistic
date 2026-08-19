// Entity adapter — maps camelCase entity names onto Supabase tables.
// The rest of the app calls `entities.Article.list("-created_date", 200)` and
// expects a plain array back. We translate to/from the new client.

import { supabaseClient, isSupabaseConfigured } from "./supabaseClient";

// Map entity name (camelCase) → table name (snake_case).
// `User` and `Role` would otherwise clash with Postgres reserved words, so we
// route them to dedicated table names.
const TABLE_MAP = {
  User: "app_user",
  UserPermission: "app_user_permission",
  CompanySetting: "app_company_setting",
  ProductionPlanning: "production_planning",
  Shift: "shift",
  ShiftBreak: "shift_break",
  // everything else is just lowercased
};

export function tableFor(entityName) {
  return TABLE_MAP[entityName] || entityName.toLowerCase();
}

// Lightweight schemas used by the import flow.
// API — just enough so the import-data flow can call .properties / .required.
const SCHEMAS = {
  Article: {
    type: "object",
    properties: {
      reference: { type: "string" },
      nom: { type: "string" },
      categorie: { type: "string" },
      unite: { type: "string" },
      stock_physique: { type: "number" },
      stock_reserve: { type: "number" },
      prix_vente: { type: "number" },
      cout_unitaire: { type: "number" },
      cout_commande: { type: "number" },
      cout_stockage: { type: "number" },
      demande_annuelle: { type: "number" },
      consommation_moyenne: { type: "number" },
      lead_time: { type: "number" },
      ecart_type: { type: "number" },
      seuil_securite: { type: "number" },
      warehouse_nom: { type: "string" },
      emplacement: { type: "string" },
      statut: { type: "string" },
    },
  },
  Supplier: {
    type: "object",
    properties: {
      code: { type: "string" },
      nom: { type: "string" },
      contact: { type: "string" },
      telephone: { type: "string" },
      email: { type: "string" },
      adresse: { type: "string" },
      statut: { type: "string" },
      total_commandes: { type: "number" },
      commandes_livrees: { type: "number" },
      total_livraisons: { type: "number" },
      livraisons_delai: { type: "number" },
      note_qualite: { type: "number" },
      note_reactivite: { type: "number" },
      note_prix: { type: "number" },
    },
  },
  CustomerOrder: {
    type: "object",
    properties: {
      numero: { type: "string" },
      client: { type: "string" },
      date: { type: "string" },
      statut: { type: "string" },
      total: { type: "number" },
      quantite: { type: "number" },
      article_ref: { type: "string" },
      adresse_livraison: { type: "string" },
    },
  },
  Client: {
    type: "object",
    properties: {
      nom: { type: "string" },
      email: { type: "string" },
      telephone: { type: "string" },
      type: { type: "string" },
      statut: { type: "string" },
      opportunite: { type: "number" },
      cout_client: { type: "number" },
      adresse: { type: "string" },
    },
  },
  Employee: {
    type: "object",
    properties: {
      nom: { type: "string" },
      poste: { type: "string" },
      departement: { type: "string" },
      statut: { type: "string" },
      salaire_base: { type: "number" },
      prime: { type: "number" },
      heures_sup: { type: "number" },
      indemnites: { type: "number" },
      cotisations: { type: "number" },
      heures_reelles: { type: "number" },
      heures_normales: { type: "number" },
      heures_absence: { type: "number" },
      heures_theoriques: { type: "number" },
      production: { type: "number" },
      telephone: { type: "string" },
      email: { type: "string" },
    },
  },
  Fleet: {
    type: "object",
    properties: {
      matricule: { type: "string" },
      marque: { type: "string" },
      modele: { type: "string" },
      type: { type: "string" },
      annee: { type: "number" },
      statut: { type: "string" },
      kilometrage: { type: "number" },
      consommation_moyenne: { type: "number" },
      capacite_reservoir: { type: "number" },
      capacite_charge: { type: "number" },
      assurance_compagnie: { type: "string" },
      assurance_numero: { type: "string" },
      assurance_date_debut: { type: "string" },
      assurance_date_fin: { type: "string" },
      visite_technique_date: { type: "string" },
      visite_technique_prochaine: { type: "string" },
      cout_acquisition: { type: "number" },
      date_mise_circulation: { type: "string" },
    },
  },
  FuelRecord: {
    type: "object",
    properties: {
      vehicule_matricule: { type: "string" },
      date: { type: "string" },
      litres: { type: "number" },
      prix_litres: { type: "number" },
      distance_parcourue: { type: "number" },
      kilometrage: { type: "number" },
      type_carburant: { type: "string" },
      station: { type: "string" },
      consommation_standard: { type: "number" },
      chauffeur: { type: "string" },
    },
  },
  Transport: {
    type: "object",
    properties: {
      numero: { type: "string" },
      chauffeur: { type: "string" },
      vehicule: { type: "string" },
      date: { type: "string" },
      statut: { type: "string" },
      distance: { type: "number" },
      cout_transport: { type: "number" },
      litres_carburant: { type: "number" },
      capacite: { type: "number" },
      poids_charge: { type: "number" },
      livraison_complete: { type: "boolean" },
      livraison_a_temps: { type: "boolean" },
      destination: { type: "string" },
    },
  },
  PurchaseOrder: {
    type: "object",
    properties: {
      numero: { type: "string" },
      fournisseur_id: { type: "string" },
      fournisseur_nom: { type: "string" },
      date: { type: "string" },
      statut: { type: "string" },
      quantite: { type: "number" },
      total: { type: "number" },
      prix_prevu: { type: "number" },
      prix_reel: { type: "number" },
      delai_respecte: { type: "boolean" },
      article_ref: { type: "string" },
    },
  },
  Invoice: {
    type: "object",
    properties: {
      numero: { type: "string" },
      client: { type: "string" },
      date: { type: "string" },
      echeance: { type: "string" },
      type: { type: "string" },
      montant_ht: { type: "number" },
      tva: { type: "number" },
      montant_ttc: { type: "number" },
      montant_paye: { type: "number" },
      statut: { type: "string" },
      description: { type: "string" },
    },
  },
  FinanceTransaction: {
    type: "object",
    properties: {
      type: { type: "string" },
      categorie: { type: "string" },
      description: { type: "string" },
      montant: { type: "number" },
      date: { type: "string" },
      compte: { type: "string" },
      statut: { type: "string" },
    },
  },
  ProductionOrder: {
    type: "object",
    properties: {
      numero: { type: "string" },
      produit: { type: "string" },
      date_debut: { type: "string" },
      date_fin: { type: "string" },
      quantite_prevue: { type: "number" },
      quantite_produite: { type: "number" },
      quantite_defectueuse: { type: "number" },
      temps_prevu: { type: "number" },
      temps_reel: { type: "number" },
      temps_arret: { type: "number" },
      statut: { type: "string" },
      cout_production: { type: "number" },
      machine: { type: "string" },
    },
  },
  ProductionPlanning: {
    type: "object",
    properties: {
      production_order_id: { type: "string" },
      numero_ordre: { type: "string" },
      produit: { type: "string" },
      machine: { type: "string" },
      ligne_production: { type: "string" },
      ressource: { type: "string" },
      start_datetime: { type: "string" },
      end_datetime: { type: "string" },
      priorite: { type: "string" },
      statut: { type: "string" },
      notes: { type: "string" },
      quantite: { type: "number" },
    },
    required: ["production_order_id", "start_datetime", "end_datetime"],
  },
  Shift: {
    type: "object",
    properties: {
      nom: { type: "string" },
      heure_debut: { type: "string" },
      heure_fin: { type: "string" },
      couleur: { type: "string" },
      actif: { type: "boolean" },
    },
    required: ["nom", "heure_debut", "heure_fin"],
  },
  ShiftBreak: {
    type: "object",
    properties: {
      shift_id: { type: "string" },
      nom: { type: "string" },
      heure_debut: { type: "string" },
      heure_fin: { type: "string" },
      jours: { type: "array" },
    },
    required: ["shift_id", "nom", "heure_debut", "heure_fin"],
  },
  QualityControl: {
    type: "object",
    properties: {
      numero: { type: "string" },
      produit: { type: "string" },
      date: { type: "string" },
      lot: { type: "string" },
      quantite_controlee: { type: "number" },
      quantite_conforme: { type: "number" },
      quantite_defectueuse: { type: "number" },
      type_defaut: { type: "string" },
      controleur: { type: "string" },
      statut: { type: "string" },
      notes: { type: "string" },
    },
  },
  AuditLog: {
    type: "object",
    properties: {
      action: { type: "string" },
      entity_type: { type: "string" },
      entity_id: { type: "string" },
      description: { type: "string" },
      user_email: { type: "string" },
      user_name: { type: "string" },
      ip_address: { type: "string" },
      metadata: { type: "string" },
    },
  },
  Warehouse: {
    type: "object",
    properties: {
      nom: { type: "string" },
      type: { type: "string" },
      adresse: { type: "string" },
      surface: { type: "number" },
      volume_total: { type: "number" },
      volume_utilise: { type: "number" },
      statut: { type: "string" },
    },
  },
  Subcontractor: {
    type: "object",
    properties: {
      nom: { type: "string" },
      prestation: { type: "string" },
      cout_main_oeuvre: { type: "number" },
      cout_transport: { type: "number" },
      cout_materiel: { type: "number" },
      conforme: { type: "boolean" },
      statut: { type: "string" },
      telephone: { type: "string" },
      nb_prestations: { type: "number" },
      nb_prestations_conformes: { type: "number" },
    },
  },
  Maintenance: {
    type: "object",
    properties: {
      machine: { type: "string" },
      type: { type: "string" },
      date: { type: "string" },
      temps_fonctionnement: { type: "number" },
      temps_reparation: { type: "number" },
      cout_main_oeuvre: { type: "number" },
      cout_pieces: { type: "number" },
      cout_sous_traitance: { type: "number" },
      nombre_pannes: { type: "number" },
      statut: { type: "string" },
      technicien: { type: "string" },
    },
  },
  UserPermission: {
    type: "object",
    properties: {
      user_email: { type: "string" },
      user_name: { type: "string" },
      module: { type: "string" },
      can_view: { type: "boolean" },
      can_create: { type: "boolean" },
      can_edit: { type: "boolean" },
      can_delete: { type: "boolean" },
    },
    required: ["user_email", "module"],
  },
  User: {
    type: "object",
    properties: {
      email: { type: "string" },
      full_name: { type: "string" },
      role: { type: "string" },
      statut: { type: "string" },
      departement: { type: "string" },
      telephone: { type: "string" },
    },
  },
  CompanySetting: {
    type: "object",
    properties: {
      nom_entreprise: { type: "string" },
      logo_url: { type: "string" },
      slogan: { type: "string" },
      forme_juridique: { type: "string" },
      capital_social: { type: "number" },
      directeur_nom: { type: "string" },
      directeur_titre: { type: "string" },
      adresse: { type: "string" },
      ville: { type: "string" },
      code_postal: { type: "string" },
      pays: { type: "string" },
      telephone: { type: "string" },
      email: { type: "string" },
      website: { type: "string" },
      ice: { type: "string" },
      rc: { type: "string" },
      if_number: { type: "string" },
      cnss: { type: "string" },
      patente: { type: "string" },
      devise: { type: "string" },
      tva_taux: { type: "number" },
      department_signatories: { type: "string" },
    },
  },
  Payment: {
    type: "object",
    properties: {
      numero: { type: "string" },
      type: { type: "string" },
      payeur: { type: "string" },
      montant: { type: "number" },
      date: { type: "string" },
      mode_paiement: { type: "string" },
      reference: { type: "string" },
      facture_ref: { type: "string" },
      compte: { type: "string" },
      statut: { type: "string" },
    },
  },
  Contract: {
    type: "object",
    properties: {
      employe_nom: { type: "string" },
      type: { type: "string" },
      poste: { type: "string" },
      departement: { type: "string" },
      date_debut: { type: "string" },
      date_fin: { type: "string" },
      salaire: { type: "number" },
      fichier_url: { type: "string" },
      statut: { type: "string" },
    },
  },
  Timesheet: {
    type: "object",
    properties: {
      employe_nom: { type: "string" },
      date: { type: "string" },
      heure_arrivee: { type: "string" },
      heure_depart: { type: "string" },
      heures_travaillees: { type: "number" },
      heures_normales: { type: "number" },
      heures_supplementaires: { type: "number" },
      absent: { type: "boolean" },
      motif_absence: { type: "string" },
      statut: { type: "string" },
    },
  },
  Advance: {
    type: "object",
    properties: {
      employe_nom: { type: "string" },
      montant: { type: "number" },
      date: { type: "string" },
      motif: { type: "string" },
      mode_remboursement: { type: "string" },
      statut: { type: "string" },
    },
  },
  Payroll: {
    type: "object",
    properties: {
      employe_nom: { type: "string" },
      periode: { type: "string" },
      salaire_base: { type: "number" },
      primes: { type: "number" },
      indemnites: { type: "number" },
      heures_sup: { type: "number" },
      cotisations: { type: "number" },
      avances_deductees: { type: "number" },
      retenues: { type: "number" },
      net_paye: { type: "number" },
      date_paiement: { type: "string" },
      statut: { type: "string" },
    },
  },
  DeliveryNote: {
    type: "object",
    properties: {
      numero: { type: "string" },
      client: { type: "string" },
      date: { type: "string" },
      commande_ref: { type: "string" },
      adresse_livraison: { type: "string" },
      chauffeur: { type: "string" },
      vehicule: { type: "string" },
      articles: { type: "string" },
      quantite: { type: "number" },
      statut: { type: "string" },
      signature_client: { type: "boolean" },
    },
  },
  Incident: {
    type: "object",
    properties: {
      machine: { type: "string" },
      type: { type: "string" },
      description: { type: "string" },
      gravite: { type: "string" },
      date_signalement: { type: "string" },
      date_resolution: { type: "string" },
      temps_arret: { type: "number" },
      responsable: { type: "string" },
      solution: { type: "string" },
      statut: { type: "string" },
    },
  },
  MaintenancePlan: {
    type: "object",
    properties: {
      machine: { type: "string" },
      type: { type: "string" },
      frequence: { type: "string" },
      description: { type: "string" },
      derniere_date: { type: "string" },
      prochaine_date: { type: "string" },
      responsable: { type: "string" },
      statut: { type: "string" },
    },
  },
  SparePart: {
    type: "object",
    properties: {
      reference: { type: "string" },
      nom: { type: "string" },
      categorie: { type: "string" },
      machine: { type: "string" },
      stock: { type: "number" },
      seuil_min: { type: "number" },
      prix_unitaire: { type: "number" },
      fournisseur: { type: "string" },
      emplacement: { type: "string" },
      unite: { type: "string" },
      statut: { type: "string" },
    },
  },
  MaintenanceExpense: {
    type: "object",
    properties: {
      description: { type: "string" },
      categorie: { type: "string" },
      montant: { type: "number" },
      date: { type: "string" },
      machine: { type: "string" },
      fournisseur: { type: "string" },
      facture_ref: { type: "string" },
      statut: { type: "string" },
    },
  },
  VehicleDocument: {
    type: "object",
    properties: {
      vehicule_matricule: { type: "string" },
      type_document: { type: "string" },
      numero: { type: "string" },
      date_emission: { type: "string" },
      date_expiration: { type: "string" },
      fichier_url: { type: "string" },
      statut: { type: "string" },
    },
  },
  VehicleAlert: {
    type: "object",
    properties: {
      vehicule_matricule: { type: "string" },
      type_alerte: { type: "string" },
      description: { type: "string" },
      niveau: { type: "string" },
      date: { type: "string" },
      statut: { type: "string" },
    },
  },
};

// Fill in missing schemas with an empty default so import still works for
// any entity we forgot to enumerate.
for (const name of Object.keys(TABLE_MAP)) {
  if (!SCHEMAS[name]) SCHEMAS[name] = { type: "object", properties: {} };
}

function makeEntityAdapter(name) {
  const table = tableFor(name);

  return {
    async list(sort = "-created_date", limit = 200) {
      try {
        const order = typeof sort === "string" && sort.startsWith("-")
          ? { column: sort.slice(1), ascending: false }
          : { column: sort || "created_date", ascending: true };
        let q = supabaseClient.from(table).select("*");
        // Supabase ordering syntax
        q = q.order(order.column, { ascending: order.ascending });
        if (typeof limit === "number") q = q.limit(limit);
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn(`[entities.${name}.list]`, err.message || err);
        return [];
      }
    },

    async create(data) {
      const payload = { ...data };
      // Always generate an id — Supabase won't auto-generate one if the
      // table's id column has no DEFAULT (which was the original schema).
      if (!payload.id) payload.id = crypto.randomUUID();
      // Always strip empty strings for Supabase; keep numeric zeros.
      Object.entries(payload).forEach(([k, v]) => {
        if (v === "" || v === undefined) delete payload[k];
      });
      const { data: row, error } = await supabaseClient
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return row;
    },

    async update(id, patch) {
      const payload = { ...patch };
      Object.entries(payload).forEach(([k, v]) => {
        if (v === "" || v === undefined) delete payload[k];
      });
      const { data, error } = await supabaseClient
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabaseClient.from(table).delete().eq("id", id);
      if (error) throw error;
      return { id };
    },

    async bulkCreate(records) {
      if (!Array.isArray(records) || records.length === 0) return [];
      const cleaned = records.map((r) => {
        const out = { ...r };
        if (!out.id) out.id = crypto.randomUUID();
        Object.entries(out).forEach(([k, v]) => {
          if (v === "" || v === undefined) delete out[k];
        });
        return out;
      });
      const { data, error } = await supabaseClient
        .from(table)
        .insert(cleaned)
        .select();
      if (error) throw error;
      return data || [];
    },

    async schema() {
      return SCHEMAS[name] || { type: "object", properties: {} };
    },
  };
}

// Build the entities object lazily. Each key is an entity name; the value is
// the adapter for that entity.
function buildEntities() {
  // Eagerly wrap a known set so `entities.Article` always works even if a
  // typo slips in elsewhere — better UX than undefined errors.
  const NAMES = [
    "Article",
    "Supplier",
    "PurchaseOrder",
    "Warehouse",
    "Transport",
    "CustomerOrder",
    "Client",
    "Employee",
    "Maintenance",
    "FinanceTransaction",
    "Subcontractor",
    "Fleet",
    "FuelRecord",
    "Invoice",
    "ProductionOrder",
    "ProductionPlanning",
    "Shift",
    "ShiftBreak",
    "QualityControl",
    "AuditLog",
    "User",
    "UserPermission",
    "CompanySetting",
    "Payment",
    "Contract",
    "Timesheet",
    "Advance",
    "Payroll",
    "DeliveryNote",
    "Incident",
    "MaintenancePlan",
    "SparePart",
    "MaintenanceExpense",
    "VehicleDocument",
    "VehicleAlert",
  ];

  const entities = {};
  NAMES.forEach((n) => {
    entities[n] = makeEntityAdapter(n);
  });
  return new Proxy(entities, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Lazy-create adapters for any other name (handles entity name typos
      // without crashing the page).
      const adapter = makeEntityAdapter(String(prop));
      target[prop] = adapter;
      return adapter;
    },
  });
}

export const entities = buildEntities();
export { isSupabaseConfigured };
