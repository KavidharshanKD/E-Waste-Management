package com.ewaste.management.service;

import com.ewaste.management.dto.PublicCertificateVerifyDTO;
import com.ewaste.management.dto.RecyclingCertificateDTO;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.RecyclingCertificate;
import com.ewaste.management.entity.User;
import com.ewaste.management.entity.UserProfile;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.RecyclingCertificateRepository;
import com.ewaste.management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CertificateServiceTest {

    @Mock
    private RecyclingCertificateRepository certificateRepository;

    @Mock
    private DisposalRequestRepository disposalRequestRepository;

    @Mock
    private UserRepository userRepository;

    private CertificateService certificateService;
    private User testUser;
    private DisposalRequest testRequest;
    private RecyclingCertificate testCert;

    @BeforeEach
    void setUp() {
        QRCodeGeneratorService qrCodeGeneratorService = new QRCodeGeneratorService();
        CertificatePdfGeneratorService pdfGeneratorService = new CertificatePdfGeneratorService(qrCodeGeneratorService);

        certificateService = new CertificateService(
                certificateRepository,
                disposalRequestRepository,
                userRepository,
                pdfGeneratorService
        );

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("ramesh@example.com");
        testUser.setRole(UserRole.USER);

        UserProfile profile = new UserProfile();
        profile.setFirstName("Ramesh");
        profile.setLastName("Kumar");
        testUser.setProfile(profile);

        testRequest = new DisposalRequest();
        testRequest.setId(10L);
        testRequest.setTrackingNumber("EW-2026-ABCD1234");
        testRequest.setUser(testUser);
        testRequest.setStatus(RequestStatus.COMPLETED);
        testRequest.setRecommendedAction(DisposalAction.RECYCLE);

        EWasteItem item = new EWasteItem();
        item.setId(100L);
        item.setCategory(EWasteCategory.LAPTOP);
        item.setQuantity(1);
        testRequest.addItem(item);

        testCert = new RecyclingCertificate();
        testCert.setId(50L);
        testCert.setCertificateNumber("EWC-2026-98765432");
        testCert.setDisposalRequest(testRequest);
    }

    @Test
    void getCertificateByRequestId_Success() {
        org.mockito.BDDMockito.given(userRepository.findByEmail("ramesh@example.com")).willReturn(Optional.of(testUser));
        org.mockito.BDDMockito.given(disposalRequestRepository.findById(10L)).willReturn(Optional.of(testRequest));
        org.mockito.BDDMockito.given(certificateRepository.findByDisposalRequestId(10L)).willReturn(Optional.of(testCert));

        RecyclingCertificateDTO dto = certificateService.getCertificateByRequestId(10L, "ramesh@example.com");

        assertNotNull(dto);
        assertEquals("EWC-2026-98765432", dto.getCertificateNumber());
        assertEquals("EW-2026-ABCD1234", dto.getTrackingNumber());
        assertEquals("Ramesh Kumar", dto.getUserName());
        assertEquals("LAPTOP", dto.getCategory());
    }

    @Test
    void downloadCertificatePdf_ReturnsValidPdfBytes() {
        org.mockito.BDDMockito.given(userRepository.findByEmail("ramesh@example.com")).willReturn(Optional.of(testUser));
        org.mockito.BDDMockito.given(disposalRequestRepository.findById(10L)).willReturn(Optional.of(testRequest));
        org.mockito.BDDMockito.given(certificateRepository.findByDisposalRequestId(10L)).willReturn(Optional.of(testCert));

        byte[] pdfBytes = certificateService.downloadCertificatePdfByRequestId(10L, "ramesh@example.com");

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        String header = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", header);
    }

    @Test
    void getCertificateByRequestId_UnauthorizedUser_ThrowsException() {
        User unauthorizedUser = new User();
        unauthorizedUser.setId(99L);
        unauthorizedUser.setEmail("hacker@example.com");
        unauthorizedUser.setRole(UserRole.USER);

        org.mockito.BDDMockito.given(userRepository.findByEmail("hacker@example.com")).willReturn(Optional.of(unauthorizedUser));
        org.mockito.BDDMockito.given(disposalRequestRepository.findById(10L)).willReturn(Optional.of(testRequest));

        assertThrows(AccessDeniedException.class, () -> {
            certificateService.getCertificateByRequestId(10L, "hacker@example.com");
        });
    }

    @Test
    void verifyCertificatePublic_ValidCertificate_NoPIIExposed() {
        org.mockito.BDDMockito.given(certificateRepository.findByCertificateNumber("EWC-2026-98765432")).willReturn(Optional.of(testCert));

        PublicCertificateVerifyDTO dto = certificateService.verifyCertificatePublic("EWC-2026-98765432");

        assertNotNull(dto);
        assertTrue(dto.isValid());
        assertEquals("EWC-2026-98765432", dto.getCertificateNumber());
        assertEquals("EW-2026-ABCD1234", dto.getTrackingNumber());
        assertEquals("LAPTOP", dto.getCategory());
        assertNotNull(dto.getDisclaimer());
    }

    @Test
    void verifyCertificatePublic_InvalidCertificate_ReturnsInvalidState() {
        org.mockito.BDDMockito.given(certificateRepository.findByCertificateNumber("EWC-INVALID")).willReturn(Optional.empty());

        PublicCertificateVerifyDTO dto = certificateService.verifyCertificatePublic("EWC-INVALID");

        assertNotNull(dto);
        assertFalse(dto.isValid());
        assertEquals("NOT_FOUND", dto.getStatus());
    }
}
