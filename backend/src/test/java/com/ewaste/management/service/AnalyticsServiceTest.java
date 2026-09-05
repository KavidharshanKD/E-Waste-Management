package com.ewaste.management.service;

import com.ewaste.management.dto.AdminAnalyticsDTO;
import com.ewaste.management.dto.UserEnvironmentalImpactDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.EnvironmentalFactor;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.EWasteItemRepository;
import com.ewaste.management.repository.EnvironmentalFactorRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private EWasteItemRepository eWasteItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnvironmentalFactorRepository environmentalFactorRepository;

    private AnalyticsService analyticsService;
    private User testUser;
    private DisposalRequest testRequest;
    private EnvironmentalFactor testFactor;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(
                disposalRequestRepository,
                eWasteItemRepository,
                userRepository,
                environmentalFactorRepository
        );

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("citizen@example.com");
        testUser.setRole(UserRole.USER);
        testUser.setRewardPointsBalance(250);

        testRequest = new DisposalRequest();
        testRequest.setId(10L);
        testRequest.setUser(testUser);
        testRequest.setStatus(RequestStatus.COMPLETED);
        testRequest.setRecommendedAction(DisposalAction.REUSE);
        testRequest.setPickupCity("Chennai");
        testRequest.setCreatedAt(LocalDateTime.now());

        EWasteItem item = new EWasteItem();
        item.setId(100L);
        item.setCategory(EWasteCategory.LAPTOP);
        item.setQuantity(2);
        testRequest.addItem(item);

        testFactor = new EnvironmentalFactor();
        testFactor.setId(1L);
        testFactor.setCategory(EWasteCategory.LAPTOP);
        testFactor.setLandfillDiversionKgPerUnit(BigDecimal.valueOf(2.40));
        testFactor.setCo2ReductionKgPerUnit(BigDecimal.valueOf(18.50));
        testFactor.setSourceReference("CPCB Guidelines 2022");
        testFactor.setValidFactor(true);
    }

    @Test
    void getUserImpact_Success() {
        given(userRepository.findByEmail("citizen@example.com")).willReturn(Optional.of(testUser));
        given(disposalRequestRepository.findByUserIdOrderByCreatedAtDesc(1L)).willReturn(List.of(testRequest));
        given(environmentalFactorRepository.findByValidFactorTrue()).willReturn(List.of(testFactor));

        UserEnvironmentalImpactDTO dto = analyticsService.getUserImpact("citizen@example.com");

        assertNotNull(dto);
        assertEquals(2L, dto.getTotalDisposedDevices());
        assertEquals(2L, dto.getReusedOrDonatedDevices());
        assertEquals(1L, dto.getCompletedRequests());
        assertEquals(250, dto.getGreenPoints());
        assertTrue(dto.isHasValidFactors());
        assertEquals(BigDecimal.valueOf(4.80), dto.getEstimatedLandfillDiversionKg());
        assertEquals(BigDecimal.valueOf(37.00), dto.getEstimatedCo2ReductionKg());
    }

    @Test
    void getAdminAnalytics_Success() {
        given(disposalRequestRepository.findAll()).willReturn(List.of(testRequest));
        given(environmentalFactorRepository.findByValidFactorTrue()).willReturn(List.of(testFactor));

        AdminAnalyticsDTO dto = analyticsService.getAdminAnalytics();

        assertNotNull(dto);
        assertEquals(1L, dto.getTotalItemsCollected());
        assertEquals(2L, dto.getTotalQuantity());
        assertEquals(1L, dto.getTotalCompletedRequests());
        assertEquals(2L, dto.getReusedDevices());
        assertTrue(dto.getCategoryDistribution().containsKey("LAPTOP"));
        assertTrue(dto.getTopCitiesDistribution().containsKey("Chennai"));
        assertTrue(dto.isHasValidFactors());
    }
}
