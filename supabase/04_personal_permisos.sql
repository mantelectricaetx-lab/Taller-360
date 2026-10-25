-- Taller 360: seguridad estricta para el directorio de personal.
-- Ejecutar una vez en Supabase SQL Editor, antes de introducir personal real.
BEGIN;
DROP POLICY IF EXISTS leer_personal ON rubinstein.personal;
DROP POLICY IF EXISTS insertar_personal ON rubinstein.personal;
DROP POLICY IF EXISTS actualizar_personal ON rubinstein.personal;
CREATE POLICY leer_personal ON rubinstein.personal FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM rubinstein.usuarios u WHERE u.id=auth.uid() AND u.activo=true AND u.taller_id=personal.taller_id));
CREATE POLICY insertar_personal ON rubinstein.personal FOR INSERT TO authenticated
WITH CHECK (EXISTS(
 SELECT 1 FROM rubinstein.usuarios u JOIN rubinstein.perfiles p ON p.id=u.perfil_id
 WHERE u.id=auth.uid() AND u.activo=true AND u.taller_id=personal.taller_id AND p.codigo IN ('superadmin','admin')
));
CREATE POLICY actualizar_personal ON rubinstein.personal FOR UPDATE TO authenticated
USING (EXISTS(
 SELECT 1 FROM rubinstein.usuarios u JOIN rubinstein.perfiles p ON p.id=u.perfil_id
 WHERE u.id=auth.uid() AND u.activo=true AND u.taller_id=personal.taller_id AND p.codigo IN ('superadmin','admin')
))
WITH CHECK (EXISTS(
 SELECT 1 FROM rubinstein.usuarios u JOIN rubinstein.perfiles p ON p.id=u.perfil_id
 WHERE u.id=auth.uid() AND u.activo=true AND u.taller_id=personal.taller_id AND p.codigo IN ('superadmin','admin')
));
COMMIT;
