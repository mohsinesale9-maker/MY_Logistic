-- ═══════════════════════════════════════════════════════════════
-- MY LOGISTICS ERP — SCHÉMA SUPABASE COMPLET
-- Exécutez ce script dans : Supabase Dashboard → SQL Editor
--
-- Couvre les 30+ entités de l'application (cf. src/api/entities.js).
-- de clés étrangères sont respectées.
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ARTICLE ───
CREATE TABLE IF NOT EXISTS article (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  reference TEXT,
  nom TEXT,
  categorie TEXT,
  unite TEXT DEFAULT 'unité',
  stock_physique NUMERIC DEFAULT 0,
  stock_reserve NUMERIC DEFAULT 0,
  prix_vente NUMERIC DEFAULT 0,
  cout_unitaire NUMERIC DEFAULT 0,
  cout_commande NUMERIC DEFAULT 0,
  cout_stockage NUMERIC DEFAULT 0,
  demande_annuelle NUMERIC DEFAULT 0,
  consommation_moyenne NUMERIC DEFAULT 0,
  lead_time NUMERIC DEFAULT 0,
  ecart_type NUMERIC DEFAULT 0,
  seuil_securite NUMERIC DEFAULT 0,
  warehouse_id TEXT,
  warehouse_nom TEXT,
  emplacement TEXT,
  statut TEXT DEFAULT 'actif'
);

-- ─── 2. SUPPLIER ───
CREATE TABLE IF NOT EXISTS supplier (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  code TEXT,
  nom TEXT,
  contact TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  statut TEXT DEFAULT 'actif',
  total_commandes NUMERIC DEFAULT 0,
  commandes_livrees NUMERIC DEFAULT 0,
  total_livraisons NUMERIC DEFAULT 0,
  livraisons_delai NUMERIC DEFAULT 0,
  note_qualite NUMERIC DEFAULT 0,
  note_reactivite NUMERIC DEFAULT 0,
  note_prix NUMERIC DEFAULT 0
);

-- ─── 3. PURCHASEORDER ───
CREATE TABLE IF NOT EXISTS purchaseorder (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  fournisseur_id TEXT,
  fournisseur_nom TEXT,
  date DATE,
  statut TEXT DEFAULT 'en_attente',
  quantite NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  prix_prevu NUMERIC DEFAULT 0,
  prix_reel NUMERIC DEFAULT 0,
  delai_respecte BOOLEAN DEFAULT true,
  article_ref TEXT
);

-- ─── 4. WAREHOUSE ───
CREATE TABLE IF NOT EXISTS warehouse (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  nom TEXT,
  type TEXT DEFAULT 'principal',
  adresse TEXT,
  surface NUMERIC DEFAULT 0,
  volume_total NUMERIC DEFAULT 0,
  volume_utilise NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'actif'
);

-- ─── 5. TRANSPORT ───
CREATE TABLE IF NOT EXISTS transport (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  chauffeur TEXT,
  vehicule TEXT,
  date DATE,
  statut TEXT DEFAULT 'planifiee',
  distance NUMERIC DEFAULT 0,
  cout_transport NUMERIC DEFAULT 0,
  litres_carburant NUMERIC DEFAULT 0,
  capacite NUMERIC DEFAULT 0,
  poids_charge NUMERIC DEFAULT 0,
  livraison_complete BOOLEAN DEFAULT true,
  livraison_a_temps BOOLEAN DEFAULT true,
  destination TEXT
);

-- ─── 6. CUSTOMERORDER ───
CREATE TABLE IF NOT EXISTS customerorder (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  client TEXT,
  date DATE,
  statut TEXT DEFAULT 'en_attente',
  total NUMERIC DEFAULT 0,
  quantite NUMERIC DEFAULT 0,
  article_ref TEXT,
  adresse_livraison TEXT
);

-- ─── 7. CLIENT ───
CREATE TABLE IF NOT EXISTS client (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  nom TEXT,
  email TEXT,
  telephone TEXT,
  type TEXT DEFAULT 'prospect',
  statut TEXT DEFAULT 'actif',
  opportunite NUMERIC DEFAULT 0,
  cout_client NUMERIC DEFAULT 0,
  adresse TEXT
);

