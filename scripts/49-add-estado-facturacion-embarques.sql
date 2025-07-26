-- Agregar columna estado_facturacion a la tabla embarques
DO $$
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'estado_facturacion'
    ) THEN
        -- Agregar la columna estado_facturacion
        ALTER TABLE embarques ADD COLUMN estado_facturacion VARCHAR(50) DEFAULT 'pendiente_facturacion';
        
        -- Comentario para la columna
        COMMENT ON COLUMN embarques.estado_facturacion IS 'Estado de facturación del embarque: pendiente_facturacion, facturado, pagado, archivado';
    END IF;

    -- Verificar y agregar columnas relacionadas con el archivado
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'fecha_archivado'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_archivado TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'usuario_archivo'
    ) THEN
        ALTER TABLE embarques ADD COLUMN usuario_archivo VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'motivo_archivo'
    ) THEN
        ALTER TABLE embarques ADD COLUMN motivo_archivo TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'observaciones_archivo'
    ) THEN
        ALTER TABLE embarques ADD COLUMN observaciones_archivo TEXT;
    END IF;

    -- Verificar y agregar columnas relacionadas con la facturación
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'fecha_pago'
    ) THEN
        ALTER TABLE embarques ADD COLUMN fecha_pago TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'pagado'
    ) THEN
        ALTER TABLE embarques ADD COLUMN pagado BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'observaciones_facturacion'
    ) THEN
        ALTER TABLE embarques ADD COLUMN observaciones_facturacion TEXT;
    END IF;

    -- Agregar columnas para folios de factura
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'folio_factura_1'
    ) THEN
        ALTER TABLE embarques ADD COLUMN folio_factura_1 VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'folio_factura_2'
    ) THEN
        ALTER TABLE embarques ADD COLUMN folio_factura_2 VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'folio_factura_3'
    ) THEN
        ALTER TABLE embarques ADD COLUMN folio_factura_3 VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'folio_factura_4'
    ) THEN
        ALTER TABLE embarques ADD COLUMN folio_factura_4 VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'embarques' AND column_name = 'cantidad_final_facturada'
    ) THEN
        ALTER TABLE embarques ADD COLUMN cantidad_final_facturada DECIMAL(12, 2);
    END IF;

    -- Crear índices para mejorar el rendimiento
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'embarques' AND indexname = 'idx_embarques_estado_facturacion'
    ) THEN
        CREATE INDEX idx_embarques_estado_facturacion ON embarques(estado_facturacion);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'embarques' AND indexname = 'idx_embarques_pagado'
    ) THEN
        CREATE INDEX idx_embarques_pagado ON embarques(pagado);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'embarques' AND indexname = 'idx_embarques_fecha_archivado'
    ) THEN
        CREATE INDEX idx_embarques_fecha_archivado ON embarques(fecha_archivado);
    END IF;

    -- Crear tabla para historial de cambios de estado de facturación
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'historial_facturacion_embarques'
    ) THEN
        CREATE TABLE historial_facturacion_embarques (
            id SERIAL PRIMARY KEY,
            embarque_id UUID REFERENCES embarques(id),
            estado_anterior VARCHAR(50),
            estado_nuevo VARCHAR(50),
            usuario VARCHAR(255),
            fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            observaciones TEXT
        );
        
        -- Índice para búsquedas rápidas por embarque
        CREATE INDEX idx_historial_facturacion_embarque_id ON historial_facturacion_embarques(embarque_id);
    END IF;

    -- Crear función para registrar cambios de estado de facturación
    CREATE OR REPLACE FUNCTION registrar_cambio_estado_facturacion()
    RETURNS TRIGGER AS $$
    BEGIN
        IF OLD.estado_facturacion IS DISTINCT FROM NEW.estado_facturacion THEN
            INSERT INTO historial_facturacion_embarques (
                embarque_id, 
                estado_anterior, 
                estado_nuevo, 
                usuario, 
                observaciones
            ) VALUES (
                NEW.id,
                OLD.estado_facturacion,
                NEW.estado_facturacion,
                COALESCE(NEW.usuario_archivo, current_user),
                CASE 
                    WHEN NEW.estado_facturacion = 'archivado' THEN NEW.motivo_archivo
                    ELSE NEW.observaciones_facturacion
                END
            );
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Crear trigger para registrar cambios automáticamente
    DROP TRIGGER IF EXISTS trg_cambio_estado_facturacion ON embarques;
    CREATE TRIGGER trg_cambio_estado_facturacion
    AFTER UPDATE OF estado_facturacion ON embarques
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_estado_facturacion();

    -- Crear función para verificar si existe una columna
    CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
    RETURNS boolean AS $$
    BEGIN
        RETURN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = $1 AND column_name = $2
        );
    END;
    $$ LANGUAGE plpgsql;

    -- Crear función para crear la función check_column_exists si no existe
    CREATE OR REPLACE FUNCTION create_check_column_function()
    RETURNS void AS $$
    BEGIN
        -- Esta función ya está creada arriba, pero la dejamos aquí para mantener
        -- la compatibilidad con el código existente
        NULL;
    END;
    $$ LANGUAGE plpgsql;

