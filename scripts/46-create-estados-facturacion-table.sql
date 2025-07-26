-- Crear tabla para estados de facturación si no existe
CREATE TABLE IF NOT EXISTS estados_facturacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar estados de facturación básicos
INSERT INTO estados_facturacion (codigo, nombre, descripcion, orden) VALUES
('pendiente_facturacion', 'Pendiente Facturación', 'Embarque completado, pendiente de facturar', 1),
('facturado', 'Facturado', 'Embarque facturado, pendiente de pago', 2),
('pagado', 'Pagado', 'Embarque facturado y pagado completamente', 3),
('archivado', 'Archivado', 'Embarque archivado para consulta histórica', 4)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar si la tabla embarques existe, si no, crearla
CREATE TABLE IF NOT EXISTS embarques (
    id VARCHAR(255) PRIMARY KEY,
    folio VARCHAR(100),
    cliente_id VARCHAR(255),
    operador_id VARCHAR(255),
    camion_id VARCHAR(255),
    remolque_id VARCHAR(255),
    origen TEXT,
    destino TEXT,
    lugar_recolecta TEXT,
    fecha_recolecta DATE,
    hora_recolecta TIME,
    contenido TEXT,
    peso DECIMAL(10,2),
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega DATE,
    hora_entrega TIME,
    observaciones TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    direccion_recolecta TEXT,
    direccion_entrega TEXT,
    tiempo_entrega VARCHAR(50),
    tiempo_recolecta VARCHAR(50),
    load_number VARCHAR(100),
    patente_agente_aduanal VARCHAR(100),
    aduana_cruce VARCHAR(100),
    dueno_mercancia TEXT,
    representante_cliente VARCHAR(255),
    info_representante JSONB,
    carta_porte VARCHAR(100),
    tipo_servicio_id VARCHAR(255),
    precio_flete DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'MXN',
    fecha_finalizacion TIMESTAMP WITH TIME ZONE
);

-- Agregar columnas a la tabla embarques si no existen
DO $$ 
BEGIN
    -- Agregar estado_facturacion si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' AND column_name = 'estado_facturacion') THEN
        ALTER TABLE embarques ADD COLUMN estado_facturacion VARCHAR(50) DEFAULT 'pendiente_facturacion';
    END IF;
    
    -- Agregar fecha_archivado si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' AND column_name = 'fecha_archivado') THEN
        ALTER TABLE embarques ADD COLUMN fecha_archivado TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Agregar usuario_archivo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' AND column_name = 'usuario_archivo') THEN
        ALTER TABLE embarques ADD COLUMN usuario_archivo VARCHAR(255);
    END IF;
    
    -- Agregar motivo_archivo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' AND column_name = 'motivo_archivo') THEN
        ALTER TABLE embarques ADD COLUMN motivo_archivo TEXT;
    END IF;
    
    -- Agregar observaciones_archivo si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'embarques' AND column_name = 'observaciones_archivo') THEN
        ALTER TABLE embarques ADD COLUMN observaciones_archivo TEXT;
    END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_embarques_estado_facturacion ON embarques(estado_facturacion);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_archivado ON embarques(fecha_archivado DESC);

-- Agregar constraint para validar estados (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'chk_estado_facturacion' AND table_name = 'embarques') THEN
        ALTER TABLE embarques 
        ADD CONSTRAINT chk_estado_facturacion 
        CHECK (estado_facturacion IN ('pendiente_facturacion', 'facturado', 'pagado', 'archivado'));
    END IF;
END $$;

-- Crear tabla para historial de cambios de estado
CREATE TABLE IF NOT EXISTS historial_estados_facturacion (
    id SERIAL PRIMARY KEY,
    embarque_id VARCHAR(255) NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    usuario VARCHAR(255) NOT NULL,
    fecha_cambio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para el historial
CREATE INDEX IF NOT EXISTS idx_historial_estados_embarque_id ON historial_estados_facturacion(embarque_id);
CREATE INDEX IF NOT EXISTS idx_historial_estados_fecha ON historial_estados_facturacion(fecha_cambio DESC);

-- Función para registrar cambios de estado
CREATE OR REPLACE FUNCTION registrar_cambio_estado_facturacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado cambió
    IF OLD.estado_facturacion IS DISTINCT FROM NEW.estado_facturacion THEN
        INSERT INTO historial_estados_facturacion (
            embarque_id, 
            estado_anterior, 
            estado_nuevo, 
            usuario,
            observaciones
        ) VALUES (
            NEW.id,
            OLD.estado_facturacion,
            NEW.estado_facturacion,
            COALESCE(NEW.usuario_archivo, 'Sistema'),
            CASE 
                WHEN NEW.estado_facturacion = 'archivado' THEN NEW.motivo_archivo
                ELSE NULL
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para registrar cambios automáticamente
DROP TRIGGER IF EXISTS trigger_cambio_estado_facturacion ON embarques;
CREATE TRIGGER trigger_cambio_estado_facturacion
    AFTER UPDATE ON embarques
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_estado_facturacion();

-- Actualizar registros existentes que no tengan estado_facturacion
UPDATE embarques 
SET estado_facturacion = 'pendiente_facturacion' 
WHERE estado_facturacion IS NULL;

-- Comentarios para documentación
COMMENT ON TABLE estados_facturacion IS 'Catálogo de estados de facturación disponibles';
COMMENT ON TABLE historial_estados_facturacion IS 'Historial de cambios de estado de facturación de embarques';
COMMENT ON COLUMN embarques.estado_facturacion IS 'Estado actual de facturación del embarque';
COMMENT ON COLUMN embarques.fecha_archivado IS 'Fecha cuando se archivó el embarque';
COMMENT ON COLUMN embarques.usuario_archivo IS 'Usuario que archivó el embarque';
COMMENT ON COLUMN embarques.motivo_archivo IS 'Motivo por el cual se archivó el embarque';

-- Insertar algunos registros de ejemplo en el historial (solo si no existen)
INSERT INTO historial_estados_facturacion (embarque_id, estado_anterior, estado_nuevo, usuario, observaciones) 
SELECT '1', 'pendiente_facturacion', 'facturado', 'Juan Pérez', 'Facturación procesada correctamente'
WHERE NOT EXISTS (SELECT 1 FROM historial_estados_facturacion WHERE embarque_id = '1');

INSERT INTO historial_estados_facturacion (embarque_id, estado_anterior, estado_nuevo, usuario, observaciones) 
SELECT '2', 'facturado', 'pagado', 'María González', 'Pago recibido y confirmado'
WHERE NOT EXISTS (SELECT 1 FROM historial_estados_facturacion WHERE embarque_id = '2');

INSERT INTO historial_estados_facturacion (embarque_id, estado_anterior, estado_nuevo, usuario, observaciones) 
SELECT '3', 'pendiente_facturacion', 'archivado', 'Admin Sistema', 'Archivado por solicitud del cliente'
WHERE NOT EXISTS (SELECT 1 FROM historial_estados_facturacion WHERE embarque_id = '3');
