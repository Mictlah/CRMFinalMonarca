-- Crear tabla de tipos de servicio
CREATE TABLE IF NOT EXISTS tipos_servicio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de servicio predeterminados
INSERT INTO tipos_servicio (nombre, descripcion, precio_base) VALUES
('Transporte Nacional', 'Servicio de transporte dentro del territorio nacional', 5000.00),
('Transporte Internacional', 'Servicio de transporte hacia otros países', 15000.00),
('Carga Completa (FTL)', 'Transporte de carga que ocupa todo el remolque', 8000.00),
('Carga Parcial (LTL)', 'Transporte de carga que comparte espacio con otros envíos', 3000.00),
('Carga Refrigerada', 'Transporte especializado para productos que requieren temperatura controlada', 12000.00),
('Carga Peligrosa', 'Transporte de materiales peligrosos con certificaciones especiales', 20000.00),
('Mudanzas', 'Servicio especializado para mudanzas residenciales y comerciales', 6000.00),
('Transporte Express', 'Servicio de entrega urgente con tiempos reducidos', 10000.00);

-- Agregar columna tipo_servicio_id a la tabla embarques
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS tipo_servicio_id UUID REFERENCES tipos_servicio(id);

-- Agregar comentarios
COMMENT ON TABLE tipos_servicio IS 'Catálogo de tipos de servicio disponibles para embarques';
COMMENT ON COLUMN embarques.tipo_servicio_id IS 'Tipo de servicio seleccionado para el embarque';
