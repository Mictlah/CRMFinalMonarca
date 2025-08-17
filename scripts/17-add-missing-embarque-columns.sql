-- Agregar columnas faltantes a la tabla embarques
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS carta_porte VARCHAR(100),
ADD COLUMN IF NOT EXISTS hora_entrega TIME,
ADD COLUMN IF NOT EXISTS direccion_recolecta TEXT,
ADD COLUMN IF NOT EXISTS direccion_entrega TEXT,
ADD COLUMN IF NOT EXISTS load_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS patente_agente_aduanal VARCHAR(100),
ADD COLUMN IF NOT EXISTS aduana_cruce VARCHAR(100),
ADD COLUMN IF NOT EXISTS dueno_mercancia VARCHAR(200),
ADD COLUMN IF NOT EXISTS representante_cliente UUID,
ADD COLUMN IF NOT EXISTS info_representante JSONB;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN embarques.carta_porte IS 'Número de carta porte del embarque';
COMMENT ON COLUMN embarques.hora_entrega IS 'Hora programada de entrega';
COMMENT ON COLUMN embarques.direccion_recolecta IS 'Dirección completa de recolecta';
COMMENT ON COLUMN embarques.direccion_entrega IS 'Dirección completa de entrega';
COMMENT ON COLUMN embarques.load_number IS 'Número de load para embarques internacionales';
COMMENT ON COLUMN embarques.patente_agente_aduanal IS 'Patente del agente aduanal';
COMMENT ON COLUMN embarques.aduana_cruce IS 'Aduana de cruce fronterizo';
COMMENT ON COLUMN embarques.dueno_mercancia IS 'Dueño de la mercancía';
COMMENT ON COLUMN embarques.representante_cliente IS 'ID del representante del cliente';
COMMENT ON COLUMN embarques.info_representante IS 'Información completa del representante (JSON)';
