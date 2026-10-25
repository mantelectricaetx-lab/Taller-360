-- Taller 360: habilitar acceso autenticado a la ficha propia y personal.
-- No modifica los registros de los usuarios ni desactiva RLS.
BEGIN;
GRANT USAGE ON SCHEMA rubinstein TO authenticated;
GRANT SELECT ON rubinstein.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE ON rubinstein.personal TO authenticated;
ALTER TABLE rubinstein.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubinstein.personal ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS taller360_usuario_propio ON rubinstein.usuarios;
CREATE POLICY taller360_usuario_propio ON rubinstein.usuarios
 FOR SELECT TO authenticated
 USING (id = (SELECT auth.uid()));
-- Política de personal acotada al taller vinculado.
DROP POLICY IF EXISTS taller360_personal_lectura ON rubinstein.personal;
CREATE POLICY taller360_personal_lectura ON rubinstein.personal
 FOR SELECT TO authenticated
 USING (EXISTS (
  SELECT 1 FROM rubinstein.usuarios u
  WHERE u.id = (SELECT auth.uid()) AND u.activo AND u.taller_id = personal.taller_id
 ));
DROP POLICY IF EXISTS taller360_personal_crear ON rubinstein.personal;
CREATE POLICY taller360_personal_crear ON rubinstein.personal
 FOR INSERT TO authenticated
 WITH CHECK (EXISTS (
  SELECT 1 FROM rubinstein.usuarios u
  JOIN rubinstein.perfiles p ON p.id=u.perfil_id
  WHERE u.id = (SELECT auth.uid()) AND u.activo AND u.taller_id = personal.taller_id
    AND p.codigo IN ('admin','superadmin')
 ));
DROP POLICY IF EXISTS taller360_personal_editar ON rubinstein.personal;
CREATE POLICY taller360_personal_editar ON rubinstein.personal
 FOR UPDATE TO authenticated
 USING (EXISTS (
  SELECT 1 FROM rubinstein.usuarios u
  JOIN rubinstein.perfiles p ON p.id=u.perfil_id
  WHERE u.id = (SELECT auth.uid()) AND u.activo AND u.taller_id = personal.taller_id
    AND p.codigo IN ('admin','superadmin')
 ))
 WITH CHECK (EXISTS (
  SELECT 1 FROM rubinstein.usuarios u
  JOIN rubinstein.perfiles p ON p.id=u.perfil_id
  WHERE u.id = (SELECT auth.uid()) AND u.activo AND u.taller_id = personal.taller_id
    AND p.codigo IN ('admin','superadmin')
 ));
COMMIT;
-- Diagnóstico de privilegios de tabla (no sustituye revisión de otras políticas).
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema='rubinstein' AND grantee='authenticated'
 AND table_name IN ('usuarios','personal')
ORDER BY table_name,privilege_type;
