package com.ewaste.management.service;

import com.ewaste.management.dto.BadgeDTO;
import com.ewaste.management.dto.GamificationProfileDTO;
import com.ewaste.management.dto.RewardTransactionDTO;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.ewaste.management.notification.NotificationService;

@Service
public class GamificationService {

    private final RewardTransactionRepository rewardTransactionRepository;
    private final DisposalRequestRepository disposalRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public GamificationService(RewardTransactionRepository rewardTransactionRepository,
                               DisposalRequestRepository disposalRequestRepository,
                               UserRepository userRepository,
                               NotificationService notificationService) {
        this.rewardTransactionRepository = rewardTransactionRepository;
        this.disposalRequestRepository = disposalRequestRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }


    @Transactional
    public RewardTransaction awardPointsForCompletedRequest(DisposalRequest request) {
        if (request == null || request.getUser() == null) {
            return null;
        }

        // Idempotency check: Ensure points for this disposal request are only awarded ONCE
        if (rewardTransactionRepository.existsByDisposalRequestId(request.getId())) {
            return null;
        }

        User user = request.getUser();
        int points = 100;
        String type = "EARN_RECYCLE";
        String description = "Successful e-waste recycling completion (+100 Green Points)";

        // Check if request contains battery or special handling
        boolean isBattery = false;
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (EWasteItem item : request.getItems()) {
                if (item.getCategory() == EWasteCategory.BATTERY) {
                    isBattery = true;
                    break;
                }
            }
        }

        if (isBattery || request.getRecommendedAction() == DisposalAction.SPECIAL_HANDLING) {
            points = 80;
            type = "EARN_BATTERY_HANDLING";
            description = "Safe disposal & hazardous handling of battery e-waste (+80 Green Points)";
        } else if (request.getRecommendedAction() == DisposalAction.DONATE) {
            points = 150;
            type = "EARN_DONATE";
            description = "Verified device donation for social reuse (+150 Green Points)";
        } else if (request.getRecommendedAction() == DisposalAction.REUSE) {
            points = 120;
            type = "EARN_REUSE";
            description = "Verified circular economy device reuse (+120 Green Points)";
        } else if (request.getRecommendedAction() == DisposalAction.REFURBISH) {
            points = 110;
            type = "EARN_REFURBISH";
            description = "Verified device refurbishing & component recovery (+110 Green Points)";
        }

        // Increment user's point balance
        int currentBalance = user.getRewardPointsBalance() != null ? user.getRewardPointsBalance() : 0;
        user.setRewardPointsBalance(currentBalance + points);
        userRepository.save(user);

        // Record RewardTransaction
        RewardTransaction tx = new RewardTransaction();
        tx.setUser(user);
        tx.setDisposalRequest(request);
        tx.setPoints(points);
        tx.setTransactionType(type);
        tx.setDescription(description);

