package com.ewaste.management.marketplace;

import com.ewaste.management.dto.marketplace.CreateListingDraftDTO;
import com.ewaste.management.dto.marketplace.ListingApprovalDTO;
import com.ewaste.management.entity.*;
import com.ewaste.management.model.enums.*;
import com.ewaste.management.repository.*;
import com.ewaste.management.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MarketplaceApprovalWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecyclingCenterRepository recyclingCenterRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

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

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String recyclerToken;
    private String citizenToken;

    private User adminUser;
    private User techUser;
    private User citizenUser;
    private RecyclingCenter center;
    private QualityCheck passedQc;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        adminUser = userRepository.save(new User("admin_" + suffix + "@system.com", "pass", UserRole.ADMIN));
        techUser = userRepository.save(new User("tech_" + suffix + "@facility.com", "pass", UserRole.RECYCLER));
        citizenUser = userRepository.save(new User("citizen_" + suffix + "@gmail.com", "pass", UserRole.USER));

        center = new RecyclingCenter();
        center.setName("Circular Facility " + suffix);
        center.setAddress("100 Industrial Parkway");
        center.setCity("Chennai");
        center.setState("Tamil Nadu");
        center.setPostalCode("600001");
        center.setContactPhone("9876543210");
        center.setActive(true);
        center = recyclingCenterRepository.save(center);

        Recycler recycler = new Recycler();
        recycler.setUser(techUser);
        recycler.setCenter(center);
        recycler.setCompanyName("Circular Electronics Ltd");
        recycler.setLicenseNumber("CIRC-" + suffix);
        recycler.setVerificationStatus("VERIFIED");
        recyclerRepository.save(recycler);

        adminToken = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                adminUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        recyclerToken = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                techUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_RECYCLER"))));
        citizenToken = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                citizenUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        // Create complete lifecycle pipeline up to Quality Check PASS
        DisposalRequest request = new DisposalRequest();
        request.setTrackingNumber("TRK-" + suffix);
        request.setUser(citizenUser);
        request.setStatus(RequestStatus.PROCESSING);
        request.setCenter(center);
        request.setRecommendedAction(DisposalAction.REFURBISH);
        request.setPickupAddress("Secret Donor Villa 12");
        request.setPickupCity("Chennai");
        request.setPickupState("Tamil Nadu");
        request.setPickupPostalCode("600001");

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setDeviceName("ThinkPad T480");
        item.setBrand("Lenovo");
        item.setModelName("T480");
        item.setCondition(DeviceCondition.WORKING);
        request.addItem(item);
        request = disposalRequestRepository.save(request);

        DeviceAssessment assessment = new DeviceAssessment();
        assessment.setDisposalRequest(request);
        assessment.setAssessedBy(techUser);
        assessment.setPowerStatus("POWERS_ON");
        assessment.setScreenAssessment("WORKING");
        assessment.setBatteryAssessment("NORMAL");
        assessment.setPhysicalCondition("GOOD");
        assessment.setFunctionalAssessment("Keyboard responsive, battery holds charge");
        assessment.setRepairabilityStatus(RepairabilityStatus.REFURBISHABLE);
        assessment.setTechnicianDecision(TechnicianDecision.REFURBISH);
        assessment = deviceAssessmentRepository.save(assessment);

        RestorationJob job = new RestorationJob();
        job.setDisposalRequest(request);
        job.setAssessment(assessment);
        job.setAssignedTechnician(techUser);
        job.setJobType(RestorationJobType.REFURBISH);
        job.setStatus(RestorationStatus.COMPLETED);
        job.setWorkStartedAt(LocalDateTime.now().minusDays(2));
        job.setWorkCompletedAt(LocalDateTime.now().minusDays(1));
        job.setWorkPerformed("Replaced thermal paste, upgraded RAM to 16GB, cleaned fan assembly");
        job.setPartsReplaced("16GB DDR4 RAM Module, Thermal Interface Material");
        job.setPartsCost(new BigDecimal("2500.00"));
        job.setLaborCost(new BigDecimal("1000.00"));
        job.setTotalCost(new BigDecimal("3500.00"));
        job = restorationJobRepository.save(job);

        QualityCheck qc = new QualityCheck();
        qc.setRestorationJob(job);
        qc.setCheckedBy(techUser);
        qc.setFunctionalTestPassed(true);
        qc.setPowerTestPassed(true);
        qc.setDisplayTestPassed(true);
        qc.setBatteryTestPassed(true);
        qc.setSafetyTestPassed(true);
        qc.setCosmeticGrade(CosmeticGrade.GRADE_A);
        qc.setOverallResult(QualityCheckResult.PASS);
        qc.setQualityNotes("Pristine condition, passed all 48-point diagnostic tests");
        qc.setMarketplaceCandidate(true);
        passedQc = qualityCheckRepository.save(qc);
    }

    @Test
    @DisplayName("Recycler sees passed QC device in marketplace candidate list")
    void testGetMarketplaceCandidates() throws Exception {
        mockMvc.perform(get("/api/recycler/marketplace/candidates")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].qualityCheckId").value(passedQc.getId()))
                .andExpect(jsonPath("$[0].brand").value("Lenovo"))
                .andExpect(jsonPath("$[0].model").value("T480"))
                .andExpect(jsonPath("$[0].cosmeticGrade").value("GRADE_A"));
    }

    @Test
    @DisplayName("Creating draft requires explicit positive selling price (no ML price fabrication)")
    void testCreateDraftRequiresPositiveSellingPrice() throws Exception {
        CreateListingDraftDTO dto = new CreateListingDraftDTO();
        dto.setQualityCheckId(passedQc.getId());
        dto.setTitle("Refurbished ThinkPad T480");
        dto.setSellingPrice(BigDecimal.ZERO); // Invalid price

        mockMvc.perform(post("/api/recycler/marketplace/listings")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Complete listing lifecycle: Draft -> Submit -> Admin Review (Approve/Reject)")
    void testCompleteListingApprovalLifecycle() throws Exception {
        // 1. Recycler creates draft listing
        CreateListingDraftDTO createDto = new CreateListingDraftDTO();
        createDto.setQualityCheckId(passedQc.getId());
        createDto.setTitle("Refurbished Lenovo ThinkPad T480 (16GB, 512GB SSD)");
        createDto.setDescription("Professionally restored corporate laptop with 6-month certified warranty.");
        createDto.setSellingPrice(new BigDecimal("24999.00"));
        createDto.setOriginalReferencePrice(new BigDecimal("65000.00"));
        createDto.setWarrantyDays(180);
        createDto.setConditionSummary("Minor hairline scratches on lid; interior like new.");
        createDto.setImageUrls(List.of("https://images.example.com/thinkpad-front.jpg"));

        String createRes = mockMvc.perform(post("/api/recycler/marketplace/listings")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.listingStatus").value("DRAFT"))
                .andExpect(jsonPath("$.stockStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.sellingPrice").value(24999.00))
                .andExpect(jsonPath("$.cosmeticGrade").value("GRADE_A"))
                .andReturn().getResponse().getContentAsString();

        Long listingId = objectMapper.readTree(createRes).get("id").asLong();

        // 2. Recycler submits for Admin approval
        mockMvc.perform(post("/api/recycler/marketplace/listings/" + listingId + "/submit")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingStatus").value("PENDING_APPROVAL"));

        // 3. Citizen cannot review or approve listing (Access Denied)
        ListingApprovalDTO approvalDto = new ListingApprovalDTO();
        approvalDto.setApproved(true);

        mockMvc.perform(post("/api/admin/marketplace/listings/" + listingId + "/review")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDto)))
                .andExpect(status().isForbidden());

        // 4. Admin reviews and approves listing with final commercial price
        approvalDto.setApproved(true);
        approvalDto.setAdjustedSellingPrice(new BigDecimal("23999.00"));

        mockMvc.perform(post("/api/admin/marketplace/listings/" + listingId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approvalDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingStatus").value("PUBLISHED"))
                .andExpect(jsonPath("$.stockStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.sellingPrice").value(23999.00))
                .andExpect(jsonPath("$.publishedAt").exists());

        // 5. Verify listing is no longer a candidate since it already has an active listing
        mockMvc.perform(get("/api/recycler/marketplace/candidates")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Admin rejection requires mandatory reason and sets status to REJECTED")
    void testAdminRejectionWorkflow() throws Exception {
        // Create and submit draft
        CreateListingDraftDTO createDto = new CreateListingDraftDTO();
        createDto.setQualityCheckId(passedQc.getId());
        createDto.setTitle("Refurbished ThinkPad");
        createDto.setSellingPrice(new BigDecimal("25000.00"));

        String createRes = mockMvc.perform(post("/api/recycler/marketplace/listings")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long listingId = objectMapper.readTree(createRes).get("id").asLong();

        mockMvc.perform(post("/api/recycler/marketplace/listings/" + listingId + "/submit")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk());

        // Attempt rejection without reason -> fails
        ListingApprovalDTO rejectNoReason = new ListingApprovalDTO();
        rejectNoReason.setApproved(false);

        mockMvc.perform(post("/api/admin/marketplace/listings/" + listingId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectNoReason)))
                .andExpect(status().isBadRequest());

        // Rejection with reason -> succeeds
        ListingApprovalDTO rejectWithReason = new ListingApprovalDTO();
        rejectWithReason.setApproved(false);
        rejectWithReason.setRejectionReason("High selling price compared to current market benchmarks; please adjust.");

        mockMvc.perform(post("/api/admin/marketplace/listings/" + listingId + "/review")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectWithReason)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingStatus").value("REJECTED"));
    }
}
