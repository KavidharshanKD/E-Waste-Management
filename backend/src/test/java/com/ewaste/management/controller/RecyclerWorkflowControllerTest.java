package com.ewaste.management.controller;

import com.ewaste.management.dto.technician.CreateAssessmentDTO;
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
import com.ewaste.management.model.enums.RestorationStatus;
import com.ewaste.management.model.enums.TechnicianDecision;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.RecyclerRepository;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.repository.RestorationJobRepository;
import com.ewaste.management.repository.UserRepository;
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
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RecyclerWorkflowControllerTest {

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
    private RestorationJobRepository restorationJobRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String recyclerToken;
    private String userToken;
    private User techUser;
    private User citizenUser;
    private RecyclingCenter center;
    private DisposalRequest request;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        techUser = userRepository.save(new User("tech_" + suffix + "@facility.com", "pass", UserRole.RECYCLER));
        citizenUser = userRepository.save(new User("user_" + suffix + "@test.com", "pass", UserRole.USER));

        center = new RecyclingCenter();
        center.setName("Green Center " + suffix);
        center.setAddress("789 Facility Lane");
        center.setCity("Chennai");
        center.setState("Tamil Nadu");
        center.setPostalCode("600001");
        center.setContactPhone("9876543210");
        center.setActive(true);
        center = recyclingCenterRepository.save(center);

        Recycler recycler = new Recycler();
        recycler.setUser(techUser);
        recycler.setCenter(center);
        recycler.setCompanyName("Green Recyclers Ltd");
        recycler.setLicenseNumber("REC-" + suffix);
        recycler.setVerificationStatus("VERIFIED");
        recyclerRepository.save(recycler);

        recyclerToken = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                techUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_RECYCLER"))));
        userToken = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                citizenUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));

        request = new DisposalRequest();
        request.setTrackingNumber("TRK-" + suffix);
        request.setUser(citizenUser);
        request.setStatus(RequestStatus.COLLECTED);
        request.setCenter(center);
        request.setRecommendedAction(DisposalAction.REPAIR);
        request.setPickupAddress("456 Customer Road");
        request.setPickupCity("Chennai");
        request.setPickupState("Tamil Nadu");
        request.setPickupPostalCode("600001");

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setDeviceName("ThinkPad L480");
        item.setCondition(DeviceCondition.PARTIALLY_WORKING);
        item.setQuantity(1);
        request.addItem(item);

        request = disposalRequestRepository.save(request);
    }

    @Test
    @DisplayName("GET /api/recycler/requests/pending-assessment returns pending devices")
    void testGetPendingAssessments() throws Exception {
        mockMvc.perform(get("/api/recycler/requests/pending-assessment")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].trackingNumber").value(request.getTrackingNumber()));
    }

    @Test
    @DisplayName("POST /api/recycler/requests/{id}/assessment creates assessment and queues restoration")
    void testSubmitAssessment_Success() throws Exception {
        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setPowerStatus("POWERS_ON");
        dto.setPhysicalCondition("GOOD");
        dto.setScreenAssessment("INTACT");
        dto.setBatteryAssessment("FUNCTIONAL");
        dto.setFunctionalAssessment("TESTED_WORKING");
        dto.setDiagnosedIssues("None");
        dto.setTechnicianDecision(TechnicianDecision.REPAIR);
        dto.setRepairabilityStatus(RepairabilityStatus.REPAIRABLE);
        dto.setSafetyHazardFound(false);
        dto.setRecommendedForMarketplace(true);
        dto.setAssessmentNotes("Excellent physical condition.");

        mockMvc.perform(post("/api/recycler/requests/" + request.getId() + "/assessment")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.technicianDecision").value("REPAIR"))
                .andExpect(jsonPath("$.repairabilityStatus").value("REPAIRABLE"));
    }

    @Test
    @DisplayName("GET /api/recycler/requests/{id}/assessment retrieves existing assessment")
    void testGetAssessment_Success() throws Exception {
        CreateAssessmentDTO dto = new CreateAssessmentDTO();
        dto.setPowerStatus("POWERS_ON");
        dto.setPhysicalCondition("GOOD");
        dto.setScreenAssessment("INTACT");
        dto.setBatteryAssessment("FUNCTIONAL");
        dto.setFunctionalAssessment("TESTED_WORKING");
        dto.setDiagnosedIssues("None");
        dto.setTechnicianDecision(TechnicianDecision.DONATE);
        dto.setRepairabilityStatus(RepairabilityStatus.REPAIRABLE);
        dto.setSafetyHazardFound(false);

        mockMvc.perform(post("/api/recycler/requests/" + request.getId() + "/assessment")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/recycler/requests/" + request.getId() + "/assessment")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technicianDecision").value("DONATE"));
    }

    @Test
    @DisplayName("Restoration lifecycle: list, start, complete, and quality-check")
    void testRestorationWorkflowLifecycle() throws Exception {
        // 1. Submit assessment with REFURBISH decision
        CreateAssessmentDTO assessmentDTO = new CreateAssessmentDTO();
        assessmentDTO.setPowerStatus("POWERS_ON");
        assessmentDTO.setPhysicalCondition("GOOD");
        assessmentDTO.setScreenAssessment("INTACT");
        assessmentDTO.setBatteryAssessment("FUNCTIONAL");
        assessmentDTO.setFunctionalAssessment("TESTED_WORKING");
        assessmentDTO.setDiagnosedIssues("Keyboard wear");
        assessmentDTO.setTechnicianDecision(TechnicianDecision.REFURBISH);
        assessmentDTO.setRepairabilityStatus(RepairabilityStatus.REFURBISHABLE);
        assessmentDTO.setSafetyHazardFound(false);
        assessmentDTO.setRecommendedForMarketplace(true);

        mockMvc.perform(post("/api/recycler/requests/" + request.getId() + "/assessment")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assessmentDTO)))
                .andExpect(status().isCreated());

        // 2. List restoration jobs
        RestorationJob job = restorationJobRepository.findByDisposalRequestId(request.getId()).get(0);
        mockMvc.perform(get("/api/recycler/restorations")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(job.getId()))
                .andExpect(jsonPath("$[0].status").value("PENDING"));

        // 3. Start restoration job
        mockMvc.perform(patch("/api/recycler/restorations/" + job.getId() + "/start")
                        .header("Authorization", "Bearer " + recyclerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // 4. Complete restoration job
        UpdateRestorationProgressDTO progressDTO = new UpdateRestorationProgressDTO();
        progressDTO.setStatus(RestorationStatus.COMPLETED);
        progressDTO.setWorkPerformed("Replaced keyboard, installed fresh SSD");
        progressDTO.setPartsReplaced("Keyboard, 512GB SSD");
        progressDTO.setPartsCost(BigDecimal.valueOf(1500.00));
        progressDTO.setLaborCost(BigDecimal.valueOf(500.00));

        mockMvc.perform(patch("/api/recycler/restorations/" + job.getId() + "/complete")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(progressDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // 5. Submit Quality Check
        SubmitQualityCheckDTO qcDTO = new SubmitQualityCheckDTO();
        qcDTO.setFunctionalTestPassed(true);
        qcDTO.setPowerTestPassed(true);
        qcDTO.setDisplayTestPassed(true);
        qcDTO.setBatteryTestPassed(true);
        qcDTO.setSafetyTestPassed(true);
        qcDTO.setCosmeticGrade(CosmeticGrade.GRADE_A);
        qcDTO.setOverallResult(QualityCheckResult.PASS);
        qcDTO.setQualityNotes("Pristine quality after complete refurbishment.");

        mockMvc.perform(post("/api/recycler/restorations/" + job.getId() + "/quality-check")
                        .header("Authorization", "Bearer " + recyclerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(qcDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.overallResult").value("PASS"))
                .andExpect(jsonPath("$.marketplaceCandidate").value(true));
    }

    @Test
    @DisplayName("Unauthorized role (USER) accessing /api/recycler/** receives 403 Forbidden")
    void testUnauthorizedRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/recycler/requests/pending-assessment")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
