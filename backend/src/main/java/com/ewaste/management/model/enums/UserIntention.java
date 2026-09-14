package com.ewaste.management.model.enums;

/**
 * Represents the citizen's or institution's desired outcome for a submitted device.
 * Used as a key prior/feature alongside physical assessment for ML recommendation.
 */
public enum UserIntention {
    KEEP_USING,
    REPAIR,
    REFURBISH,
    REFURBISH_AND_SELL,
    DONATE,
    RECYCLE,
    UNSURE
}
