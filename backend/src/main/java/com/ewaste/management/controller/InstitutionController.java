package com.ewaste.management.controller;

import com.ewaste.management.dto.BulkEWasteRequestDTO;
import com.ewaste.management.dto.CsvPreviewResultDTO;
import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.InstitutionDashboardDTO;
import com.ewaste.management.service.CsvParserService;
import com.ewaste.management.service.InstitutionService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/institution")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final CsvParserService csvParserService;

    public InstitutionController(InstitutionService institutionService,
                                 CsvParserService csvParserService) {
        this.institutionService = institutionService;
        this.csvParserService = csvParserService;
    }

    @PostMapping("/ewaste/preview-csv")
    public ResponseEntity<CsvPreviewResultDTO> previewCsv(@RequestParam("file") MultipartFile file) {
        CsvPreviewResultDTO preview = csvParserService.parseAndValidateCsv(file);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/ewaste/bulk")
    public ResponseEntity<DisposalRequestDTO> submitBulkRequest(@Valid @RequestBody BulkEWasteRequestDTO dto,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        DisposalRequestDTO requestDTO = institutionService.submitBulkRequest(userDetails.getUsername(), dto);
        return ResponseEntity.ok(requestDTO);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<InstitutionDashboardDTO> getInstitutionDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        InstitutionDashboardDTO dto = institutionService.getInstitutionDashboard(userDetails.getUsername());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/reports/{requestId}/download")
    public ResponseEntity<byte[]> downloadAssetReportPdf(@PathVariable Long requestId,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        byte[] pdfBytes = institutionService.generateAssetReportPdf(requestId, userDetails.getUsername());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("Asset_Disposal_Report_" + requestId + ".pdf")
                .build());

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
