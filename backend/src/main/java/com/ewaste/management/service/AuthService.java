package com.ewaste.management.service;

import com.ewaste.management.dto.JwtAuthResponse;
import com.ewaste.management.dto.LoginRequest;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.model.enums.UserType;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.ewaste.management.dto.ForgotPasswordRequest;
import com.ewaste.management.dto.ResetPasswordRequest;
import com.ewaste.management.entity.PasswordResetToken;
import com.ewaste.management.repository.PasswordResetTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this(userRepository, passwordEncoder, authenticationManager, tokenProvider, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public JwtAuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email address is already registered!");
        }

        User user = new User();
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.USER);
        user.setActive(true);
        user.setRewardPointsBalance(0);

        UserProfile profile = new UserProfile();
        String[] nameParts = request.getFullName().trim().split("\\s+", 2);
        profile.setFirstName(nameParts[0]);
        profile.setLastName(nameParts.length > 1 ? nameParts[1] : "");
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setCity(request.getCity());
        profile.setState(request.getState());
        profile.setPostalCode(request.getPincode());
        profile.setCountry("India");

        // Institutional registration fields
        if (request.getUserType() != null) {
            profile.setUserType(request.getUserType());
        }
        if (request.getOrganizationName() != null && !request.getOrganizationName().isBlank()) {
            profile.setOrganizationName(request.getOrganizationName().trim());
        }
        if (request.getOrganizationType() != null) {
            profile.setOrganizationType(request.getOrganizationType());
        }
        if (request.getGstNumber() != null && !request.getGstNumber().isBlank()) {
            profile.setGstNumber(request.getGstNumber().trim());
        }
        if (request.getContactPerson() != null && !request.getContactPerson().isBlank()) {
            profile.setContactPerson(request.getContactPerson().trim());
        }

        user.setProfile(profile);

        User savedUser = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = tokenProvider.generateToken(authentication);
        return new JwtAuthResponse(token, mapToUserDTO(savedUser));
    }

    @Transactional(readOnly = true)
    public JwtAuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new JwtAuthResponse(token, mapToUserDTO(user));
    }

    @Transactional
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No registered account found with email: " + email));

        // Generate 6-digit verification code
        int codeInt = 100000 + new SecureRandom().nextInt(900000);
        String code = String.valueOf(codeInt);

        PasswordResetToken resetToken = new PasswordResetToken(email, code, LocalDateTime.now().plusMinutes(15));
        passwordResetTokenRepository.save(resetToken);

        emailService.sendPasswordResetEmail(email, code);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "A 6-digit verification code has been dispatched to your email.");
        response.put("email", email);
        response.put("expiresInMinutes", 15);
        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String code = request.getCode().trim();

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findFirstByEmailAndTokenAndUsedFalseOrderByCreatedAtDesc(email, code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired verification code."));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new code.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password has been successfully reset. You can now log in with your new password.");
        return response;
    }

    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return mapToUserDTO(user);
    }

    public UserDTO mapToUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
        dto.setRewardPointsBalance(user.getRewardPointsBalance());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getProfile() != null) {
            UserProfile profile = user.getProfile();
            UserProfileDTO profileDTO = new UserProfileDTO();
            profileDTO.setId(profile.getId());
            profileDTO.setUserType(profile.getUserType() != null ? profile.getUserType().name() : UserType.INDIVIDUAL.name());
            profileDTO.setOrganizationName(profile.getOrganizationName());
            profileDTO.setOrganizationType(profile.getOrganizationType() != null ? profile.getOrganizationType().name() : null);
            profileDTO.setGstNumber(profile.getGstNumber());
            profileDTO.setContactPerson(profile.getContactPerson());
            profileDTO.setFirstName(profile.getFirstName());
            profileDTO.setLastName(profile.getLastName());
            profileDTO.setPhoneNumber(profile.getPhoneNumber());
            profileDTO.setAddress(profile.getAddress());
            profileDTO.setCity(profile.getCity());
            profileDTO.setState(profile.getState());
            profileDTO.setPostalCode(profile.getPostalCode());
            profileDTO.setCountry(profile.getCountry());
            dto.setProfile(profileDTO);
        }

        return dto;
    }
}
