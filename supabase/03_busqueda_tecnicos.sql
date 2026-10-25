-- Ejecutar en Supabase SQL Editor. No modifica datos existentes.
CREATE OR REPLACE FUNCTION public.buscar_tecnicos_taller(termino text DEFAULT '')
RETURNS TABLE(id uuid, nombre text, cargo text, especialidad text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT p.id, p.nombre, p.cargo, p.especialidad
 FROM rubinstein.personal p
 JOIN rubinstein.usuarios u ON u.taller_id=p.taller_id
 WHERE u.id=(SELECT auth.uid()) AND u.activo=true AND p.activo=true
 AND (
  coalesce(btrim(termino),'')=''
  OR p.nombre ILIKE '%'||btrim(termino)||'%'
  OR coalesce(p.cargo,'') ILIKE '%'||btrim(termino)||'%'
  OR coalesce(p.especialidad,'') ILIKE '%'||btrim(termino)||'%'
 )
 ORDER BY p.nombre LIMIT 30
$$;
REVOKE ALL ON FUNCTION public.buscar_tecnicos_taller(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_tecnicos_taller(text) TO authenticated;
