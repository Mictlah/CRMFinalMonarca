-- Add currency field to embarques table
-- This script adds a column to store the currency type for freight price

-- Add the moneda_flete column to store currency (MXN or USD)
ALTER TABLE embarques 
ADD COLUMN IF NOT EXISTS moneda_flete VARCHAR(3) DEFAULT 'MXN';

-- Add a comment to the column
COMMENT ON COLUMN embarques.moneda_flete IS 'Currency for freight price: MXN (Mexican Peso) or USD (US Dollar)';

-- Update existing records to have MXN as default currency
UPDATE embarques 
SET moneda_flete = 'MXN' 
WHERE moneda_flete IS NULL;

-- Add a check constraint to ensure only valid currencies
ALTER TABLE embarques 
ADD CONSTRAINT check_moneda_flete 
CHECK (moneda_flete IN ('MXN', 'USD'));
