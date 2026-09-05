-- V8: Environmental Impact Analytics & Configurable Conversion Factors Table

CREATE TABLE environmental_factors (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE,
    landfill_diversion_kg_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    co2_reduction_kg_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recovered_metals_kg_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recovered_plastics_kg_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    source_reference VARCHAR(255) NOT NULL,
    is_valid_factor BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial documented benchmark conversion factors per e-waste category
INSERT INTO environmental_factors (category, landfill_diversion_kg_per_unit, co2_reduction_kg_per_unit, recovered_metals_kg_per_unit, recovered_plastics_kg_per_unit, source_reference, is_valid_factor) VALUES
('MOBILE_PHONE', 0.18, 1.25, 0.08, 0.06, 'CPCB E-Waste Guidelines 2022 / EPA WARM v15 (Mobile Device Benchmarks)', TRUE),
('LAPTOP', 2.40, 18.50, 1.10, 0.85, 'CPCB E-Waste Guidelines 2022 / EPA WARM v15 (Personal Computing)', TRUE),
('DESKTOP', 7.50, 42.00, 4.20, 2.10, 'CPCB E-Waste Guidelines 2022 (Desktop Systems)', TRUE),
('MONITOR', 4.80, 28.00, 2.10, 1.80, 'CPCB E-Waste Guidelines 2022 (Display Equipment)', TRUE),
('TELEVISION', 12.00, 65.00, 5.50, 4.20, 'CPCB E-Waste Guidelines 2022 (Consumer Electronics)', TRUE),
('PRINTER', 5.50, 31.00, 2.80, 2.10, 'CPCB E-Waste Guidelines 2022 (Office Equipment)', TRUE),
('KEYBOARD', 0.60, 2.10, 0.10, 0.45, 'EPA WARM v15 (Peripheral Devices)', TRUE),
('MOUSE', 0.15, 0.75, 0.02, 0.11, 'EPA WARM v15 (Peripheral Devices)', TRUE),
('BATTERY', 0.35, 3.80, 0.22, 0.05, 'CPCB Battery Waste Management Rules 2022', TRUE),
('CHARGER', 0.20, 1.10, 0.08, 0.09, 'EPA WARM v15 (Small Adapters)', TRUE),
('CABLE', 0.30, 1.50, 0.18, 0.08, 'EPA WARM v15 (Copper Cable Benchmarks)', TRUE),
('REFRIGERATOR', 45.00, 280.00, 28.00, 12.00, 'CPCB E-Waste Guidelines 2022 (Large Appliances)', TRUE),
('WASHING_MACHINE', 32.00, 195.00, 21.00, 8.50, 'CPCB E-Waste Guidelines 2022 (Large Appliances)', TRUE),
('AIR_CONDITIONER', 38.00, 240.00, 24.00, 9.00, 'CPCB E-Waste Guidelines 2022 (Cooling Appliances)', TRUE),
('OTHER', 1.50, 8.50, 0.60, 0.50, 'CPCB E-Waste Guidelines 2022 (General Electronics Baseline)', TRUE);
