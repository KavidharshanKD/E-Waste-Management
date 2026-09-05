package com.ewaste.management.service;

import com.ewaste.management.dto.AssignCollectorRequestDTO;
import com.ewaste.management.dto.PickupDTO;
import com.ewaste.management.dto.SchedulePickupRequestDTO;
import com.ewaste.management.dto.UpdatePickupStatusDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.Pickup;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;

import com.ewaste.management.model.enums.PickupStatus;
import com.ewaste.management.model.enums.PickupTimeSlot;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PickupServiceTest {

    @Mock
    private PickupRepository pickupRepository;

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PickupService pickupService;

    private User user;
    private User collector;
    private User otherCollector;
    private User admin;
    private DisposalRequest disposalRequest;
    private Pickup pickup;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setEmail("user@example.com");
        user.setRole(UserRole.USER);
        UserProfile up = new UserProfile();
        up.setFirstName("Test");
        up.setLastName("User");
        user.setProfile(up);

        collector = new User();
        collector.setId(20L);
        collector.setEmail("collector@example.com");
        collector.setRole(UserRole.COLLECTOR);
        UserProfile cp = new UserProfile();
        cp.setFirstName("Collector");
        cp.setLastName("John");
        collector.setProfile(cp);

        otherCollector = new User();
        otherCollector.setId(21L);
        otherCollector.setEmail("collector2@example.com");
        otherCollector.setRole(UserRole.COLLECTOR);
        UserProfile ocp = new UserProfile();
        ocp.setFirstName("Collector");
        ocp.setLastName("Bob");
        otherCollector.setProfile(ocp);


        admin = new User();
        admin.setId(30L);
        admin.setRole(UserRole.ADMIN);

        disposalRequest = new DisposalRequest();
        disposalRequest.setId(100L);
        disposalRequest.setUser(user);
        disposalRequest.setTrackingNumber("EW-100");
        disposalRequest.setStatus(RequestStatus.APPROVED);

        pickup = new Pickup();
        pickup.setId(50L);
        pickup.setDisposalRequest(disposalRequest);
        pickup.setCollector(collector);
        pickup.setStatus(PickupStatus.ASSIGNED);
    }

    @Test
    void testSchedulePickupSuccess() {
        SchedulePickupRequestDTO dto = new SchedulePickupRequestDTO();
        dto.setDisposalRequestId(100L);
        dto.setPickupAddress("123 MG Road, Bangalore");
        dto.setPreferredDate(LocalDateTime.now().plusDays(1));
        dto.setPreferredTimeSlot(PickupTimeSlot.MORNING);
        dto.setContactNumber("9876543210");
        dto.setNotes("Handle with care");

        when(disposalRequestRepository.findById(100L)).thenReturn(Optional.of(disposalRequest));
        when(pickupRepository.findByDisposalRequestId(100L)).thenReturn(Optional.empty());
        when(pickupRepository.save(any(Pickup.class))).thenAnswer(i -> {
            Pickup p = i.getArgument(0);
            p.setId(50L);
            return p;
        });

        PickupDTO result = pickupService.schedulePickup(dto, user);

        assertNotNull(result);
        assertEquals(PickupTimeSlot.MORNING, result.getTimeSlot());
        assertEquals("9876543210", result.getContactNumber());
        assertEquals("123 MG Road, Bangalore", result.getPickupAddress());
        verify(disposalRequestRepository, times(1)).save(disposalRequest);
    }

    @Test
    void testAssignCollectorSuccess() {
        AssignCollectorRequestDTO dto = new AssignCollectorRequestDTO(20L);

        when(pickupRepository.findById(50L)).thenReturn(Optional.of(pickup));
        when(userRepository.findById(20L)).thenReturn(Optional.of(collector));
        when(pickupRepository.save(any(Pickup.class))).thenReturn(pickup);

        PickupDTO result = pickupService.assignCollector(50L, dto, admin);

        assertNotNull(result);
        assertEquals("Collector John", result.getCollectorName());
        assertEquals(RequestStatus.PICKUP_ASSIGNED, disposalRequest.getStatus());
    }

    @Test
    void testCollectorUpdateStatusSuccess() {
        UpdatePickupStatusDTO dto = new UpdatePickupStatusDTO(PickupStatus.ON_THE_WAY, "Navigating to location");

        when(pickupRepository.findById(50L)).thenReturn(Optional.of(pickup));
        when(pickupRepository.save(any(Pickup.class))).thenReturn(pickup);

        PickupDTO result = pickupService.updatePickupStatus(50L, dto, collector);

        assertNotNull(result);
        assertEquals("ON_THE_WAY", result.getStatus());
        assertEquals("Navigating to location", result.getCollectorNotes());
    }

    @Test
    void testCollectorUpdateStatusSecurityIsolationFail() {
        UpdatePickupStatusDTO dto = new UpdatePickupStatusDTO(PickupStatus.COLLECTED, "Collected");

        when(pickupRepository.findById(50L)).thenReturn(Optional.of(pickup));

        // Attempt by otherCollector who is not assigned to this pickup
        assertThrows(AccessDeniedException.class, () -> {
            pickupService.updatePickupStatus(50L, dto, otherCollector);
        });

        verify(pickupRepository, never()).save(any(Pickup.class));
    }

    @Test
    void testStatusSyncToCollected() {
        UpdatePickupStatusDTO dto = new UpdatePickupStatusDTO(PickupStatus.COLLECTED, "Collected e-waste successfully");

        when(pickupRepository.findById(50L)).thenReturn(Optional.of(pickup));
        when(pickupRepository.save(any(Pickup.class))).thenAnswer(i -> i.getArgument(0));

        PickupDTO result = pickupService.updatePickupStatus(50L, dto, collector);

        assertNotNull(result);
        assertEquals("COLLECTED", result.getStatus());
        assertEquals(RequestStatus.COLLECTED, disposalRequest.getStatus());
        assertNotNull(pickup.getActualPickupDate());
    }
}
