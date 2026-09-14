package com.ewaste.management.service;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.EWasteItemDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserIntention;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.EWasteItemRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DeviceAssessmentModule1Test {

    @Autowired
    private UserEWasteService userEWasteService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private EWasteItemRepository eWasteItemRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.findByEmail("resident@ewaste.com")
                .orElseGet(() -> userRepository.save(new User("resident@ewaste.com", "password", UserRole.USER)));
    }

    @Test
    @DisplayName("Backward Compatibility: Legacy submission with null intention defaults to UNSURE")
    void testLegacySubmissionDefaultsToUnsure() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.LAPTOP);
        dto.setDeviceName("ThinkPad T480");
        dto.setBrand("Lenovo");
        dto.setApproxAgeYears(4);
        dto.setQuantity(1);
        dto.setCondition(DeviceCondition.WORKING);
        dto.setWorkingStatus("Normal functional state");
        dto.setPickupRequired(true);
        dto.setPickupAddress("45 Anna Salai");
        dto.setPickupCity("Chennai");
        dto.setPickupState("Tamil Nadu");
        dto.setPickupPostalCode("600002");
        // userIntention is left unset (or null)

        DisposalRequestDTO result = userEWasteService.createRequest(testUser.getEmail(), dto, null);

        assertNotNull(result);
        assertEquals(UserIntention.UNSURE, result.getUserIntention());

        // Verify persisted entity
        DisposalRequest persisted = disposalRequestRepository.findById(result.getId()).orElseThrow();
        assertEquals(UserIntention.UNSURE, persisted.getUserIntention());
        assertFalse(persisted.getItems().isEmpty());
        assertEquals(UserIntention.UNSURE, persisted.getItems().get(0).getUserIntention());
    }

    @ParameterizedTest
    @EnumSource(UserIntention.class)
    @DisplayName("Module 1: Submissions with each valid UserIntention succeed and persist")
    void testSubmissionsWithAllValidUserIntentions(UserIntention intention) {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.MOBILE_PHONE);
        dto.setDeviceName("Pixel 7");
        dto.setBrand("Google");
        dto.setApproxAgeYears(2);
        dto.setQuantity(1);
        dto.setCondition(DeviceCondition.WORKING);
        dto.setUserIntention(intention);
        dto.setPickupAddress("12 Cross Road");
        dto.setPickupCity("Coimbatore");
        dto.setPickupState("Tamil Nadu");
        dto.setPickupPostalCode("641001");

        DisposalRequestDTO result = userEWasteService.createRequest(testUser.getEmail(), dto, null);

        assertNotNull(result);
        assertEquals(intention, result.getUserIntention());

        // Verify DTO items mapping
        List<EWasteItemDTO> items = result.getItems();
        assertNotNull(items);
        assertEquals(1, items.size());
        assertEquals(intention, items.get(0).getUserIntention());
    }

    @Test
    @DisplayName("Module 1: Extended assessment fields persist and map correctly")
    void testExtendedAssessmentFieldsPersistAndMap() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.LAPTOP);
        dto.setDeviceName("MacBook Air M1");
        dto.setBrand("Apple");
        dto.setApproxAgeYears(3);
        dto.setQuantity(1);
        dto.setCondition(DeviceCondition.PARTIALLY_WORKING);
        dto.setUserIntention(UserIntention.REPAIR);
        dto.setPowersOn(true);
        dto.setScreenCondition("INTACT");
        dto.setBatterySwollen(false);
        dto.setBatteryLeaking(false);
        dto.setOverheatingEvidence(false);
        dto.setSeverePhysicalDamage(false);
        dto.setFunctionalIssues("Trackpad click intermittent, battery health 72%");
        dto.setPickupAddress("7th Avenue");
        dto.setPickupCity("Bengaluru");
        dto.setPickupState("Karnataka");
        dto.setPickupPostalCode("560034");

        DisposalRequestDTO result = userEWasteService.createRequest(testUser.getEmail(), dto, null);

        assertNotNull(result);
        EWasteItemDTO itemDTO = result.getItems().get(0);
        assertEquals(UserIntention.REPAIR, itemDTO.getUserIntention());
        assertTrue(itemDTO.getPowersOn());
        assertEquals("INTACT", itemDTO.getScreenCondition());
        assertFalse(itemDTO.getBatterySwollen());
        assertEquals("Trackpad click intermittent, battery health 72%", itemDTO.getFunctionalIssues());

        // Verify direct database query
        EWasteItem dbItem = eWasteItemRepository.findById(itemDTO.getId()).orElseThrow();
        assertEquals(UserIntention.REPAIR, dbItem.getUserIntention());
        assertTrue(dbItem.getPowersOn());
        assertEquals("INTACT", dbItem.getScreenCondition());
        assertEquals("Trackpad click intermittent, battery health 72%", dbItem.getFunctionalIssues());
    }

    @Test
    @DisplayName("Module 1 Safety: Battery swollen indicator forces SPECIAL_HANDLING recommendation")
    void testHazardousBatterySwollenForcesSpecialHandling() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.LAPTOP);
        dto.setDeviceName("Dell XPS 13");
        dto.setBrand("Dell");
        dto.setApproxAgeYears(2);
        dto.setQuantity(1);
        dto.setCondition(DeviceCondition.WORKING);
        dto.setUserIntention(UserIntention.KEEP_USING);
        dto.setBatterySwollen(true);
        dto.setPickupAddress("10 Ring Road");
        dto.setPickupCity("Hyderabad");
        dto.setPickupState("Telangana");
        dto.setPickupPostalCode("500001");

        DisposalRequestDTO result = userEWasteService.createRequest(testUser.getEmail(), dto, null);

        assertNotNull(result);
        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
        assertTrue(result.getRecommendationExplanation().contains("hazardous") ||
                   result.getRecommendationExplanation().contains("swollen"));
    }

    @Test
    @DisplayName("Module 1 Safety: Battery leaking indicator forces SPECIAL_HANDLING")
    void testBatteryLeakingForcesSpecialHandling() {
        CreateEWasteRequestDTO dto = new CreateEWasteRequestDTO();
        dto.setCategory(EWasteCategory.BATTERY);
        dto.setDeviceName("Li-Ion 18650 Pack");
        dto.setBrand("Generic");
        dto.setApproxAgeYears(1);
        dto.setQuantity(2);
        dto.setCondition(DeviceCondition.DAMAGED);
        dto.setUserIntention(UserIntention.RECYCLE);
        dto.setBatteryLeaking(true);
        dto.setPickupAddress("22 MG Road");
        dto.setPickupCity("Pune");
        dto.setPickupState("Maharashtra");
        dto.setPickupPostalCode("411001");

        DisposalRequestDTO result = userEWasteService.createRequest(testUser.getEmail(), dto, null);

        assertNotNull(result);
        assertEquals(DisposalAction.SPECIAL_HANDLING, result.getRecommendedAction());
    }

    @Test
    @DisplayName("Module 1: updateRequest preserves and updates intention and assessment attributes")
    void testUpdateRequestUpdatesIntentionAndAssessment() {
        CreateEWasteRequestDTO initialDto = new CreateEWasteRequestDTO();
        initialDto.setCategory(EWasteCategory.TELEVISION);
        initialDto.setDeviceName("Sony Bravia 55");
        initialDto.setBrand("Sony");
        initialDto.setApproxAgeYears(4);
        initialDto.setQuantity(1);
        initialDto.setCondition(DeviceCondition.WORKING);
        initialDto.setUserIntention(UserIntention.DONATE);
        initialDto.setPickupAddress("10 Palm Grove");
        initialDto.setPickupCity("Kochi");
        initialDto.setPickupState("Kerala");
        initialDto.setPickupPostalCode("682001");

        DisposalRequestDTO created = userEWasteService.createRequest(testUser.getEmail(), initialDto, null);
        assertEquals(UserIntention.DONATE, created.getUserIntention());

        // Update intention to REFURBISH_AND_SELL and set functionalIssues
        initialDto.setUserIntention(UserIntention.REFURBISH_AND_SELL);
        initialDto.setFunctionalIssues("Remote sensor slow to respond");
        initialDto.setScreenCondition("INTACT");

        DisposalRequestDTO updated = userEWasteService.updateRequest(testUser.getEmail(), created.getId(), initialDto, null);

        assertEquals(UserIntention.REFURBISH_AND_SELL, updated.getUserIntention());
        assertEquals("Remote sensor slow to respond", updated.getItems().get(0).getFunctionalIssues());
        assertEquals("INTACT", updated.getItems().get(0).getScreenCondition());
    }
}