-- ─── 8. EMPLOYEE ───
CREATE TABLE IF NOT EXISTS employee (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  nom TEXT,
  poste TEXT,
  departement TEXT,
  statut TEXT DEFAULT 'actif',
  salaire_base NUMERIC DEFAULT 0,
  prime NUMERIC DEFAULT 0,
  heures_sup NUMERIC DEFAULT 0,
  indemnites NUMERIC DEFAULT 0,
  cotisations NUMERIC DEFAULT 0,
  heures_reelles NUMERIC DEFAULT 0,
  heures_normales NUMERIC DEFAULT 0,
  heures_absence NUMERIC DEFAULT 0,
  heures_theoriques NUMERIC DEFAULT 0,
  production NUMERIC DEFAULT 0,
  telephone TEXT,
  email TEXT
);

-- ─── 9. MAINTENANCE ───
CREATE TABLE IF NOT EXISTS maintenance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  machine TEXT,
  type TEXT DEFAULT 'corrective',
  date DATE,
  temps_fonctionnement NUMERIC DEFAULT 0,
  temps_reparation NUMERIC DEFAULT 0,
  cout_main_oeuvre NUMERIC DEFAULT 0,
  cout_pieces NUMERIC DEFAULT 0,
  cout_sous_traitance NUMERIC DEFAULT 0,
  nombre_pannes NUMERIC DEFAULT 1,
  statut TEXT DEFAULT 'planifiee',
  technicien TEXT
);

-- ─── 10. FINANCETRANSACTION ───
CREATE TABLE IF NOT EXISTS financetransaction (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  type TEXT DEFAULT 'produit',
  categorie TEXT,
  description TEXT,
  montant NUMERIC DEFAULT 0,
  date DATE,
  compte TEXT DEFAULT 'banque',
  statut TEXT DEFAULT 'valide'
);

-- ─── 11. SUBCONTRACTOR ───
CREATE TABLE IF NOT EXISTS subcontractor (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  nom TEXT,
  prestation TEXT,
  cout_main_oeuvre NUMERIC DEFAULT 0,
  cout_transport NUMERIC DEFAULT 0,
  cout_materiel NUMERIC DEFAULT 0,
  conforme BOOLEAN DEFAULT true,
  statut TEXT DEFAULT 'actif',
  telephone TEXT,
  nb_prestations NUMERIC DEFAULT 0,
  nb_prestations_conformes NUMERIC DEFAULT 0
);

-- ─── 12. FLEET ───
CREATE TABLE IF NOT EXISTS fleet (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  matricule TEXT,
  marque TEXT,
  modele TEXT,
  type TEXT DEFAULT 'camion',
  annee NUMERIC DEFAULT 2020,
  statut TEXT DEFAULT 'actif',
  kilometrage NUMERIC DEFAULT 0,
  consommation_moyenne NUMERIC DEFAULT 0,
  capacite_reservoir NUMERIC DEFAULT 0,
  capacite_charge NUMERIC DEFAULT 0,
  assurance_compagnie TEXT,
  assurance_numero TEXT,
  assurance_date_debut DATE,
  assurance_date_fin DATE,
  visite_technique_date DATE,
  visite_technique_prochaine DATE,
  cout_acquisition NUMERIC DEFAULT 0,
  date_mise_circulation DATE
);

-- ─── 13. FUELRECORD ───
CREATE TABLE IF NOT EXISTS fuelrecord (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  vehicule_matricule TEXT,
  date DATE,
  litres NUMERIC DEFAULT 0,
  prix_litres NUMERIC DEFAULT 0,
  distance_parcourue NUMERIC DEFAULT 0,
  kilometrage NUMERIC DEFAULT 0,
  type_carburant TEXT DEFAULT 'diesel',
  station TEXT,
  consommation_standard NUMERIC DEFAULT 0,
  chauffeur TEXT
);

-- ─── 14. INVOICE ───
CREATE TABLE IF NOT EXISTS invoice (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  client TEXT,
  date DATE,
  echeance DATE,
  type TEXT DEFAULT 'facture',
  montant_ht NUMERIC DEFAULT 0,
  tva NUMERIC DEFAULT 0,
  montant_ttc NUMERIC DEFAULT 0,
  montant_paye NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'brouillon',
  description TEXT
);

-- ─── 15. PRODUCTIONORDER ───
CREATE TABLE IF NOT EXISTS productionorder (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  produit TEXT,
  date_debut DATE,
  date_fin DATE,
  quantite_prevue NUMERIC DEFAULT 0,
  quantite_produite NUMERIC DEFAULT 0,
  quantite_defectueuse NUMERIC DEFAULT 0,
  temps_prevu NUMERIC DEFAULT 0,
  temps_reel NUMERIC DEFAULT 0,
  temps_arret NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'planifiee',
  cout_production NUMERIC DEFAULT 0,
  machine TEXT
);

