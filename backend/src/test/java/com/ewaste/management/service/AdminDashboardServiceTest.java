package com.ewaste.management.service;

import com.ewaste.management.dto.AdminStatsDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.UserDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.notification.NotificationService;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.repository.RewardTransactionRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {


    @Mock
    private UserRepository userRepository;

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private PickupRepository pickupRepository;

    @Mock
    private RecyclingCenterRepository recyclingCenterRepository;

    @Mock
    private RewardTransactionRepository rewardTransactionRepository;

    @Mock
    private com.ewaste.management.repository.NotificationRepository notificationRepository;

    @Mock
    private com.ewaste.management.repository.UserProfileRepository userProfileRepository;

    private NotificationService notificationService;

    private UserEWasteService userEWasteService;


    @InjectMocks
    private AdminDashboardService adminDashboardService;

    private User testUser;
    private DisposalRequest testRequest;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, Collections.emptyList());

        FileStorageService fileStorageService = new FileStorageService();
        RecommendationService recommendationService = new RecommendationService(new RuleBasedRecommendationEngine());
        userEWasteService = new UserEWasteService(userRepository, userProfileRepository, disposalRequestRepository, fileStorageService, recommendationService, notificationService);

        ReflectionTestUtils.setField(adminDashboardService, "notificationService", notificationService);
        ReflectionTestUtils.setField(adminDashboardService, "userEWasteService", userEWasteService);

        testUser = new User();


        testUser.setId(1L);
        testUser.setEmail("user@example.com");
        testUser.setRole(UserRole.USER);
        testUser.setActive(true);
        testUser.setRewardPointsBalance(150);

        UserProfile profile = new UserProfile();
        profile.setId(10L);
        profile.setFirstName("Ramesh");
        profile.setLastName("Kumar");
        profile.setVerified(false);
        testUser.setProfile(profile);

        testRequest = new DisposalRequest();
        testRequest.setId(100L);
        testRequest.setTrackingNumber("EW-2026-TEST1234");
        testRequest.setUser(testUser);
        testRequest.setStatus(RequestStatus.SUBMITTED);
    }

    @Test
    void getAdminStats_ShouldCalculateCorrectMetrics() {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.findByRole(UserRole.COLLECTOR)).thenReturn(List.of(new User()));
        when(userRepository.findByRole(UserRole.RECYCLER)).thenReturn(List.of(new User()));
        when(recyclingCenterRepository.count()).thenReturn(3L);
        when(disposalRequestRepository.count()).thenReturn(10L);
        when(pickupRepository.findByStatusIn(any())).thenReturn(Collections.emptyList());
        when(disposalRequestRepository.findAll()).thenReturn(List.of(testRequest));
        when(userRepository.findAll()).thenReturn(List.of(testUser));

        AdminStatsDTO stats = adminDashboardService.getAdminStats();

        assertNotNull(stats);
        assertEquals(5L, stats.getTotalUsers());
        assertEquals(1L, stats.getCollectorsCount());
        assertEquals(1L, stats.getRecyclersCount());
        assertEquals(3L, stats.getRecyclingCentersCount());
        assertEquals(10L, stats.getTotalRequests());
        assertEquals(150L, stats.getTotalGreenPointsIssued());
    }

    @Test
    void toggleUserActive_ShouldFlipActiveState() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        UserDTO updated = adminDashboardService.toggleUserActive(1L);

        assertNotNull(updated);
        assertFalse(updated.isActive());
    }

    @Test
    void verifyUserProfile_ShouldSetVerifiedTrue() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        UserDTO updated = adminDashboardService.verifyUserProfile(1L);

        assertNotNull(updated);
        assertTrue(updated.getProfile().isVerified());
    }

    @Test
    void approveRequest_ShouldSetStatusToApproved() {
        User admin = new User();
        admin.setId(99L);
        admin.setEmail("admin@example.com");

        DisposalRequestDTO mockDTO = new DisposalRequestDTO();
        mockDTO.setId(100L);
        mockDTO.setStatus(RequestStatus.APPROVED);

        when(disposalRequestRepository.findById(100L)).thenReturn(Optional.of(testRequest));
        when(disposalRequestRepository.save(any(DisposalRequest.class))).thenAnswer(i -> i.getArguments()[0]);

        DisposalRequestDTO result = adminDashboardService.approveRequest(100L, admin);

        assertNotNull(result);
        assertEquals(RequestStatus.APPROVED, result.getStatus());
    }

}
