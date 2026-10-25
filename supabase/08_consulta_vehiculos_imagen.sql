-- Taller 360 | Consultar estructura de vehículos en Supabase
-- Ejecutar en SQL Editor. No modifica tablas ni datos.
SELECT table_schema,table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='rubinstein'
  AND table_name IN ('vehiculos','vehiculo','vehiculo_imagenes','vehiculos_imagenes')
ORDER BY table_name,ordinal_position;

-- Cuando se confirme que la tabla oficial es rubinstein.vehiculos,
-- este cambio OPCIONAL puede guardar la ruta de la foto en Storage:
-- ALTER TABLE rubinstein.vehiculos
-- ADD COLUMN IF NOT EXISTS imagen_url text;
-- No guardar imágenes Base64 en esta columna: almacenar archivos
-- en un bucket privado de Supabase Storage con políticas por taller.
