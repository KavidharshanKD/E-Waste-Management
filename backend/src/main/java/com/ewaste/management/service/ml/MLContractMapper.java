package com.ewaste.management.service.ml;

import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserIntention;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Centralized contract mapper between Spring Boot entities/DTOs and Python FastAPI ML service.
 * Enforces strict, explicit mapping and never relies on toString() accidents.
 */
@Component
public class MLContractMapper {

    // Allowed categories in Python FastAPI schema
    private static final Set<String> PYTHON_ALLOWED_CATEGORIES = Set.of(
            "MOBILE_PHONE", "LAPTOP", "DESKTOP", "TABLET", "TELEVISION",
            "MONITOR", "PRINTER", "AUDIO_EQUIPMENT", "CAMERA", "REFRIGERATOR",
            "WASHING_MACHINE", "AIR_CONDITIONER", "MICROWAVE", "BATTERY",
            "CHARGER", "CABLE", "KEYBOARD", "MOUSE", "OTHER"
    );

    // Allowed conditions in Python FastAPI schema
    private static final Set<String> PYTHON_ALLOWED_CONDITIONS = Set.of(
            "WORKING", "PARTIALLY_WORKING", "DAMAGED", "NOT_WORKING", "HAZARDOUS"
    );

    // Allowed screen conditions in Python FastAPI schema
    private static final Set<String> PYTHON_ALLOWED_SCREENS = Set.of(
            "INTACT", "MINOR_SCRATCHES", "CRACKED", "DEAD_PIXELS_BLEED",
            "SHATTERED_NOT_WORKING", "NOT_APPLICABLE"
    );

    // Categories that naturally possess a display/screen
    private static final Set<EWasteCategory> SCREEN_CATEGORIES = Set.of(
            EWasteCategory.MOBILE_PHONE,
            EWasteCategory.LAPTOP,
            EWasteCategory.MONITOR,
            EWasteCategory.TELEVISION
    );

    // Categories that naturally possess a rechargeable battery
    private static final Set<EWasteCategory> BATTERY_CATEGORIES = Set.of(
            EWasteCategory.MOBILE_PHONE,
            EWasteCategory.LAPTOP,
            EWasteCategory.BATTERY
    );

    // Categories that have power states
    private static final Set<EWasteCategory> PASSIVE_CATEGORIES = Set.of(
            EWasteCategory.CABLE,
            EWasteCategory.BATTERY
    );

    /**
     * Converts a RecommendationInput into an MLPredictRequest matching the FastAPI contract.
     */
    public MLPredictRequest toMLRequest(RecommendationInput input) {
        if (input == null) {
            throw new IllegalArgumentException("RecommendationInput cannot be null for ML mapping");
        }

        MLPredictRequest request = new MLPredictRequest();

        // 1. Category
        String categoryStr = mapCategory(input.getCategory());
        request.setCategory(categoryStr);

        // 2. Approx Age Years
        double age = input.getDeviceAgeYears() != null && input.getDeviceAgeYears() >= 0
                ? input.getDeviceAgeYears().doubleValue()
                : 0.0;
        request.setApproxAgeYears(age);

        // 3. Condition
        request.setCondition(mapCondition(input.getCondition()));

        // 4. User Intention
        request.setUserIntention(mapUserIntention(input.getUserIntention()));

        // 5. Powers On
        request.setPowersOn(mapPowersOn(input.getCategory(), input.getPowersOn()));

        // 6. Screen Condition
        request.setScreenCondition(mapScreenCondition(input.getCategory(), input.getScreenCondition()));

        // 7. Battery Condition
        request.setBatteryCondition(mapBatteryCondition(input.getCategory(), input.getBatteryCondition()));

        // 8. Damage Severity
        request.setDamageSeverity(mapDamageSeverity(input.getCondition(), input.getDamageCondition()));

        // 9. Safety Flags (Deterministic pass-through)
        request.setBatterySwollen(Boolean.TRUE.equals(input.getBatterySwollen()));
        request.setBatteryLeaking(Boolean.TRUE.equals(input.getBatteryLeaking()));
        request.setOverheatingEvidence(Boolean.TRUE.equals(input.getOverheatingEvidence()));
        request.setSeverePhysicalDamage(Boolean.TRUE.equals(input.getSeverePhysicalDamage()));

        return request;
    }

