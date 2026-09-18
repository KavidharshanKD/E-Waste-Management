package com.ewaste.management.controller;

import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.technician.AssessmentResponseDTO;
import com.ewaste.management.dto.technician.CreateAssessmentDTO;
import com.ewaste.management.dto.technician.QualityCheckResponseDTO;
import com.ewaste.management.dto.technician.RestorationJobResponseDTO;
import com.ewaste.management.dto.technician.SubmitQualityCheckDTO;
import com.ewaste.management.dto.technician.UpdateRestorationProgressDTO;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.RestorationStatus;
import com.ewaste.management.repository.UserRepository;
import com.ewaste.management.service.TechnicianWorkflowService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recycler")
@PreAuthorize("hasAnyRole('RECYCLER', 'ADMIN')")
public class RecyclerWorkflowController {

    private final TechnicianWorkflowService technicianWorkflowService;
    private final UserRepository userRepository;

    public RecyclerWorkflowController(TechnicianWorkflowService technicianWorkflowService,
                                      UserRepository userRepository) {
        this.technicianWorkflowService = technicianWorkflowService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + authentication.getName()));
    }

    /**
     * Get list of collected e-waste requests awaiting physical assessment.
     */
    @GetMapping("/requests/pending-assessment")
    public ResponseEntity<List<DisposalRequestDTO>> getPendingAssessments(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(technicianWorkflowService.getPendingAssessments(user));
    }

    /**
     * Submit physical technician assessment for a device.
     */
    @PostMapping("/requests/{id}/assessment")
    public ResponseEntity<?> submitAssessment(
            @PathVariable("id") Long requestId,
            @Valid @RequestBody CreateAssessmentDTO dto,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            AssessmentResponseDTO result = technicianWorkflowService.submitAssessment(requestId, dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Retrieve physical assessment details for a request.
     */
    @GetMapping("/requests/{id}/assessment")
    public ResponseEntity<?> getAssessment(
            @PathVariable("id") Long requestId,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            AssessmentResponseDTO result = technicianWorkflowService.getAssessmentByRequestId(requestId, user);
            return ResponseEntity.ok(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
        }
    }

    /**
     * List restoration/repair jobs.
     */
    @GetMapping("/restorations")
    public ResponseEntity<List<RestorationJobResponseDTO>> getRestorationJobs(
            @RequestParam(name = "status", required = false) RestorationStatus status,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        return ResponseEntity.ok(technicianWorkflowService.getRestorationJobs(user, status));
    }

    /**
     * Start work on a restoration job ticket.
     */
    @PatchMapping("/restorations/{id}/start")
    public ResponseEntity<?> startRestorationJob(
            @PathVariable("id") Long jobId,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            RestorationJobResponseDTO result = technicianWorkflowService.startRestorationJob(jobId, user);
            return ResponseEntity.ok(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Complete work or record failure on a restoration job ticket.
     */
    @PatchMapping("/restorations/{id}/complete")
    public ResponseEntity<?> completeRestorationJob(
            @PathVariable("id") Long jobId,
            @Valid @RequestBody UpdateRestorationProgressDTO dto,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            RestorationJobResponseDTO result = technicianWorkflowService.completeRestorationJob(jobId, dto, user);
            return ResponseEntity.ok(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    /**
     * Submit quality check for a completed restoration ticket.
     */
    @PostMapping("/restorations/{id}/quality-check")
    public ResponseEntity<?> submitQualityCheck(
            @PathVariable("id") Long jobId,
            @Valid @RequestBody SubmitQualityCheckDTO dto,
            Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            QualityCheckResponseDTO result = technicianWorkflowService.submitQualityCheck(jobId, dto, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (AccessDeniedException ex) {
            return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return ResponseEntity.status(status).body(err);
    }
}
