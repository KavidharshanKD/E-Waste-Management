"""
Dataset Schema and Definitions for Device Lifecycle Recommendation
Aligned with Java Enums, Module 1 Data Contract, and Module 3 Preprocessing Architecture.
"""

from typing import Dict, List, Any

# ==============================================================================
# 1. CORE ENUMS & VALUES (Module 1 Data Contract)
# ==============================================================================

# Core Category Enum (15 classes matching EWasteCategory.java)
EWASTE_CATEGORIES = [
    "MOBILE_PHONE",
    "LAPTOP",
    "DESKTOP",
    "MONITOR",
    "TELEVISION",
    "PRINTER",
    "KEYBOARD",
    "MOUSE",
    "BATTERY",
    "CHARGER",
    "CABLE",
    "REFRIGERATOR",
    "WASHING_MACHINE",
    "AIR_CONDITIONER",
    "OTHER",
]

# Operating Condition Enum (5 classes matching DeviceCondition.java)
DEVICE_CONDITIONS = [
    "WORKING",
    "PARTIALLY_WORKING",
    "DAMAGED",
    "NOT_WORKING",
    "HAZARDOUS",
]

# Condition options for Preprocessing (includes NOT_RECORDED for real datasets without condition intake)
CONDITION_PREPROCESSING_VALUES = DEVICE_CONDITIONS + ["NOT_RECORDED"]

# User Intention Enum (7 classes matching UserIntention.java)
# REMOVED from ML Feature Matrix; used exclusively in Post-Model Policy Layer
USER_INTENTIONS = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
    "RECYCLE",
    "UNSURE",
]

# Display / Screen Condition Values
SCREEN_CONDITIONS = [
    "INTACT",
    "MINOR_SCRATCHES",
    "CRACKED",
    "DEAD_PIXELS_BLEED",
    "SHATTERED_NOT_WORKING",
    "NOT_APPLICABLE",
]

# Battery State Values
BATTERY_CONDITIONS = [
    "NORMAL",
    "DEGRADED",
    "DEAD",
    "NOT_APPLICABLE",
]

# Power-On State Values
POWERS_ON_VALUES = [
    "YES",
    "NO",
    "NOT_APPLICABLE",
]

# Physical Damage Severity
DAMAGE_SEVERITIES = [
    "NONE",
    "MINOR_COSMETIC",
    "MODERATE",
    "HEAVY",
]

# ==============================================================================
# 2. DATA PROVENANCE DEFINITIONS (Zero Silent Mixing)
# ==============================================================================

PROVENANCE_REAL_OPEN_REPAIR = "REAL_OPEN_REPAIR"
PROVENANCE_REAL_TU_DELFT = "REAL_TU_DELFT"
PROVENANCE_SYNTHETIC_DEVELOPMENT = "SYNTHETIC_DEVELOPMENT"
PROVENANCE_HYBRID_AUGMENTED = "HYBRID_AUGMENTED"

ALL_PROVENANCE_VALUES = [
    PROVENANCE_REAL_OPEN_REPAIR,
    PROVENANCE_REAL_TU_DELFT,
    PROVENANCE_SYNTHETIC_DEVELOPMENT,
    PROVENANCE_HYBRID_AUGMENTED,
]

# ==============================================================================
# 3. HIERARCHICAL ML ARCHITECTURE SCHEMAS
# ==============================================================================

# LEVEL 1: PHYSICAL FEASIBILITY CLASSIFIER
# Evaluates whether the device has physical recovery potential vs true end-of-life
LEVEL_1_TARGET_COLUMN = "feasibility_label"
LEVEL_1_CLASSES = ["SALVAGEABLE", "END_OF_LIFE"]

LEVEL_1_FEATURES: List[str] = [
    "category",
    "approx_age_years",
    "condition",
]

# LEVEL 2: CIRCULAR PATHWAY CLASSIFIER
# Evaluates optimal circular disposition for salvageable devices
LEVEL_2_TARGET_COLUMN = "circular_action"
LEVEL_2_CLASSES = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
]

LEVEL_2_FEATURES: List[str] = [
    "category",
    "approx_age_years",
    "condition",
    "powers_on",
    "screen_condition",
    "battery_condition",
    "damage_severity",
]

# Deterministic Safety Target (Outside ML - Layer 1 Safety Gate)
SAFETY_TARGET = "SPECIAL_HANDLING"

# Legacy 6-class targets (Module 2 backward compatibility)
ML_TARGET_CLASSES = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
    "RECYCLE",
]
ALL_TARGET_CLASSES = ML_TARGET_CLASSES + [SAFETY_TARGET]

# Safety Gate Deterministic Input Features
SAFETY_GATE_FEATURES: List[str] = [
    "battery_swollen",
    "battery_leaking",
    "overheating_evidence",
    "severe_physical_damage",
]

TARGET_COLUMN: str = "recommended_action"
SAFETY_FLAG_COLUMN: str = "is_safety_hazard"

# Module 2 Legacy Predictive Feature Set (Retained for generator/testing backward compatibility;
# user_intention is removed from LEVEL_1_FEATURES and LEVEL_2_FEATURES in Module 3)
ML_PREDICTIVE_FEATURES: List[str] = [
    "category",
    "approx_age_years",
    "condition",
    "user_intention",
    "powers_on",
    "screen_condition",
    "battery_condition",
    "damage_severity",
]

# ==============================================================================
# 4. CATEGORY MAPPINGS FROM REAL EXTERNAL DATASETS
# ==============================================================================

