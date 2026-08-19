-- ═══════════════════════════════════════════════════════════════
-- MY LOGISTICS ERP — SHIFTS & BREAKS
-- Exécutez ce script dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── SHIFT ───────────────────────────────────────────────────
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

CREATE POLICY "Authenticated users can read shifts"
  ON shift FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage shifts"
  ON shift FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM app_user
      WHERE app_user.id = auth.uid()::text
      AND app_user.role = 'admin'
    )
  );

-- ─── SHIFT_BREAK ────────────────────────────────────────────
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

CREATE POLICY "Authenticated users can read breaks"
  ON shift_break FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage breaks"
  ON shift_break FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM app_user
      WHERE app_user.id = auth.uid()::text
      AND app_user.role = 'admin'
    )
  );

-- ─── DONNÉES PAR DÉFAUT ─────────────────────────────────────
INSERT INTO shift (id, nom, heure_debut, heure_fin, couleur, actif) VALUES
  ('s1', 'Shift 1', '08:00', '16:00', '#3B82F6', true),
  ('s2', 'Shift 2', '16:00', '00:00', '#F59E0B', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shift_break (shift_id, nom, heure_debut, heure_fin, jours) VALUES
  ('s1', 'Pause déjeuner', '12:00', '13:00', ARRAY['lundi','mardi','mercredi','jeudi','vendredi']),
  ('s2', 'Pause dîner', '20:00', '21:00', ARRAY['lundi','mardi','mercredi','jeudi','vendredi'])
ON CONFLICT DO NOTHING;

-- ─── VÉRIFICATION ───────────────────────────────────────────
-- SELECT * FROM shift;
-- SELECT * FROM shift_break;
