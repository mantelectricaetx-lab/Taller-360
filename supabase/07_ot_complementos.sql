-- Ejecutar en Supabase SQL Editor. Almacena los detalles de subtareas de OT de Taller 360.
-- Las OT principales siguen en modo demo local; esta tabla sincroniza complementos por referencia.
CREATE TABLE IF NOT EXISTS rubinstein.ot_complementos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id uuid NOT NULL REFERENCES rubinstein.talleres(id),
  ot_ref text NOT NULL,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE(taller_id,ot_ref)
);
ALTER TABLE rubinstein.ot_complementos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON rubinstein.ot_complementos TO authenticated;
DROP POLICY IF EXISTS t360_ot_comp_select ON rubinstein.ot_complementos;
DROP POLICY IF EXISTS t360_ot_comp_insert ON rubinstein.ot_complementos;
DROP POLICY IF EXISTS t360_ot_comp_update ON rubinstein.ot_complementos;
CREATE POLICY t360_ot_comp_select ON rubinstein.ot_complementos FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM rubinstein.usuarios u WHERE u.id=(select auth.uid()) AND u.activo AND u.taller_id=ot_complementos.taller_id));
CREATE POLICY t360_ot_comp_insert ON rubinstein.ot_complementos FOR INSERT TO authenticated
WITH CHECK (EXISTS(SELECT 1 FROM rubinstein.usuarios u WHERE u.id=(select auth.uid()) AND u.activo AND u.taller_id=ot_complementos.taller_id));
CREATE POLICY t360_ot_comp_update ON rubinstein.ot_complementos FOR UPDATE TO authenticated
USING (EXISTS(SELECT 1 FROM rubinstein.usuarios u WHERE u.id=(select auth.uid()) AND u.activo AND u.taller_id=ot_complementos.taller_id))
WITH CHECK (EXISTS(SELECT 1 FROM rubinstein.usuarios u WHERE u.id=(select auth.uid()) AND u.activo AND u.taller_id=ot_complementos.taller_id));
