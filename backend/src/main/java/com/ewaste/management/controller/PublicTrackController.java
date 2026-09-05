package com.ewaste.management.controller;

import com.ewaste.management.dto.PublicTrackDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.service.QRCodeGeneratorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
public class PublicTrackController {

    private final DisposalRequestRepository disposalRequestRepository;
    private final QRCodeGeneratorService qrCodeGeneratorService;

    public PublicTrackController(DisposalRequestRepository disposalRequestRepository,
                                 QRCodeGeneratorService qrCodeGeneratorService) {
        this.disposalRequestRepository = disposalRequestRepository;
        this.qrCodeGeneratorService = qrCodeGeneratorService;
    }

    @GetMapping("/track/{trackingId}")
    public ResponseEntity<?> getPublicTrackingInfo(@PathVariable String trackingId) {
        DisposalRequest request = disposalRequestRepository.findByTrackingNumber(trackingId)
                .orElse(null);

        if (request == null) {
            Map<String, String> err = new HashMap<>();
            err.put("error", "Invalid or expired e-waste tracking ID: " + trackingId);
            return ResponseEntity.status(404).body(err);
        }

        PublicTrackDTO dto = new PublicTrackDTO();
        dto.setTrackingNumber(request.getTrackingNumber());
        dto.setStatus(request.getStatus());
        dto.setRecommendedAction(request.getRecommendedAction());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());

        // Processing stage text
        dto.setProcessingStage(getProcessingStageText(request.getStatus()));

        // Recycling center
        if (request.getCenter() != null) {
            dto.setRecyclingCenterName(request.getCenter().getName());
        }


        // Completion status
        boolean isCompleted = request.getStatus() == RequestStatus.COMPLETED ||
                              request.getStatus() == RequestStatus.RECYCLED ||
                              request.getStatus() == RequestStatus.REUSED ||
                              request.getStatus() == RequestStatus.REFURBISHED;
        dto.setCompleted(isCompleted);

        // Devices summary (Sanitized without personal info)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            EWasteItem item = request.getItems().get(0);
            dto.setCategory(item.getCategory() != null ? item.getCategory().name() : "E-Waste");
            dto.setDeviceName(item.getBrand() != null && item.getModelName() != null 
                    ? item.getBrand() + " " + item.getModelName() 
                    : (item.getCategory() != null ? item.getCategory().name() : "Electronic Device"));
            dto.setQuantity(item.getQuantity());
            dto.setCondition(item.getCondition() != null ? item.getCondition().name() : "N/A");
        } else {
            dto.setCategory("E-Waste");
            dto.setDeviceName("Electronic Item");
            dto.setQuantity(1);
            dto.setCondition("N/A");
        }

        // Generate safe QR Code Data URL containing only tracking link
        String trackingUrl = "http://localhost:5173/track/" + request.getTrackingNumber();
        String qrDataUrl = qrCodeGeneratorService.generateQRCodeDataUrl(trackingUrl, 250, 250);
        dto.setQrCodeDataUrl(qrDataUrl);

        // Map status history timeline safely (Without user credentials/PII)
        if (request.getStatusHistories() != null) {
            List<PublicTrackDTO.StatusTimelineItemDTO> timeline = request.getStatusHistories().stream()
                    .map(h -> new PublicTrackDTO.StatusTimelineItemDTO(
                            h.getToStatus(),
                            getProcessingStageText(h.getToStatus()),
                            h.getComment(),
                            h.getTimestamp()
                    ))
                    .collect(Collectors.toList());
            dto.setStatusTimeline(timeline);
        }

        return ResponseEntity.ok(dto);
    }

    private String getProcessingStageText(RequestStatus status) {
        if (status == null) return "Submitted";
        switch (status) {
            case SUBMITTED:
                return "Disposal request registered in public ledger";
            case UNDER_REVIEW:
                return "Verification & center assignment under review";
            case APPROVED:
                return "Disposal request approved for pickup";
            case PICKUP_ASSIGNED:
                return "Doorstep collector assigned for pickup";
            case COLLECTED:
                return "E-waste collected from doorstep";
            case AT_RECYCLING_CENTER:
                return "Arrived safely at eco-recycling facility";
            case PROCESSING:
                return "Sorting, component recovery & hazardous segregation in progress";
            case RECYCLED:
                return "Materials successfully recycled into raw eco-resources";
            case REUSED:
                return "Device repurposed for secondary reuse";
            case REFURBISHED:
                return "Device restored & refurbished for extension of life";
            case COMPLETED:
                return "Lifecycle complete - Recycling certificate generated";
            case CANCELLED:
                return "Request cancelled";
            case REJECTED:
                return "Request non-compliant / rejected";
            default:
                return status.name();
        }
    }
}