-- ─── 16. QUALITYCONTROL ───
CREATE TABLE IF NOT EXISTS qualitycontrol (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  produit TEXT,
  date DATE,
  lot TEXT,
  quantite_controlee NUMERIC DEFAULT 0,
  quantite_conforme NUMERIC DEFAULT 0,
  quantite_defectueuse NUMERIC DEFAULT 0,
  type_defaut TEXT,
  controleur TEXT,
  statut TEXT DEFAULT 'conforme',
  notes TEXT
);

-- ─── 17. AUDITLOG ───
CREATE TABLE IF NOT EXISTS auditlog (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  action TEXT DEFAULT 'create',
  entity_type TEXT,
  entity_id TEXT,
  description TEXT,
  user_email TEXT,
  user_name TEXT,
  ip_address TEXT,
  metadata TEXT
);

-- ─── 18. PAYMENT ───
CREATE TABLE IF NOT EXISTS payment (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  type TEXT DEFAULT 'client',
  payeur TEXT,
  montant NUMERIC DEFAULT 0,
  date DATE,
  mode_paiement TEXT DEFAULT 'virement',
  reference TEXT,
  facture_ref TEXT,
  compte TEXT DEFAULT 'banque',
  statut TEXT DEFAULT 'valide'
);

-- ─── 19. CONTRACT ───
CREATE TABLE IF NOT EXISTS contract (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  employe_nom TEXT,
  type TEXT DEFAULT 'cdi',
  poste TEXT,
  departement TEXT,
  date_debut DATE,
  date_fin DATE,
  salaire NUMERIC DEFAULT 0,
  fichier_url TEXT,
  statut TEXT DEFAULT 'actif'
);

-- ─── 20. TIMESHEET ───
CREATE TABLE IF NOT EXISTS timesheet (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  employe_nom TEXT,
  date DATE,
  heure_arrivee TEXT,
  heure_depart TEXT,
  heures_travaillees NUMERIC DEFAULT 0,
  heures_normales NUMERIC DEFAULT 0,
  heures_supplementaires NUMERIC DEFAULT 0,
  absent BOOLEAN DEFAULT false,
  motif_absence TEXT,
  statut TEXT DEFAULT 'present'
);

-- ─── 21. ADVANCE ───
CREATE TABLE IF NOT EXISTS advance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  employe_nom TEXT,
  montant NUMERIC DEFAULT 0,
  date DATE,
  motif TEXT,
  mode_remboursement TEXT DEFAULT 'salaire',
  statut TEXT DEFAULT 'accorde'
);

-- ─── 22. PAYROLL ───
CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  employe_nom TEXT,
  periode TEXT,
  salaire_base NUMERIC DEFAULT 0,
  primes NUMERIC DEFAULT 0,
  indemnites NUMERIC DEFAULT 0,
  heures_sup NUMERIC DEFAULT 0,
  cotisations NUMERIC DEFAULT 0,
  avances_deductees NUMERIC DEFAULT 0,
  retenues NUMERIC DEFAULT 0,
  net_paye NUMERIC DEFAULT 0,
  date_paiement DATE,
  statut TEXT DEFAULT 'calcule'
);

-- ─── 23. DELIVERYNOTE ───
CREATE TABLE IF NOT EXISTS deliverynote (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  numero TEXT,
  client TEXT,
  date DATE,
  commande_ref TEXT,
  adresse_livraison TEXT,
  chauffeur TEXT,
  vehicule TEXT,
  articles TEXT,
  quantite NUMERIC DEFAULT 0,
  statut TEXT DEFAULT 'planifie',
  signature_client BOOLEAN DEFAULT false
);

-- ─── 24. INCIDENT ───
CREATE TABLE IF NOT EXISTS incident (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  machine TEXT,
  type TEXT DEFAULT 'panne',
  description TEXT,
  gravite TEXT DEFAULT 'majeure',
  date_signalement DATE,
  date_resolution DATE,
  temps_arret NUMERIC DEFAULT 0,
  responsable TEXT,
  solution TEXT,
  statut TEXT DEFAULT 'ouvert'
);

-- ─── 25. MAINTENANCEPLAN ───
CREATE TABLE IF NOT EXISTS maintenanceplan (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  machine TEXT,
  type TEXT DEFAULT 'preventive',
  frequence TEXT DEFAULT 'mensuel',
  description TEXT,
  derniere_date DATE,
  prochaine_date DATE,
  responsable TEXT,
  statut TEXT DEFAULT 'actif'
);

