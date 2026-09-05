package com.ewaste.management.service;

import com.ewaste.management.dto.AssignCollectorRequestDTO;
import com.ewaste.management.dto.EWasteItemDTO;
import com.ewaste.management.dto.PickupDTO;
import com.ewaste.management.dto.SchedulePickupRequestDTO;
import com.ewaste.management.dto.UpdatePickupStatusDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.DisposalStatusHistory;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.Pickup;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.PickupStatus;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;
import com.ewaste.management.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PickupService {

    private final PickupRepository pickupRepository;
    private final DisposalRequestRepository disposalRequestRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;

    public PickupService(PickupRepository pickupRepository,
                         DisposalRequestRepository disposalRequestRepository,
                         UserRepository userRepository,
                         GamificationService gamificationService) {
        this.pickupRepository = pickupRepository;
        this.disposalRequestRepository = disposalRequestRepository;
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
    }


    @Transactional
    public PickupDTO schedulePickup(SchedulePickupRequestDTO dto, User user) {
        DisposalRequest disposalRequest = disposalRequestRepository.findById(dto.getDisposalRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + dto.getDisposalRequestId()));

        // Security check: Only request owner or admin can schedule pickup
        if (!disposalRequest.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("You are not authorized to schedule pickup for this request");
        }

        // Check if pickup already exists for this request
        Pickup pickup = pickupRepository.findByDisposalRequestId(dto.getDisposalRequestId())
                .orElse(new Pickup());

        pickup.setDisposalRequest(disposalRequest);
        pickup.setScheduledDate(dto.getPreferredDate());
        pickup.setTimeSlot(dto.getPreferredTimeSlot());
        pickup.setPickupAddress(dto.getPickupAddress());
        pickup.setContactNumber(dto.getContactNumber());
        pickup.setUserNotes(dto.getNotes());
        
        if (pickup.getStatus() == null || pickup.getStatus() == PickupStatus.CANCELLED || pickup.getStatus() == PickupStatus.FAILED) {
            pickup.setStatus(PickupStatus.SCHEDULED);
        }

        if (pickup.getVerificationCode() == null) {
            pickup.setVerificationCode("PKP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }

        // Update disposal request preferences
        disposalRequest.setPickupRequired(true);
        disposalRequest.setPreferredPickupDate(dto.getPreferredDate());
        disposalRequest.setPickupAddress(dto.getPickupAddress());
        disposalRequestRepository.save(disposalRequest);

        Pickup savedPickup = pickupRepository.save(pickup);
        return mapToDTO(savedPickup);
    }

    @Transactional(readOnly = true)
    public List<PickupDTO> getPendingPickups() {
        List<Pickup> pickups = pickupRepository.findByStatusIn(List.of(PickupStatus.SCHEDULED, PickupStatus.ASSIGNED));
        return pickups.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PickupDTO> getAllPickups() {
        return pickupRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PickupDTO assignCollector(Long pickupId, AssignCollectorRequestDTO dto, User adminUser) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found with ID: " + pickupId));

        User collector = userRepository.findById(dto.getCollectorId())
                .orElseThrow(() -> new IllegalArgumentException("Collector user not found: " + dto.getCollectorId()));

        if (collector.getRole() != UserRole.COLLECTOR) {
            throw new IllegalArgumentException("User " + collector.getEmail() + " is not a collector");
        }

        pickup.setCollector(collector);
        pickup.setStatus(PickupStatus.ASSIGNED);

        DisposalRequest request = pickup.getDisposalRequest();
        RequestStatus oldStatus = request.getStatus();

        if (oldStatus != RequestStatus.PICKUP_ASSIGNED) {
            request.setStatus(RequestStatus.PICKUP_ASSIGNED);

            DisposalStatusHistory history = new DisposalStatusHistory();
            history.setFromStatus(oldStatus);
            history.setToStatus(RequestStatus.PICKUP_ASSIGNED);
            history.setChangedBy(adminUser);
            history.setComment("Collector " + collector.getFullName() + " assigned for doorstep pickup.");
            history.setTimestamp(LocalDateTime.now());

            request.addStatusHistory(history);
            disposalRequestRepository.save(request);
        }

        Pickup savedPickup = pickupRepository.save(pickup);
        return mapToDTO(savedPickup);
    }

    @Transactional(readOnly = true)
    public List<PickupDTO> getCollectorPickups(User collector) {
        List<Pickup> pickups = pickupRepository.findByCollectorIdOrderByScheduledDateDesc(collector.getId());
        return pickups.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public PickupDTO updatePickupStatus(Long pickupId, UpdatePickupStatusDTO dto, User collector) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new IllegalArgumentException("Pickup not found with ID: " + pickupId));

        // SECURITY CHECK: Collectors can only modify pickups assigned to them
        if (pickup.getCollector() == null || !pickup.getCollector().getId().equals(collector.getId())) {
            throw new AccessDeniedException("Access denied: You are only authorized to modify pickups assigned to you.");
        }

        PickupStatus newPickupStatus = dto.getStatus();
        pickup.setStatus(newPickupStatus);

        if (dto.getCollectorNotes() != null && !dto.getCollectorNotes().isBlank()) {
            pickup.setCollectorNotes(dto.getCollectorNotes());
        }

        DisposalRequest request = pickup.getDisposalRequest();
        RequestStatus oldRequestStatus = request.getStatus();

        if (newPickupStatus == PickupStatus.COLLECTED) {
            pickup.setActualPickupDate(LocalDateTime.now());
            request.setStatus(RequestStatus.COLLECTED);

            DisposalStatusHistory history = new DisposalStatusHistory();
            history.setFromStatus(oldRequestStatus);
            history.setToStatus(RequestStatus.COLLECTED);
            history.setChangedBy(collector);
            history.setComment(dto.getCollectorNotes() != null && !dto.getCollectorNotes().isBlank() 
                    ? dto.getCollectorNotes() : "Items collected successfully by collector.");
            history.setTimestamp(LocalDateTime.now());

            request.addStatusHistory(history);
            disposalRequestRepository.save(request);

            // Award green points automatically for verified doorstep collection
            gamificationService.awardPointsForCompletedRequest(request);

        } else {
            // Log status history update if applicable
            DisposalStatusHistory history = new DisposalStatusHistory();
            history.setFromStatus(oldRequestStatus);
            history.setToStatus(oldRequestStatus);
            history.setChangedBy(collector);
            history.setComment("Pickup status updated to " + newPickupStatus + ". Notes: " + (dto.getCollectorNotes() != null ? dto.getCollectorNotes() : "N/A"));
            history.setTimestamp(LocalDateTime.now());
            request.addStatusHistory(history);
            disposalRequestRepository.save(request);
        }

        Pickup savedPickup = pickupRepository.save(pickup);
        return mapToDTO(savedPickup);
    }

    @Transactional(readOnly = true)
    public List<PickupDTO> getUserPickups(User user) {
        List<Pickup> pickups = pickupRepository.findByDisposalRequestUserIdOrderByCreatedAtDesc(user.getId());
        return pickups.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PickupDTO getPickupByRequestId(Long requestId, User user) {
        Pickup pickup = pickupRepository.findByDisposalRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("No pickup scheduled for disposal request: " + requestId));

        // Security check
        boolean isOwner = pickup.getDisposalRequest().getUser().getId().equals(user.getId());
        boolean isAssignedCollector = pickup.getCollector() != null && pickup.getCollector().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAssignedCollector && !isAdmin) {
            throw new AccessDeniedException("Access denied for pickup associated with request: " + requestId);
        }

        return mapToDTO(pickup);
    }

    private PickupDTO mapToDTO(Pickup pickup) {
        PickupDTO dto = new PickupDTO();
        dto.setId(pickup.getId());
        if (pickup.getDisposalRequest() != null) {
            dto.setDisposalRequestId(pickup.getDisposalRequest().getId());
            dto.setTrackingNumber(pickup.getDisposalRequest().getTrackingNumber());
            if (pickup.getDisposalRequest().getUser() != null) {
                dto.setUserName(pickup.getDisposalRequest().getUser().getFullName());
            }

            if (pickup.getDisposalRequest().getItems() != null) {
                List<EWasteItemDTO> itemDTOs = pickup.getDisposalRequest().getItems().stream().map(item -> {
                    EWasteItemDTO itemDTO = new EWasteItemDTO();
                    itemDTO.setId(item.getId());
                    itemDTO.setCategory(item.getCategory());
                    itemDTO.setDeviceName(item.getBrand() != null && item.getModelName() != null ? item.getBrand() + " " + item.getModelName() : item.getCategory().name());
                    itemDTO.setBrand(item.getBrand());
                    itemDTO.setModelName(item.getModelName());
                    itemDTO.setCondition(item.getCondition());
                    itemDTO.setQuantity(item.getQuantity());
                    itemDTO.setDescription(item.getDescription());
                    return itemDTO;
                }).collect(Collectors.toList());
                dto.setItems(itemDTOs);
            }
        }
        if (pickup.getCollector() != null) {
            dto.setCollectorId(pickup.getCollector().getId());
            dto.setCollectorName(pickup.getCollector().getFullName());
        }
        dto.setScheduledDate(pickup.getScheduledDate());
        dto.setTimeSlot(pickup.getTimeSlot());
        dto.setPickupAddress(pickup.getPickupAddress() != null ? pickup.getPickupAddress() : (pickup.getDisposalRequest() != null ? pickup.getDisposalRequest().getPickupAddress() : null));
        dto.setContactNumber(pickup.getContactNumber());
        dto.setNotes(pickup.getUserNotes());
        dto.setActualPickupDate(pickup.getActualPickupDate());
        dto.setStatus(pickup.getStatus() != null ? pickup.getStatus().name() : PickupStatus.SCHEDULED.name());
        dto.setCollectorNotes(pickup.getCollectorNotes());
        dto.setVerificationCode(pickup.getVerificationCode());
        return dto;
    }
}
