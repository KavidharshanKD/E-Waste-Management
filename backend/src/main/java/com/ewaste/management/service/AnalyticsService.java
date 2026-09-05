package com.ewaste.management.service;

import com.ewaste.management.dto.AdminAnalyticsDTO;
import com.ewaste.management.dto.EnvironmentalFactorDTO;
import com.ewaste.management.dto.UserEnvironmentalImpactDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.EnvironmentalFactor;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.EWasteItemRepository;
import com.ewaste.management.repository.EnvironmentalFactorRepository;
import com.ewaste.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AnalyticsService {

    private final DisposalRequestRepository disposalRequestRepository;
    private final EWasteItemRepository eWasteItemRepository;
    private final UserRepository userRepository;
    private final EnvironmentalFactorRepository environmentalFactorRepository;

    private static final Set<RequestStatus> PROCESSED_STATUSES = Set.of(
            RequestStatus.COLLECTED,
            RequestStatus.AT_RECYCLING_CENTER,
            RequestStatus.PROCESSING,
            RequestStatus.RECYCLED,
            RequestStatus.REUSED,
            RequestStatus.REFURBISHED,
            RequestStatus.COMPLETED
    );

    public AnalyticsService(DisposalRequestRepository disposalRequestRepository,
                            EWasteItemRepository eWasteItemRepository,
                            UserRepository userRepository,
                            EnvironmentalFactorRepository environmentalFactorRepository) {
        this.disposalRequestRepository = disposalRequestRepository;
        this.eWasteItemRepository = eWasteItemRepository;
        this.userRepository = userRepository;
        this.environmentalFactorRepository = environmentalFactorRepository;
    }

    @Transactional(readOnly = true)
    public UserEnvironmentalImpactDTO getUserImpact(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        List<DisposalRequest> userRequests = disposalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<EnvironmentalFactor> factors = environmentalFactorRepository.findByValidFactorTrue();
        Map<EWasteCategory, EnvironmentalFactor> factorMap = new EnumMap<>(EWasteCategory.class);
        for (EnvironmentalFactor f : factors) {
            factorMap.put(f.getCategory(), f);
        }

        long totalDisposedDevices = 0;
        long reusedOrDonatedDevices = 0;
        long completedRequests = 0;

        BigDecimal estLandfillDiversion = BigDecimal.ZERO;
        BigDecimal estCo2Reduction = BigDecimal.ZERO;

        for (DisposalRequest req : userRequests) {
            boolean isCompleted = PROCESSED_STATUSES.contains(req.getStatus());
            if (isCompleted) {
                completedRequests++;
            }

            if (req.getItems() != null) {
                for (EWasteItem item : req.getItems()) {
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    totalDisposedDevices += qty;

                    DisposalAction action = req.getRecommendedAction();
                    if (action == DisposalAction.REUSE || action == DisposalAction.DONATE) {
                        reusedOrDonatedDevices += qty;
                    }

                    if (factorMap.containsKey(item.getCategory())) {
                        EnvironmentalFactor f = factorMap.get(item.getCategory());
                        BigDecimal itemQty = BigDecimal.valueOf(qty);
                        estLandfillDiversion = estLandfillDiversion.add(f.getLandfillDiversionKgPerUnit().multiply(itemQty));
                        estCo2Reduction = estCo2Reduction.add(f.getCo2ReductionKgPerUnit().multiply(itemQty));
                    }
                }
            }
        }

        UserEnvironmentalImpactDTO dto = new UserEnvironmentalImpactDTO();
        dto.setTotalDisposedDevices(totalDisposedDevices);
        dto.setReusedOrDonatedDevices(reusedOrDonatedDevices);
        dto.setCompletedRequests(completedRequests);
        dto.setGreenPoints(user.getRewardPointsBalance() != null ? user.getRewardPointsBalance() : 0);
        dto.setEstimatedLandfillDiversionKg(estLandfillDiversion);
        dto.setEstimatedCo2ReductionKg(estCo2Reduction);
        dto.setHasValidFactors(!factors.isEmpty());
        dto.setFactorSourceReference(!factors.isEmpty() ? factors.get(0).getSourceReference() : "CPCB E-Waste Guidelines");

        return dto;
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDTO getAdminAnalytics() {
        List<DisposalRequest> allRequests = disposalRequestRepository.findAll();
        List<EnvironmentalFactor> factors = environmentalFactorRepository.findByValidFactorTrue();

        Map<EWasteCategory, EnvironmentalFactor> factorMap = new EnumMap<>(EWasteCategory.class);
        for (EnvironmentalFactor f : factors) {
            factorMap.put(f.getCategory(), f);
        }

        long totalItemsCollected = 0;
        long totalQuantity = 0;
        long totalCompletedRequests = 0;
        long reusedDevices = 0;
        long repairedRefurbishedDevices = 0;
        long recycledDevices = 0;
        long specialHandlingDevices = 0;

        Map<String, Long> categoryDistribution = new LinkedHashMap<>();
        Map<String, Long> disposalMethodDistribution = new LinkedHashMap<>();
        Map<String, Long> requestStatusDistribution = new LinkedHashMap<>();
        Map<String, Long> monthlyCollectionTrend = new LinkedHashMap<>();
        Map<String, Long> cityDistribution = new LinkedHashMap<>();

        BigDecimal estLandfillDiversion = BigDecimal.ZERO;
        BigDecimal estCo2Reduction = BigDecimal.ZERO;
        BigDecimal estRecoveredMetals = BigDecimal.ZERO;
        BigDecimal estRecoveredPlastics = BigDecimal.ZERO;

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (DisposalRequest req : allRequests) {
            // Status Distribution
            String statusKey = req.getStatus() != null ? req.getStatus().name() : "SUBMITTED";
            requestStatusDistribution.put(statusKey, requestStatusDistribution.getOrDefault(statusKey, 0L) + 1);

            boolean isProcessed = PROCESSED_STATUSES.contains(req.getStatus());
            if (isProcessed) {
                totalCompletedRequests++;
            }

            // Monthly Trend
            if (req.getCreatedAt() != null) {
                String monthKey = req.getCreatedAt().format(monthFormatter);
                monthlyCollectionTrend.put(monthKey, monthlyCollectionTrend.getOrDefault(monthKey, 0L) + 1);
            }

            // City Distribution
            if (req.getPickupCity() != null && !req.getPickupCity().isBlank()) {
                String cityKey = req.getPickupCity().trim();
                cityDistribution.put(cityKey, cityDistribution.getOrDefault(cityKey, 0L) + 1);
            }

            // Disposal Action Distribution
            DisposalAction action = req.getRecommendedAction();
            if (action != null) {
                disposalMethodDistribution.put(action.name(), disposalMethodDistribution.getOrDefault(action.name(), 0L) + 1);
            }

            if (req.getItems() != null) {
                for (EWasteItem item : req.getItems()) {
                    totalItemsCollected++;
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    totalQuantity += qty;

                    // Category Distribution
                    String catName = item.getCategory() != null ? item.getCategory().name() : "OTHER";
                    categoryDistribution.put(catName, categoryDistribution.getOrDefault(catName, 0L) + qty);

                    // Disposal Action Counts
                    if (action == DisposalAction.REUSE || action == DisposalAction.DONATE) {
                        reusedDevices += qty;
                    } else if (action == DisposalAction.REPAIR || action == DisposalAction.REFURBISH) {
                        repairedRefurbishedDevices += qty;
                    } else if (action == DisposalAction.RECYCLE) {
                        recycledDevices += qty;
                    } else if (action == DisposalAction.SPECIAL_HANDLING) {
                        specialHandlingDevices += qty;
                    }

                    // Estimate Calculations if factors present
                    if (factorMap.containsKey(item.getCategory())) {
                        EnvironmentalFactor f = factorMap.get(item.getCategory());
                        BigDecimal itemQty = BigDecimal.valueOf(qty);
                        estLandfillDiversion = estLandfillDiversion.add(f.getLandfillDiversionKgPerUnit().multiply(itemQty));
                        estCo2Reduction = estCo2Reduction.add(f.getCo2ReductionKgPerUnit().multiply(itemQty));
                        estRecoveredMetals = estRecoveredMetals.add(f.getRecoveredMetalsKgPerUnit().multiply(itemQty));
                        estRecoveredPlastics = estRecoveredPlastics.add(f.getRecoveredPlasticsKgPerUnit().multiply(itemQty));
                    }
                }
            }
        }

        AdminAnalyticsDTO dto = new AdminAnalyticsDTO();
        dto.setTotalItemsCollected(totalItemsCollected);
        dto.setTotalQuantity(totalQuantity);
        dto.setTotalCompletedRequests(totalCompletedRequests);
        dto.setReusedDevices(reusedDevices);
        dto.setRepairedRefurbishedDevices(repairedRefurbishedDevices);
        dto.setRecycledDevices(recycledDevices);
        dto.setSpecialHandlingDevices(specialHandlingDevices);

        dto.setCategoryDistribution(categoryDistribution);
        dto.setDisposalMethodDistribution(disposalMethodDistribution);
        dto.setRequestStatusDistribution(requestStatusDistribution);
        dto.setMonthlyCollectionTrend(monthlyCollectionTrend);
        dto.setTopCitiesDistribution(cityDistribution);

        dto.setEstimatedLandfillDiversionKg(estLandfillDiversion);
        dto.setEstimatedCo2ReductionKg(estCo2Reduction);
        dto.setEstimatedRecoveredMetalsKg(estRecoveredMetals);
        dto.setEstimatedRecoveredPlasticsKg(estRecoveredPlastics);

        dto.setHasValidFactors(!factors.isEmpty());
        dto.setFactorSourceReference(!factors.isEmpty() ? factors.get(0).getSourceReference() : "CPCB E-Waste Guidelines");

        return dto;
    }

    @Transactional(readOnly = true)
    public List<EnvironmentalFactorDTO> getFactors() {
        return environmentalFactorRepository.findAll().stream().map(this::mapFactorToDTO).toList();
    }

    @Transactional
    public EnvironmentalFactorDTO updateFactor(Long id, EnvironmentalFactorDTO dto) {
        EnvironmentalFactor factor = environmentalFactorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Environmental factor not found with ID: " + id));

        if (dto.getLandfillDiversionKgPerUnit() != null) {
            factor.setLandfillDiversionKgPerUnit(dto.getLandfillDiversionKgPerUnit());
        }
        if (dto.getCo2ReductionKgPerUnit() != null) {
            factor.setCo2ReductionKgPerUnit(dto.getCo2ReductionKgPerUnit());
        }
        if (dto.getRecoveredMetalsKgPerUnit() != null) {
            factor.setRecoveredMetalsKgPerUnit(dto.getRecoveredMetalsKgPerUnit());
        }
        if (dto.getRecoveredPlasticsKgPerUnit() != null) {
            factor.setRecoveredPlasticsKgPerUnit(dto.getRecoveredPlasticsKgPerUnit());
        }
        if (dto.getSourceReference() != null && !dto.getSourceReference().isBlank()) {
            factor.setSourceReference(dto.getSourceReference());
        }
        factor.setValidFactor(dto.isValidFactor());

        EnvironmentalFactor saved = environmentalFactorRepository.save(factor);
        return mapFactorToDTO(saved);
    }

    private EnvironmentalFactorDTO mapFactorToDTO(EnvironmentalFactor f) {
        EnvironmentalFactorDTO dto = new EnvironmentalFactorDTO();
        dto.setId(f.getId());
        dto.setCategory(f.getCategory() != null ? f.getCategory().name() : "OTHER");
        dto.setLandfillDiversionKgPerUnit(f.getLandfillDiversionKgPerUnit());
        dto.setCo2ReductionKgPerUnit(f.getCo2ReductionKgPerUnit());
        dto.setRecoveredMetalsKgPerUnit(f.getRecoveredMetalsKgPerUnit());
        dto.setRecoveredPlasticsKgPerUnit(f.getRecoveredPlasticsKgPerUnit());
        dto.setSourceReference(f.getSourceReference());
        dto.setValidFactor(f.isValidFactor());
        return dto;
    }
}
