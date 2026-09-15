"""
Deterministic Stage 0 Safety Gate.
Evaluates physical hazard flags ABOVE and BEFORE any machine learning inference.
Guarantees immediate quarantine with SPECIAL_HANDLING when thermal or chemical hazards are detected.
"""

from typing import Tuple, List
from app.schemas import PredictRequest


def evaluate_safety_gate(req: PredictRequest) -> Tuple[bool, List[str]]:
    """
    Evaluate deterministic safety conditions.
    Returns:
        (is_hazardous: bool, safety_reasons: List[str])
    """
    reasons: List[str] = []

    if req.battery_swollen:
        reasons.append("Battery swelling detected.")

    if req.battery_leaking:
        reasons.append("Battery leakage detected.")

    if req.overheating_evidence:
        reasons.append("Overheating evidence reported.")

    if req.severe_physical_damage or req.condition == "HAZARDOUS":
        reasons.append("Severe physical damage requires controlled handling.")

    is_hazardous = len(reasons) > 0
    return is_hazardous, reasons
