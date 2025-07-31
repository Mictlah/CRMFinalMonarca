-- Script para diagnosticar y corregir la vinculación de fotos con embarques
-- Caso específico: embarque TIM-2507-074

-- 1. Buscar el embarque por folio
SELECT 
    id as embarque_id,
    folio,
    cliente_id,
    operador_id,
    estado,
    fecha_creacion
FROM embarques 
WHERE folio = 'TIM-2507-074';

-- 2. Buscar fotos que podrían corresponder a este embarque
SELECT 
    id as foto_id,
    embarque_id,
    nombre_archivo,
    url_blob,
    fecha_subida,
    subido_por
FROM fotos_embarques 
WHERE nombre_archivo LIKE '%TIM-2507-074%' 
   OR url_blob LIKE '%TIM-2507-074%';

-- 3. Buscar confirmaciones de operador para este embarque
SELECT 
    id,
    embarque_id,
    operador_nombre,
    fecha_confirmacion
FROM operador_confirmaciones_embarque 
WHERE embarque_id IN (
    SELECT id FROM embarques WHERE folio = 'TIM-2507-074'
);

-- 4. Si encontramos fotos huérfanas (sin embarque_id correcto), las corregimos
-- NOTA: Ejecutar solo después de verificar los resultados de las consultas anteriores

-- Actualizar fotos huérfanas basándose en el nombre del archivo
UPDATE fotos_embarques 
SET embarque_id = (
    SELECT id FROM embarques WHERE folio = 'TIM-2507-074' LIMIT 1
)
WHERE (embarque_id IS NULL OR embarque_id NOT IN (SELECT id FROM embarques))
  AND (nombre_archivo LIKE '%TIM-2507-074%' OR url_blob LIKE '%TIM-2507-074%');

-- 5. Verificar que la corrección funcionó
SELECT 
    fe.id as foto_id,
    fe.embarque_id,
    e.folio,
    fe.nombre_archivo,
    fe.url_blob,
    fe.fecha_subida,
    fe.subido_por
FROM fotos_embarques fe
LEFT JOIN embarques e ON fe.embarque_id = e.id
WHERE e.folio = 'TIM-2507-074' OR fe.nombre_archivo LIKE '%TIM-2507-074%';

-- 6. Mostrar estadísticas de fotos por embarque
SELECT 
    e.folio,
    e.estado,
    COUNT(fe.id) as total_fotos,
    MAX(fe.fecha_subida) as ultima_foto_subida
FROM embarques e
LEFT JOIN fotos_embarques fe ON e.id = fe.embarque_id
WHERE e.folio = 'TIM-2507-074'
GROUP BY e.id, e.folio, e.estado;
