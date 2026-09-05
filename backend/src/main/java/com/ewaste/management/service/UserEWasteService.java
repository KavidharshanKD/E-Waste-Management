package com.ewaste.management.service;

import com.ewaste.management.dto.CreateEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.EWasteItemDTO;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.dto.UserStatsDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.DisposalStatusHistory;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.UserProfileRepository;
import com.ewaste.management.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserEWasteService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final DisposalRequestRepository disposalRequestRepository;
    private final FileStorageService fileStorageService;

    public UserEWasteService(UserRepository userRepository,
                             UserProfileRepository userProfileRepository,
                             DisposalRequestRepository disposalRequestRepository,
                             FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.disposalRequestRepository = disposalRequestRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public DisposalRequestDTO createRequest(String userEmail, CreateEWasteRequestDTO dto, MultipartFile imageFile) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        DisposalRequest request = new DisposalRequest();
        request.setTrackingNumber("EW-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        request.setUser(user);
        request.setStatus(RequestStatus.SUBMITTED);
        request.setPickupRequired(dto.getPickupRequired() != null ? dto.getPickupRequired() : true);
        request.setPickupAddress(dto.getPickupAddress());
        request.setPickupCity(dto.getPickupCity());
        request.setPickupState(dto.getPickupState());
        request.setPickupPostalCode(dto.getPickupPostalCode());
        request.setNotes(dto.getDescription());

        // Handle Image Upload
        String imageUrl = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imageUrl = fileStorageService.storeFile(imageFile);
        }

        // Create EWasteItem
        EWasteItem item = new EWasteItem();
        item.setCategory(dto.getCategory());
        item.setDeviceName(dto.getDeviceName());
        item.setBrand(dto.getBrand());
        item.setApproxAgeYears(dto.getApproxAgeYears());
        item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
        item.setCondition(dto.getCondition());
        item.setWorkingStatus(dto.getWorkingStatus());
        item.setDescription(dto.getDescription());
        item.setImageUrl(imageUrl);
        item.setEstimatedRewardPoints((dto.getQuantity() != null ? dto.getQuantity() : 1) * 50);

        request.addItem(item);

        // Record Initial History
        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(null);
        history.setToStatus(RequestStatus.SUBMITTED);
        history.setChangedBy(user);
        history.setComment("Disposal request submitted by citizen");
        history.setTimestamp(LocalDateTime.now());
        request.addStatusHistory(history);

        DisposalRequest saved = disposalRequestRepository.save(request);
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DisposalRequestDTO> getUserRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return disposalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DisposalRequestDTO getRequestById(String userEmail, Long requestId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found with ID: " + requestId));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only view your own disposal requests.");
        }

        return mapToDTO(request);
    }

    @Transactional
    public DisposalRequestDTO updateRequest(String userEmail, Long requestId, CreateEWasteRequestDTO dto, MultipartFile imageFile) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found with ID: " + requestId));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only edit your own disposal requests.");
        }

        if (request.getStatus() != RequestStatus.SUBMITTED && request.getStatus() != RequestStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Request cannot be edited once it has passed the review stage.");
        }

        request.setPickupRequired(dto.getPickupRequired() != null ? dto.getPickupRequired() : true);
        request.setPickupAddress(dto.getPickupAddress());
        request.setPickupCity(dto.getPickupCity());
        request.setPickupState(dto.getPickupState());
        request.setPickupPostalCode(dto.getPickupPostalCode());
        request.setNotes(dto.getDescription());

        // Update or store new image
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(imageFile);
            if (!request.getItems().isEmpty()) {
                request.getItems().get(0).setImageUrl(imageUrl);
            }
        }

        // Update primary item
        if (!request.getItems().isEmpty()) {
            EWasteItem item = request.getItems().get(0);
            item.setCategory(dto.getCategory());
            item.setDeviceName(dto.getDeviceName());
            item.setBrand(dto.getBrand());
            item.setApproxAgeYears(dto.getApproxAgeYears());
            item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
            item.setCondition(dto.getCondition());
            item.setWorkingStatus(dto.getWorkingStatus());
            item.setDescription(dto.getDescription());
        }

        DisposalRequest updated = disposalRequestRepository.save(request);
        return mapToDTO(updated);
    }

    @Transactional
    public void cancelRequest(String userEmail, Long requestId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found with ID: " + requestId));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only cancel your own disposal requests.");
        }

        if (request.getStatus() == RequestStatus.COLLECTED ||
            request.getStatus() == RequestStatus.COMPLETED ||
            request.getStatus() == RequestStatus.RECYCLED) {
            throw new IllegalStateException("Cannot cancel a request that has already been collected or completed.");
        }

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.CANCELLED);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(oldStatus);
        history.setToStatus(RequestStatus.CANCELLED);
        history.setChangedBy(user);
        history.setComment("Disposal request cancelled by user");
        history.setTimestamp(LocalDateTime.now());
        request.addStatusHistory(history);

        disposalRequestRepository.save(request);
    }

    @Transactional(readOnly = true)
    public UserStatsDTO getUserStats(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Long userId = user.getId();

        long totalSubmitted = disposalRequestRepository.countByUserId(userId);

        long awaitingPickup = disposalRequestRepository.countByUserIdAndStatusIn(userId, Arrays.asList(
                RequestStatus.SUBMITTED,
                RequestStatus.UNDER_REVIEW,
                RequestStatus.APPROVED,
                RequestStatus.PICKUP_ASSIGNED
        ));

        long collected = disposalRequestRepository.countByUserIdAndStatusIn(userId, Arrays.asList(
                RequestStatus.COLLECTED,
                RequestStatus.AT_RECYCLING_CENTER
        ));

        long successfullyProcessed = disposalRequestRepository.countByUserIdAndStatusIn(userId, Arrays.asList(
                RequestStatus.PROCESSING,
                RequestStatus.RECYCLED,
                RequestStatus.REUSED,
                RequestStatus.REFURBISHED,
                RequestStatus.COMPLETED
        ));

        int greenPoints = user.getRewardPointsBalance();

        return new UserStatsDTO(totalSubmitted, awaitingPickup, collected, successfullyProcessed, greenPoints);
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return userProfileRepository.save(newProfile);
                });

        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(user.getId());
        dto.setFirstName(profile.getFirstName());
        dto.setLastName(profile.getLastName());
        dto.setPhoneNumber(profile.getPhoneNumber());
        dto.setAddress(profile.getAddress());
        dto.setCity(profile.getCity());
        dto.setState(profile.getState());
        dto.setPostalCode(profile.getPostalCode());
        dto.setCountry(profile.getCountry());
        return dto;
    }

    @Transactional
    public UserProfileDTO updateUserProfile(String userEmail, UserProfileDTO dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile newProfile = new UserProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        profile.setFirstName(dto.getFirstName());
        profile.setLastName(dto.getLastName());
        profile.setPhoneNumber(dto.getPhoneNumber());
        profile.setAddress(dto.getAddress());
        profile.setCity(dto.getCity());
        profile.setState(dto.getState());
        profile.setPostalCode(dto.getPostalCode());
        if (dto.getCountry() != null) {
            profile.setCountry(dto.getCountry());
        }

        UserProfile saved = userProfileRepository.save(profile);

        UserProfileDTO response = new UserProfileDTO();
        response.setId(saved.getId());
        response.setUserId(user.getId());
        response.setFirstName(saved.getFirstName());
        response.setLastName(saved.getLastName());
        response.setPhoneNumber(saved.getPhoneNumber());
        response.setAddress(saved.getAddress());
        response.setCity(saved.getCity());
        response.setState(saved.getState());
        response.setPostalCode(saved.getPostalCode());
        response.setCountry(saved.getCountry());
        return response;
    }

    private DisposalRequestDTO mapToDTO(DisposalRequest req) {
        DisposalRequestDTO dto = new DisposalRequestDTO();
        dto.setId(req.getId());
        dto.setTrackingNumber(req.getTrackingNumber());
        dto.setUserId(req.getUser().getId());
        dto.setUserEmail(req.getUser().getEmail());
        dto.setStatus(req.getStatus());
        dto.setRecommendedAction(req.getRecommendedAction());
        dto.setPickupRequired(req.getPickupRequired());
        dto.setPickupAddress(req.getPickupAddress());
        dto.setPickupCity(req.getPickupCity());
        dto.setPickupState(req.getPickupState());
        dto.setPickupPostalCode(req.getPickupPostalCode());
        dto.setPreferredPickupDate(req.getPreferredPickupDate());
        dto.setNotes(req.getNotes());
        if (req.getCenter() != null) {
            dto.setCenterId(req.getCenter().getId());
            dto.setCenterName(req.getCenter().getName());
        }
        dto.setCreatedAt(req.getCreatedAt());
        dto.setUpdatedAt(req.getUpdatedAt());

        if (req.getItems() != null) {
            dto.setItems(req.getItems().stream().map(item -> {
                EWasteItemDTO itemDTO = new EWasteItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setDisposalRequestId(req.getId());
                itemDTO.setCategory(item.getCategory());
                itemDTO.setDeviceName(item.getDeviceName());
                itemDTO.setBrand(item.getBrand());
                itemDTO.setModelName(item.getModelName());
                itemDTO.setSerialNumber(item.getSerialNumber());
                itemDTO.setApproxAgeYears(item.getApproxAgeYears());
                itemDTO.setCondition(item.getCondition());
                itemDTO.setWorkingStatus(item.getWorkingStatus());
                itemDTO.setWeightKg(item.getWeightKg());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setDescription(item.getDescription());
                itemDTO.setImageUrl(item.getImageUrl());
                itemDTO.setEstimatedRewardPoints(item.getEstimatedRewardPoints());
                return itemDTO;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
