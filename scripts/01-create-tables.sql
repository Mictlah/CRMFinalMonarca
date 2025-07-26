-- Crear tabla de usuarios/operadores
CREATE TABLE IF NOT EXISTS operadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  telefono VARCHAR(15),
  email VARCHAR(100),
  licencia VARCHAR(50),
  fecha_vencimiento_licencia DATE,
  estado VARCHAR(20) DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  empresa VARCHAR(100),
  telefono VARCHAR(15),
  email VARCHAR(100),
  direccion TEXT,
  rfc VARCHAR(20),
  estado VARCHAR(20) DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de camiones
CREATE TABLE IF NOT EXISTS camiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_economico VARCHAR(20) NOT NULL UNIQUE,
  marca VARCHAR(50),
  modelo VARCHAR(50),
  año INTEGER,
  placas VARCHAR(20),
  kilometraje INTEGER DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'disponible',
  fecha_registro TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de remolques
CREATE TABLE IF NOT EXISTS remolques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_economico VARCHAR(20) NOT NULL UNIQUE,
  tipo VARCHAR(50),
  capacidad DECIMAL(10,2),
  placas VARCHAR(20),
  estado VARCHAR(20) DEFAULT 'disponible',
  ubicacion VARCHAR(100),
  fecha_registro TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de embarques
CREATE TABLE IF NOT EXISTS embarques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio VARCHAR(50) NOT NULL UNIQUE,
  cliente_id UUID REFERENCES clientes(id),
  operador_id UUID REFERENCES operadores(id),
  camion_id UUID REFERENCES camiones(id),
  remolque_id UUID REFERENCES remolques(id),
  origen VARCHAR(200) NOT NULL,
  destino VARCHAR(200) NOT NULL,
  lugar_recolecta VARCHAR(200),
  fecha_recolecta DATE,
  hora_recolecta TIME,
  contenido TEXT,
  peso DECIMAL(10,2),
  estado VARCHAR(30) DEFAULT 'creado',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_entrega TIMESTAMP,
  observaciones TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de recordatorios
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  fecha_vencimiento DATE NOT NULL,
  tipo VARCHAR(50),
  prioridad VARCHAR(20) DEFAULT 'media',
  estado VARCHAR(20) DEFAULT 'pendiente',
  operador_id UUID REFERENCES operadores(id),
  camion_id UUID REFERENCES camiones(id),
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de fotos de embarques
CREATE TABLE IF NOT EXISTS fotos_embarques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  embarque_id UUID REFERENCES embarques(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(200) NOT NULL,
  url_blob VARCHAR(500) NOT NULL,
  tamaño_bytes INTEGER,
  tipo_mime VARCHAR(50),
  fecha_subida TIMESTAMP DEFAULT NOW(),
  subido_por VARCHAR(100)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_embarques_folio ON embarques(folio);
CREATE INDEX IF NOT EXISTS idx_embarques_estado ON embarques(estado);
CREATE INDEX IF NOT EXISTS idx_embarques_fecha ON embarques(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_recordatorios_fecha ON recordatorios(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_recordatorios_estado ON recordatorios(estado);
CREATE INDEX IF NOT EXISTS idx_fotos_embarque ON fotos_embarques(embarque_id);