        RewardTransaction savedTx = rewardTransactionRepository.save(tx);
        if (notificationService != null) {
            notificationService.sendNotification(
                    user,
                    "Green Points Credited",
                    "You earned +" + points + " Green Points! " + description,
                    "GREEN_POINTS_CREDITED"
            );
        }
        return savedTx;
    }



    @Transactional(readOnly = true)
    public GamificationProfileDTO getUserGamificationProfile(User user) {
        int totalPoints = user.getRewardPointsBalance() != null ? user.getRewardPointsBalance() : 0;

        GamificationProfileDTO profile = new GamificationProfileDTO();
        profile.setTotalPoints(totalPoints);

        // Calculate level and progress percentage
        if (totalPoints < 500) {
            profile.setCurrentLevel("Green Starter");
            profile.setNextLevel("Eco Contributor");
            profile.setNextLevelThreshold(500);
            profile.setPointsToNextLevel(500 - totalPoints);
            profile.setProgressPercentage((int) Math.min(100, Math.max(0, (totalPoints / 500.0) * 100)));
        } else if (totalPoints < 1500) {
            profile.setCurrentLevel("Eco Contributor");
            profile.setNextLevel("Eco Champion");
            profile.setNextLevelThreshold(1500);
            profile.setPointsToNextLevel(1500 - totalPoints);
            profile.setProgressPercentage((int) Math.min(100, Math.max(0, ((totalPoints - 500) / 1000.0) * 100)));
        } else if (totalPoints < 3000) {
            profile.setCurrentLevel("Eco Champion");
            profile.setNextLevel("Planet Guardian");
            profile.setNextLevelThreshold(3000);
            profile.setPointsToNextLevel(3000 - totalPoints);
            profile.setProgressPercentage((int) Math.min(100, Math.max(0, ((totalPoints - 1500) / 1500.0) * 100)));
        } else {
            profile.setCurrentLevel("Planet Guardian");
            profile.setNextLevel("Max Level Unlocked");
            profile.setNextLevelThreshold(3000);
            profile.setPointsToNextLevel(0);
            profile.setProgressPercentage(100);
        }

        // Fetch user requests for badge unlock criteria
        List<DisposalRequest> userRequests = disposalRequestRepository.findByUserId(user.getId());
        int completedCount = 0;
        int totalDevicesCount = 0;
        boolean hasBatteryDisposal = false;
        boolean hasReuseOrDonate = false;

        for (DisposalRequest req : userRequests) {
            if (req.getStatus() == RequestStatus.COLLECTED ||
                req.getStatus() == RequestStatus.AT_RECYCLING_CENTER ||
                req.getStatus() == RequestStatus.PROCESSING ||
                req.getStatus() == RequestStatus.RECYCLED ||
                req.getStatus() == RequestStatus.REUSED ||
                req.getStatus() == RequestStatus.REFURBISHED ||
                req.getStatus() == RequestStatus.COMPLETED) {
                completedCount++;
                if (req.getItems() != null) {
                    for (EWasteItem item : req.getItems()) {
                        totalDevicesCount += (item.getQuantity() != null ? item.getQuantity() : 1);
                        if (item.getCategory() == EWasteCategory.BATTERY) {
                            hasBatteryDisposal = true;
                        }
                    }
                }
                if (req.getRecommendedAction() == DisposalAction.REUSE || req.getRecommendedAction() == DisposalAction.DONATE) {
                    hasReuseOrDonate = true;
                }
            }
        }

        List<BadgeDTO> badges = new ArrayList<>();
        badges.add(new BadgeDTO(
                "first_recycling",
                "First Recycling",
                "Successfully completed your first verified e-waste disposal request.",
                "bi-award-fill",
                completedCount >= 1,
                completedCount >= 1 ? "Unlocked" : completedCount + "/1 completed"
        ));

        badges.add(new BadgeDTO(
                "5_devices",
                "5 Devices Recycled",
                "Diverted 5 or more electronic devices from landfills.",
                "bi-box-seam-fill",
                totalDevicesCount >= 5,
                totalDevicesCount >= 5 ? "Unlocked" : totalDevicesCount + "/5 devices"
        ));

        badges.add(new BadgeDTO(
                "10_devices",
                "10 Devices Recycled",
                "Eco Pioneer: Safely handed over 10+ electronic items.",
                "bi-trophy-fill",
                totalDevicesCount >= 10,
                totalDevicesCount >= 10 ? "Unlocked" : totalDevicesCount + "/10 devices"
        ));

        badges.add(new BadgeDTO(
                "battery_disposal",
                "Responsible Battery Disposal",
                "Safely disposed of hazardous batteries preventing chemical contamination.",
                "bi-battery-charging",
                hasBatteryDisposal,
                hasBatteryDisposal ? "Unlocked font-weight-bold" : "Pending battery disposal"
        ));

        badges.add(new BadgeDTO(
                "reuse_champion",
                "Reuse Champion",
                "Given electronics a second life through device reuse or donation.",
                "bi-heart-fill",
                hasReuseOrDonate,
                hasReuseOrDonate ? "Unlocked" : "Pending device reuse/donation"
        ));

        profile.setBadges(badges);

        // Fetch reward transaction history
        List<RewardTransaction> txList = rewardTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<RewardTransactionDTO> txDTOs = txList.stream().map(tx -> {
            RewardTransactionDTO dto = new RewardTransactionDTO();
            dto.setId(tx.getId());
            dto.setUserId(user.getId());
            if (tx.getDisposalRequest() != null) {
                dto.setDisposalRequestId(tx.getDisposalRequest().getId());
                dto.setTrackingNumber(tx.getDisposalRequest().getTrackingNumber());
            }
            dto.setPoints(tx.getPoints());
            dto.setTransactionType(tx.getTransactionType());
            dto.setDescription(tx.getDescription());
            dto.setCreatedAt(tx.getCreatedAt());
            return dto;
        }).collect(Collectors.toList());

        profile.setTransactions(txDTOs);
        return profile;
    }
}
