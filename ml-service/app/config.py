"""
Configuration and settings for E-Waste Standalone ML Inference Service.
Stores versioned thresholds, file paths, and operational parameters without magic numbers.
"""

import os
import sys
from typing import Dict, Any, List

# Ensure ml-service root and src directories are in sys.path for unpickling custom transformers
APP_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVICE_DIR = os.path.dirname(APP_DIR)
SRC_DIR = os.path.join(ML_SERVICE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)
if ML_SERVICE_DIR not in sys.path:
    sys.path.insert(0, ML_SERVICE_DIR)
SERVICE_NAME = "ewaste-ml-inference-service"
SERVICE_VERSION = "1.0.0"
MODEL_VERSION = "1.0.0"
DATASET_VERSION = "2025.07"

MODELS_DIR = os.path.join(ML_SERVICE_DIR, "models")
LEVEL_1_MODEL_PATH = os.path.join(MODELS_DIR, "level1_recovery_pipeline.joblib")
LEVEL_2_MODEL_PATH = os.path.join(MODELS_DIR, "level2_pathway_pipeline.joblib")
MODEL_MANIFEST_PATH = os.path.join(MODELS_DIR, "model_manifest.json")

# Level 1: 3-Zone Conservative Triage Thresholds (Module 4.5 validation-calibrated)
# Zone 1: P(EOL) < 0.35 -> RECOVERY_FEASIBLE
# Zone 2: 0.35 <= P(EOL) < 0.70 -> AMBIGUOUS_TRIAGE (Technician Review Required)
# Zone 3: P(EOL) >= 0.70 -> RECOVERY_UNLIKELY (Direct to RECYCLE)
EOL_RECOVERY_FEASIBLE_THRESHOLD: float = 0.35
EOL_RECOVERY_UNLIKELY_THRESHOLD: float = 0.70

# Level 2: Confidence Display Bands
# If max probability < 0.40 -> LOW (forces inspection_recommended=True)
# If 0.40 <= max probability < 0.70 -> MEDIUM
# If max probability >= 0.70 -> HIGH
CONFIDENCE_HIGH_THRESHOLD: float = 0.70
CONFIDENCE_MEDIUM_THRESHOLD: float = 0.40

# Valid Enum Definitions (matching Java DTO contracts)
EWASTE_CATEGORIES: List[str] = [
    "MOBILE_PHONE",
    "LAPTOP",
    "DESKTOP",
    "TABLET",
    "TELEVISION",
    "MONITOR",
    "PRINTER",
    "AUDIO_EQUIPMENT",
    "CAMERA",
    "REFRIGERATOR",
    "WASHING_MACHINE",
    "AIR_CONDITIONER",
    "MICROWAVE",
    "BATTERY",
    "CHARGER",
    "CABLE",
    "KEYBOARD",
    "MOUSE",
    "OTHER",
]

DEVICE_CONDITIONS: List[str] = [
    "WORKING",
    "PARTIALLY_WORKING",
    "DAMAGED",
    "NOT_WORKING",
    "HAZARDOUS",
]

USER_INTENTIONS: List[str] = [
    "KEEP_USING",
    "REPAIR",
    "REFURBISH",
    "REFURBISH_AND_SELL",
    "DONATE",
    "RECYCLE",
    "UNSURE",
]

SCREEN_CONDITIONS: List[str] = [
    "INTACT",
    "MINOR_SCRATCHES",
    "CRACKED",
    "DEAD_PIXELS_BLEED",
    "SHATTERED_NOT_WORKING",
    "NOT_APPLICABLE",
]

BATTERY_CONDITIONS: List[str] = [
    "NORMAL",
    "DEGRADED",
    "DEAD",
    "NOT_APPLICABLE",
]

POWERS_ON_VALUES: List[str] = [
    "YES",
    "NO",
    "NOT_APPLICABLE",
]

DAMAGE_SEVERITIES: List[str] = [
    "NONE",
    "MINOR_COSMETIC",
    "MODERATE",
    "HEAVY",
]

# Action and Status Enums
ACTION_SPECIAL_HANDLING = "SPECIAL_HANDLING"
ACTION_RESTORE = "RESTORE"
ACTION_POTENTIAL_RESALE = "POTENTIAL_RESALE_CANDIDATE"
ACTION_KEEP_USING = "KEEP_USING"
ACTION_DONATE = "DONATE"
ACTION_RECYCLE = "RECYCLE"

STATUS_RECOVERY_FEASIBLE = "RECOVERY_FEASIBLE"
STATUS_AMBIGUOUS_TRIAGE = "AMBIGUOUS_TRIAGE"
STATUS_RECOVERY_UNLIKELY = "RECOVERY_UNLIKELY"
STATUS_SPECIAL_HANDLING = "SPECIAL_HANDLING"

MARKETPLACE_NOT_ASSESSED = "NOT_ASSESSED"
MARKETPLACE_TECHNICIAN_REVIEW_REQUIRED = "TECHNICIAN_REVIEW_REQUIRED"
