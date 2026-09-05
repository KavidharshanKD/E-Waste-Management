package com.ewaste.management.service;

import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import org.springframework.stereotype.Component;

@Component
public class RuleBasedRecommendationEngine implements DisposalRecommendationEngine {

    public static final String ADVISORY_DISCLAIMER =
            "Notice: This automated recommendation is advisory and does not replace professional recycling facility inspection.";

    @Override
    public DisposalRecommendationResult evaluateRecommendation(RecommendationInput input) {
        if (input == null) {
            return new DisposalRecommendationResult(
                    DisposalAction.RECYCLE,
                    "Default recycling recommendation due to missing device specifications.",
                    "Hand over to certified recycling facility for environmental disposal.",
                    ADVISORY_DISCLAIMER
            );
        }

        DeviceCondition condition = input.getCondition() != null ? input.getCondition() : DeviceCondition.WORKING;
        int age = input.getDeviceAgeYears() != null ? input.getDeviceAgeYears() : 0;
        String batteryCond = input.getBatteryCondition() != null ? input.getBatteryCondition().toLowerCase() : "";
        String damageCond = input.getDamageCondition() != null ? input.getDamageCondition().toLowerCase() : "";
        EWasteCategory category = input.getCategory();

        // 1. HAZARDOUS or Swollen / Leaking Battery Check -> SPECIAL_HANDLING
        if (condition == DeviceCondition.HAZARDOUS ||
            batteryCond.contains("swollen") ||
            batteryCond.contains("leak") ||
            batteryCond.contains("hazard") ||
            batteryCond.contains("damaged") ||
            batteryCond.contains("bloated") ||
            damageCond.contains("leak") ||
            damageCond.contains("fire")) {
            
            return new DisposalRecommendationResult(
                    DisposalAction.SPECIAL_HANDLING,
                    "The device contains a swollen, leaking, or hazardous component presenting potential chemical or fire safety risks.",
                    "Do not attempt to power on, charge, or puncture the device. Place in non-conductive, insulated packaging and request specialized hazardous waste handling.",
                    ADVISORY_DISCLAIMER
            );
        }

        // 2. Working + Recent Device (age <= 3 years) -> REUSE or DONATE
        if (condition == DeviceCondition.WORKING && age <= 3) {
            if (age <= 2) {
                return new DisposalRecommendationResult(
                        DisposalAction.REUSE,
                        "The device is in working condition and relatively recent. Reusing it extends product lifecycle and preserves natural resources.",
                        "Perform a complete factory data reset and remove all personal accounts before transferring to a secondary user.",
                        ADVISORY_DISCLAIMER
                );
            } else {
                return new DisposalRecommendationResult(
                        DisposalAction.DONATE,
                        "The device is in functional working condition and suitable for donation to educational programs or community initiatives.",
                        "Wipe all personal files and clean external surfaces prior to donation.",
                        ADVISORY_DISCLAIMER
                );
            }
        }

        // 3. Working + Moderate Age (3 < age <= 5 years) -> DONATE or REFURBISH
        if (condition == DeviceCondition.WORKING && age <= 5) {
            return new DisposalRecommendationResult(
                    DisposalAction.DONATE,
                    "The device is working and retains usable secondary lifespan for community reuse.",
                    "Ensure confidential personal data is erased securely before donation.",
                    ADVISORY_DISCLAIMER
            );
        }

        // 4. Partially Working + Repairable Age (age <= 5 years) -> REPAIR or REFURBISH
        if (condition == DeviceCondition.PARTIALLY_WORKING) {
            if (age <= 3) {
                return new DisposalRecommendationResult(
                        DisposalAction.REPAIR,
                        "The device is partially working with minor repairable defects. Repairing it restores full functional utility efficiently.",
                        "Backup stored data and consult an authorized service center for component replacement.",
                        ADVISORY_DISCLAIMER
                );
            } else {
                return new DisposalRecommendationResult(
                        DisposalAction.REFURBISH,
                        "The device is partially working and contains recoverable components suitable for professional refurbishment.",
                        "Backup important files and secure fragile external parts before transport.",
                        ADVISORY_DISCLAIMER
                );
            }
        }

        // 5. Old electronics (> 5 years) or Damaged / Non-Working -> RECYCLE
        if (condition == DeviceCondition.NOT_WORKING || condition == DeviceCondition.DAMAGED || age > 5) {
            return new DisposalRecommendationResult(
                    DisposalAction.RECYCLE,
                    "The device is end-of-life or non-functional. Valuable metals and raw materials should be extracted through certified material recycling.",
                    "Separate removable cables and drop off at a certified e-waste collection center.",
                    ADVISORY_DISCLAIMER
            );
        }

        // 6. Default Fallback -> RECYCLE
        return new DisposalRecommendationResult(
                DisposalAction.RECYCLE,
                "The device meets standard end-of-life criteria for certified environmental recycling.",
                "Hand over to authorized recycling center for component recovery.",
                ADVISORY_DISCLAIMER
        );
    }
}
