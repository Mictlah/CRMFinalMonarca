-- Crear tabla de contactos de clientes
CREATE TABLE IF NOT EXISTS contactos_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(15),
  email VARCHAR(100),
  puesto VARCHAR(50),
  es_principal BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_contactos_clientes_cliente_id ON contactos_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contactos_clientes_activo ON contactos_clientes(activo);
CREATE INDEX IF NOT EXISTS idx_contactos_clientes_principal ON contactos_clientes(es_principal);

-- Agregar columna para forma de facturación en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS forma_facturacion VARCHAR(50);

-- Comentarios para documentar la tabla
COMMENT ON TABLE contactos_clientes IS 'Tabla para almacenar contactos de clientes de forma normalizada';
COMMENT ON COLUMN contactos_clientes.es_principal IS 'Indica si es el contacto principal del cliente';
COMMENT ON COLUMN contactos_clientes.puesto IS 'Cargo o puesto del contacto en la empresa';
