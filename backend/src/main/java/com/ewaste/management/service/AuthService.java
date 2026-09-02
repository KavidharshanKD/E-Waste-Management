package com.ewaste.management.service;

import com.ewaste.management.dto.JwtAuthResponse;
import com.ewaste.management.dto.LoginRequest;
import com.ewaste.management.dto.RegisterRequest;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.security.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
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
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
        dto.setRewardPointsBalance(user.getRewardPointsBalance());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        if (user.getProfile() != null) {
            UserProfile profile = user.getProfile();
            UserProfileDTO profileDTO = new UserProfileDTO();
            profileDTO.setId(profile.getId());
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
