package com.ewaste.management.service;

import com.ewaste.management.dto.AdminStatsDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.dto.UserProfileDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.DisposalStatusHistory;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.Pickup;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.PickupStatus;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.notification.NotificationService;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.repository.RewardTransactionRepository;
import com.ewaste.management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminDashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private PickupRepository pickupRepository;

    @Autowired
    private RecyclingCenterRepository recyclingCenterRepository;

    @Autowired
    private RewardTransactionRepository rewardTransactionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserEWasteService userEWasteService;

    @Transactional(readOnly = true)
    public AdminStatsDTO getAdminStats() {
        AdminStatsDTO stats = new AdminStatsDTO();

        long totalUsers = userRepository.count();
        long collectorsCount = userRepository.findByRole(UserRole.COLLECTOR).size();
        long recyclersCount = userRepository.findByRole(UserRole.RECYCLER).size();
        long recyclingCentersCount = recyclingCenterRepository.count();
        long totalRequests = disposalRequestRepository.count();

        long pendingPickupsCount = pickupRepository.findByStatusIn(
                List.of(PickupStatus.SCHEDULED, PickupStatus.ASSIGNED)
        ).size();

        long completedRecyclingCount = disposalRequestRepository.findAll().stream()
                .filter(r -> r.getStatus() == RequestStatus.COMPLETED ||
                             r.getStatus() == RequestStatus.RECYCLED ||
                             r.getStatus() == RequestStatus.REUSED ||
                             r.getStatus() == RequestStatus.REFURBISHED)
                .count();

        long totalGreenPointsIssued = userRepository.findAll().stream()
                .mapToLong(u -> u.getRewardPointsBalance() != null ? u.getRewardPointsBalance() : 0)
                .sum();

        stats.setTotalUsers(totalUsers);
        stats.setCollectorsCount(collectorsCount);
        stats.setRecyclersCount(recyclersCount);
        stats.setRecyclingCentersCount(recyclingCentersCount);
        stats.setTotalRequests(totalRequests);
        stats.setPendingPickupsCount(pendingPickupsCount);
        stats.setCompletedRecyclingCount(completedRecyclingCount);
        stats.setTotalGreenPointsIssued(totalGreenPointsIssued);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getAllUsers(String search, String roleFilter, String statusFilter) {
        List<User> users = userRepository.findAll();

        return users.stream()
                .filter(u -> {
                    if (roleFilter != null && !roleFilter.isBlank() && !roleFilter.equalsIgnoreCase("ALL")) {
                        if (!u.getRole().name().equalsIgnoreCase(roleFilter)) return false;
                    }
                    if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
                        boolean activeMatch = statusFilter.equalsIgnoreCase("ACTIVE");
                        if (u.isActive() != activeMatch) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(s);
                        boolean nameMatch = false;
                        if (u.getProfile() != null) {
                            String fullName = (u.getProfile().getFirstName() + " " + u.getProfile().getLastName()).toLowerCase();
                            nameMatch = fullName.contains(s) || (u.getProfile().getPhoneNumber() != null && u.getProfile().getPhoneNumber().contains(s));
                        }
                        return emailMatch || nameMatch;
                    }
                    return true;
                })
                .map(this::mapUserToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO toggleUserActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setActive(!user.isActive());
        User saved = userRepository.save(user);

        notificationService.sendNotification(
                saved,
                "Account Status Updated",
                "Your account status has been updated to: " + (saved.isActive() ? "ACTIVE" : "INACTIVE") + ".",
                "ACCOUNT_STATUS_CHANGE"
        );

        return mapUserToDTO(saved);
    }

    @Transactional
    public UserDTO verifyUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }

        profile.setVerified(true);
        user.setProfile(profile);
        User saved = userRepository.save(user);

        notificationService.sendNotification(
                saved,
                "Profile Verified",
                "Your profile credentials have been verified by the administrator.",
                "PROFILE_VERIFIED"
        );

        return mapUserToDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<DisposalRequestDTO> getAllRequests(String search, String statusFilter, String categoryFilter) {
        List<DisposalRequest> requests = disposalRequestRepository.findAllByOrderByCreatedAtDesc();

        return requests.stream()
                .filter(r -> {
                    if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
                        if (!r.getStatus().name().equalsIgnoreCase(statusFilter)) return false;
                    }
                    if (categoryFilter != null && !categoryFilter.isBlank() && !categoryFilter.equalsIgnoreCase("ALL")) {
                        boolean catMatch = r.getItems() != null && r.getItems().stream()
                                .anyMatch(i -> i.getCategory().name().equalsIgnoreCase(categoryFilter));
                        if (!catMatch) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        boolean trackingMatch = r.getTrackingNumber() != null && r.getTrackingNumber().toLowerCase().contains(s);
                        boolean userMatch = r.getUser() != null && r.getUser().getEmail().toLowerCase().contains(s);
                        boolean deviceMatch = r.getItems() != null && r.getItems().stream()
                                .anyMatch(i -> (i.getDeviceName() != null && i.getDeviceName().toLowerCase().contains(s)) ||
                                               (i.getBrand() != null && i.getBrand().toLowerCase().contains(s)));
                        return trackingMatch || userMatch || deviceMatch;
                    }
                    return true;
                })
                .map(userEWasteService::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DisposalRequestDTO approveRequest(Long requestId, User adminUser) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.APPROVED);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(oldStatus);
        history.setToStatus(RequestStatus.APPROVED);
        history.setChangedBy(adminUser);
        history.setComment("Disposal request approved by administrator");
        history.setTimestamp(LocalDateTime.now());

        request.addStatusHistory(history);
        DisposalRequest saved = disposalRequestRepository.save(request);

        if (saved.getUser() != null) {
            notificationService.sendNotification(
                    saved.getUser(),
                    "Request Approved",
                    "Your disposal request " + saved.getTrackingNumber() + " has been approved.",
                    "REQUEST_APPROVED"
            );
        }

        return userEWasteService.mapToDTO(saved);
    }

    @Transactional
    public DisposalRequestDTO rejectRequest(Long requestId, String reason, User adminUser) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.REJECTED);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(oldStatus);
        history.setToStatus(RequestStatus.REJECTED);
        history.setChangedBy(adminUser);
        history.setComment(reason != null && !reason.isBlank() ? reason : "Disposal request rejected by administrator");
        history.setTimestamp(LocalDateTime.now());

        request.addStatusHistory(history);
        DisposalRequest saved = disposalRequestRepository.save(request);

        if (saved.getUser() != null) {
            notificationService.sendNotification(
                    saved.getUser(),
                    "Request Rejected",
                    "Your disposal request " + saved.getTrackingNumber() + " was rejected. Reason: " + (reason != null ? reason : "N/A"),
                    "REQUEST_REJECTED"
            );
        }

        return userEWasteService.mapToDTO(saved);
    }

    @Transactional
    public DisposalRequestDTO updateRequestLifecycleStatus(Long requestId, RequestStatus newStatus, String comment, User adminUser) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(newStatus);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(oldStatus);
        history.setToStatus(newStatus);
        history.setChangedBy(adminUser);
        history.setComment(comment != null && !comment.isBlank() ? comment : "Status updated to " + newStatus);
        history.setTimestamp(LocalDateTime.now());

        request.addStatusHistory(history);
        DisposalRequest saved = disposalRequestRepository.save(request);

        if (saved.getUser() != null) {
            String title = "Request Status Updated";
            String message = "Your disposal request " + saved.getTrackingNumber() + " status is now " + newStatus + ".";
            String type = "STATUS_UPDATE";

            switch (newStatus) {
                case APPROVED:
                    title = "Request Approved";
                    type = "REQUEST_APPROVED";
                    break;
                case AT_RECYCLING_CENTER:
                    title = "Item Reached Recycler";
                    message = "Your e-waste item(s) (" + saved.getTrackingNumber() + ") have arrived at the recycling facility.";
                    type = "ITEM_REACHES_RECYCLER";
                    break;
                case PROCESSING:
                    title = "Processing Begins";
                    message = "Processing and material recovery have begun for request " + saved.getTrackingNumber() + ".";
                    type = "PROCESSING_BEGINS";
                    break;
                case RECYCLED:
                case REUSED:
                case REFURBISHED:
                case COMPLETED:
                    title = "Processing Completed";
                    message = "Processing completed successfully for request " + saved.getTrackingNumber() + ".";
                    type = "PROCESSING_COMPLETED";
                    break;
                default:
                    break;
            }

            notificationService.sendNotification(saved.getUser(), title, message, type);
        }

        return userEWasteService.mapToDTO(saved);
    }

    private UserDTO mapUserToDTO(User u) {
        UserDTO dto = new UserDTO();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setActive(u.isActive());
        dto.setRewardPointsBalance(u.getRewardPointsBalance());
        dto.setCreatedAt(u.getCreatedAt());
        dto.setUpdatedAt(u.getUpdatedAt());

        if (u.getProfile() != null) {
            UserProfile p = u.getProfile();
            UserProfileDTO pDto = new UserProfileDTO();
            pDto.setId(p.getId());
            pDto.setUserId(u.getId());
            pDto.setUserType(p.getUserType() != null ? p.getUserType().name() : null);
            pDto.setOrganizationName(p.getOrganizationName());
            pDto.setOrganizationType(p.getOrganizationType() != null ? p.getOrganizationType().name() : null);
            pDto.setGstNumber(p.getGstNumber());
            pDto.setContactPerson(p.getContactPerson());
            pDto.setFirstName(p.getFirstName());
            pDto.setLastName(p.getLastName());
            pDto.setPhoneNumber(p.getPhoneNumber());
            pDto.setAddress(p.getAddress());
            pDto.setCity(p.getCity());
            pDto.setState(p.getState());
            pDto.setPostalCode(p.getPostalCode());
            pDto.setCountry(p.getCountry());
            pDto.setVerified(p.isVerified());
            dto.setProfile(pDto);
        }
        return dto;
    }
}
