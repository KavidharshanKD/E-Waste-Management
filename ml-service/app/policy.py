"""
Stage 3: User Intention Policy Layer.
Deterministic rules for evaluating citizen preference against technical feasibility.
Guarantees that user preference cannot override safety hazards or high-confidence recycling warnings.
"""

from typing import Tuple, Optional
from app.config import (
    ACTION_SPECIAL_HANDLING,
    ACTION_RESTORE,
    ACTION_POTENTIAL_RESALE,
    ACTION_KEEP_USING,
    ACTION_DONATE,
    ACTION_RECYCLE,
    STATUS_RECOVERY_UNLIKELY,
    STATUS_SPECIAL_HANDLING,
)


def evaluate_user_intention_policy(
    display_rec: str,
    recovery_status: str,
    technician_review_required: bool,
    user_intention: Optional[str],
) -> Tuple[str, str, Optional[str]]:
    """
    Apply user intention policy rules.
    Returns:
        (authoritative_action: str, compatibility: str, policy_note: Optional[str])
    """
    intent = (user_intention or "UNSURE").strip().upper()

    # Rule 1: Safety Gate is supreme. User intention CANNOT override special handling.
    if recovery_status == STATUS_SPECIAL_HANDLING or display_rec == ACTION_SPECIAL_HANDLING:
        compatibility = "NOT_APPLICABLE" if intent == "UNSURE" else "CONFLICT"
        note = "Safety hazards mandate special controlled handling regardless of stated user preference."
        return ACTION_SPECIAL_HANDLING, compatibility, note

    # Rule 2: Unsure intention simply defaults to technical ML recommendation.
    if intent in ["UNSURE", "", "NONE"]:
        return display_rec, "NOT_APPLICABLE", None

    # Rule 3: High-Confidence Recovery Unlikely Warning.
    # If hardware is terminal, user intention (e.g., KEEP_USING or REPAIR) cannot override the technical warning.
    if recovery_status == STATUS_RECOVERY_UNLIKELY or display_rec == ACTION_RECYCLE:
        if intent == ACTION_RECYCLE:
            return ACTION_RECYCLE, "COMPATIBLE", "User preference aligns with recycling recommendation."
        else:
            return (
                ACTION_RECYCLE,
                "CONFLICT",
                f"The device exhibits severe end-of-life recovery hurdles; stated intention '{intent}' cannot override recycling recommendation.",
            )

    # Rule 4: Device is working (KEEP_USING), but user wishes to DONATE or RECYCLE.
    if display_rec == ACTION_KEEP_USING:
        if intent in [ACTION_DONATE, ACTION_REFURBISH_AND_SELL, ACTION_POTENTIAL_RESALE]:
            return ACTION_DONATE, "COMPATIBLE", "Working device is suitable for donation as preferred by the user."
        elif intent == ACTION_RECYCLE:
            return ACTION_RECYCLE, "COMPATIBLE", "Device is functional, but recycling preference will be honored."
        elif intent == ACTION_KEEP_USING:
            return ACTION_KEEP_USING, "COMPATIBLE", "User preference aligns with continued device usage."

    # Rule 5: Device requires restoration (RESTORE / REPAIR / REFURBISH).
    if display_rec == ACTION_RESTORE:
        if intent in ["REPAIR", "REFURBISH", "RESTORE"]:
            return ACTION_RESTORE, "COMPATIBLE", "User preference aligns with device restoration."
        elif intent == ACTION_RECYCLE:
            return (
                ACTION_RECYCLE,
                "COMPATIBLE",
                "Restoration may be feasible, but citizen preference for recycling will be respected.",
            )
        elif intent == ACTION_KEEP_USING:
            return (
                ACTION_RESTORE,
                "CONFLICT",
                "Device has reported defects requiring bench restoration before it can be safely used.",
            )

    # Rule 6: Potential resale candidate.
    if display_rec == ACTION_POTENTIAL_RESALE:
        if intent in ["REFURBISH_AND_SELL", "REFURBISH", "REPAIR"]:
            return ACTION_POTENTIAL_RESALE, "COMPATIBLE", "Device may be appraised for second-life resale."
        elif intent in [ACTION_DONATE, ACTION_RECYCLE]:
            return intent, "COMPATIBLE", f"Device has potential resale value, but citizen preference for {intent} is respected."

    # Default fallback: Preserve display recommendation
    return display_rec, "COMPATIBLE", None