END $$;

-- Actualizar los estados de facturación basados en datos existentes
UPDATE embarques
SET estado_facturacion = 
    CASE 
        WHEN pagado = TRUE THEN 'pagado'
        WHEN folio_factura_1 IS NOT NULL OR folio_factura_2 IS NOT NULL THEN 'facturado'
        ELSE 'pendiente_facturacion'
    END
WHERE estado_facturacion IS NULL OR estado_facturacion = 'pendiente_facturacion';

-- Crear vistas para facilitar reportes
CREATE OR REPLACE VIEW vista_facturacion_embarques AS
SELECT 
    e.id,
    e.folio,
    e.cliente_id,
    c.nombre AS cliente_nombre,
    e.operador_id,
    o.nombre || ' ' || COALESCE(o.apellidos, '') AS operador_nombre,
    e.camion_id,
    cam.numero_economico AS camion_numero,
    e.precio_flete,
    e.moneda_flete,
    e.estado_facturacion,
    e.pagado,
    e.fecha_pago,
    e.folio_factura_1,
    e.folio_factura_2,
    e.folio_factura_3,
    e.folio_factura_4,
    e.cantidad_final_facturada,
    e.fecha_creacion,
    e.fecha_finalizacion,
    e.fecha_archivado
FROM 
    embarques e
LEFT JOIN 
    clientes c ON e.cliente_id = c.id
LEFT JOIN 
    operadores o ON e.operador_id = o.id
LEFT JOIN 
    camiones cam ON e.camion_id = cam.id;

-- Crear función para obtener estadísticas de facturación
CREATE OR REPLACE FUNCTION obtener_estadisticas_facturacion(
    fecha_inicio date DEFAULT NULL,
    fecha_fin date DEFAULT NULL
)
RETURNS TABLE (
    total_embarques bigint,
    pendientes_facturacion bigint,
    facturados bigint,
    pagados bigint,
    archivados bigint,
    monto_total_mxn numeric,
    monto_total_usd numeric,
    monto_pagado_mxn numeric,
    monto_pagado_usd numeric,
    monto_pendiente_mxn numeric,
    monto_pendiente_usd numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE estado_facturacion = 'pendiente_facturacion') AS pendientes,
            COUNT(*) FILTER (WHERE estado_facturacion = 'facturado') AS facturados,
            COUNT(*) FILTER (WHERE estado_facturacion = 'pagado' OR pagado = TRUE) AS pagados,
            COUNT(*) FILTER (WHERE estado_facturacion = 'archivado') AS archivados,
            SUM(CASE WHEN moneda_flete = 'MXN' OR moneda_flete IS NULL THEN precio_flete ELSE 0 END) AS total_mxn,
            SUM(CASE WHEN moneda_flete = 'USD' THEN precio_flete ELSE 0 END) AS total_usd,
            SUM(CASE WHEN (estado_facturacion = 'pagado' OR pagado = TRUE) AND (moneda_flete = 'MXN' OR moneda_flete IS NULL) THEN precio_flete ELSE 0 END) AS pagado_mxn,
            SUM(CASE WHEN (estado_facturacion = 'pagado' OR pagado = TRUE) AND moneda_flete = 'USD' THEN precio_flete ELSE 0 END) AS pagado_usd,
            SUM(CASE WHEN (estado_facturacion != 'pagado' AND pagado = FALSE) AND (moneda_flete = 'MXN' OR moneda_flete IS NULL) THEN precio_flete ELSE 0 END) AS pendiente_mxn,
            SUM(CASE WHEN (estado_facturacion != 'pagado' AND pagado = FALSE) AND moneda_flete = 'USD' THEN precio_flete ELSE 0 END) AS pendiente_usd
        FROM
            embarques
        WHERE
            (fecha_inicio IS NULL OR fecha_creacion >= fecha_inicio) AND
            (fecha_fin IS NULL OR fecha_creacion <= fecha_fin)
    )
    SELECT
        total,
        pendientes,
        facturados,
        pagados,
        archivados,
        COALESCE(total_mxn, 0),
        COALESCE(total_usd, 0),
        COALESCE(pagado_mxn, 0),
        COALESCE(pagado_usd, 0),
        COALESCE(pendiente_mxn, 0),
        COALESCE(pendiente_usd, 0)
    FROM
        stats;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script ejecutado correctamente. Se han agregado las columnas de facturación y archivado a la tabla embarques.';
END $$;
