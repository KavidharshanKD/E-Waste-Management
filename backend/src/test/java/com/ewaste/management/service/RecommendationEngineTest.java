package com.ewaste.management.service;

import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RecommendationEngineTest {

    private DisposalRecommendationEngine recommendationEngine;

    @BeforeEach
    void setUp() {
        recommendationEngine = new RuleBasedRecommendationEngine();
    }

    @Test
    @DisplayName("Swollen or damaged battery triggers SPECIAL_HANDLING recommendation")
    void testHazardousBatteryTriggersSpecialHandling() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.MOBILE_PHONE,
                2,
                DeviceCondition.WORKING,
                "Working screen",
                "None",
                "Swollen battery"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("swollen"));
        assertNotNull(result.getHandlingAdvice());
        assertTrue(result.getDisclaimer().contains("advisory"));
    }

    @Test
    @DisplayName("Hazardous device condition triggers SPECIAL_HANDLING recommendation")
    void testHazardousConditionTriggersSpecialHandling() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.BATTERY,
                1,
                DeviceCondition.HAZARDOUS,
                "Non-functional",
                "Severe corrosion",
                "Normal"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertNotNull(result.getHandlingAdvice());
    }

    @Test
    @DisplayName("Recent working device (age <= 2 years) recommends REUSE")
    void testRecentWorkingDeviceRecommendsReuse() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.LAPTOP,
                1,
                DeviceCondition.WORKING,
                "Fully functional",
                "Minor scratches",
                "Normal"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.REUSE, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("working condition"));
        assertTrue(result.getHandlingAdvice().contains("factory data reset"));
    }

    @Test
    @DisplayName("Working device aged 3 years recommends DONATE")
    void testWorkingDeviceAged3YearsRecommendsDonate() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.MONITOR,
                3,
                DeviceCondition.WORKING,
                "Functional display",
                "None",
                "N/A"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.DONATE, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("donation"));
    }

    @Test
    @DisplayName("Partially working recent device (age <= 3 years) recommends REPAIR")
    void testPartiallyWorkingRecentDeviceRecommendsRepair() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.MOBILE_PHONE,
                2,
                DeviceCondition.PARTIALLY_WORKING,
                "Touchscreen issue",
                "Cracked glass",
                "Normal"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.REPAIR, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("repairable"));
    }

    @Test
    @DisplayName("Partially working device (age 4 years) recommends REFURBISH")
    void testPartiallyWorkingOlderDeviceRecommendsRefurbish() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.LAPTOP,
                4,
                DeviceCondition.PARTIALLY_WORKING,
                "Degraded battery performance",
                "Minor scuffs",
                "Normal"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.REFURBISH, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("refurbishment"));
    }

    @Test
    @DisplayName("Old non-working device (age 7 years) recommends RECYCLE")
    void testOldNonWorkingDeviceRecommendsRecycle() {
        RecommendationInput input = new RecommendationInput(
                EWasteCategory.TELEVISION,
                7,
                DeviceCondition.NOT_WORKING,
                "Power supply failed",
                "Heavy physical wear",
                "N/A"
        );

        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(input);

        assertEquals(DisposalAction.RECYCLE, result.getRecommendedAction());
        assertTrue(result.getExplanation().contains("recycling"));
    }

    @Test
    @DisplayName("Null input handles gracefully with default RECYCLE recommendation")
    void testNullInputHandling() {
        DisposalRecommendationResult result = recommendationEngine.evaluateRecommendation(null);

        assertNotNull(result);
        assertEquals(DisposalAction.RECYCLE, result.getRecommendedAction());
        assertNotNull(result.getDisclaimer());
    }
}
