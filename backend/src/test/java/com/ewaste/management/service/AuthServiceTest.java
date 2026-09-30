package com.ewaste.management.service;

import com.ewaste.management.dto.JwtAuthResponse;
import com.ewaste.management.dto.LoginRequest;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.OrganizationType;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.model.enums.UserType;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private com.ewaste.management.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    private EmailService emailService;

    private JwtTokenProvider realTokenProvider;

    private AuthService authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(null);
        realTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(realTokenProvider, "jwtSecret", "dGhpcyBpcyBhIHZhbGlkIGJhc2U2NCBzZWNyZXQga2V5IDEyMzQ1Njc4OTA=");
        ReflectionTestUtils.setField(realTokenProvider, "jwtExpirationMs", 3600000L);

        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, realTokenProvider, passwordResetTokenRepository, emailService);

        registerRequest = new RegisterRequest();
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("secret123");
        registerRequest.setFullName("Arun Kumar");
        registerRequest.setPhoneNumber("9876543210");
        registerRequest.setCity("Chennai");
        registerRequest.setState("Tamil Nadu");
        registerRequest.setPincode("600001");
        registerRequest.setRole(UserRole.USER);
        registerRequest.setUserType(UserType.INDIVIDUAL);
    }

    @Test
    @DisplayName("Should successfully register individual user and return JWT token")
    void testRegisterIndividualSuccess() {
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword123");

        User savedUser = new User();
        savedUser.setEmail("newuser@example.com");
        savedUser.setRole(UserRole.USER);
        savedUser.setActive(true);

        UserProfile profile = new UserProfile();
        profile.setFirstName("Arun");
        profile.setLastName("Kumar");
        profile.setCity("Chennai");
        savedUser.setProfile(profile);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Authentication tokenAuth = new UsernamePasswordAuthenticationToken("newuser@example.com", "secret123", Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(tokenAuth);

        JwtAuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("newuser@example.com", response.getUser().getEmail());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertEquals("encodedPassword123", capturedUser.getPassword());
        assertEquals("Arun", capturedUser.getProfile().getFirstName());
        assertEquals("Kumar", capturedUser.getProfile().getLastName());
    }

    @Test
    @DisplayName("Should successfully register institutional entity with GST and organization fields")
    void testRegisterInstitutionalUser() {
        registerRequest.setUserType(UserType.INSTITUTION);
        registerRequest.setOrganizationName("IIT Madras");
        registerRequest.setOrganizationType(OrganizationType.COLLEGE);
        registerRequest.setGstNumber("33AAAAA0000A1Z5");
        registerRequest.setContactPerson("Dr. S. Raman");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword123");

        User savedUser = new User();
        savedUser.setEmail("newuser@example.com");
        savedUser.setRole(UserRole.USER);

        UserProfile profile = new UserProfile();
        profile.setUserType(UserType.INSTITUTION);
        profile.setOrganizationName("IIT Madras");
        profile.setOrganizationType(OrganizationType.COLLEGE);
        profile.setGstNumber("33AAAAA0000A1Z5");
        profile.setContactPerson("Dr. S. Raman");
        savedUser.setProfile(profile);

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Authentication tokenAuth = new UsernamePasswordAuthenticationToken("newuser@example.com", "secret123", Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(tokenAuth);

        JwtAuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("IIT Madras", response.getUser().getProfile().getOrganizationName());
        assertEquals("COLLEGE", response.getUser().getProfile().getOrganizationType());
    }

    @Test
    @DisplayName("Should throw exception when registering with already existing email")
    void testRegisterDuplicateEmailThrowsException() {
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(true);

        org.springframework.web.server.ResponseStatusException ex = assertThrows(
                org.springframework.web.server.ResponseStatusException.class,
                () -> authService.register(registerRequest)
        );

        assertTrue(ex.getMessage().contains("Email address is already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should authenticate login request and return token and user profile")
    void testLoginSuccess() {
        LoginRequest loginRequest = new LoginRequest("user@example.com", "secret123");
        Authentication tokenAuth = new UsernamePasswordAuthenticationToken("user@example.com", "secret123", Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(tokenAuth);

        User user = new User("user@example.com", "encodedPassword", UserRole.USER);
        UserProfile profile = new UserProfile();
        profile.setFirstName("Priya");
        profile.setLastName("Sharma");
        user.setProfile(profile);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        JwtAuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertNotNull(response.getAccessToken());
        assertEquals("user@example.com", response.getUser().getEmail());
        assertEquals("Priya", response.getUser().getProfile().getFirstName());
        assertEquals("Priya Sharma", response.getUser().getFullName());
    }

    @Test
    @DisplayName("Should create reset token on forgot password request")
    void testForgotPasswordSuccess() {
        User user = new User("user@example.com", "pass", UserRole.USER);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        com.ewaste.management.dto.ForgotPasswordRequest request =
                new com.ewaste.management.dto.ForgotPasswordRequest("user@example.com");

        Map<String, Object> result = authService.forgotPassword(request);

        assertNotNull(result);
        assertEquals("user@example.com", result.get("email"));
        verify(passwordResetTokenRepository, times(1)).save(any(com.ewaste.management.entity.PasswordResetToken.class));
    }

    @Test
    @DisplayName("Should successfully reset password when valid token provided")
    void testResetPasswordSuccess() {
        com.ewaste.management.entity.PasswordResetToken token =
                new com.ewaste.management.entity.PasswordResetToken("user@example.com", "123456", java.time.LocalDateTime.now().plusMinutes(10));

        User user = new User("user@example.com", "oldPass", UserRole.USER);
        when(passwordResetTokenRepository.findFirstByEmailAndTokenAndUsedFalseOrderByCreatedAtDesc("user@example.com", "123456"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newSecretPass")).thenReturn("encodedNewSecretPass");

        com.ewaste.management.dto.ResetPasswordRequest request =
                new com.ewaste.management.dto.ResetPasswordRequest("user@example.com", "123456", "newSecretPass");

        Map<String, Object> result = authService.resetPassword(request);

        assertNotNull(result);
        assertTrue(token.isUsed());
        assertEquals("encodedNewSecretPass", user.getPassword());
        verify(userRepository, times(1)).save(user);
        verify(passwordResetTokenRepository, times(1)).save(token);
    }
}
