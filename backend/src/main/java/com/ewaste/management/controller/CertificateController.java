package com.ewaste.management.controller;

import com.ewaste.management.dto.RecyclingCertificateDTO;
import com.ewaste.management.service.CertificateService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecyclingCertificateDTO> getCertificateById(@PathVariable Long id,
                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        RecyclingCertificateDTO dto = certificateService.getCertificateById(id, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadCertificatePdfById(@PathVariable Long id,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        RecyclingCertificateDTO certDTO = certificateService.getCertificateById(id, userDetails.getUsername());
        byte[] pdfBytes = certificateService.downloadCertificatePdfById(id, userDetails.getUsername());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(certDTO.getCertificateNumber() + ".pdf")
                .build());

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<RecyclingCertificateDTO> getCertificateByRequestId(@PathVariable Long requestId,
                                                                             @AuthenticationPrincipal UserDetails userDetails) {
        RecyclingCertificateDTO dto = certificateService.getCertificateByRequestId(requestId, userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/request/{requestId}/download")
    public ResponseEntity<byte[]> downloadCertificatePdfByRequestId(@PathVariable Long requestId,
                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        RecyclingCertificateDTO certDTO = certificateService.getCertificateByRequestId(requestId, userDetails.getUsername());
        byte[] pdfBytes = certificateService.downloadCertificatePdfByRequestId(requestId, userDetails.getUsername());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(certDTO.getCertificateNumber() + ".pdf")
                .build());

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
