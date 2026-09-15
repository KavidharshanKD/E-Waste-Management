"""
Pydantic Request and Response Schemas for ML Standalone Inference Service.
Enforces strict contract validation matching Java enum strings, age ranges, and safety flags.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, field_validator

from app.config import (
    EWASTE_CATEGORIES,
    DEVICE_CONDITIONS,
    USER_INTENTIONS,
    SCREEN_CONDITIONS,
    BATTERY_CONDITIONS,
    POWERS_ON_VALUES,
    DAMAGE_SEVERITIES,
)


class PredictRequest(BaseModel):
    """
    Intake Request DTO for ML recommendation.
    Represents device physical state, category, age, and optional citizen intention.
    """

    category: str = Field(..., description="E-waste product category", examples=["LAPTOP"])
    approx_age_years: float = Field(..., description="Device age in years", ge=0.0, le=100.0, examples=[5.0])
    condition: str = Field(..., description="Reported intake condition", examples=["PARTIALLY_WORKING"])

    user_intention: Optional[str] = Field("UNSURE", description="Citizen stated intention", examples=["REPAIR"])

    powers_on: Optional[str] = Field("YES", description="Power test status", examples=["YES"])
    screen_condition: Optional[str] = Field("INTACT", description="Display / screen status", examples=["CRACKED"])
    battery_condition: Optional[str] = Field("NORMAL", description="Battery operational health", examples=["NORMAL"])
    damage_severity: Optional[str] = Field("NONE", description="Structural damage severity", examples=["MODERATE"])

    battery_swollen: Optional[bool] = Field(False, description="Physical battery swelling flag")
    battery_leaking: Optional[bool] = Field(False, description="Battery chemical leakage flag")
    overheating_evidence: Optional[bool] = Field(False, description="Thermal scorch / burning evidence flag")
    severe_physical_damage: Optional[bool] = Field(False, description="Catastrophic structural damage flag")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        clean = v.strip().upper()
        if clean not in EWASTE_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'. Supported categories: {EWASTE_CATEGORIES}")
        return clean

    @field_validator("condition")
    @classmethod
    def validate_condition(cls, v: str) -> str:
        clean = v.strip().upper()
        if clean not in DEVICE_CONDITIONS:
            raise ValueError(f"Invalid condition '{v}'. Supported conditions: {DEVICE_CONDITIONS}")
        return clean

    @field_validator("user_intention")
    @classmethod
    def validate_intention(cls, v: Optional[str]) -> str:
        if v is None or not str(v).strip():
            return "UNSURE"
        clean = str(v).strip().upper()
        if clean not in USER_INTENTIONS:
            raise ValueError(f"Invalid user_intention '{v}'. Supported intentions: {USER_INTENTIONS}")
        return clean

    @field_validator("powers_on")
    @classmethod
    def validate_powers_on(cls, v: Optional[str]) -> str:
        if v is None:
            return "NOT_APPLICABLE"
        clean = str(v).strip().upper()
        if clean not in POWERS_ON_VALUES:
            raise ValueError(f"Invalid powers_on '{v}'. Supported values: {POWERS_ON_VALUES}")
        return clean

    @field_validator("screen_condition")
    @classmethod
    def validate_screen(cls, v: Optional[str]) -> str:
        if v is None:
            return "NOT_APPLICABLE"
        clean = str(v).strip().upper()
        if clean not in SCREEN_CONDITIONS:
            raise ValueError(f"Invalid screen_condition '{v}'. Supported values: {SCREEN_CONDITIONS}")
        return clean

    @field_validator("battery_condition")
    @classmethod
    def validate_battery(cls, v: Optional[str]) -> str:
        if v is None:
            return "NOT_APPLICABLE"
        clean = str(v).strip().upper()
        if clean not in BATTERY_CONDITIONS:
            raise ValueError(f"Invalid battery_condition '{v}'. Supported values: {BATTERY_CONDITIONS}")
        return clean

    @field_validator("damage_severity")
    @classmethod
    def validate_damage(cls, v: Optional[str]) -> str:
        if v is None:
            return "NONE"
        clean = str(v).strip().upper()
        if clean not in DAMAGE_SEVERITIES:
            raise ValueError(f"Invalid damage_severity '{v}'. Supported values: {DAMAGE_SEVERITIES}")
        return clean


class PredictResponse(BaseModel):
    """
    Response DTO matching production specifications for later Spring Boot consumption.
    Includes deterministic explanations, safety triggers, recovery probabilities, and marketplace flags.
    """

    model_version: str = Field(..., description="Active production model version")

    safety_gate_triggered: bool = Field(..., description="Whether deterministic Stage 0 safety gate intervened")
    safety_reasons: List[str] = Field(default_factory=list, description="List of triggered safety hazard descriptions")

    recovery_status: Optional[str] = Field(
        None,
        description="Stage 1 Recovery status: RECOVERY_FEASIBLE, AMBIGUOUS_TRIAGE, RECOVERY_UNLIKELY, SPECIAL_HANDLING",
    )
    recovery_probability: Optional[float] = Field(
        None,
        description="Calibrated probability of recovery hurdle / end-of-life",
        ge=0.0,
        le=1.0,
    )

    raw_pathway_prediction: Optional[str] = Field(
        None,
        description="Underlying Stage 2 ML prediction (KEEP_USING, REPAIR, REFURBISH, REFURBISH_AND_SELL, DONATE)",
    )
    display_recommendation: str = Field(
        ...,
        description="Citizen-facing recommendation (RESTORE, POTENTIAL_RESALE_CANDIDATE, KEEP_USING, DONATE, RECYCLE, SPECIAL_HANDLING)",
    )
    pathway_probability: Optional[float] = Field(
        None,
        description="Estimated probability/confidence of the underlying circular pathway",
        ge=0.0,
        le=1.0,
    )

    confidence_level: str = Field(
        ...,
        description="Product display confidence band: HIGH, MEDIUM, LOW",
    )

    technician_review_required: bool = Field(
        ...,
        description="Whether a human bench technician must perform physical inspection",
    )
    inspection_recommended: bool = Field(
        ...,
        description="Whether uncertainty warrants technician confirmation before final disposition",
    )

    user_intention: Optional[str] = Field(None, description="Reported citizen intention")
    intention_compatibility: str = Field(
        ...,
        description="Intention policy evaluation: COMPATIBLE, CONFLICT, NOT_APPLICABLE",
    )

    recommended_action: str = Field(
        ...,
        description="Authoritative recommendation action for downstream database and Spring Boot workflow",
    )

    explanation: str = Field(..., description="Deterministic, structured explanation of recommendation")

    marketplace_eligibility: str = Field(
        ...,
        description="Commercial marketplace status: NOT_ASSESSED, TECHNICIAN_REVIEW_REQUIRED (Never automatically approved)",
    )

    pathway_probabilities: Optional[Dict[str, float]] = Field(
        None,
        description="Full probability distribution over Level 2 candidate circular actions",
    )


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    service: str
    version: str
    models_loaded: bool
    timestamp_utc: str


class VersionResponse(BaseModel):
    """Safe model metadata and configuration response schema."""

    service_name: str
    service_version: str
    model_version: str
    dataset_version: str
    git_commit: str
    level1_algorithm: str
    level2_algorithm: str
    thresholds: Dict[str, Any]
    marketplace_policy: str
