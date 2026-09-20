package com.ewaste.management.marketplace;

import com.ewaste.management.entity.*;
import com.ewaste.management.model.enums.*;
import com.ewaste.management.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MarketplaceCatalogAndPrivacyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecyclingCenterRepository recyclingCenterRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private DeviceAssessmentRepository deviceAssessmentRepository;

    @Autowired
    private RestorationJobRepository restorationJobRepository;

    @Autowired
    private QualityCheckRepository qualityCheckRepository;

    @Autowired
    private MarketplaceListingRepository marketplaceListingRepository;

    private MarketplaceListing publishedLaptop;
    private MarketplaceListing publishedPhone;
    private User citizenDonor;
    private String secretDonorAddress;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        User adminUser = userRepository.save(new User("admin_" + suffix + "@system.com", "pass", UserRole.ADMIN));
        User techUser = userRepository.save(new User("tech_" + suffix + "@facility.com", "pass", UserRole.RECYCLER));

        citizenDonor = new User("donor_" + suffix + "@private.org", "pass", UserRole.USER);
        UserProfile profile = new UserProfile();
        profile.setFirstName("John");
        profile.setLastName("Sensitive Donor");
        profile.setPhoneNumber("9998887776");
        citizenDonor.setProfile(profile);
        citizenDonor = userRepository.save(citizenDonor);

        RecyclingCenter center = new RecyclingCenter();
        center.setName("EcoRestore Hub " + suffix);
        center.setAddress("500 Circular Way");
        center.setCity("Bengaluru");
        center.setState("Karnataka");
        center.setPostalCode("560001");
        center.setContactPhone("9876543210");
        center.setActive(true);
        center = recyclingCenterRepository.save(center);

        secretDonorAddress = "Apartment 404, Confidential Residency, Bengaluru";

        // Create Request 1 (Laptop)
        DisposalRequest req1 = new DisposalRequest();
        req1.setTrackingNumber("TRK-LAP-" + suffix);
        req1.setUser(citizenDonor);
        req1.setStatus(RequestStatus.PROCESSING);
        req1.setCenter(center);
        req1.setRecommendedAction(DisposalAction.REFURBISH);
        req1.setPickupAddress(secretDonorAddress);
        req1.setPickupCity("Bengaluru");
        req1.setPickupState("Karnataka");
        req1.setPickupPostalCode("560001");

        EWasteItem item1 = new EWasteItem();
        item1.setCategory(EWasteCategory.LAPTOP);
        item1.setDeviceName("Dell XPS 13");
        item1.setBrand("Dell");
        item1.setModelName("XPS 9380");
        item1.setCondition(DeviceCondition.WORKING);
        req1.addItem(item1);
        req1 = disposalRequestRepository.save(req1);

        DeviceAssessment da1 = new DeviceAssessment();
        da1.setDisposalRequest(req1);
        da1.setAssessedBy(techUser);
        da1.setPowerStatus("POWERS_ON");
        da1.setPhysicalCondition("GOOD");
        da1.setRepairabilityStatus(RepairabilityStatus.REFURBISHABLE);
        da1.setTechnicianDecision(TechnicianDecision.REFURBISH);
        da1 = deviceAssessmentRepository.save(da1);

        RestorationJob job1 = new RestorationJob();
        job1.setDisposalRequest(req1);
        job1.setAssessment(da1);
        job1.setAssignedTechnician(techUser);
        job1.setJobType(RestorationJobType.REFURBISH);
        job1.setStatus(RestorationStatus.COMPLETED);
        job1.setWorkCompletedAt(LocalDateTime.now().minusDays(3));
        job1.setWorkPerformed("Installed new genuine Dell battery, thermal refresh");
        job1.setPartsReplaced("Original Dell 52Wh Battery");
        job1 = restorationJobRepository.save(job1);

        QualityCheck qc1 = new QualityCheck();
        qc1.setRestorationJob(job1);
        qc1.setCheckedBy(techUser);
        qc1.setFunctionalTestPassed(true);
        qc1.setPowerTestPassed(true);
        qc1.setDisplayTestPassed(true);
        qc1.setBatteryTestPassed(true);
        qc1.setSafetyTestPassed(true);
        qc1.setCosmeticGrade(CosmeticGrade.GRADE_A);
        qc1.setOverallResult(QualityCheckResult.PASS);
        qc1.setMarketplaceCandidate(true);
        qc1 = qualityCheckRepository.save(qc1);

        publishedLaptop = new MarketplaceListing();
        publishedLaptop.setDisposalRequest(req1);
        publishedLaptop.setEwasteItem(item1);
        publishedLaptop.setQualityCheck(qc1);
        publishedLaptop.setRestorationJob(job1);
        publishedLaptop.setRecyclingCenter(center);
        publishedLaptop.setTitle("Certified Refurbished Dell XPS 13 9380");
        publishedLaptop.setDescription("Ultra-thin professional notebook in excellent condition.");
        publishedLaptop.setCategory(EWasteCategory.LAPTOP);
        publishedLaptop.setBrand("Dell");
        publishedLaptop.setModel("XPS 9380");
        publishedLaptop.setCosmeticGrade(CosmeticGrade.GRADE_A);
        publishedLaptop.setSellingPrice(new BigDecimal("32999.00"));
        publishedLaptop.setOriginalReferencePrice(new BigDecimal("85000.00"));
        publishedLaptop.setWarrantyDays(180);
        publishedLaptop.setStockStatus(MarketplaceStockStatus.AVAILABLE);
        publishedLaptop.setListingStatus(MarketplaceListingStatus.PUBLISHED);
        publishedLaptop.setApprovedBy(adminUser);
        publishedLaptop.setApprovedAt(LocalDateTime.now().minusDays(1));
        publishedLaptop.setPublishedAt(LocalDateTime.now().minusDays(1));
        publishedLaptop.addImage(new MarketplaceListingImage(publishedLaptop, "https://example.com/xps13.jpg", 0, true));
        publishedLaptop = marketplaceListingRepository.save(publishedLaptop);

        // Create Request 2 (Mobile Phone)
        DisposalRequest req2 = new DisposalRequest();
        req2.setTrackingNumber("TRK-PHN-" + suffix);
        req2.setUser(citizenDonor);
        req2.setStatus(RequestStatus.PROCESSING);
        req2.setCenter(center);
        req2.setRecommendedAction(DisposalAction.REPAIR);
        req2.setPickupAddress(secretDonorAddress);
        req2.setPickupCity("Bengaluru");
        req2.setPickupState("Karnataka");
        req2.setPickupPostalCode("560001");

        EWasteItem item2 = new EWasteItem();
        item2.setCategory(EWasteCategory.MOBILE_PHONE);
        item2.setDeviceName("Pixel 6a");
        item2.setBrand("Google");
        item2.setModelName("Pixel 6a");
        item2.setCondition(DeviceCondition.PARTIALLY_WORKING);
        req2.addItem(item2);
        req2 = disposalRequestRepository.save(req2);

        DeviceAssessment da2 = new DeviceAssessment();
        da2.setDisposalRequest(req2);
        da2.setAssessedBy(techUser);
        da2.setPowerStatus("POWERS_ON");
        da2.setPhysicalCondition("FAIR");
        da2.setRepairabilityStatus(RepairabilityStatus.REPAIRABLE);
        da2.setTechnicianDecision(TechnicianDecision.REPAIR);
        da2 = deviceAssessmentRepository.save(da2);

        RestorationJob job2 = new RestorationJob();
        job2.setDisposalRequest(req2);
        job2.setAssessment(da2);
        job2.setAssignedTechnician(techUser);
        job2.setJobType(RestorationJobType.REPAIR);
        job2.setStatus(RestorationStatus.COMPLETED);
        job2.setWorkCompletedAt(LocalDateTime.now().minusDays(2));
        job2.setWorkPerformed("Replaced cracked OLED screen with OEM grade panel");
        job2.setPartsReplaced("6.1-inch OLED Display");
        job2 = restorationJobRepository.save(job2);

        QualityCheck qc2 = new QualityCheck();
        qc2.setRestorationJob(job2);
        qc2.setCheckedBy(techUser);
        qc2.setFunctionalTestPassed(true);
        qc2.setPowerTestPassed(true);
        qc2.setDisplayTestPassed(true);
        qc2.setBatteryTestPassed(true);
        qc2.setSafetyTestPassed(true);
        qc2.setCosmeticGrade(CosmeticGrade.GRADE_B);
        qc2.setOverallResult(QualityCheckResult.PASS);
        qc2.setMarketplaceCandidate(true);
        qc2 = qualityCheckRepository.save(qc2);

        publishedPhone = new MarketplaceListing();
        publishedPhone.setDisposalRequest(req2);
        publishedPhone.setEwasteItem(item2);
        publishedPhone.setQualityCheck(qc2);
        publishedPhone.setRestorationJob(job2);
        publishedPhone.setRecyclingCenter(center);
        publishedPhone.setTitle("Restored Google Pixel 6a (Charcoal)");
        publishedPhone.setDescription("OLED replaced, 100% functional test passed.");
        publishedPhone.setCategory(EWasteCategory.MOBILE_PHONE);
        publishedPhone.setBrand("Google");
        publishedPhone.setModel("Pixel 6a");
        publishedPhone.setCosmeticGrade(CosmeticGrade.GRADE_B);
        publishedPhone.setSellingPrice(new BigDecimal("14500.00"));
        publishedPhone.setOriginalReferencePrice(new BigDecimal("31000.00"));
        publishedPhone.setWarrantyDays(90);
        publishedPhone.setStockStatus(MarketplaceStockStatus.AVAILABLE);
        publishedPhone.setListingStatus(MarketplaceListingStatus.PUBLISHED);
        publishedPhone.setApprovedBy(adminUser);
        publishedPhone.setApprovedAt(LocalDateTime.now().minusDays(1));
        publishedPhone.setPublishedAt(LocalDateTime.now().minusDays(1));
        publishedPhone.addImage(new MarketplaceListingImage(publishedPhone, "https://example.com/pixel6a.jpg", 0, true));
        publishedPhone = marketplaceListingRepository.save(publishedPhone);
    }

    @Test
    @DisplayName("Public unauthenticated access to browse published catalog with search and filters")
    void testPublicCatalogBrowsingAndFilters() throws Exception {
        // 1. Browsing all published listings without any auth header
        mockMvc.perform(get("/api/marketplace/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));

        // 2. Filter by Category: LAPTOP
        mockMvc.perform(get("/api/marketplace/listings?category=LAPTOP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].brand").value("Dell"));

        // 3. Filter by Brand: Google
        mockMvc.perform(get("/api/marketplace/listings?brand=google"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].category").value("MOBILE_PHONE"));

        // 4. Filter by Cosmetic Grade: GRADE_A
        mockMvc.perform(get("/api/marketplace/listings?cosmeticGrade=GRADE_A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].cosmeticGrade").value("GRADE_A"));

        // 5. Filter by Price Range: 10000 - 20000
        mockMvc.perform(get("/api/marketplace/listings?minPrice=10000&maxPrice=20000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].sellingPrice").value(14500.00));

        // 6. Full-text search query
        mockMvc.perform(get("/api/marketplace/listings?query=XPS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].model").value("XPS 9380"));
    }

    @Test
    @DisplayName("STRICT PRIVACY VERIFICATION: Public listing details and circular journey omit all donor PII")
    void testPrivacyStrictZeroDonorPII() throws Exception {
        // 1. Inspect Listing Detail JSON
        String detailJson = mockMvc.perform(get("/api/marketplace/listings/" + publishedLaptop.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Certified Refurbished Dell XPS 13 9380"))
                .andExpect(jsonPath("$.centerName").exists())
                .andExpect(jsonPath("$.deviceJourney.events", hasSize(greaterThanOrEqualTo(4))))
                .andReturn().getResponse().getContentAsString();

        // Privacy Assertion: No citizen name, email, phone, or home address
        assertFalse(detailJson.contains(citizenDonor.getFullName()), "Detail JSON exposed donor full name!");
        assertFalse(detailJson.contains(citizenDonor.getEmail()), "Detail JSON exposed donor email!");
        assertFalse(detailJson.contains(citizenDonor.getPhoneNumber()), "Detail JSON exposed donor phone!");
        assertFalse(detailJson.contains(secretDonorAddress), "Detail JSON exposed donor pickup address!");

        // 2. Inspect Standalone Device Journey Endpoint
        String journeyJson = mockMvc.perform(get("/api/marketplace/listings/" + publishedLaptop.getId() + "/journey"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.events", hasSize(greaterThanOrEqualTo(4))))
                .andReturn().getResponse().getContentAsString();

        assertFalse(journeyJson.contains(citizenDonor.getFullName()), "Journey JSON exposed donor full name!");
        assertFalse(journeyJson.contains(citizenDonor.getEmail()), "Journey JSON exposed donor email!");
        assertFalse(journeyJson.contains(citizenDonor.getPhoneNumber()), "Journey JSON exposed donor phone!");
        assertFalse(journeyJson.contains(secretDonorAddress), "Journey JSON exposed donor pickup address!");
    }
}