OPEN_REPAIR_CATEGORY_MAP: Dict[str, str] = {
    "Laptop": "LAPTOP",
    "Mobile": "MOBILE_PHONE",
    "Desktop computer": "DESKTOP",
    "Printer/scanner": "PRINTER",
    "Flat screen": "MONITOR",
    "TV and gaming-related accessories": "TELEVISION",
    "Tablet": "OTHER",  # Tablet maps to OTHER as TABLET is not a standalone Java EWasteCategory enum
}

TU_DELFT_CATEGORY_MAP: Dict[str, str] = {
    "0303": "LAPTOP",
    "0302": "DESKTOP",
    "0306": "MOBILE_PHONE",
    "0304": "PRINTER",
    "0408": "MONITOR",
    "0309": "MONITOR",
    "0407": "TELEVISION",
    "0308": "OTHER",  # Tablets
    "0204": "OTHER",  # Vacuums
    "0404": "OTHER",  # Camcorders
    "0405": "OTHER",  # Audio
    "0406": "OTHER",  # Digital Cameras
}

# ==============================================================================
# 5. CATEGORY-AWARE AGE LIMITS & EMPIRICAL BASELINES
# Grounded in technology introduction eras and empirical distributions
# ==============================================================================

CATEGORY_AGE_LIMITS: Dict[str, float] = {
    "MOBILE_PHONE": 15.0,     # Modern smartphones established post-2007
    "LAPTOP": 20.0,           # Consumer laptop lifespans
    "DESKTOP": 25.0,          # PC architectures
    "MONITOR": 20.0,          # Flat screen LCD/LED monitors post-2000
    "TELEVISION": 25.0,       # Modern consumer TVs
    "PRINTER": 20.0,          # Consumer desktop printers
    "KEYBOARD": 15.0,
    "MOUSE": 15.0,
    "BATTERY": 10.0,
    "CHARGER": 15.0,
    "CABLE": 15.0,
    "REFRIGERATOR": 25.0,
    "WASHING_MACHINE": 20.0,
    "AIR_CONDITIONER": 20.0,
    "OTHER": 25.0,
}

# Calibrated category parameters (Informed by Open Repair & TU Delft Medians)
CATEGORY_CAPABILITIES: Dict[str, Dict[str, Any]] = {
    "MOBILE_PHONE": {
        "has_screen": True,
        "has_battery": True,
        "is_powered": True,
        "resale_demand": "HIGH",
        "repairability_base": 0.72,  # Calibrated to Open Repair ~72%
        "donation_utility": 0.75,
        "avg_lifespan_years": 3.8,   # Calibrated: TU Delft med 3.5, ORA med 4.0
    },
    "LAPTOP": {
        "has_screen": True,
        "has_battery": True,
        "is_powered": True,
        "resale_demand": "HIGH",
        "repairability_base": 0.75,  # Calibrated to Open Repair laptop repair rate
        "donation_utility": 0.90,
        "avg_lifespan_years": 5.9,   # Calibrated: TU Delft med 5.8, ORA med 6.0
    },
    "DESKTOP": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.85,
        "donation_utility": 0.85,
        "avg_lifespan_years": 7.6,   # Calibrated: TU Delft med 7.3, ORA med 8.0
    },
    "MONITOR": {
        "has_screen": True,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.60,
        "donation_utility": 0.80,
        "avg_lifespan_years": 6.7,   # Calibrated: TU Delft med 5.4, ORA med 8.0
    },
    "TELEVISION": {
        "has_screen": True,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.55,
        "donation_utility": 0.65,
        "avg_lifespan_years": 11.3,  # Calibrated: TU Delft med 12.7, ORA med 10.0
    },
    "PRINTER": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "LOW",
        "repairability_base": 0.50,
        "donation_utility": 0.50,
        "avg_lifespan_years": 5.0,   # Calibrated: TU Delft med 4.1, ORA med 6.0
    },
    "KEYBOARD": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": False,
        "resale_demand": "LOW",
        "repairability_base": 0.30,
        "donation_utility": 0.40,
        "avg_lifespan_years": 5.0,
    },
    "MOUSE": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": False,
        "resale_demand": "LOW",
        "repairability_base": 0.20,
        "donation_utility": 0.35,
        "avg_lifespan_years": 4.0,
    },
    "BATTERY": {
        "has_screen": False,
        "has_battery": True,
        "is_powered": False,
        "resale_demand": "NONE",
        "repairability_base": 0.05,
        "donation_utility": 0.00,
        "avg_lifespan_years": 3.0,
    },
    "CHARGER": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "LOW",
        "repairability_base": 0.15,
        "donation_utility": 0.30,
        "avg_lifespan_years": 4.0,
    },
    "CABLE": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": False,
        "resale_demand": "NONE",
        "repairability_base": 0.05,
        "donation_utility": 0.20,
        "avg_lifespan_years": 3.0,
    },
    "REFRIGERATOR": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.65,
        "donation_utility": 0.50,
        "avg_lifespan_years": 12.0,
    },
    "WASHING_MACHINE": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.60,
        "donation_utility": 0.45,
        "avg_lifespan_years": 10.0,
    },
    "AIR_CONDITIONER": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.55,
        "donation_utility": 0.40,
        "avg_lifespan_years": 10.0,
    },
    "OTHER": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "LOW",
        "repairability_base": 0.40,
        "donation_utility": 0.30,
        "avg_lifespan_years": 5.0,
    },
}
