package com.ewaste.management.service;

import com.ewaste.management.dto.BulkEWasteItemInput;
import com.ewaste.management.dto.BulkEWasteRequestDTO;
import com.ewaste.management.dto.CsvPreviewResultDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.OrganizationType;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.model.enums.UserType;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.PickupRepository;

import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class InstitutionServiceTest {

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PickupRepository pickupRepository;

    private RecommendationService recommendationService;
    private PickupService pickupService;
    private InstitutionService institutionService;
    private CsvParserService csvParserService;
    private User testUser;
    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(new RuleBasedRecommendationEngine());
        pickupService = new PickupService(pickupRepository, disposalRequestRepository, userRepository, null);

        institutionService = new InstitutionService(
                disposalRequestRepository,
                userRepository,
                recommendationService,
                pickupService
        );
        csvParserService = new CsvParserService();

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("admin@iit.ac.in");
        testUser.setRole(UserRole.USER);

        testProfile = new UserProfile();
        testProfile.setUserType(UserType.INSTITUTION);
        testProfile.setOrganizationName("IIT Madras");
        testProfile.setOrganizationType(OrganizationType.COLLEGE);
        testProfile.setContactPerson("Prof. Sharma");
        testUser.setProfile(testProfile);
    }

    @Test
    void parseAndValidateCsv_ValidCsvContent_Success() {
        String csvContent = "Category,Device Name,Brand,Quantity,Condition,Working Status,Description\n" +
                "MONITOR,Dell UltraSharp,Dell,40,WORKING,Working,Computer lab monitors\n" +
                "KEYBOARD,Logitech K120,Logitech,25,WORKING,Working,Library keyboards\n" +
                "DESKTOP,OptiPlex,Dell,15,PARTIALLY_WORKING,Partially Working,Mainframe PCs\n" +
                "PRINTER,LaserJet 1020,HP,10,DAMAGED,Not Working,Old printers";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "bulk_items.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        CsvPreviewResultDTO preview = csvParserService.parseAndValidateCsv(file);

        assertNotNull(preview);
        assertEquals(4, preview.getValidRowsCount());
        assertEquals(0, preview.getInvalidRowsCount());
        assertEquals(4, preview.getParsedItems().size());
        assertEquals(EWasteCategory.MONITOR, preview.getParsedItems().get(0).getCategory());
        assertEquals(40, preview.getParsedItems().get(0).getQuantity());
    }

    @Test
    void submitBulkRequest_Success() {
        given(userRepository.findByEmail("admin@iit.ac.in")).willReturn(Optional.of(testUser));
        given(disposalRequestRepository.save(any(DisposalRequest.class))).willAnswer(invocation -> {
            DisposalRequest req = invocation.getArgument(0);
            req.setId(50L);
            return req;
        });

        BulkEWasteRequestDTO dto = new BulkEWasteRequestDTO();
        dto.setOrganizationName("IIT Madras");
        dto.setOrganizationType(OrganizationType.COLLEGE);
        dto.setContactPhone("9876543210");
        dto.setPickupAddress("IIT Campus, Guindy");
        dto.setPickupCity("Chennai");
        dto.setPickupState("Tamil Nadu");
        dto.setPickupPostalCode("600036");
        dto.setPreferredDate(LocalDateTime.now().plusDays(2));

        BulkEWasteItemInput item1 = new BulkEWasteItemInput();
        item1.setCategory(EWasteCategory.MONITOR);
        item1.setQuantity(40);
        item1.setCondition(DeviceCondition.WORKING);

        BulkEWasteItemInput item2 = new BulkEWasteItemInput();
        item2.setCategory(EWasteCategory.KEYBOARD);
        item2.setQuantity(25);
        item2.setCondition(DeviceCondition.WORKING);

        dto.setItems(List.of(item1, item2));

        DisposalRequestDTO result = institutionService.submitBulkRequest("admin@iit.ac.in", dto);

        assertNotNull(result);
        assertNotNull(result.getTrackingNumber());
        assertTrue(result.getTrackingNumber().startsWith("BLK-2026-"));
        assertEquals(2, result.getItems().size());
    }

    @Test
    void generateAssetReportPdf_ReturnsValidPdfBytes() {
        given(userRepository.findByEmail("admin@iit.ac.in")).willReturn(Optional.of(testUser));

        DisposalRequest req = new DisposalRequest();
        req.setId(50L);
        req.setTrackingNumber("BLK-2026-99887766");
        req.setUser(testUser);
        req.setOrganizationName("IIT Madras");
        req.setStatus(RequestStatus.COMPLETED);
        req.setCreatedAt(LocalDateTime.now());

        EWasteItem item = new EWasteItem();
        item.setId(101L);
        item.setCategory(EWasteCategory.MONITOR);
        item.setBrand("Dell");
        item.setModelName("UltraSharp");
        item.setQuantity(40);
        item.setCondition(DeviceCondition.WORKING);
        req.addItem(item);

        given(disposalRequestRepository.findById(50L)).willReturn(Optional.of(req));

        byte[] pdfBytes = institutionService.generateAssetReportPdf(50L, "admin@iit.ac.in");

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        String header = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", header);
    }
}
