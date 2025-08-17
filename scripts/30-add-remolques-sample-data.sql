-- Insertar datos de ejemplo para remolques si no existen
INSERT INTO remolques (numero_economico, tipo, marca, modelo, año, capacidad, estado, activo) 
VALUES 
    ('R001', 'Caja Seca', 'Great Dane', 'Everest', 2020, 28000, 'disponible', true),
    ('R002', 'Refrigerado', 'Utility', 'Reefer', 2019, 26000, 'disponible', true),
    ('R003', 'Plataforma', 'Fontaine', 'Flatbed', 2021, 30000, 'disponible', true),
    ('R004', 'Caja Seca', 'Wabash', 'DuraPlate', 2018, 28000, 'mantenimiento', true),
    ('R005', 'Tolva', 'Timpte', 'Grain', 2020, 32000, 'disponible', true),
    ('R006', 'Tanque', 'Brenner', 'Tank', 2019, 25000, 'disponible', true),
    ('R007', 'Caja Seca', 'Great Dane', 'Champion', 2022, 28500, 'disponible', true),
    ('R008', 'Refrigerado', 'Carrier', 'Reefer', 2021, 26500, 'reparacion', true),
    ('R009', 'Plataforma', 'Transcraft', 'Flatbed', 2020, 29000, 'disponible', true),
    ('R010', 'Caja Seca', 'Hyundai', 'Dry Van', 2019, 27500, 'disponible', true)
ON CONFLICT (numero_economico) DO NOTHING;

-- Actualizar estados de algunos remolques para tener variedad
UPDATE remolques SET estado = 'asignado' WHERE numero_economico IN ('R001', 'R003', 'R007');
UPDATE remolques SET estado = 'mantenimiento' WHERE numero_economico = 'R004';
UPDATE remolques SET estado = 'reparacion' WHERE numero_economico = 'R008';
