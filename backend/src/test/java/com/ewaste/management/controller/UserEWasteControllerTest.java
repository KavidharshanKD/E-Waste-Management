package com.ewaste.management.controller;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.UserRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserEWasteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String userAToken;
    private String userBToken;

    @BeforeEach
    void setUp() throws Exception {
        // Register User A
        RegisterRequest regA = new RegisterRequest();
        regA.setFullName("Citizen User A");
        regA.setEmail("usera@ewaste.com");
        regA.setPhoneNumber("9876543211");
        regA.setPassword("passwordA123");
        regA.setCity("Chennai");
        regA.setState("Tamil Nadu");
        regA.setPincode("600001");
        regA.setRole(UserRole.USER);

        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isOk())
                .andReturn();
        userAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).get("accessToken").asText();

        // Register User B
        RegisterRequest regB = new RegisterRequest();
        regB.setFullName("Citizen User B");
        regB.setEmail("userb@ewaste.com");
        regB.setPhoneNumber("9876543212");
        regB.setPassword("passwordB123");
        regB.setCity("Coimbatore");
        regB.setState("Tamil Nadu");
        regB.setPincode("641001");
        regB.setRole(UserRole.USER);

        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isOk())
                .andReturn();
        userBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void testCreateEWasteRequestSuccess() throws Exception {
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.LAPTOP);
        createDTO.setDeviceName("MacBook Pro M1");
        createDTO.setBrand("Apple");
        createDTO.setApproxAgeYears(3);
        createDTO.setQuantity(1);
        createDTO.setCondition(DeviceCondition.WORKING);
        createDTO.setWorkingStatus("Fully Working");
        createDTO.setDescription("Good condition, minor scratches on outer shell");
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("123 Green Street, Adyar");
        createDTO.setPickupCity("Chennai");
        createDTO.setPickupState("Tamil Nadu");
        createDTO.setPickupPostalCode("600020");

        mockMvc.perform(post("/api/user/ewaste")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.trackingNumber").value(org.hamcrest.Matchers.startsWith("EW-")))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.pickupRequired").value(true))
                .andExpect(jsonPath("$.items[0].deviceName").value("MacBook Pro M1"))
                .andExpect(jsonPath("$.items[0].category").value("LAPTOP"));
    }

    @Test
    void testCreateEWasteWithMultipartImageUpload() throws Exception {
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.MOBILE_PHONE);
        createDTO.setDeviceName("iPhone 12");
        createDTO.setBrand("Apple");
        createDTO.setApproxAgeYears(2);
        createDTO.setQuantity(1);
        createDTO.setCondition(DeviceCondition.PARTIALLY_WORKING);
        createDTO.setWorkingStatus("Cracked screen");
        createDTO.setDescription("Screen cracked, turns on");
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("45 Anna Salai");
        createDTO.setPickupCity("Chennai");
        createDTO.setPickupState("Tamil Nadu");
        createDTO.setPickupPostalCode("600002");

        MockMultipartFile imagePart = new MockMultipartFile("image", "phone.png", "image/png", "fake image content".getBytes());

        mockMvc.perform(multipart("/api/user/ewaste")
                        .file(imagePart)
                        .param("category", "MOBILE_PHONE")
                        .param("deviceName", "iPhone 12")
                        .param("brand", "Apple")
                        .param("approxAgeYears", "2")
                        .param("quantity", "1")
                        .param("condition", "PARTIALLY_WORKING")
                        .param("workingStatus", "Cracked screen")
                        .param("description", "Screen cracked, turns on")
                        .param("pickupRequired", "true")
                        .param("pickupAddress", "45 Anna Salai")
                        .param("pickupCity", "Chennai")
                        .param("pickupState", "Tamil Nadu")
                        .param("pickupPostalCode", "600002")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.items[0].imageUrl").value(org.hamcrest.Matchers.startsWith("/uploads/ewaste/")));
    }

    @Test
    void testGetRequestsAndUserStats() throws Exception {
        // Create 1 request for User A
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.BATTERY);
        createDTO.setDeviceName("Li-ion Battery Pack");
        createDTO.setBrand("Panasonic");
        createDTO.setApproxAgeYears(1);
        createDTO.setQuantity(2);
        createDTO.setCondition(DeviceCondition.NOT_WORKING);
        createDTO.setWorkingStatus("Dead battery");
        createDTO.setDescription("Old laptop battery");
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("78 T Nagar");
        createDTO.setPickupCity("Chennai");
        createDTO.setPickupState("Tamil Nadu");
        createDTO.setPickupPostalCode("600017");

        mockMvc.perform(post("/api/user/ewaste")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated());

        // Get user A requests
        mockMvc.perform(get("/api/user/ewaste")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].items[0].deviceName").value("Li-ion Battery Pack"));

        // Get stats
        mockMvc.perform(get("/api/user/stats")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSubmitted").value(1))
                .andExpect(jsonPath("$.awaitingPickup").value(1))
                .andExpect(jsonPath("$.collected").value(0))
                .andExpect(jsonPath("$.successfullyProcessed").value(0));
    }

    @Test
    void testUserIsolationCannotAccessOtherUserRequest() throws Exception {
        // User A creates a request
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.MONITOR);
        createDTO.setDeviceName("Dell 24 Display");
        createDTO.setBrand("Dell");
        createDTO.setApproxAgeYears(4);
        createDTO.setQuantity(1);
        createDTO.setCondition(DeviceCondition.WORKING);
        createDTO.setWorkingStatus("Working");
        createDTO.setDescription("Upgraded monitor");
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("12 Beach Road");
        createDTO.setPickupCity("Chennai");
        createDTO.setPickupState("Tamil Nadu");
        createDTO.setPickupPostalCode("600001");

        MvcResult result = mockMvc.perform(post("/api/user/ewaste")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        Long requestAId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // User B attempts to access User A's request -> Should fail (404/403)
        mockMvc.perform(get("/api/user/ewaste/" + requestAId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void testCancelDisposalRequest() throws Exception {
        CreateEWasteRequestDTO createDTO = new CreateEWasteRequestDTO();
        createDTO.setCategory(EWasteCategory.PRINTER);
        createDTO.setDeviceName("HP LaserJet");
        createDTO.setBrand("HP");
        createDTO.setApproxAgeYears(5);
        createDTO.setQuantity(1);
        createDTO.setCondition(DeviceCondition.DAMAGED);
        createDTO.setWorkingStatus("Paper jam issue");
        createDTO.setDescription("Old office printer");
        createDTO.setPickupRequired(true);
        createDTO.setPickupAddress("99 OMR Road");
        createDTO.setPickupCity("Chennai");
        createDTO.setPickupState("Tamil Nadu");
        createDTO.setPickupPostalCode("600096");

        MvcResult result = mockMvc.perform(post("/api/user/ewaste")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        Long reqId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Cancel request
        mockMvc.perform(delete("/api/user/ewaste/" + reqId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Disposal request cancelled successfully."));

        // Verify status changed to CANCELLED
        mockMvc.perform(get("/api/user/ewaste/" + reqId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void testGetUserProfileAndUpdateProfile() throws Exception {
        // Get initial profile
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Citizen"));

        // Update profile
        UserProfileDTO updateDTO = new UserProfileDTO();
        updateDTO.setFirstName("Rahul");
        updateDTO.setLastName("Dravid");
        updateDTO.setPhoneNumber("9876543211");
        updateDTO.setAddress("45 MG Road");
        updateDTO.setCity("Bengaluru");
        updateDTO.setState("Karnataka");
        updateDTO.setPostalCode("560001");
        updateDTO.setCountry("India");

        mockMvc.perform(put("/api/user/profile")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Rahul"))
                .andExpect(jsonPath("$.lastName").value("Dravid"))
                .andExpect(jsonPath("$.city").value("Bengaluru"));
    }
}
