package com.ewaste.management.service;

import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.technician.AssessmentResponseDTO;
import com.ewaste.management.dto.technician.CreateAssessmentDTO;
import com.ewaste.management.dto.technician.QualityCheckResponseDTO;
import com.ewaste.management.dto.technician.RestorationJobResponseDTO;
import com.ewaste.management.dto.technician.SubmitQualityCheckDTO;
import com.ewaste.management.dto.technician.UpdateRestorationProgressDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.Recycler;
import com.ewaste.management.entity.RecyclingCenter;
import com.ewaste.management.entity.RestorationJob;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.CosmeticGrade;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.QualityCheckResult;
import com.ewaste.management.model.enums.RepairabilityStatus;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.RestorationJobType;
import com.ewaste.management.model.enums.RestorationStatus;
import com.ewaste.management.model.enums.TechnicianDecision;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DeviceAssessmentRepository;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.QualityCheckRepository;
import com.ewaste.management.repository.RecyclerRepository;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.repository.RestorationJobRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TechnicianWorkflowServiceTest {

    @Autowired
    private TechnicianWorkflowService technicianWorkflowService;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private DeviceAssessmentRepository deviceAssessmentRepository;

    @Autowired
    private RestorationJobRepository restorationJobRepository;

    @Autowired
    private QualityCheckRepository qualityCheckRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

    @Autowired
    private RecyclingCenterRepository recyclingCenterRepository;

    @Autowired
    private UserRepository userRepository;

    private User customerUser;
    private User technicianUser;
    private User adminUser;
    private RecyclingCenter center1;
    private RecyclingCenter center2;
    private Recycler recyclerEntity;
    private DisposalRequest testRequest;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        customerUser = userRepository.save(new User("cust_" + suffix + "@test.com", "pass", UserRole.USER));
        technicianUser = userRepository.save(new User("tech_" + suffix + "@facility.com", "pass", UserRole.RECYCLER));
        adminUser = userRepository.save(new User("admin_" + suffix + "@facility.com", "pass", UserRole.ADMIN));

        center1 = new RecyclingCenter();
        center1.setName("Green Facility 1 " + suffix);
        center1.setAddress("123 Eco Road");
        center1.setCity("Chennai");
        center1.setState("Tamil Nadu");
        center1.setPostalCode("600001");
        center1.setContactPhone("9876543210");
        center1.setActive(true);
        center1 = recyclingCenterRepository.save(center1);

        center2 = new RecyclingCenter();
        center2.setName("Green Facility 2 " + suffix);
        center2.setAddress("456 Clean Road");
        center2.setCity("Coimbatore");
        center2.setState("Tamil Nadu");
        center2.setPostalCode("641001");
        center2.setContactPhone("9876543211");
        center2.setActive(true);
        center2 = recyclingCenterRepository.save(center2);

        recyclerEntity = new Recycler();
        recyclerEntity.setUser(technicianUser);
        recyclerEntity.setCenter(center1);
        recyclerEntity.setCompanyName("Facility 1 Center");
        recyclerEntity.setLicenseNumber("LIC-" + suffix);
        recyclerEntity.setVerificationStatus("VERIFIED");
        recyclerEntity = recyclerRepository.save(recyclerEntity);

        testRequest = new DisposalRequest();
        testRequest.setTrackingNumber("TRK-" + suffix);
        testRequest.setUser(customerUser);
        testRequest.setStatus(RequestStatus.COLLECTED);
        testRequest.setCenter(center1);
        testRequest.setRecommendedAction(DisposalAction.REPAIR);
        testRequest.setMlRawPathway("REPAIR");
        testRequest.setMlModelVersion("1.0.0");
        testRequest.setMlRecoveryProbability(0.85);
        testRequest.setMlConfidenceLevel("HIGH");
        testRequest.setMarketplaceEligibility("NOT_ASSESSED");
        testRequest.setPickupAddress("123 Test St");
        testRequest.setPickupCity("Chennai");
        testRequest.setPickupState("Tamil Nadu");
        testRequest.setPickupPostalCode("600001");

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setDeviceName("ThinkPad T480");
        item.setCondition(DeviceCondition.PARTIALLY_WORKING);
        item.setQuantity(1);
        testRequest.addItem(item);

        testRequest = disposalRequestRepository.save(testRequest);
    }

    // =========================================================================
    // PHYSICAL ASSESSMENT TESTS
    // =========================================================================

    @Test
    @DisplayName("Submit assessment with REPAIR decision queues RestorationJob in PENDING status")
    void testSubmitAssessment_RepairDecision_CreatesRestorationJob() {
        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setPowerStatus("POWERS_ON");
        dto.setScreenAssessment("MINOR_SCRATCHES");
        dto.setBatteryAssessment("FUNCTIONAL");
        dto.setPhysicalCondition("GOOD");
        dto.setFunctionalAssessment("Keyboard works, OS loads");
        dto.setDiagnosedIssues("Needs RAM upgrade and thermal paste");
        dto.setRepairabilityStatus(RepairabilityStatus.REPAIRABLE);
        dto.setTechnicianDecision(TechnicianDecision.REPAIR);
        dto.setSafetyHazardFound(false);
        dto.setRecommendedForMarketplace(true);
        dto.setAssessmentNotes("Excellent candidate for repair.");

        AssessmentResponseDTO response = technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(TechnicianDecision.REPAIR, response.getTechnicianDecision());
        assertEquals(RepairabilityStatus.REPAIRABLE, response.getRepairabilityStatus());
        assertTrue(response.getRecommendedForMarketplace());

        // Verify restoration job was automatically persisted in PENDING status
        List<RestorationJob> jobs = restorationJobRepository.findByDisposalRequestId(testRequest.getId());
        assertEquals(1, jobs.size());
        RestorationJob job = jobs.get(0);
        assertEquals(RestorationStatus.PENDING, job.getStatus());
        assertEquals(RestorationJobType.REPAIR, job.getJobType());

        // Verify request updated to PROCESSING
        DisposalRequest updatedReq = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals(RequestStatus.PROCESSING, updatedReq.getStatus());
    }

    @Test
    @DisplayName("Submit assessment with hazard detected escalates to SPECIAL_HANDLING and no job queued")
    void testSubmitAssessment_SafetyHazard_EscalatesToSpecialHandling() {
        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setPowerStatus("DOES_NOT_POWER_ON");
        dto.setScreenAssessment("CRACKED");
        dto.setBatteryAssessment("SWOLLEN");
        dto.setPhysicalCondition("SEVERE_DAMAGE");
        dto.setFunctionalAssessment("None");
        dto.setDiagnosedIssues("Punctured lithium battery detected");
        dto.setRepairabilityStatus(RepairabilityStatus.NOT_RECOVERABLE);
        dto.setTechnicianDecision(TechnicianDecision.SPECIAL_HANDLING);
        dto.setSafetyHazardFound(true);
        dto.setSafetyNotes("Hazardous swollen battery with visible puncture");
        dto.setRecommendedForMarketplace(false);

        AssessmentResponseDTO response = technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        assertNotNull(response);
        assertTrue(response.getSafetyHazardFound());

        // No restoration job should be queued for hazardous devices
        List<RestorationJob> jobs = restorationJobRepository.findByDisposalRequestId(testRequest.getId());
        assertTrue(jobs.isEmpty());

        // Recommended action must escalate to SPECIAL_HANDLING
        DisposalRequest updatedReq = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals(DisposalAction.SPECIAL_HANDLING, updatedReq.getRecommendedAction());
        assertEquals(RequestStatus.PROCESSING, updatedReq.getStatus());
        assertEquals("NOT_ASSESSED", updatedReq.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("Technician cannot assess request assigned to a different center")
    void testSubmitAssessment_RecyclerWrongCenter_ThrowsAccessDenied() {
        testRequest.setCenter(center2);
        disposalRequestRepository.save(testRequest);

        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setTechnicianDecision(TechnicianDecision.RECYCLE);

        assertThrows(AccessDeniedException.class, () ->
                technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser)
        );
    }

    private CreateAssessmentDTO createDefaultAssessmentDTO(TechnicianDecision decision, RepairabilityStatus status) {
        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setPowerStatus("POWERS_ON");
        dto.setPhysicalCondition("GOOD");
        dto.setScreenAssessment("INTACT");
        dto.setBatteryAssessment("FUNCTIONAL");
        dto.setFunctionalAssessment("TESTED_WORKING");
        dto.setDiagnosedIssues("None");
        dto.setTechnicianDecision(decision);
        dto.setRepairabilityStatus(status);
        dto.setSafetyHazardFound(false);
        dto.setRecommendedForMarketplace(true);
        dto.setAssessmentNotes("Standard test assessment.");
        return dto;
    }

    @Test
    @DisplayName("Admin can assess requests across any center")
    void testSubmitAssessment_AdminAnyCenter_Succeeds() {
        testRequest.setCenter(center2);
        disposalRequestRepository.save(testRequest);

        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.RECYCLE, RepairabilityStatus.NOT_ECONOMICALLY_RECOMMENDED);

        AssessmentResponseDTO response = technicianWorkflowService.submitAssessment(testRequest.getId(), dto, adminUser);
        assertNotNull(response);
        assertEquals(TechnicianDecision.RECYCLE, response.getTechnicianDecision());
    }

    @Test
    @DisplayName("Submitting duplicate assessment on same request throws IllegalStateException")
    void testSubmitAssessment_DuplicateAssessment_ThrowsIllegalStateException() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.DONATE, RepairabilityStatus.REPAIRABLE);

        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        // Second attempt must fail
        assertThrows(IllegalStateException.class, () ->
                technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser)
        );
    }

    @Test
    @DisplayName("Assessment submission preserves Module 6 ML audit trail pristine")
    void testSubmitAssessment_PreservesModule6MLAuditFields() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.DONATE, RepairabilityStatus.REPAIRABLE);

        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        DisposalRequest refreshed = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals("REPAIR", refreshed.getMlRawPathway());
        assertEquals("1.0.0", refreshed.getMlModelVersion());
        assertEquals(0.85, refreshed.getMlRecoveryProbability());
        assertEquals("HIGH", refreshed.getMlConfidenceLevel());
    }

    // =========================================================================
    // RESTORATION WORKFLOW TESTS
    // =========================================================================

    @Test
    @DisplayName("Start restoration transitions PENDING to IN_PROGRESS")
    void testStartRestorationJob_Success() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.REPAIR, RepairabilityStatus.REPAIRABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);

        RestorationJobResponseDTO response = technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        assertNotNull(response);
        assertEquals(RestorationStatus.IN_PROGRESS, response.getStatus());
        assertNotNull(response.getWorkStartedAt());
    }

    @Test
    @DisplayName("Cannot start a restoration job that is not PENDING")
    void testStartRestorationJob_NotInPending_ThrowsException() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.REPAIR, RepairabilityStatus.REPAIRABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        // Starting already IN_PROGRESS job must throw
        assertThrows(IllegalStateException.class, () ->
                technicianWorkflowService.startRestorationJob(job.getId(), technicianUser)
        );
    }

    @Test
    @DisplayName("Complete restoration transitions IN_PROGRESS to COMPLETED and marks request REFURBISHED")
    void testCompleteRestorationJob_Success_UpdatesDisposalRequestToRefurbished() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        UpdateRestorationProgressDTO updateDTO = new UpdateRestorationProgressDTO();
        updateDTO.setStatus(RestorationStatus.COMPLETED);
        updateDTO.setWorkPerformed("Replaced keyboard and upgraded SSD to 512GB");
        updateDTO.setPartsReplaced("Keyboard, SSD");
        updateDTO.setPartsCost(BigDecimal.valueOf(1200.00));
        updateDTO.setLaborCost(BigDecimal.valueOf(500.00));
        updateDTO.setTechnicianNotes("Restoration successful, boots fast.");

        RestorationJobResponseDTO response = technicianWorkflowService.completeRestorationJob(job.getId(), updateDTO, technicianUser);

        assertNotNull(response);
        assertEquals(RestorationStatus.COMPLETED, response.getStatus());
        assertEquals(0, response.getTotalCost().compareTo(new BigDecimal("1700.00")));

        DisposalRequest refreshed = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals(RequestStatus.REFURBISHED, refreshed.getStatus());
    }

    @Test
    @DisplayName("Completing restoration with negative cost throws IllegalArgumentException")
    void testCompleteRestorationJob_NegativeCost_ThrowsException() {
        CreateAssessmentDTO dto = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), dto, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        UpdateRestorationProgressDTO updateDTO = new UpdateRestorationProgressDTO();
        updateDTO.setStatus(RestorationStatus.COMPLETED);
        updateDTO.setPartsCost(BigDecimal.valueOf(-100));

        assertThrows(IllegalArgumentException.class, () ->
                technicianWorkflowService.completeRestorationJob(job.getId(), updateDTO, technicianUser)
        );
    }

    // =========================================================================
    // QUALITY CHECK & MARKETPLACE CANDIDATE TESTS
    // =========================================================================

    @Test
    @DisplayName("Quality check PASS on completed job flags marketplace candidate and sets review required")
    void testSubmitQualityCheck_Success_MarketplaceCandidateTrue() {
        CreateAssessmentDTO assessmentDTO = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), assessmentDTO, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        UpdateRestorationProgressDTO progressDTO = new UpdateRestorationProgressDTO();
        progressDTO.setStatus(RestorationStatus.COMPLETED);
        progressDTO.setWorkPerformed("Complete refurbishment done");
        technicianWorkflowService.completeRestorationJob(job.getId(), progressDTO, technicianUser);

        SubmitQualityCheckDTO qcDTO = new SubmitQualityCheckDTO();
        qcDTO.setFunctionalTestPassed(true);
        qcDTO.setPowerTestPassed(true);
        qcDTO.setDisplayTestPassed(true); // Required for LAPTOP
        qcDTO.setBatteryTestPassed(true); // Required for LAPTOP
        qcDTO.setSafetyTestPassed(true);
        qcDTO.setCosmeticGrade(CosmeticGrade.GRADE_A);
        qcDTO.setOverallResult(QualityCheckResult.PASS);
        qcDTO.setQualityNotes("Pristine condition, verified all tests pass.");

        QualityCheckResponseDTO qcResponse = technicianWorkflowService.submitQualityCheck(job.getId(), qcDTO, technicianUser);

        assertNotNull(qcResponse);
        assertTrue(qcResponse.getMarketplaceCandidate());
        assertEquals(CosmeticGrade.GRADE_A, qcResponse.getCosmeticGrade());

        // Option A check: marketplace candidate strictly sets TECHNICIAN_REVIEW_REQUIRED, NOT APPROVED_FOR_SALE
        DisposalRequest refreshed = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals("TECHNICIAN_REVIEW_REQUIRED", refreshed.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("Cannot perform quality check on an uncompleted job")
    void testSubmitQualityCheck_NotCompletedJob_ThrowsException() {
        CreateAssessmentDTO assessmentDTO = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), assessmentDTO, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);

        SubmitQualityCheckDTO qcDTO = new SubmitQualityCheckDTO();
        qcDTO.setOverallResult(QualityCheckResult.PASS);

        // Job is still in PENDING status
        assertThrows(IllegalStateException.class, () ->
                technicianWorkflowService.submitQualityCheck(job.getId(), qcDTO, technicianUser)
        );
    }

    @Test
    @DisplayName("Screen category (laptop) requires display test; missing throws IllegalArgumentException")
    void testSubmitQualityCheck_ScreenCategoryRequiresDisplayTest() {
        CreateAssessmentDTO assessmentDTO = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), assessmentDTO, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        UpdateRestorationProgressDTO progressDTO = new UpdateRestorationProgressDTO();
        progressDTO.setStatus(RestorationStatus.COMPLETED);
        technicianWorkflowService.completeRestorationJob(job.getId(), progressDTO, technicianUser);

        SubmitQualityCheckDTO qcDTO = new SubmitQualityCheckDTO();
        qcDTO.setDisplayTestPassed(null); // Missing required display test!
        qcDTO.setBatteryTestPassed(true);
        qcDTO.setOverallResult(QualityCheckResult.PASS);

        assertThrows(IllegalArgumentException.class, () ->
                technicianWorkflowService.submitQualityCheck(job.getId(), qcDTO, technicianUser)
        );
    }

    @Test
    @DisplayName("Failed quality check results in marketplaceCandidate=false")
    void testSubmitQualityCheck_FailedQC_NotMarketplaceCandidate() {
        CreateAssessmentDTO assessmentDTO = createDefaultAssessmentDTO(TechnicianDecision.REFURBISH, RepairabilityStatus.REFURBISHABLE);
        technicianWorkflowService.submitAssessment(testRequest.getId(), assessmentDTO, technicianUser);

        RestorationJob job = restorationJobRepository.findByDisposalRequestId(testRequest.getId()).get(0);
        technicianWorkflowService.startRestorationJob(job.getId(), technicianUser);

        UpdateRestorationProgressDTO progressDTO = new UpdateRestorationProgressDTO();
        progressDTO.setStatus(RestorationStatus.COMPLETED);
        technicianWorkflowService.completeRestorationJob(job.getId(), progressDTO, technicianUser);

        SubmitQualityCheckDTO qcDTO = new SubmitQualityCheckDTO();
        qcDTO.setFunctionalTestPassed(false);
        qcDTO.setPowerTestPassed(true);
        qcDTO.setDisplayTestPassed(true);
        qcDTO.setBatteryTestPassed(false);
        qcDTO.setSafetyTestPassed(false);
        qcDTO.setCosmeticGrade(CosmeticGrade.GRADE_C);
        qcDTO.setOverallResult(QualityCheckResult.FAIL);

        QualityCheckResponseDTO qcResponse = technicianWorkflowService.submitQualityCheck(job.getId(), qcDTO, technicianUser);

        assertNotNull(qcResponse);
        assertFalse(qcResponse.getMarketplaceCandidate());

        DisposalRequest refreshed = disposalRequestRepository.findById(testRequest.getId()).orElseThrow();
        assertEquals("NOT_ASSESSED", refreshed.getMarketplaceEligibility());
    }

    @Test
    @DisplayName("Pending assessments returns unassessed requests at technician center")
    void testGetPendingAssessments_FilterByCenterAndStatus() {
        List<DisposalRequestDTO> pending = technicianWorkflowService.getPendingAssessments(technicianUser);
        assertFalse(pending.isEmpty());
        assertEquals(testRequest.getId(), pending.get(0).getId());
    }
}
