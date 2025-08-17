-- Add fecha_finalizacion column to embarques table
-- This script adds the missing column that tracks when shipments are finalized

-- Add the fecha_finalizacion column
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS fecha_finalizacion TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on finalized shipments queries
CREATE INDEX IF NOT EXISTS idx_embarques_fecha_finalizacion 
ON embarques(fecha_finalizacion) 
WHERE fecha_finalizacion IS NOT NULL;

-- Create index for finalized status queries
CREATE INDEX IF NOT EXISTS idx_embarques_estado_finalizado 
ON embarques(estado, fecha_finalizacion) 
WHERE estado = 'finalizado';

-- Update existing finalized embarques to have a finalization date
-- Use updated_at as the finalization date for existing records
UPDATE embarques 
SET fecha_finalizacion = updated_at 
WHERE estado = 'finalizado' 
AND fecha_finalizacion IS NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN embarques.fecha_finalizacion IS 'Timestamp when the shipment was marked as finalized and moved to completed records';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'embarques' 
AND column_name = 'fecha_finalizacion';

-- Show count of finalized embarques
SELECT 
    COUNT(*) as total_finalizados,
    COUNT(fecha_finalizacion) as con_fecha_finalizacion
FROM embarques 
WHERE estado = 'finalizado';
