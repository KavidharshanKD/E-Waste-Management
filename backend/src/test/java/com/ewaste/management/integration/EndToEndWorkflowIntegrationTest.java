package com.ewaste.management.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ewaste.management.dto.AssignCollectorRequestDTO;
import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.LoginRequest;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.dto.SchedulePickupRequestDTO;
import com.ewaste.management.dto.UpdatePickupStatusDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.Pickup;
import com.ewaste.management.entity.RecyclingCertificate;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.PickupStatus;
import com.ewaste.management.model.enums.PickupTimeSlot;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.model.enums.UserType;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;
import com.ewaste.management.repository.RecyclingCertificateRepository;
import com.ewaste.management.repository.RewardTransactionRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class EndToEndWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private PickupRepository pickupRepository;

    @Autowired
    private RewardTransactionRepository rewardTransactionRepository;

    @Autowired
    private RecyclingCertificateRepository certificateRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private User adminUser;
    private User collectorUser;

    @BeforeEach
    void setUpSeedUsers() {
        adminUser = userRepository.findByEmail("admin@ewaste.com")
                .orElseGet(() -> new User("admin@ewaste.com", passwordEncoder.encode("admin123"), UserRole.ADMIN));
        adminUser.setPassword(passwordEncoder.encode("admin123"));
        adminUser = userRepository.save(adminUser);

        collectorUser = userRepository.findByEmail("collector@ewaste.com")
                .orElseGet(() -> new User("collector@ewaste.com", passwordEncoder.encode("collector123"), UserRole.COLLECTOR));
        collectorUser.setPassword(passwordEncoder.encode("collector123"));
        collectorUser = userRepository.save(collectorUser);
    }

    @Test
    @DisplayName("Complete E2E Lifecycle: Register -> Login -> Submit -> Recommend -> Pickup -> Approve -> Collect -> Complete -> Points -> Certificate")
    void testCompleteEWasteLifecycleWorkflow() throws Exception {
        // 1. REGISTER CITIZEN USER
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("workflow_citizen@example.com");
        registerRequest.setPassword("securePass123");
        registerRequest.setFullName("Karthik Raja");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setCity("Bengaluru");
        registerRequest.setState("Karnataka");
        registerRequest.setPincode("560001");
        registerRequest.setRole(UserRole.USER);
        registerRequest.setUserType(UserType.INDIVIDUAL);

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("workflow_citizen@example.com")))
                .andReturn();

        String citizenToken = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("accessToken").asText();

        // 2. LOGIN CITIZEN USER
        LoginRequest loginRequest = new LoginRequest("workflow_citizen@example.com", "securePass123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andReturn();

        citizenToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("accessToken").asText();

        // 3. SUBMIT E-WASTE REQUEST
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.LAPTOP);
        createDTO.setDeviceName("Dell XPS 15");
        createDTO.setBrand("Dell");
        createDTO.setCondition(DeviceCondition.WORKING);
        createDTO.setWorkingStatus("Fully Working");
        createDTO.setApproxAgeYears(3);
        createDTO.setQuantity(2);
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("123 Indiranagar 100ft Road");
        createDTO.setPickupCity("Bengaluru");
        createDTO.setPickupState("Karnataka");
        createDTO.setPickupPostalCode("560038");
        createDTO.setDescription("Good condition laptop suitable for reuse or donation.");

        MvcResult submitResult = mockMvc.perform(post("/api/user/ewaste")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.trackingNumber", startsWith("EW-2026-")))
                .andExpect(jsonPath("$.status", is("SUBMITTED")))
                .andExpect(jsonPath("$.recommendedAction", notNullValue()))
                .andReturn();

        Long requestId = objectMapper.readTree(submitResult.getResponse().getContentAsString()).get("id").asLong();
        String trackingNumber = objectMapper.readTree(submitResult.getResponse().getContentAsString()).get("trackingNumber").asText();

        // 4. VERIFY PUBLIC TRACKING & SMART RECOMMENDATION
        mockMvc.perform(get("/api/public/track/" + trackingNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trackingNumber", is(trackingNumber)))
                .andExpect(jsonPath("$.status", is("SUBMITTED")))
                .andExpect(jsonPath("$.category", is("LAPTOP")))
                .andExpect(jsonPath("$.processingStage", notNullValue()));

        // 5. SCHEDULE DOORSTEP PICKUP
        SchedulePickupRequestDTO scheduleDTO = new SchedulePickupRequestDTO();
        scheduleDTO.setDisposalRequestId(requestId);
        scheduleDTO.setPreferredDate(LocalDateTime.now().plusDays(2));
        scheduleDTO.setPreferredTimeSlot(PickupTimeSlot.MORNING);
        scheduleDTO.setPickupAddress("123 Indiranagar 100ft Road");
        scheduleDTO.setContactNumber("9876543210");
        scheduleDTO.setNotes("Please call before arriving");

        MvcResult pickupResult = mockMvc.perform(post("/api/user/pickups")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scheduleDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status", is("SCHEDULED")))
                .andReturn();

        Long pickupId = objectMapper.readTree(pickupResult.getResponse().getContentAsString()).get("id").asLong();

        // 6. ADMIN LOGIN & APPROVE REQUEST + ASSIGN COLLECTOR
        LoginRequest adminLogin = new LoginRequest("admin@ewaste.com", "admin123");
        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Approve Request
        mockMvc.perform(put("/api/admin/requests/" + requestId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Assign Collector
        AssignCollectorRequestDTO assignDTO = new AssignCollectorRequestDTO();
        assignDTO.setCollectorId(collectorUser.getId());

        mockMvc.perform(put("/api/admin/pickups/" + pickupId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ASSIGNED")))
                .andExpect(jsonPath("$.collectorId", is(collectorUser.getId().intValue())));

        // 7. COLLECTOR LOGIN & UPDATE PICKUP TO COLLECTED
        LoginRequest collectorLogin = new LoginRequest("collector@ewaste.com", "collector123");
        MvcResult collectorLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(collectorLogin)))
                .andExpect(status().isOk())
                .andReturn();
        String collectorToken = objectMapper.readTree(collectorLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Collector marks ON_THE_WAY
        UpdatePickupStatusDTO statusWayDTO = new UpdatePickupStatusDTO();
        statusWayDTO.setStatus(PickupStatus.ON_THE_WAY);
        statusWayDTO.setCollectorNotes("Navigating to Indiranagar");

        mockMvc.perform(put("/api/collector/pickups/" + pickupId + "/status")
                        .header("Authorization", "Bearer " + collectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusWayDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ON_THE_WAY")));

        // Collector marks COLLECTED
        UpdatePickupStatusDTO statusCollectedDTO = new UpdatePickupStatusDTO();
        statusCollectedDTO.setStatus(PickupStatus.COLLECTED);
        statusCollectedDTO.setCollectorNotes("Collected 2 Laptops safely in protective box.");

        mockMvc.perform(put("/api/collector/pickups/" + pickupId + "/status")
                        .header("Authorization", "Bearer " + collectorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusCollectedDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COLLECTED")));

        // 8. ADMIN UPDATES LIFECYCLE TO COMPLETED
        Map<String, String> statusCompleteBody = Map.of(
                "status", "COMPLETED",
                "comment", "Laptops inspected, refurbished, and re-allocated for community center."
        );

        mockMvc.perform(put("/api/admin/requests/" + requestId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusCompleteBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("COMPLETED")));

        // 9. VERIFY GREEN POINTS AWARDED TO CITIZEN
        User updatedCitizen = userRepository.findByEmail("workflow_citizen@example.com").orElseThrow();
        assertTrue(updatedCitizen.getRewardPointsBalance() > 0, "Citizen should have earned Green Points upon verified collection");

        // 10. GENERATE & VERIFY DIGITAL RECYCLING CERTIFICATE
        MvcResult certResult = mockMvc.perform(get("/api/certificates/request/" + requestId)
                        .header("Authorization", "Bearer " + citizenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.certificateNumber", startsWith("EWC-2026-")))
                .andExpect(jsonPath("$.trackingNumber", is(trackingNumber)))
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andReturn();

        String certNumber = objectMapper.readTree(certResult.getResponse().getContentAsString()).get("certificateNumber").asText();

        // Verify Public Certificate Verification Endpoint
        mockMvc.perform(get("/api/public/certificates/verify/" + certNumber))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.certificateNumber", is(certNumber)))
                .andExpect(jsonPath("$.status", is("COMPLETED")));
    }
}
