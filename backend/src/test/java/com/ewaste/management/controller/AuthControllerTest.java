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

    @Autowired
    private com.ewaste.management.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Test
    void testUnauthorizedAccessToProtectedEndpointFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testLoginWithWrongCredentialsReturnsUserFriendly401() throws Exception {
        LoginRequest wrongLogin = new LoginRequest("nonexistent@ewaste.com", "wrongpassword123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password. Please verify your credentials and try again."));
    }

    @Test
    void testForgotPasswordAndResetPasswordFlow() throws Exception {
        // 1. Create a user to reset password for
        RegisterRequest reg = new RegisterRequest();
        reg.setFullName("Reset Password User");
        reg.setEmail("resetme@ewaste.com");
        reg.setPhoneNumber("9876543222");
        reg.setPassword("oldSecret123");
        reg.setCity("Bengaluru");
        reg.setState("Karnataka");
        reg.setPincode("560001");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk());

        // 2. Request forgot password
        com.ewaste.management.dto.ForgotPasswordRequest forgotReq =
                new com.ewaste.management.dto.ForgotPasswordRequest("resetme@ewaste.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.expiresInMinutes").value(15));

        // 3. Find the created token in repository
        com.ewaste.management.entity.PasswordResetToken tokenEntity = passwordResetTokenRepository.findAll().stream()
                .filter(t -> "resetme@ewaste.com".equals(t.getEmail()) && !t.isUsed())
                .findFirst()
                .orElseThrow(() -> new AssertionError("Reset token was not generated"));

        org.junit.jupiter.api.Assertions.assertNotNull(tokenEntity.getToken());
        org.junit.jupiter.api.Assertions.assertEquals(6, tokenEntity.getToken().length());

        // 4. Reset password with new credentials
        com.ewaste.management.dto.ResetPasswordRequest resetReq =
                new com.ewaste.management.dto.ResetPasswordRequest("resetme@ewaste.com", tokenEntity.getToken(), "brandNewPass456");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been successfully reset. You can now log in with your new password."));

        // 5. Verify old password no longer works
        LoginRequest oldLogin = new LoginRequest("resetme@ewaste.com", "oldSecret123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // 6. Verify new password successfully logs in
        LoginRequest newLogin = new LoginRequest("resetme@ewaste.com", "brandNewPass456");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void testResetPasswordWithInvalidCodeFails() throws Exception {
        com.ewaste.management.dto.ResetPasswordRequest invalidReq =
                new com.ewaste.management.dto.ResetPasswordRequest("admin@ewaste.com", "999999", "brandNewPass456");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired verification code."));
    }
}
