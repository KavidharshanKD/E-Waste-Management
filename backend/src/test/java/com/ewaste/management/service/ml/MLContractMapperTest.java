package com.ewaste.management.service.ml;

import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.dto.ml.MLPredictRequest;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserIntention;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MLContractMapperTest {

    private MLContractMapper mapper;

    private static final Set<String> PYTHON_ALLOWED_CATEGORIES = Set.of(
            "MOBILE_PHONE", "LAPTOP", "DESKTOP", "TABLET", "TELEVISION",
            "MONITOR", "PRINTER", "AUDIO_EQUIPMENT", "CAMERA", "REFRIGERATOR",
            "WASHING_MACHINE", "AIR_CONDITIONER", "MICROWAVE", "BATTERY",
            "CHARGER", "CABLE", "KEYBOARD", "MOUSE", "OTHER"
    );

    private static final Set<String> PYTHON_ALLOWED_CONDITIONS = Set.of(
            "WORKING", "PARTIALLY_WORKING", "DAMAGED", "NOT_WORKING", "HAZARDOUS"
    );

    @BeforeEach
    void setUp() {
        mapper = new MLContractMapper();
    }

    @ParameterizedTest
    @EnumSource(EWasteCategory.class)
    @DisplayName("Every Java EWasteCategory enum maps to a valid category in Python FastAPI schema")
    void testAllJavaCategoriesMapToPythonSchema(EWasteCategory category) {
        String mapped = mapper.mapCategory(category);
        assertNotNull(mapped);
        assertTrue(PYTHON_ALLOWED_CATEGORIES.contains(mapped),
                "Category " + category + " mapped to " + mapped + " which is not recognized by Python schema!");
    }

    @ParameterizedTest
    @EnumSource(DeviceCondition.class)
    @DisplayName("Every Java DeviceCondition enum maps to a valid condition in Python FastAPI schema")
    void testAllJavaConditionsMapToPythonSchema(DeviceCondition condition) {
        String mapped = mapper.mapCondition(condition);
        assertNotNull(mapped);
        assertTrue(PYTHON_ALLOWED_CONDITIONS.contains(mapped),
                "Condition " + condition + " mapped to " + mapped + " which is not recognized by Python schema!");
    }

    @ParameterizedTest
    @EnumSource(UserIntention.class)
    @DisplayName("Every Java UserIntention enum maps cleanly")
    void testAllJavaIntentionsMapCleanly(UserIntention intention) {
        String mapped = mapper.mapUserIntention(intention);
        assertEquals(intention.name(), mapped);
    }

    @Test
    @DisplayName("Screen condition is NOT_APPLICABLE for categories without display (e.g., CABLE, BATTERY, WASHING_MACHINE)")
    void testScreenConditionNotApplicableForPassiveDevices() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.CABLE);
        input.setDeviceAgeYears(2);
        input.setCondition(DeviceCondition.WORKING);
        input.setScreenCondition("CRACKED"); // User supplied extraneous screen text

        MLPredictRequest request = mapper.toMLRequest(input);
        assertEquals("NOT_APPLICABLE", request.getScreenCondition(),
                "Non-display categories must map screen_condition to NOT_APPLICABLE");
    }

    @Test
    @DisplayName("Screen condition preserves valid screen states for LAPTOP")
    void testScreenConditionPreservedForLaptop() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.LAPTOP);
        input.setDeviceAgeYears(5);
        input.setCondition(DeviceCondition.PARTIALLY_WORKING);
        input.setScreenCondition("CRACKED");

        MLPredictRequest request = mapper.toMLRequest(input);
        assertEquals("CRACKED", request.getScreenCondition());
    }

    @Test
    @DisplayName("Battery condition is NOT_APPLICABLE for non-battery categories (e.g., MONITOR, KEYBOARD)")
    void testBatteryConditionNotApplicableForNonBatteryDevices() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.MONITOR);
        input.setDeviceAgeYears(3);
        input.setCondition(DeviceCondition.WORKING);
        input.setBatteryCondition("DEGRADED");

        MLPredictRequest request = mapper.toMLRequest(input);
        assertEquals("NOT_APPLICABLE", request.getBatteryCondition());
    }

    @Test
    @DisplayName("Deterministic safety flags pass through accurately")
    void testSafetyFlagsPassThrough() {
        RecommendationInput input = new RecommendationInput();
        input.setCategory(EWasteCategory.MOBILE_PHONE);
        input.setDeviceAgeYears(2);
        input.setCondition(DeviceCondition.WORKING);
        input.setBatterySwollen(true);
        input.setBatteryLeaking(false);
        input.setOverheatingEvidence(true);
        input.setSeverePhysicalDamage(false);

        MLPredictRequest request = mapper.toMLRequest(input);
        assertTrue(request.getBatterySwollen());
        assertFalse(request.getBatteryLeaking());
        assertTrue(request.getOverheatingEvidence());
        assertFalse(request.getSeverePhysicalDamage());
    }
}
