package com.ewaste.management.controller;

import com.ewaste.management.dto.PublicCertificateVerifyDTO;
import com.ewaste.management.service.CertificateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/certificates")
public class PublicCertificateController {

    private final CertificateService certificateService;

    public PublicCertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/verify/{certificateNumber}")
    public ResponseEntity<PublicCertificateVerifyDTO> verifyCertificate(@PathVariable String certificateNumber) {
        PublicCertificateVerifyDTO dto = certificateService.verifyCertificatePublic(certificateNumber);
        return ResponseEntity.ok(dto);
    }
}
