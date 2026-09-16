package com.ewaste.management.service;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RecommendationSource;
import com.ewaste.management.model.enums.UserIntention;
import com.ewaste.management.repository.DisposalRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MLIntegrationPersistenceTest {

    @Autowired
    private UserEWasteService userEWasteService;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private com.ewaste.management.repository.UserRepository userRepository;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        userRepository.findByEmail("resident@ewaste.com")
                .orElseGet(() -> userRepository.save(new com.ewaste.management.entity.User("resident@ewaste.com", "password", com.ewaste.management.model.enums.UserRole.USER)));
    }

    @Test
    @DisplayName("Safety hazard submission persists SAFETY_RULE recommendation source and audit flags")
    void testHazardousSubmissionPersistsSafetyAudit() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.MOBILE_PHONE);
        dto.setDeviceName("Hazardous Battery Phone");
        dto.setBrand("Samsung");
        dto.setApproxAgeYears(2);
        dto.setCondition(DeviceCondition.WORKING);
        dto.setUserIntention(UserIntention.REPAIR);
        dto.setBatterySwollen(true); // Hazardous trigger!
        dto.setPickupAddress("123 Hazardous St");
        dto.setPickupCity("Chennai");
        dto.setPickupState("Tamil Nadu");
        dto.setPickupPostalCode("600001");

        DisposalRequestDTO created = userEWasteService.createRequest("resident@ewaste.com", dto, null);

        assertNotNull(created.getId());
        assertEquals(DisposalAction.SPECIAL_HANDLING, created.getRecommendedAction());
        assertEquals(RecommendationSource.SAFETY_RULE, created.getRecommendationSource());

        DisposalRequest entity = disposalRequestRepository.findById(created.getId()).orElseThrow();
        assertEquals(RecommendationSource.SAFETY_RULE, entity.getRecommendationSource());
        assertEquals("SPECIAL_HANDLING", entity.getMlDisplayRecommendation());
        assertTrue(entity.getTechnicianReviewRequired());
        assertEquals("NOT_ASSESSED", entity.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("When ML service is offline, fallback audit is persisted seamlessly without crashing request")
    void testOfflineFallbackAuditPersisted() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.LAPTOP);
        dto.setDeviceName("Office Laptop 5yr");
        dto.setBrand("Dell");
        dto.setApproxAgeYears(5);
        dto.setCondition(DeviceCondition.PARTIALLY_WORKING);
        dto.setUserIntention(UserIntention.REPAIR);
        dto.setPowersOn(true);
        dto.setScreenCondition("CRACKED");
        dto.setPickupAddress("456 Fallback Ave");
        dto.setPickupCity("Bangalore");
        dto.setPickupState("Karnataka");
        dto.setPickupPostalCode("560001");

        DisposalRequestDTO created = userEWasteService.createRequest("resident@ewaste.com", dto, null);

        assertNotNull(created.getId());
        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, created.getRecommendationSource());
        assertEquals(DisposalAction.REFURBISH, created.getRecommendedAction());

        DisposalRequest entity = disposalRequestRepository.findById(created.getId()).orElseThrow();
        assertEquals(RecommendationSource.RULE_BASED_FALLBACK, entity.getRecommendationSource());
        assertNotNull(entity.getRecommendationExplanation());
        assertEquals("NOT_ASSESSED", entity.getMarketplaceEligibility());
    }
}
