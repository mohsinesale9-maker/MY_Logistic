-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION : Ajouter DEFAULT gen_random_uuid() sur la colonne id
-- Exécutez ce script dans : Supabase Dashboard → SQL Editor
--
-- Ce script corrige la contrainte NOT NULL sur la colonne "id"
-- pour TOUTES les tables de l'application MY Logistics ERP.
--
-- Si vous avez déjà exécuté le schema.sql complet, exécutez juste
-- ce script en complément.
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  has_id BOOLEAN;
BEGIN
  FOR tbl IN
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
    -- Vérifier que la colonne id existe
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'id'
    ) INTO has_id;

    IF has_id THEN
      -- Ajouter la valeur par défaut si pas déjà présente
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()',
        tbl
      );
      RAISE NOTICE 'Migration ok: %', tbl;
    ELSE
      RAISE WARNING 'Table % n''a pas de colonne id — ignorée', tbl;
    END IF;
  END LOOP;
END$$;

-- Rendre la colonne id nullable-friendly pour les lignes existantes
-- (affecte uniquement les lignes qui n'ont pas de id — très rare)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
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
    -- Donner un id aux lignes existantes qui n'en ont pas
    EXECUTE format(
      'UPDATE %I SET id = gen_random_uuid() WHERE id IS NULL',
      tbl
    );
  END LOOP;
END$$;

RAISE NOTICE 'Migration terminée avec succès !';
