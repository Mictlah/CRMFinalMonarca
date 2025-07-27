-- Script completo para crear todas las tablas necesarias para facturación/cobranza

-- 1. Actualizar tabla embarques con campos de facturación
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS estado_facturacion VARCHAR(50) DEFAULT 'pendiente_facturacion',
ADD COLUMN IF NOT EXISTS folio_factura_1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_2 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_3 VARCHAR(100),
ADD COLUMN IF NOT EXISTS folio_factura_4 VARCHAR(100),
ADD COLUMN IF NOT EXISTS cantidad_final_facturada DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS observaciones_facturacion TEXT,
ADD COLUMN IF NOT EXISTS fecha_envio_cliente DATE,
ADD COLUMN IF NOT EXISTS fecha_pago_cliente DATE,
ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(200),
ADD COLUMN IF NOT EXISTS fecha_archivado TIMESTAMP,
ADD COLUMN IF NOT EXISTS usuario_archivo VARCHAR(100),
ADD COLUMN IF NOT EXISTS motivo_archivo TEXT,
ADD COLUMN IF NOT EXISTS observaciones_archivo TEXT,
ADD COLUMN IF NOT EXISTS pagado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_pago DATE,
ADD COLUMN IF NOT EXISTS moneda_flete VARCHAR(3) DEFAULT 'MXN',
ADD COLUMN IF NOT EXISTS precio_flete DECIMAL(10,2);

-- 2. Crear tabla tipos_servicio si no existe
CREATE TABLE IF NOT EXISTS tipos_servicio (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    precio_base DECIMAL(10,2) DEFAULT 0,
    pago_operador DECIMAL(10,2) DEFAULT 0,
    monto_base DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    orden_visualizacion INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar tipos de servicio por defecto
INSERT INTO tipos_servicio (id, nombre, descripcion, precio_base, pago_operador, monto_base, activo) VALUES
('exportacion-cargada-caja-seca-240', 'EXPORTACIÓN CARGADA - CAJA SECA 240', 'Servicio de exportación con contenedor de caja seca cargada - Zona 240', 2500, 1800, 1800, TRUE),
('importacion-cargada-caja-seca-240', 'IMPORTACIÓN CARGADA - CAJA SECA 240', 'Servicio de importación con contenedor de caja seca cargada - Zona 240', 2400, 1700, 1700, TRUE),
('exportacion-vacia-caja-seca-240', 'EXPORTACIÓN VACÍA - CAJA SECA 240', 'Servicio de exportación con contenedor de caja seca vacía - Zona 240', 1800, 1200, 1200, TRUE),
('importacion-vacia-caja-seca-240', 'IMPORTACIÓN VACÍA - CAJA SECA 240', 'Servicio de importación con contenedor de caja seca vacía - Zona 240', 1700, 1100, 1100, TRUE),
('otro', 'OTRO', 'Servicio personalizado según necesidades específicas del cliente', 0, 0, 0, TRUE)
ON CONFLICT (id) DO UPDATE SET
    precio_base = EXCLUDED.precio_base,
    pago_operador = EXCLUDED.pago_operador,
    monto_base = EXCLUDED.monto_base,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Crear tabla creditos_clientes
CREATE TABLE IF NOT EXISTS creditos_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    limite_credito_usd DECIMAL(12,2) DEFAULT 0,
    limite_credito_mxn DECIMAL(12,2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    notas_tipo_cambio TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id)
);

-- 5. Crear tabla tipos_cambio
CREATE TABLE IF NOT EXISTS tipos_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    usd_to_mxn DECIMAL(8,4) NOT NULL,
    mxn_to_usd DECIMAL(8,4) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    creado_por VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipo de cambio por defecto
INSERT INTO tipos_cambio (fecha, usd_to_mxn, mxn_to_usd, activo, creado_por) VALUES
(CURRENT_DATE, 17.5000, 0.0571, TRUE, 'Sistema')
ON CONFLICT DO NOTHING;

-- 6. Crear tabla folio_sequence para generar folios automáticos
CREATE TABLE IF NOT EXISTS folio_sequence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    last_number INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year)
);

