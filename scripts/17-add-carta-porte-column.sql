-- Agregar columna carta_porte a la tabla embarques
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS carta_porte VARCHAR(100);

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN embarques.carta_porte IS 'Número de carta porte del embarque';
