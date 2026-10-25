-- TALLER 360 | 3 técnicos ficticios para pruebas
-- Ejecutar en Supabase > SQL Editor como administrador del proyecto.
-- No elimina ni modifica personal existente.
BEGIN;
INSERT INTO rubinstein.personal
  (taller_id, nombre, cargo, especialidad, telefono, activo)
SELECT
  t.id, v.nombre, v.cargo, v.especialidad, NULL::text, true
FROM rubinstein.talleres AS t
CROSS JOIN (VALUES
  ('DEMO - Alejandro Morales', 'Técnico mecánico', 'Diagnóstico y mecánica general'),
  ('DEMO - Camila Rojas', 'Técnico automotriz', 'Electricidad y electrónica'),
  ('DEMO - Diego Fernández', 'Técnico mecánico', 'Frenos y suspensión')
) AS v(nombre,cargo,especialidad)
WHERE t.id = 'df9a4c35-36af-47d8-8114-39e6fb99cff6'::uuid
  AND NOT EXISTS (
    SELECT 1 FROM rubinstein.personal AS p
    WHERE p.taller_id = t.id
      AND lower(btrim(p.nombre)) = lower(btrim(v.nombre))
  );
COMMIT;

-- Verificación (resultado esperado: 3 técnicos DEMO, si no existían previamente)
SELECT nombre, cargo, especialidad, activo
FROM rubinstein.personal
WHERE taller_id = 'df9a4c35-36af-47d8-8114-39e6fb99cff6'::uuid
  AND nombre IN ('DEMO - Alejandro Morales','DEMO - Camila Rojas','DEMO - Diego Fernández')
ORDER BY nombre;
