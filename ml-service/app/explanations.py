"""
Deterministic, Structured Explanation Generator.
Produces transparent, non-causal explanations based purely on actual model outputs,
reported hardware characteristics, and policy outcomes. Zero external LLM calls.
"""

from typing import List, Optional
from app.config import (
    ACTION_SPECIAL_HANDLING,
    ACTION_RESTORE,
    ACTION_POTENTIAL_RESALE,
    ACTION_KEEP_USING,
    ACTION_DONATE,
    ACTION_RECYCLE,
    STATUS_RECOVERY_FEASIBLE,
    STATUS_AMBIGUOUS_TRIAGE,
    STATUS_RECOVERY_UNLIKELY,
)


def build_explanation(
    category: str,
    age: float,
    condition: str,
    powers_on: Optional[str],
    screen: Optional[str],
    battery: Optional[str],
    damage: Optional[str],
    safety_triggered: bool,
    safety_reasons: List[str],
    recovery_status: Optional[str],
    recovery_prob: Optional[float],
    display_rec: str,
    raw_pathway: Optional[str],
    confidence_level: str,
    technician_review: bool,
    policy_note: Optional[str],
) -> str:
    """Build a deterministic, multi-part structured explanation."""
    parts: List[str] = []

    # 1. Safety Gate
    if safety_triggered:
        reasons_text = " ".join(safety_reasons)
        return f"Safety Gate Intercepted: {reasons_text} Immediate quarantine required. Standard ML models were bypassed for operator and environmental safety."

    # 2. Hardware Context
    parts.append(f"Based on the reported {category} ({age:.1f} years old, condition: {condition}):")

    # 3. Level 1 Recovery Feasibility
    if recovery_status == STATUS_RECOVERY_FEASIBLE:
        p_str = f"({(1.0 - (recovery_prob or 0.0))*100:.1f}% recovery likelihood)"
        parts.append(f"The model estimates hardware recovery is feasible {p_str}.")
    elif recovery_status == STATUS_AMBIGUOUS_TRIAGE:
        p_str = f"({(recovery_prob or 0.0)*100:.1f}% hurdle probability)"
        parts.append(
            f"The device falls into the recovery uncertainty range {p_str}. Physical salvage is protected and technician triage is recommended before any recycling decision."
        )
    elif recovery_status == STATUS_RECOVERY_UNLIKELY:
        p_str = f"({(recovery_prob or 0.0)*100:.1f}% end-of-life probability)"
        parts.append(
            f"The model indicates high end-of-life probability {p_str} due to age and severe operational barriers. Responsible material recycling is recommended."
        )

    # 4. Level 2 Circular Pathway
    if display_rec == ACTION_RESTORE:
        parts.append(
            "Reported operational telemetry indicates the hardware is suitable for restoration. A technician inspection will determine whether a targeted repair or full refurbishment is most appropriate."
        )
    elif display_rec == ACTION_POTENTIAL_RESALE:
        parts.append(
            "The device is identified as a potential candidate for restoration and second-life resale. Marketplace eligibility and pricing require physical inspection, quality grading, and commercial appraisal."
        )
    elif display_rec == ACTION_KEEP_USING:
        parts.append("The device appears functional with healthy operational characteristics; continued usage is recommended.")
    elif display_rec == ACTION_DONATE:
        parts.append("The device is functional with useful operating lifetime; donation for community or educational use is recommended.")
    elif display_rec == ACTION_RECYCLE:
        parts.append("The device has exceeded practical restorative utility; routing to certified e-waste recycling is recommended.")

    # 5. Technician Review Note
    if technician_review and recovery_status != STATUS_RECOVERY_UNLIKELY:
        if confidence_level == "LOW":
            parts.append("Due to low intake confidence, physical bench diagnostics are strongly recommended.")
        else:
            parts.append("Technician bench triage is required to confirm diagnostic status.")

    # 6. Policy Note
    if policy_note:
        parts.append(f"Policy Note: {policy_note}")

    return " ".join(parts)
