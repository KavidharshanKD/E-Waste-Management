package com.ewaste.management.service;

import com.ewaste.management.dto.BulkEWasteItemInput;
import com.ewaste.management.dto.BulkEWasteRequestDTO;
import com.ewaste.management.dto.DisposalRecommendationResult;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.EWasteItemDTO;
import com.ewaste.management.dto.InstitutionDashboardDTO;
import com.ewaste.management.dto.RecommendationInput;
import com.ewaste.management.dto.SchedulePickupRequestDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.DisposalStatusHistory;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.PickupTimeSlot;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InstitutionService {

    private final DisposalRequestRepository disposalRequestRepository;
    private final UserRepository userRepository;
    private final RecommendationService recommendationService;
    private final PickupService pickupService;

    private static final Set<RequestStatus> PENDING_STATUSES = Set.of(
            RequestStatus.SUBMITTED,
            RequestStatus.UNDER_REVIEW,
            RequestStatus.APPROVED,
            RequestStatus.PICKUP_ASSIGNED
    );

    private static final Set<RequestStatus> COMPLETED_STATUSES = Set.of(
            RequestStatus.COLLECTED,
            RequestStatus.AT_RECYCLING_CENTER,
            RequestStatus.PROCESSING,
            RequestStatus.RECYCLED,
            RequestStatus.REUSED,
            RequestStatus.REFURBISHED,
            RequestStatus.COMPLETED
    );

    public InstitutionService(DisposalRequestRepository disposalRequestRepository,
                              UserRepository userRepository,
                              RecommendationService recommendationService,
                              PickupService pickupService) {
        this.disposalRequestRepository = disposalRequestRepository;
        this.userRepository = userRepository;
        this.recommendationService = recommendationService;
        this.pickupService = pickupService;
    }

    @Transactional
    public DisposalRequestDTO submitBulkRequest(String userEmail, BulkEWasteRequestDTO dto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        UserProfile profile = user.getProfile();
        if (profile != null) {
            if (dto.getOrganizationName() != null && !dto.getOrganizationName().isBlank()) {
                profile.setOrganizationName(dto.getOrganizationName().trim());
            }
            if (dto.getOrganizationType() != null) {
                profile.setOrganizationType(dto.getOrganizationType());
            }
            if (dto.getGstNumber() != null && !dto.getGstNumber().isBlank()) {
                profile.setGstNumber(dto.getGstNumber().trim());
            }
            if (dto.getContactPerson() != null && !dto.getContactPerson().isBlank()) {
                profile.setContactPerson(dto.getContactPerson().trim());
            }
        }

        DisposalRequest request = new DisposalRequest();
        request.setTrackingNumber("BLK-2026-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        request.setUser(user);
        request.setStatus(RequestStatus.SUBMITTED);
        request.setIsBulkRequest(true);
        request.setOrganizationName(dto.getOrganizationName() != null && !dto.getOrganizationName().isBlank()
                ? dto.getOrganizationName().trim()
                : (profile != null && profile.getOrganizationName() != null ? profile.getOrganizationName() : "Institution"));

        request.setPickupAddress(dto.getPickupAddress().trim());
        request.setPickupCity(dto.getPickupCity().trim());
        request.setPickupState(dto.getPickupState().trim());
        request.setPickupPostalCode(dto.getPickupPostalCode().trim());
        request.setPreferredPickupDate(dto.getPreferredDate() != null ? dto.getPreferredDate() : LocalDateTime.now().plusDays(2));
        request.setNotes(dto.getNotes());

        DisposalAction overallAction = DisposalAction.RECYCLE;

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (BulkEWasteItemInput itemInput : dto.getItems()) {
                EWasteItem item = new EWasteItem();
                item.setCategory(itemInput.getCategory());
                item.setBrand(itemInput.getBrand() != null ? itemInput.getBrand() : "Generic");
                item.setModelName(itemInput.getDeviceName() != null ? itemInput.getDeviceName() : itemInput.getCategory().name());
                item.setQuantity(itemInput.getQuantity() != null ? itemInput.getQuantity() : 1);
                item.setCondition(itemInput.getCondition());
                item.setWorkingStatus(itemInput.getWorkingStatus() != null ? itemInput.getWorkingStatus() : "Working");
                item.setDescription(itemInput.getDescription());
                request.addItem(item);

                // Run disposal recommendation engine
                RecommendationInput recInput = new RecommendationInput();
                recInput.setCategory(itemInput.getCategory());
                recInput.setCondition(itemInput.getCondition());
                recInput.setWorkingStatus(itemInput.getWorkingStatus());
                recInput.setDamageCondition(itemInput.getCondition().name());
                recInput.setDeviceAgeYears(3);

                DisposalRecommendationResult recResult = recommendationService.getRecommendation(recInput);
                if (recResult != null && recResult.getRecommendedAction() != null) {
                    overallAction = recResult.getRecommendedAction();
                }
            }
        }

        request.setRecommendedAction(overallAction);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(RequestStatus.SUBMITTED);
        history.setToStatus(RequestStatus.SUBMITTED);
        history.setChangedBy(user);
        history.setComment("Institutional bulk disposal request submitted with " + (dto.getItems() != null ? dto.getItems().size() : 0) + " item line(s).");
        history.setTimestamp(LocalDateTime.now());
        request.addStatusHistory(history);

        DisposalRequest savedRequest = disposalRequestRepository.save(request);

        // Schedule doorstep pickup automatically if contact phone provided
        if (dto.getContactPhone() != null && !dto.getContactPhone().isBlank()) {
            try {
                SchedulePickupRequestDTO pickupDto = new SchedulePickupRequestDTO();
                pickupDto.setDisposalRequestId(savedRequest.getId());
                pickupDto.setPickupAddress(savedRequest.getPickupAddress());
                pickupDto.setPreferredDate(savedRequest.getPreferredPickupDate());
                
                PickupTimeSlot slot = PickupTimeSlot.MORNING;
                if (dto.getPreferredTimeSlot() != null) {
                    try {
                        slot = PickupTimeSlot.valueOf(dto.getPreferredTimeSlot().toUpperCase());
                    } catch (Exception ignored) {}
                }
                pickupDto.setPreferredTimeSlot(slot);
                pickupDto.setContactNumber(dto.getContactPhone());
                pickupDto.setNotes("Bulk doorstep pickup request for " + savedRequest.getOrganizationName());
                pickupService.schedulePickup(pickupDto, user);
            } catch (Exception ignored) {}
        }

        return mapToDTO(savedRequest);
    }

    @Transactional(readOnly = true)
    public InstitutionDashboardDTO getInstitutionDashboard(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        UserProfile profile = user.getProfile();
        List<DisposalRequest> bulkRequests = disposalRequestRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().filter(r -> Boolean.TRUE.equals(r.getIsBulkRequest())).collect(Collectors.toList());

        long totalAssetsDisposed = 0;
        long pendingCollections = 0;
        long completedCollections = 0;

        for (DisposalRequest req : bulkRequests) {
            if (PENDING_STATUSES.contains(req.getStatus())) {
                pendingCollections++;
            } else if (COMPLETED_STATUSES.contains(req.getStatus())) {
                completedCollections++;
            }

            if (req.getItems() != null) {
                for (EWasteItem item : req.getItems()) {
                    totalAssetsDisposed += item.getQuantity() != null ? item.getQuantity() : 1;
                }
            }
        }

        InstitutionDashboardDTO dto = new InstitutionDashboardDTO();
        dto.setOrganizationName(profile != null && profile.getOrganizationName() != null ? profile.getOrganizationName() : user.getFullName());
        dto.setOrganizationType(profile != null && profile.getOrganizationType() != null ? profile.getOrganizationType().name() : "INSTITUTION");
        dto.setContactPerson(profile != null && profile.getContactPerson() != null ? profile.getContactPerson() : user.getFullName());
        dto.setTotalAssetsDisposed(totalAssetsDisposed);
        dto.setPendingCollections(pendingCollections);
        dto.setCompletedCollections(completedCollections);
        dto.setTotalBulkRequests((long) bulkRequests.size());
        dto.setRecentBulkRequests(bulkRequests.stream().map(this::mapToDTO).collect(Collectors.toList()));

        return dto;
    }

    @Transactional(readOnly = true)
    public byte[] generateAssetReportPdf(Long requestId, String userEmail) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (!request.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Access denied for asset processing report: " + requestId);
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Color primaryColor = new Color(5, 150, 105); // Emerald Green
            Color darkColor = new Color(30, 41, 59);     // Slate 800
            Color grayColor = new Color(71, 85, 105);    // Slate 600
            Color bgLight = new Color(248, 250, 252);     // Slate 50

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkColor);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryColor);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkColor);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkColor);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, grayColor);

            Paragraph title = new Paragraph("INSTITUTIONAL E-WASTE ASSET PROCESSING REPORT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subTitle = new Paragraph("Smart E-Waste Management Platform • Corporate & Institutional Compliance", subtitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(16);
            document.add(subTitle);

            // Organization & Request Summary Table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{40f, 60f});
            metaTable.setSpacingAfter(16);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm");
            String reqDate = request.getCreatedAt() != null ? request.getCreatedAt().format(formatter) : "N/A";
            UserProfile prof = request.getUser().getProfile();

            addTableRow(metaTable, "Bulk Tracking Ref", request.getTrackingNumber(), labelFont, valueFont, bgLight);
            addTableRow(metaTable, "Organization Name", request.getOrganizationName() != null ? request.getOrganizationName() : "N/A", labelFont, valueFont, Color.WHITE);
            addTableRow(metaTable, "Organization Type", prof != null && prof.getOrganizationType() != null ? prof.getOrganizationType().name() : "INSTITUTION", labelFont, valueFont, bgLight);
            addTableRow(metaTable, "GST / Ref Number", prof != null && prof.getGstNumber() != null ? prof.getGstNumber() : "N/A", labelFont, valueFont, Color.WHITE);
            addTableRow(metaTable, "Contact Person", prof != null && prof.getContactPerson() != null ? prof.getContactPerson() : request.getUser().getFullName(), labelFont, valueFont, bgLight);
            addTableRow(metaTable, "Submission Date", reqDate, labelFont, valueFont, Color.WHITE);
            addTableRow(metaTable, "Current Processing Status", request.getStatus().name(), labelFont, valueFont, bgLight);

            document.add(metaTable);

            // Asset Inventory Section Header
            Paragraph assetHeader = new Paragraph("Bulk Asset Inventory Breakdown", sectionFont);
            assetHeader.setSpacingAfter(8);
            document.add(assetHeader);

            // Items Table
            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{25f, 25f, 15f, 15f, 20f});
            itemsTable.setSpacingAfter(16);

            // Header Cells
            addHeaderCell(itemsTable, "Category", labelFont, primaryColor);
            addHeaderCell(itemsTable, "Device / Brand", labelFont, primaryColor);
            addHeaderCell(itemsTable, "Quantity", labelFont, primaryColor);
            addHeaderCell(itemsTable, "Condition", labelFont, primaryColor);
            addHeaderCell(itemsTable, "Action", labelFont, primaryColor);

            int totalQty = 0;
            if (request.getItems() != null) {
                for (EWasteItem item : request.getItems()) {
                    int q = item.getQuantity() != null ? item.getQuantity() : 1;
                    totalQty += q;
                    addTableRowCell(itemsTable, item.getCategory().name(), valueFont);
                    addTableRowCell(itemsTable, item.getBrand() + " " + item.getModelName(), valueFont);
                    addTableRowCell(itemsTable, String.valueOf(q), valueFont);
                    addTableRowCell(itemsTable, item.getCondition().name(), valueFont);
                    addTableRowCell(itemsTable, request.getRecommendedAction() != null ? request.getRecommendedAction().name() : "RECYCLE", valueFont);
                }
            }

            document.add(itemsTable);

            // Total Assets Summary Box
            Paragraph totalSummary = new Paragraph("Total Bulk Assets Accounted For: " + totalQty + " unit(s)", subtitleFont);
            totalSummary.setAlignment(Element.ALIGN_RIGHT);
            totalSummary.setSpacingAfter(16);
            document.add(totalSummary);

            // Disclaimer Footer
            Paragraph footer = new Paragraph("Official Institutional Disposal Report • Generated by Smart E-Waste Management System", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(12);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating asset disposal report PDF", e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, Color bgColor) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(bgColor);
        c1.setPadding(6);
        c1.setBorderColor(new Color(226, 232, 240));

        PdfPCell c2 = new PdfPCell(new Phrase(value, valueFont));
        c2.setBackgroundColor(bgColor);
        c2.setPadding(6);
        c2.setBorderColor(new Color(226, 232, 240));

        table.addCell(c1);
        table.addCell(c2);
    }

    private void addHeaderCell(PdfPTable table, String text, Font font, Color primaryColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        cell.setBackgroundColor(primaryColor);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addTableRowCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    private DisposalRequestDTO mapToDTO(DisposalRequest request) {
        DisposalRequestDTO dto = new DisposalRequestDTO();
        dto.setId(request.getId());
        dto.setTrackingNumber(request.getTrackingNumber());
        dto.setStatus(request.getStatus());
        dto.setRecommendedAction(request.getRecommendedAction());
        dto.setPickupAddress(request.getPickupAddress());
        dto.setPickupCity(request.getPickupCity());
        dto.setPickupState(request.getPickupState());
        dto.setPickupPostalCode(request.getPickupPostalCode());
        dto.setPreferredPickupDate(request.getPreferredPickupDate());
        dto.setPickupRequired(request.getPickupRequired());
        dto.setNotes(request.getNotes());
        dto.setCreatedAt(request.getCreatedAt());

        if (request.getUser() != null) {
            dto.setUserId(request.getUser().getId());
            dto.setUserName(request.getUser().getFullName());
            dto.setUserEmail(request.getUser().getEmail());
        }

        if (request.getItems() != null) {
            List<EWasteItemDTO> itemDTOs = request.getItems().stream().map(item -> {
                EWasteItemDTO itemDTO = new EWasteItemDTO();
                itemDTO.setId(item.getId());
                itemDTO.setCategory(item.getCategory());
                itemDTO.setDeviceName(item.getBrand() + " " + item.getModelName());
                itemDTO.setBrand(item.getBrand());
                itemDTO.setModelName(item.getModelName());
                itemDTO.setCondition(item.getCondition());
                itemDTO.setQuantity(item.getQuantity());
                itemDTO.setDescription(item.getDescription());
                return itemDTO;
            }).collect(Collectors.toList());
            dto.setItems(itemDTOs);
        }

        return dto;
    }
}
