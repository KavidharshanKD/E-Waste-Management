package com.ewaste.management.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ewaste.management.dto.LoginRequest;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.model.enums.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegisterUserSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Rahul Dravid");
        request.setEmail("rahul.test@ewaste.com");
        request.setPhoneNumber("9876543299");
        request.setPassword("securePassword123");
        request.setCity("Bengaluru");
        request.setState("Karnataka");
        request.setPincode("560001");
        request.setRole(UserRole.USER);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("rahul.test@ewaste.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void testRegisterDuplicateEmailFails() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate User");
        request.setEmail("admin@ewaste.com"); // already in seed data
        request.setPhoneNumber("9876543210");
        request.setPassword("password123");
        request.setCity("Bengaluru");
        request.setState("Karnataka");
        request.setPincode("560001");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testLoginSuccessAndGetMe() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@ewaste.com", "$2a$10$wT5XzS9mG.V0z7Jz9.5MxuW9S5V5mGZ9z7Jz95MxuW9S5V5mGZ9z");
        
        // Register a fresh test user to guarantee BCrypt match
        RegisterRequest reg = new RegisterRequest();
        reg.setFullName("Auth Test User");
        reg.setEmail("authtest@ewaste.com");
        reg.setPhoneNumber("9876543219");
        reg.setPassword("mySecretPass123");
        reg.setCity("Bengaluru");
        reg.setState("Karnataka");
        reg.setPincode("560001");

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk())
                .andReturn();

        String responseStr = regResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseStr).get("accessToken").asText();

        // Perform GET /api/auth/me using Bearer token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("authtest@ewaste.com"));
    }

    @Test
    void testUnauthorizedAccessToProtectedEndpointFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
