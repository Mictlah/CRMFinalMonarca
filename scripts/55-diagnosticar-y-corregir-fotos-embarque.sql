-- Script para diagnosticar y corregir problemas de vinculación de fotos con embarques
-- Especialmente útil para casos como TIM-2507-074

-- 1. Diagnóstico inicial
SELECT 'DIAGNÓSTICO INICIAL' as seccion;

-- Verificar embarque TIM-2507-074
SELECT 
    'Embarque TIM-2507-074' as tipo,
    id,
    folio,
    estado,
    fecha_creacion
FROM embarques 
WHERE folio = 'TIM-2507-074';

-- Verificar fotos que podrían estar relacionadas con TIM-2507-074
SELECT 
    'Fotos relacionadas con TIM-2507-074' as tipo,
    id,
    embarque_id,
    nombre_archivo,
    url_blob,
    fecha_subida
FROM fotos_embarques 
WHERE nombre_archivo ILIKE '%TIM-2507-074%' 
   OR url_blob ILIKE '%TIM-2507-074%';

-- 2. Función para corregir fotos por folio
CREATE OR REPLACE FUNCTION corregir_fotos_por_folio(folio_embarque TEXT)
RETURNS TABLE(
    fotos_corregidas INTEGER,
    embarque_id_encontrado UUID,
    mensaje TEXT
) AS $$
DECLARE
    embarque_record RECORD;
    fotos_actualizadas INTEGER := 0;
BEGIN
    -- Buscar el embarque por folio
    SELECT id, folio INTO embarque_record
    FROM embarques 
    WHERE embarques.folio = folio_embarque;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0, NULL::UUID, 'Embarque no encontrado con folio: ' || folio_embarque;
        RETURN;
    END IF;
    
    -- Actualizar fotos que contengan el folio en el nombre o URL
    UPDATE fotos_embarques 
    SET embarque_id = embarque_record.id,
        updated_at = NOW()
    WHERE (nombre_archivo ILIKE '%' || folio_embarque || '%' 
           OR url_blob ILIKE '%' || folio_embarque || '%')
      AND (embarque_id IS NULL OR embarque_id != embarque_record.id);
    
    GET DIAGNOSTICS fotos_actualizadas = ROW_COUNT;
    
    RETURN QUERY SELECT 
        fotos_actualizadas,
        embarque_record.id,
        'Fotos corregidas exitosamente para embarque: ' || folio_embarque;
END;
$$ LANGUAGE plpgsql;

-- 3. Ejecutar corrección para TIM-2507-074
SELECT * FROM corregir_fotos_por_folio('TIM-2507-074');

-- 4. Verificar corrección
SELECT 
    'Verificación post-corrección' as tipo,
    e.folio,
    f.id as foto_id,
    f.nombre_archivo,
    f.fecha_subida
FROM embarques e
JOIN fotos_embarques f ON e.id = f.embarque_id
WHERE e.folio = 'TIM-2507-074'
ORDER BY f.fecha_subida DESC;

-- 5. Estadísticas generales
SELECT 
    'Estadísticas generales' as seccion,
    (SELECT COUNT(*) FROM embarques) as total_embarques,
    (SELECT COUNT(*) FROM fotos_embarques) as total_fotos,
    (SELECT COUNT(*) FROM fotos_embarques WHERE embarque_id IS NULL) as fotos_huerfanas;

-- 6. Limpiar fotos duplicadas (opcional)
WITH fotos_duplicadas AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY embarque_id, nombre_archivo 
            ORDER BY fecha_subida DESC
        ) as rn
    FROM fotos_embarques
    WHERE embarque_id IS NOT NULL
)
DELETE FROM fotos_embarques 
WHERE id IN (
    SELECT id FROM fotos_duplicadas WHERE rn > 1
);

-- 7. Resultado final
SELECT 'RESULTADO FINAL' as seccion;
SELECT 
    e.folio,
    COUNT(f.id) as total_fotos,
    STRING_AGG(f.nombre_archivo, ', ') as archivos
FROM embarques e
LEFT JOIN fotos_embarques f ON e.id = f.embarque_id
WHERE e.folio = 'TIM-2507-074'
GROUP BY e.folio;
