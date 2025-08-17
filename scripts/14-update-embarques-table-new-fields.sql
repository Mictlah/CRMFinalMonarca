-- Agregar nuevos campos a la tabla embarques
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS direccion_recolecta TEXT,
ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
ADD COLUMN IF NOT EXISTS tiempo_entrega TEXT,
ADD COLUMN IF NOT EXISTS tiempo_recolecta TEXT,
ADD COLUMN IF NOT EXISTS load_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS patente_agente_aduanal VARCHAR(100),
ADD COLUMN IF NOT EXISTS aduana_cruce VARCHAR(100),
ADD COLUMN IF NOT EXISTS dueno_mercancia TEXT,
ADD COLUMN IF NOT EXISTS representante_cliente TEXT,
ADD COLUMN IF NOT EXISTS info_representante JSONB;

-- Crear tabla para representantes de clientes
CREATE TABLE IF NOT EXISTS representantes_clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    puesto VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos representantes de ejemplo
INSERT INTO representantes_clientes (cliente_id, nombre, apellidos, telefono, email, puesto) 
SELECT 
    c.id,
    'Juan Carlos',
    'Pérez López',
    '555-0101',
    'jperez@empresa.com',
    'Gerente de Logística'
FROM clientes c 
WHERE c.nombre LIKE '%Empresa%' 
LIMIT 1;

INSERT INTO representantes_clientes (cliente_id, nombre, apellidos, telefono, email, puesto) 
SELECT 
    c.id,
    'María Elena',
    'González Ruiz',
    '555-0102',
    'mgonzalez@empresa.com',
    'Coordinadora de Embarques'
FROM clientes c 
WHERE c.nombre LIKE '%Empresa%' 
LIMIT 1;

-- Crear tabla para secuencia de folios
CREATE TABLE IF NOT EXISTS folio_sequence (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    last_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year)
);

-- Insertar el año actual
INSERT INTO folio_sequence (year, last_number) 
VALUES (EXTRACT(YEAR FROM NOW()), 0)
ON CONFLICT (year) DO NOTHING;
