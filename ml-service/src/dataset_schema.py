"""
Dataset Schema and Definitions for Device Lifecycle Recommendation
Aligned 1-to-1 with Java Enums and Module 1 Data Contract.
"""

from typing import Dict, List, Any

# 1. Core Category Enum (15 classes matching EWasteCategory.java)
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

# 2. Operating Condition Enum (5 classes matching DeviceCondition.java)
DEVICE_CONDITIONS = [
    "WORKING",
    "PARTIALLY_WORKING",
    "DAMAGED",
    "NOT_WORKING",
    "HAZARDOUS",
]

# 3. User Intention Enum (7 classes matching UserIntention.java)
USER_INTENTIONS = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
    "RECYCLE",
    "UNSURE",
]

# 4. Display / Screen Condition Values
SCREEN_CONDITIONS = [
    "INTACT",
    "MINOR_SCRATCHES",
    "CRACKED",
    "DEAD_PIXELS_BLEED",
    "SHATTERED_NOT_WORKING",
    "NOT_APPLICABLE",
]

# 5. Battery State Values
BATTERY_CONDITIONS = [
    "NORMAL",
    "DEGRADED",
    "DEAD",
    "NOT_APPLICABLE",
]

# 6. Power-On State Values
POWERS_ON_VALUES = [
    "YES",
    "NO",
    "NOT_APPLICABLE",
]

# 7. Physical Damage Severity (Mapped from intake descriptors)
DAMAGE_SEVERITIES = [
    "NONE",
    "MINOR_COSMETIC",
    "MODERATE",
    "HEAVY",
]

# 8. ML Circular Lifecycle Target Classes (6 non-hazardous outcomes)
ML_TARGET_CLASSES = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
    "RECYCLE",
]

# 9. Safety Gate Terminal Outcome (Handled by Layer 1 Deterministic Rule Gate)
SAFETY_TARGET = "SPECIAL_HANDLING"

# 10. Complete Recommendation Outcomes (6 ML + 1 Safety Gate)
ALL_TARGET_CLASSES = ML_TARGET_CLASSES + [SAFETY_TARGET]

# 11. Category Hardware Capabilities Matrix
# Defines realistic physical attributes for each category
CATEGORY_CAPABILITIES: Dict[str, Dict[str, Any]] = {
    "MOBILE_PHONE": {
        "has_screen": True,
        "has_battery": True,
        "is_powered": True,
        "resale_demand": "HIGH",
        "repairability_base": 0.70,
        "donation_utility": 0.75,
        "avg_lifespan_years": 4.5,
    },
    "LAPTOP": {
        "has_screen": True,
        "has_battery": True,
        "is_powered": True,
        "resale_demand": "HIGH",
        "repairability_base": 0.80,
        "donation_utility": 0.90,
        "avg_lifespan_years": 6.0,
    },
    "DESKTOP": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.90,
        "donation_utility": 0.85,
        "avg_lifespan_years": 8.0,
    },
    "MONITOR": {
        "has_screen": True,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.50,
        "donation_utility": 0.80,
        "avg_lifespan_years": 7.0,
    },
    "TELEVISION": {
        "has_screen": True,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "MEDIUM",
        "repairability_base": 0.45,
        "donation_utility": 0.65,
        "avg_lifespan_years": 8.0,
    },
    "PRINTER": {
        "has_screen": False,
        "has_battery": False,
        "is_powered": True,
        "resale_demand": "LOW",
        "repairability_base": 0.40,
        "donation_utility": 0.50,
        "avg_lifespan_years": 5.0,
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

# 12. Explicit Feature Groupings for ML and Safety Pipeline
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

SAFETY_GATE_FEATURES: List[str] = [
    "battery_swollen",
    "battery_leaking",
    "overheating_evidence",
    "severe_physical_damage",
]

TARGET_COLUMN: str = "recommended_action"
SAFETY_FLAG_COLUMN: str = "is_safety_hazard"