    public String mapCategory(EWasteCategory category) {
        if (category == null) {
            return "OTHER";
        }
        String name = category.name();
        if (PYTHON_ALLOWED_CATEGORIES.contains(name)) {
            return name;
        }
        return "OTHER";
    }

    public String mapCondition(DeviceCondition condition) {
        if (condition == null) {
            return "WORKING";
        }
        String name = condition.name();
        if (PYTHON_ALLOWED_CONDITIONS.contains(name)) {
            return name;
        }
        return "WORKING";
    }

    public String mapUserIntention(UserIntention intention) {
        if (intention == null) {
            return "UNSURE";
        }
        return intention.name();
    }

    public String mapPowersOn(EWasteCategory category, Boolean powersOn) {
        if (category != null && PASSIVE_CATEGORIES.contains(category)) {
            return "NOT_APPLICABLE";
        }
        if (powersOn == null) {
            return "YES";
        }
        return powersOn ? "YES" : "NO";
    }

    public String mapScreenCondition(EWasteCategory category, String screenCondition) {
        if (category != null && !SCREEN_CATEGORIES.contains(category)) {
            return "NOT_APPLICABLE";
        }
        if (screenCondition == null || screenCondition.isBlank()) {
            return "INTACT";
        }
        String upper = screenCondition.trim().toUpperCase();
        if (PYTHON_ALLOWED_SCREENS.contains(upper)) {
            return upper;
        }
        if (upper.contains("CRACK")) return "CRACKED";
        if (upper.contains("SCRATCH")) return "MINOR_SCRATCHES";
        if (upper.contains("BLEED") || upper.contains("PIXEL") || upper.contains("LINE")) return "DEAD_PIXELS_BLEED";
        if (upper.contains("SHATTER") || upper.contains("BROKEN")) return "SHATTERED_NOT_WORKING";
        return "INTACT";
    }

    public String mapBatteryCondition(EWasteCategory category, String batteryCondition) {
        if (category != null && !BATTERY_CATEGORIES.contains(category)) {
            return "NOT_APPLICABLE";
        }
        if (batteryCondition == null || batteryCondition.isBlank()) {
            return "NORMAL";
        }
        String lower = batteryCondition.trim().toLowerCase();
        if (lower.contains("normal") || lower.contains("good")) return "NORMAL";
        if (lower.contains("degrad") || lower.contains("drain") || lower.contains("poor") || lower.contains("weak")) return "DEGRADED";
        if (lower.contains("dead") || lower.contains("not charging") || lower.contains("none")) return "DEAD";
        if (lower.contains("not_applicable") || lower.contains("n/a")) return "NOT_APPLICABLE";
        return "NORMAL";
    }

    public String mapDamageSeverity(DeviceCondition condition, String damageCondition) {
        if (damageCondition != null && !damageCondition.isBlank()) {
            String upper = damageCondition.trim().toUpperCase();
            if (upper.contains("HEAVY") || upper.contains("SEVERE") || upper.contains("CRUSH")) return "HEAVY";
            if (upper.contains("MODERATE") || upper.contains("MEDIUM") || upper.contains("DENT")) return "MODERATE";
            if (upper.contains("MINOR") || upper.contains("COSMETIC") || upper.contains("SCRATCH")) return "MINOR_COSMETIC";
            if (upper.contains("NONE") || upper.contains("INTACT")) return "NONE";
        }

        if (condition == null) return "NONE";
        switch (condition) {
            case DAMAGED:
                return "MODERATE";
            case NOT_WORKING:
                return "MINOR_COSMETIC";
            case HAZARDOUS:
                return "HEAVY";
            case PARTIALLY_WORKING:
                return "MINOR_COSMETIC";
            case WORKING:
            default:
                return "NONE";
        }
    }
}
