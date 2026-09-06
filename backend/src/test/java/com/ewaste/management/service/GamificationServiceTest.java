package com.ewaste.management.service;

import com.ewaste.management.dto.GamificationProfileDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.RewardTransaction;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.RewardTransactionRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GamificationServiceTest {

    @Mock
    private RewardTransactionRepository rewardTransactionRepository;

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.ewaste.management.repository.NotificationRepository notificationRepository;

    private com.ewaste.management.notification.NotificationService notificationService;

    @InjectMocks
    private GamificationService gamificationService;

    private User user;
    private DisposalRequest request;

    @BeforeEach
    void setUp() {
        notificationService = new com.ewaste.management.notification.NotificationService(notificationRepository, java.util.Collections.emptyList());
        gamificationService = new GamificationService(rewardTransactionRepository, disposalRequestRepository, userRepository, notificationService);

        user = new User();

        user.setId(1L);
        user.setEmail("user@example.com");
        user.setRewardPointsBalance(0);

        request = new DisposalRequest();
        request.setId(100L);
        request.setUser(user);
        request.setStatus(RequestStatus.COLLECTED);
        request.setRecommendedAction(DisposalAction.RECYCLE);

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setQuantity(1);
        request.setItems(List.of(item));
    }

    @Test
    void testAwardPointsRecycleSuccess() {
        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(false);
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> i.getArgument(0));

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNotNull(tx);
        assertEquals(100, tx.getPoints());
        assertEquals("EARN_RECYCLE", tx.getTransactionType());
        assertEquals(100, user.getRewardPointsBalance());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testAwardPointsDonateSuccess() {
        request.setRecommendedAction(DisposalAction.DONATE);
        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(false);
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> i.getArgument(0));

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNotNull(tx);
        assertEquals(150, tx.getPoints());
        assertEquals("EARN_DONATE", tx.getTransactionType());
        assertEquals(150, user.getRewardPointsBalance());
    }

    @Test
    void testAwardPointsReuseSuccess() {
        request.setRecommendedAction(DisposalAction.REUSE);
        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(false);
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> i.getArgument(0));

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNotNull(tx);
        assertEquals(120, tx.getPoints());
        assertEquals("EARN_REUSE", tx.getTransactionType());
        assertEquals(120, user.getRewardPointsBalance());
    }

    @Test
    void testAwardPointsRefurbishSuccess() {
        request.setRecommendedAction(DisposalAction.REFURBISH);
        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(false);
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> i.getArgument(0));

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNotNull(tx);
        assertEquals(110, tx.getPoints());
        assertEquals("EARN_REFURBISH", tx.getTransactionType());
        assertEquals(110, user.getRewardPointsBalance());
    }

    @Test
    void testAwardPointsBatterySuccess() {
        EWasteItem batteryItem = new EWasteItem();
        batteryItem.setCategory(EWasteCategory.BATTERY);
        request.setItems(List.of(batteryItem));

        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(false);
        when(rewardTransactionRepository.save(any(RewardTransaction.class))).thenAnswer(i -> i.getArgument(0));

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNotNull(tx);
        assertEquals(80, tx.getPoints());
        assertEquals("EARN_BATTERY_HANDLING", tx.getTransactionType());
        assertEquals(80, user.getRewardPointsBalance());
    }

    @Test
    void testDuplicatePointsAwardPrevented() {
        when(rewardTransactionRepository.existsByDisposalRequestId(100L)).thenReturn(true);

        RewardTransaction tx = gamificationService.awardPointsForCompletedRequest(request);

        assertNull(tx);
        assertEquals(0, user.getRewardPointsBalance());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLevelProgressionCalculation() {
        user.setRewardPointsBalance(650); // Eco Contributor tier

        when(disposalRequestRepository.findByUserId(1L)).thenReturn(List.of(request));
        when(rewardTransactionRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        GamificationProfileDTO profile = gamificationService.getUserGamificationProfile(user);

        assertNotNull(profile);
        assertEquals(650, profile.getTotalPoints());
        assertEquals("Eco Contributor", profile.getCurrentLevel());
        assertEquals("Eco Champion", profile.getNextLevel());
        assertEquals(1500, profile.getNextLevelThreshold());
        assertEquals(850, profile.getPointsToNextLevel());
        assertEquals(15, profile.getProgressPercentage()); // (650-500)/1000 = 15%
        assertNotNull(profile.getBadges());
        assertFalse(profile.getBadges().isEmpty());
    }
}
