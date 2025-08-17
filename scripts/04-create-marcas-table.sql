-- Crear tabla de marcas de camiones
CREATE TABLE IF NOT EXISTS marcas_camiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar marcas iniciales
INSERT INTO marcas_camiones (nombre) VALUES
  ('Freightliner'),
  ('Kenworth'),
  ('Peterbilt'),
  ('Volvo Trucks'),
  ('Mack'),
  ('International (Navistar)'),
  ('Scania'),
  ('Mercedes-Benz (Daimler Trucks)'),
  ('DAF'),
  ('MAN'),
  ('IVECO'),
  ('Hino'),
  ('Western Star'),
  ('Dongfeng'),
  ('Sinotruk'),
  ('Foton'),
  ('JAC'),
  ('Tata Motors')
ON CONFLICT (nombre) DO NOTHING;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_marcas_camiones_activa ON marcas_camiones(activa);
CREATE INDEX IF NOT EXISTS idx_marcas_camiones_nombre ON marcas_camiones(nombre);
