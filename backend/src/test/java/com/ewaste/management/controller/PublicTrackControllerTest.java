package com.ewaste.management.controller;

import com.ewaste.management.dto.PublicTrackDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.service.QRCodeGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicTrackControllerTest {

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    private QRCodeGeneratorService qrCodeGeneratorService = new QRCodeGeneratorService();
    private PublicTrackController publicTrackController;

    private DisposalRequest request;

    @BeforeEach
    void setUp() {
        publicTrackController = new PublicTrackController(disposalRequestRepository, qrCodeGeneratorService);

        User user = new User();
        user.setId(99L);
        user.setEmail("secret@user.com");

        request = new DisposalRequest();
        request.setId(100L);
        request.setTrackingNumber("EW-2026-ABC12345");
        request.setStatus(RequestStatus.COLLECTED);
        request.setUser(user);
        request.setPickupAddress("123 Private St, Secret City");
        request.setCreatedAt(LocalDateTime.now());

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setBrand("Dell");
        item.setModelName("XPS 15");
        item.setCondition(DeviceCondition.WORKING);
        item.setQuantity(1);
        request.setItems(List.of(item));
    }

    @Test
    void testPublicTrackingSuccessWithoutPII() {
        when(disposalRequestRepository.findByTrackingNumber("EW-2026-ABC12345"))
                .thenReturn(Optional.of(request));

        ResponseEntity<?> response = publicTrackController.getPublicTrackingInfo("EW-2026-ABC12345");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof PublicTrackDTO);

        PublicTrackDTO dto = (PublicTrackDTO) response.getBody();
        assertEquals("EW-2026-ABC12345", dto.getTrackingNumber());
        assertEquals("LAPTOP", dto.getCategory());
        assertEquals("Dell XPS 15", dto.getDeviceName());
        assertEquals(RequestStatus.COLLECTED, dto.getStatus());
        assertNotNull(dto.getQrCodeDataUrl());
        assertTrue(dto.getQrCodeDataUrl().startsWith("data:image/png;base64,"));
    }

    @Test
    void testPublicTrackingInvalidId404() {
        when(disposalRequestRepository.findByTrackingNumber("INVALID-ID"))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response = publicTrackController.getPublicTrackingInfo("INVALID-ID");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