-- ─── 26. SPAREPART ───
CREATE TABLE IF NOT EXISTS sparepart (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  reference TEXT,
  nom TEXT,
  categorie TEXT,
  machine TEXT,
  stock NUMERIC DEFAULT 0,
  seuil_min NUMERIC DEFAULT 0,
  prix_unitaire NUMERIC DEFAULT 0,
  fournisseur TEXT,
  emplacement TEXT,
  unite TEXT DEFAULT 'unité',
  statut TEXT DEFAULT 'en_stock'
);

-- ─── 27. MAINTENANCEEXPENSE ───
CREATE TABLE IF NOT EXISTS maintenanceexpense (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  description TEXT,
  categorie TEXT DEFAULT 'pieces',
  montant NUMERIC DEFAULT 0,
  date DATE,
  machine TEXT,
  fournisseur TEXT,
  facture_ref TEXT,
  statut TEXT DEFAULT 'valide'
);

-- ─── 28. VEHICLEDOCUMENT ───
CREATE TABLE IF NOT EXISTS vehicledocument (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  vehicule_matricule TEXT,
  type_document TEXT DEFAULT 'assurance',
  numero TEXT,
  date_emission DATE,
  date_expiration DATE,
  fichier_url TEXT,
  statut TEXT DEFAULT 'valide'
);

-- ─── 29. VEHICLEALERT ───
CREATE TABLE IF NOT EXISTS vehiclealert (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  vehicule_matricule TEXT,
  type_alerte TEXT DEFAULT 'maintenance',
  description TEXT,
  niveau TEXT DEFAULT 'warning',
  date DATE,
  statut TEXT DEFAULT 'active'
);

-- ─── 30. APP_USER (renamed from User, which is a Postgres reserved word) ───
CREATE TABLE IF NOT EXISTS app_user (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  email TEXT UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  statut TEXT DEFAULT 'actif',
  departement TEXT,
  telephone TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ
);

-- ─── 31. APP_USER_PERMISSION (renamed from UserPermission) ───
CREATE TABLE IF NOT EXISTS app_user_permission (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  user_email TEXT,
  user_name TEXT,
  module TEXT,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false
);

-- ─── 32. APP_COMPANY_SETTING (singleton row) ───
CREATE TABLE IF NOT EXISTS app_company_setting (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ,
  updated_date TIMESTAMPTZ,
  created_by_id TEXT,
  nom_entreprise TEXT,
  logo_url TEXT,
  slogan TEXT,
  forme_juridique TEXT,
  capital_social NUMERIC DEFAULT 0,
  directeur_nom TEXT,
  directeur_titre TEXT DEFAULT 'Directeur Général',
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  pays TEXT DEFAULT 'Maroc',
  telephone TEXT,
  email TEXT,
  website TEXT,
  ice TEXT,
  rc TEXT,
  if_number TEXT,
  cnss TEXT,
  patente TEXT,
  devise TEXT DEFAULT 'MAD',
  tva_taux NUMERIC DEFAULT 20,
  department_signatories TEXT
);

-- ═══════════════════════════════════════════════════════════════
-- ACTIVER ROW LEVEL SECURITY (le service_role bypass RLS)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE article ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchaseorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport ENABLE ROW LEVEL SECURITY;
ALTER TABLE customerorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE financetransaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuelrecord ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE productionorder ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualitycontrol ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverynote ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenanceplan ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparepart ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenanceexpense ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicledocument ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiclealert ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_company_setting ENABLE ROW LEVEL SECURITY;

-- Politique simple : accès complet pour les utilisateurs authentifiés.
-- Adaptez ces politiques selon vos besoins métier.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'article','supplier','purchaseorder','warehouse','transport','customerorder',
      'client','employee','maintenance','financetransaction','subcontractor',
      'fleet','fuelrecord','invoice','productionorder','qualitycontrol','auditlog',
      'payment','contract','timesheet','advance','payroll','deliverynote',
      'incident','maintenanceplan','sparepart','maintenanceexpense',
      'vehicledocument','vehiclealert','app_user','app_user_permission',
      'app_company_setting'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_full_access" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "auth_full_access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END$$;