-- 7. Crear tabla embarque_modificaciones para historial
CREATE TABLE IF NOT EXISTS embarque_modificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    embarque_id UUID REFERENCES embarques(id) ON DELETE CASCADE,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion VARCHAR(100),
    razon TEXT,
    
    -- Operador original y nuevo
    operador_original_id UUID,
    operador_original_nombre VARCHAR(200),
    operador_nuevo_id UUID,
    operador_nuevo_nombre VARCHAR(200),
    sueldo_operador_original DECIMAL(10,2),
    sueldo_operador_nuevo DECIMAL(10,2),
    moneda_sueldo_operador_original VARCHAR(3),
    moneda_sueldo_operador_nuevo VARCHAR(3),
    
    -- Camión original y nuevo
    camion_original_id UUID,
    camion_original_numero VARCHAR(50),
    camion_nuevo_id UUID,
    camion_nuevo_numero VARCHAR(50),
    
    -- Remolque original y nuevo
    remolque_original_id UUID,
    remolque_original_numero VARCHAR(50),
    remolque_nuevo_id UUID,
    remolque_nuevo_numero VARCHAR(50),
    
    -- Precio de flete
    precio_flete_original DECIMAL(10,2),
    precio_flete_nuevo DECIMAL(10,2),
    moneda_flete_original VARCHAR(3),
    moneda_flete_nueva VARCHAR(3),
    flete_en_falso BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_embarques_estado_facturacion ON embarques(estado_facturacion);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_creacion ON embarques(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_embarques_cliente_id ON embarques(cliente_id);
CREATE INDEX IF NOT EXISTS idx_embarques_operador_id ON embarques(operador_id);
CREATE INDEX IF NOT EXISTS idx_tipos_cambio_activo ON tipos_cambio(activo, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_creditos_clientes_cliente_id ON creditos_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_embarque_modificaciones_embarque_id ON embarque_modificaciones(embarque_id);

-- 9. Crear función para verificar si existe una columna
CREATE OR REPLACE FUNCTION check_column_exists(table_name TEXT, column_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Crear función para crear recordatorios de cumpleaños
CREATE OR REPLACE FUNCTION crear_recordatorios_cumpleanos(dias_anticipacion INTEGER DEFAULT 2)
RETURNS INTEGER AS $$
DECLARE
    recordatorios_creados INTEGER := 0;
    operador_record RECORD;
    fecha_recordatorio DATE;
BEGIN
    -- Iterar sobre operadores con fecha de nacimiento
    FOR operador_record IN 
        SELECT id, nombre, apellidos, fecha_nacimiento
        FROM operadores 
        WHERE fecha_nacimiento IS NOT NULL 
        AND estado = 'activo'
    LOOP
        -- Calcular fecha de recordatorio (cumpleaños de este año - días de anticipación)
        fecha_recordatorio := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
                                  EXTRACT(MONTH FROM operador_record.fecha_nacimiento) || '-' || 
                                  EXTRACT(DAY FROM operador_record.fecha_nacimiento)) - INTERVAL '1 day' * dias_anticipacion;
        
        -- Si la fecha ya pasó este año, programar para el próximo año
        IF fecha_recordatorio < CURRENT_DATE THEN
            fecha_recordatorio := fecha_recordatorio + INTERVAL '1 year';
        END IF;
        
        -- Insertar recordatorio si no existe ya
        INSERT INTO recordatorios (
            titulo,
            descripcion,
            fecha_vencimiento,
            tipo,
            prioridad,
            estado,
            operador_id
        )
        SELECT 
            'Cumpleaños de ' || operador_record.nombre || ' ' || COALESCE(operador_record.apellidos, ''),
            'Recordatorio de cumpleaños del operador ' || operador_record.nombre,
            fecha_recordatorio,
            'cumpleanos',
            'media',
            'pendiente',
            operador_record.id
        WHERE NOT EXISTS (
            SELECT 1 FROM recordatorios 
            WHERE operador_id = operador_record.id 
            AND tipo = 'cumpleanos' 
            AND EXTRACT(YEAR FROM fecha_vencimiento) = EXTRACT(YEAR FROM fecha_recordatorio)
        );
        
        recordatorios_creados := recordatorios_creados + 1;
    END LOOP;
    
    RETURN recordatorios_creados;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear función helper para crear la función check_column_exists
CREATE OR REPLACE FUNCTION create_check_column_function()
RETURNS VOID AS $$
BEGIN
    -- Esta función ya se creó arriba, solo retornamos
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 12. Actualizar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas relevantes
DROP TRIGGER IF EXISTS update_embarques_updated_at ON embarques;
CREATE TRIGGER update_embarques_updated_at
    BEFORE UPDATE ON embarques
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tipos_servicio_updated_at ON tipos_servicio;
CREATE TRIGGER update_tipos_servicio_updated_at
    BEFORE UPDATE ON tipos_servicio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creditos_clientes_updated_at ON creditos_clientes;
CREATE TRIGGER update_creditos_clientes_updated_at
    BEFORE UPDATE ON creditos_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tipos_cambio_updated_at ON tipos_cambio;
CREATE TRIGGER update_tipos_cambio_updated_at
    BEFORE UPDATE ON tipos_cambio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Crear políticas RLS (Row Level Security) básicas
ALTER TABLE tipos_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditos_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_cambio ENABLE ROW LEVEL SECURITY;
ALTER TABLE embarque_modificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_sequence ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar según necesidades de seguridad)
CREATE POLICY "Allow all operations on tipos_servicio" ON tipos_servicio FOR ALL USING (true);
CREATE POLICY "Allow all operations on creditos_clientes" ON creditos_clientes FOR ALL USING (true);
CREATE POLICY "Allow all operations on tipos_cambio" ON tipos_cambio FOR ALL USING (true);
CREATE POLICY "Allow all operations on embarque_modificaciones" ON embarque_modificaciones FOR ALL USING (true);
CREATE POLICY "Allow all operations on folio_sequence" ON folio_sequence FOR ALL USING (true);

-- 14. Insertar datos de ejemplo para créditos de clientes
INSERT INTO creditos_clientes (cliente_id, limite_credito_usd, limite_credito_mxn, activo)
SELECT 
    id,
    CASE 
        WHEN nombre ILIKE '%ABC%' THEN 50000
        WHEN nombre ILIKE '%XYZ%' THEN 30000
        ELSE 25000
    END,
    CASE 
        WHEN nombre ILIKE '%ABC%' THEN 875000
        WHEN nombre ILIKE '%XYZ%' THEN 525000
        ELSE 437500
    END,
    TRUE
FROM clientes
WHERE NOT EXISTS (
    SELECT 1 FROM creditos_clientes cc WHERE cc.cliente_id = clientes.id
)
LIMIT 10;

-- 15. Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Script de facturación/cobranza ejecutado exitosamente';
    RAISE NOTICE 'Tablas creadas/actualizadas: embarques, tipos_servicio, creditos_clientes, tipos_cambio, embarque_modificaciones, folio_sequence';
    RAISE NOTICE 'Funciones creadas: check_column_exists, crear_recordatorios_cumpleanos, create_check_column_function';
    RAISE NOTICE 'Triggers y políticas RLS aplicados';
END $$;