-- ═══════════════════════════════════════════════════════════════
-- INDEX FRÉQUEMMENT UTILISÉS
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_article_reference ON article (reference);
CREATE INDEX IF NOT EXISTS idx_article_statut ON article (statut);
CREATE INDEX IF NOT EXISTS idx_supplier_code ON supplier (code);
CREATE INDEX IF NOT EXISTS idx_purchaseorder_numero ON purchaseorder (numero);
CREATE INDEX IF NOT EXISTS idx_transport_numero ON transport (numero);
CREATE INDEX IF NOT EXISTS idx_transport_statut ON transport (statut);
CREATE INDEX IF NOT EXISTS idx_customerorder_numero ON customerorder (numero);
CREATE INDEX IF NOT EXISTS idx_client_type ON client (type);
CREATE INDEX IF NOT EXISTS idx_employee_departement ON employee (departement);
CREATE INDEX IF NOT EXISTS idx_fleet_matricule ON fleet (matricule);
CREATE INDEX IF NOT EXISTS idx_fleet_statut ON fleet (statut);
CREATE INDEX IF NOT EXISTS idx_financetransaction_type ON financetransaction (type);
CREATE INDEX IF NOT EXISTS idx_financetransaction_compte ON financetransaction (compte);
CREATE INDEX IF NOT EXISTS idx_fuelrecord_matricule ON fuelrecord (vehicule_matricule);
CREATE INDEX IF NOT EXISTS idx_fuelrecord_date ON fuelrecord (date);
CREATE INDEX IF NOT EXISTS idx_invoice_numero ON invoice (numero);
CREATE INDEX IF NOT EXISTS idx_invoice_client ON invoice (client);
CREATE INDEX IF NOT EXISTS idx_invoice_statut ON invoice (statut);
CREATE INDEX IF NOT EXISTS idx_productionorder_numero ON productionorder (numero);
CREATE INDEX IF NOT EXISTS idx_productionorder_statut ON productionorder (statut);
CREATE INDEX IF NOT EXISTS idx_qualitycontrol_numero ON qualitycontrol (numero);
CREATE INDEX IF NOT EXISTS idx_qualitycontrol_statut ON qualitycontrol (statut);
CREATE INDEX IF NOT EXISTS idx_auditlog_action ON auditlog (action);
CREATE INDEX IF NOT EXISTS idx_auditlog_entity ON auditlog (entity_type);
CREATE INDEX IF NOT EXISTS idx_auditlog_date ON auditlog (created_date);
CREATE INDEX IF NOT EXISTS idx_app_user_email ON app_user (email);
CREATE INDEX IF NOT EXISTS idx_app_user_permission_user ON app_user_permission (user_email);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment (date);
CREATE INDEX IF NOT EXISTS idx_payment_statut ON payment (statut);
CREATE INDEX IF NOT EXISTS idx_vehiclealert_matricule ON vehiclealert (vehicule_matricule);
CREATE INDEX IF NOT EXISTS idx_vehiclealert_statut ON vehiclealert (statut);
CREATE INDEX IF NOT EXISTS idx_incident_machine ON incident (machine);
CREATE INDEX IF NOT EXISTS idx_maintenanceplan_prochaine ON maintenanceplan (prochaine_date);

-- ─── 33. PRODUCTION_PLANNING ───
CREATE TABLE IF NOT EXISTS production_planning (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now(),
  created_by_id TEXT,
  production_order_id TEXT,
  numero_ordre TEXT,
  produit TEXT,
  machine TEXT,
  ligne_production TEXT,
  ressource TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  priorite TEXT DEFAULT 'normale',
  statut TEXT DEFAULT 'planifie',
  notes TEXT,
  quantite NUMERIC DEFAULT 0
);

-- RLS for production_planning
ALTER TABLE production_planning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read production_planning"
  ON production_planning FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert production_planning"
  ON production_planning FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_user
      WHERE app_user.id = auth.uid()::text
      AND app_user.role = 'admin'
    )
  );

CREATE POLICY "Admins can update production_planning"
  ON production_planning FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_user
      WHERE app_user.id = auth.uid()::text
      AND app_user.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete production_planning"
  ON production_planning FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_user
      WHERE app_user.id = auth.uid()::text
      AND app_user.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_production_planning_start ON production_planning (start_datetime);
CREATE INDEX IF NOT EXISTS idx_production_planning_machine ON production_planning (machine);
CREATE INDEX IF NOT EXISTS idx_production_planning_statut ON production_planning (statut);

-- ─── SHIFT ───
CREATE TABLE IF NOT EXISTS shift (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  couleur TEXT DEFAULT '#3B82F6',
  actif BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read shifts" ON shift FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage shifts" ON shift FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = auth.uid()::text
    AND app_user.role = 'admin'
  )
);

-- ─── SHIFT_BREAK ───
CREATE TABLE IF NOT EXISTS shift_break (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id TEXT REFERENCES shift(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  heure_debut TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  jours TEXT[] DEFAULT '{}',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shift_break ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read breaks" ON shift_break FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage breaks" ON shift_break FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM app_user
    WHERE app_user.id = auth.uid()::text
    AND app_user.role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════════
-- VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
