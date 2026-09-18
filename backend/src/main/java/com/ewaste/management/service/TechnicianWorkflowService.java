package com.ewaste.management.service;

import com.ewaste.management.dto.DisposalRequestDTO;
import com.ewaste.management.dto.technician.AssessmentResponseDTO;
import com.ewaste.management.dto.technician.CreateAssessmentDTO;
import com.ewaste.management.dto.technician.QualityCheckResponseDTO;
import com.ewaste.management.dto.technician.RestorationJobResponseDTO;
import com.ewaste.management.dto.technician.SubmitQualityCheckDTO;
import com.ewaste.management.dto.technician.UpdateRestorationProgressDTO;
import com.ewaste.management.entity.DeviceAssessment;
import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.DisposalStatusHistory;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.QualityCheck;
import com.ewaste.management.entity.Recycler;
import com.ewaste.management.entity.RestorationJob;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DisposalAction;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.QualityCheckResult;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.RestorationJobType;
import com.ewaste.management.model.enums.RestorationStatus;
import com.ewaste.management.model.enums.TechnicianDecision;
import com.ewaste.management.model.enums.UserRole;
import com.ewaste.management.notification.NotificationService;
import com.ewaste.management.repository.DeviceAssessmentRepository;
import com.ewaste.management.repository.DisposalRequestRepository;
import com.ewaste.management.repository.QualityCheckRepository;
import com.ewaste.management.repository.RecyclerRepository;
import com.ewaste.management.repository.RestorationJobRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TechnicianWorkflowService {

    private static final Set<EWasteCategory> SCREEN_CATEGORIES = Set.of(
            EWasteCategory.MOBILE_PHONE, EWasteCategory.LAPTOP, EWasteCategory.MONITOR, EWasteCategory.TELEVISION
    );

    private static final Set<EWasteCategory> BATTERY_CATEGORIES = Set.of(
            EWasteCategory.MOBILE_PHONE, EWasteCategory.LAPTOP, EWasteCategory.BATTERY
    );

    private final DisposalRequestRepository disposalRequestRepository;
    private final DeviceAssessmentRepository deviceAssessmentRepository;
    private final RestorationJobRepository restorationJobRepository;
    private final QualityCheckRepository qualityCheckRepository;
    private final RecyclerRepository recyclerRepository;
    private final NotificationService notificationService;

    public TechnicianWorkflowService(DisposalRequestRepository disposalRequestRepository,
                                     DeviceAssessmentRepository deviceAssessmentRepository,
                                     RestorationJobRepository restorationJobRepository,
                                     QualityCheckRepository qualityCheckRepository,
                                     RecyclerRepository recyclerRepository,
                                     NotificationService notificationService) {
        this.disposalRequestRepository = disposalRequestRepository;
        this.deviceAssessmentRepository = deviceAssessmentRepository;
        this.restorationJobRepository = restorationJobRepository;
        this.qualityCheckRepository = qualityCheckRepository;
        this.recyclerRepository = recyclerRepository;
        this.notificationService = notificationService;
    }

    /**
     * Validates that the current user has permission to operate on this request and center.
     */
    public void validateCenterAuthority(DisposalRequest request, User technician) {
        if (technician.getRole() == UserRole.ADMIN) {
            return; // Admins have system-wide oversight
        }

        if (technician.getRole() != UserRole.RECYCLER) {
            throw new AccessDeniedException("Only authorized RECYCLER or ADMIN users can perform technician operations");
        }

        Recycler recycler = recyclerRepository.findByUserId(technician.getId())
                .orElseThrow(() -> new AccessDeniedException("No recycling facility profile registered for user: " + technician.getEmail()));

        // If request has been assigned to a center, verify match
        if (request.getCenter() != null && recycler.getCenter() != null) {
            if (!request.getCenter().getId().equals(recycler.getCenter().getId())) {
                throw new AccessDeniedException("Access denied: Request is assigned to a different recycling center");
            }
        }
    }

    // =========================================================================
    // 1. TECHNICIAN ASSESSMENT
    // =========================================================================

    @Transactional(readOnly = true)
    public List<DisposalRequestDTO> getPendingAssessments(User technician) {
        List<DisposalRequest> requests;
        if (technician.getRole() == UserRole.ADMIN) {
            requests = disposalRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            Recycler recycler = recyclerRepository.findByUserId(technician.getId())
                    .orElseThrow(() -> new AccessDeniedException("No recycling facility profile registered for user: " + technician.getEmail()));
            if (recycler.getCenter() == null) {
                return List.of();
            }
            requests = disposalRequestRepository.findByCenterId(recycler.getCenter().getId());
        }

        return requests.stream()
                .filter(req -> !deviceAssessmentRepository.existsByDisposalRequestId(req.getId()))
                .filter(req -> req.getStatus() == RequestStatus.COLLECTED
                        || req.getStatus() == RequestStatus.AT_RECYCLING_CENTER
                        || req.getStatus() == RequestStatus.PROCESSING
                        || req.getStatus() == RequestStatus.APPROVED)
                .map(this::mapToRequestDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssessmentResponseDTO submitAssessment(Long requestId, CreateAssessmentDTO dto, User technician) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        validateCenterAuthority(request, technician);

        if (deviceAssessmentRepository.existsByDisposalRequestId(requestId)) {
            throw new IllegalStateException("An assessment has already been submitted for request " + request.getTrackingNumber());
        }

        DeviceAssessment assessment = new DeviceAssessment();
        assessment.setDisposalRequest(request);
        assessment.setAssessedBy(technician);
        assessment.setPowerStatus(dto.getPowerStatus());
        assessment.setScreenAssessment(dto.getScreenAssessment());
        assessment.setBatteryAssessment(dto.getBatteryAssessment());
        assessment.setPhysicalCondition(dto.getPhysicalCondition());
        assessment.setFunctionalAssessment(dto.getFunctionalAssessment());
        assessment.setDiagnosedIssues(dto.getDiagnosedIssues());
        assessment.setRepairabilityStatus(dto.getRepairabilityStatus());
        assessment.setTechnicianDecision(dto.getTechnicianDecision());
        assessment.setSafetyHazardFound(Boolean.TRUE.equals(dto.getSafetyHazardFound()));
        assessment.setSafetyNotes(dto.getSafetyNotes());
        assessment.setRecommendedForMarketplace(Boolean.TRUE.equals(dto.getRecommendedForMarketplace()));
        assessment.setAssessmentNotes(dto.getAssessmentNotes());
        assessment.setAssessedAt(LocalDateTime.now());

        DeviceAssessment savedAssessment = deviceAssessmentRepository.save(assessment);

        // Record history and update request lifecycle
        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(request.getStatus());
        history.setChangedBy(technician);
        history.setTimestamp(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.getSafetyHazardFound()) || dto.getTechnicianDecision() == TechnicianDecision.SPECIAL_HANDLING) {
            // Hazard detected -> SPECIAL_HANDLING escalation
            request.setStatus(RequestStatus.PROCESSING);
            request.setRecommendedAction(DisposalAction.SPECIAL_HANDLING);
            request.setMarketplaceEligibility("NOT_ASSESSED");
            history.setToStatus(RequestStatus.PROCESSING);
            history.setComment("Technician Physical Assessment: HAZARD DISCOVERED. Routed to SPECIAL_HANDLING (" + dto.getSafetyNotes() + ")");
            request.addStatusHistory(history);

            if (request.getUser() != null) {
                notificationService.sendNotification(
                        request.getUser(),
                        "Hazard Detected During Inspection",
                        "Physical inspection for " + request.getTrackingNumber() + " identified a safety hazard. Your device has been routed for specialized hazardous handling.",
                        "SPECIAL_HANDLING_ALERT"
                );
            }
        } else {
            // Non-hazardous technician decision
            history.setToStatus(RequestStatus.PROCESSING);
            history.setComment("Technician Physical Assessment: Decision=" + dto.getTechnicianDecision() + ", Repairability=" + dto.getRepairabilityStatus());
            request.addStatusHistory(history);
            request.setStatus(RequestStatus.PROCESSING);

            // Auto-create a RestorationJob if decision is REPAIR or REFURBISH
            if (dto.getTechnicianDecision() == TechnicianDecision.REPAIR || dto.getTechnicianDecision() == TechnicianDecision.REFURBISH) {
                RestorationJob job = new RestorationJob();
                job.setDisposalRequest(request);
                job.setAssessment(savedAssessment);
                job.setAssignedTechnician(technician);
                job.setJobType(dto.getTechnicianDecision() == TechnicianDecision.REPAIR ? RestorationJobType.REPAIR : RestorationJobType.REFURBISH);
                job.setStatus(RestorationStatus.PENDING);
                job.setWorkPerformed("Awaiting technician restoration work queue.");
                job.setPartsCost(BigDecimal.ZERO);
                job.setLaborCost(BigDecimal.ZERO);
                job.setTotalCost(BigDecimal.ZERO);
                restorationJobRepository.save(job);

                if (request.getUser() != null) {
                    notificationService.sendNotification(
                            request.getUser(),
                            "Device Restoring in Progress",
                            "Your device " + request.getTrackingNumber() + " has been physically diagnosed and queued for " + job.getJobType() + ".",
                            "RESTORATION_QUEUED"
                    );
                }
            } else if (dto.getTechnicianDecision() == TechnicianDecision.DONATE) {
                request.setRecommendedAction(DisposalAction.DONATE);
            } else if (dto.getTechnicianDecision() == TechnicianDecision.RECYCLE) {
                request.setRecommendedAction(DisposalAction.RECYCLE);
            }
        }

        disposalRequestRepository.save(request);
        return mapToAssessmentDTO(savedAssessment);
    }

    @Transactional(readOnly = true)
    public AssessmentResponseDTO getAssessmentByRequestId(Long requestId, User user) {
        DisposalRequest request = disposalRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Disposal request not found: " + requestId));

        if (user.getRole() == UserRole.USER && !request.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Access denied: You can only view your own device assessment");
        }

        DeviceAssessment assessment = deviceAssessmentRepository.findByDisposalRequestId(requestId)
                .orElseThrow(() -> new IllegalArgumentException("No assessment found for request: " + requestId));

        return mapToAssessmentDTO(assessment);
    }

    // =========================================================================
    // 2. RESTORATION WORKFLOW
    // =========================================================================

    @Transactional
    public RestorationJobResponseDTO startRestorationJob(Long jobId, User technician) {
        RestorationJob job = restorationJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Restoration job not found: " + jobId));

        validateCenterAuthority(job.getDisposalRequest(), technician);

        if (job.getStatus() != RestorationStatus.PENDING) {
            throw new IllegalStateException("Cannot start a restoration job that is in status: " + job.getStatus());
        }

        job.setStatus(RestorationStatus.IN_PROGRESS);
        job.setWorkStartedAt(LocalDateTime.now());
        if (job.getAssignedTechnician() == null) {
            job.setAssignedTechnician(technician);
        }

        RestorationJob saved = restorationJobRepository.save(job);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(job.getDisposalRequest().getStatus());
        history.setToStatus(RequestStatus.PROCESSING);
        history.setChangedBy(technician);
        history.setComment("Restoration work (" + job.getJobType() + ") started by technician " + technician.getFullName());
        history.setTimestamp(LocalDateTime.now());
        job.getDisposalRequest().addStatusHistory(history);
        disposalRequestRepository.save(job.getDisposalRequest());

        return mapToJobDTO(saved);
    }

    @Transactional
    public RestorationJobResponseDTO completeRestorationJob(Long jobId, UpdateRestorationProgressDTO dto, User technician) {
        RestorationJob job = restorationJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Restoration job not found: " + jobId));

        validateCenterAuthority(job.getDisposalRequest(), technician);

        if (job.getStatus() != RestorationStatus.IN_PROGRESS) {
            throw new IllegalStateException("Restoration job must be IN_PROGRESS before it can be updated to: " + dto.getStatus());
        }

        if (dto.getPartsCost() != null && dto.getPartsCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Parts cost cannot be negative");
        }
        if (dto.getLaborCost() != null && dto.getLaborCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Labor cost cannot be negative");
        }

        job.setStatus(dto.getStatus());
        if (dto.getStatus() == RestorationStatus.COMPLETED) {
            job.setWorkCompletedAt(LocalDateTime.now());
            job.getDisposalRequest().setStatus(RequestStatus.REFURBISHED);
        } else if (dto.getStatus() == RestorationStatus.FAILED) {
            job.setWorkCompletedAt(LocalDateTime.now());
            job.getDisposalRequest().setStatus(RequestStatus.PROCESSING);
        }

        if (dto.getWorkPerformed() != null) job.setWorkPerformed(dto.getWorkPerformed());
        if (dto.getPartsReplaced() != null) job.setPartsReplaced(dto.getPartsReplaced());
        if (dto.getTechnicianNotes() != null) job.setTechnicianNotes(dto.getTechnicianNotes());
        if (dto.getPartsCost() != null) job.setPartsCost(dto.getPartsCost());
        if (dto.getLaborCost() != null) job.setLaborCost(dto.getLaborCost());
        job.recalculateTotal();

        RestorationJob saved = restorationJobRepository.save(job);

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(RequestStatus.PROCESSING);
        history.setToStatus(job.getDisposalRequest().getStatus());
        history.setChangedBy(technician);
        history.setComment("Restoration ticket marked as " + dto.getStatus() + ". Total cost: ₹" + job.getTotalCost());
        history.setTimestamp(LocalDateTime.now());
        job.getDisposalRequest().addStatusHistory(history);
        disposalRequestRepository.save(job.getDisposalRequest());

        if (job.getDisposalRequest().getUser() != null) {
            notificationService.sendNotification(
                    job.getDisposalRequest().getUser(),
                    "Restoration Work Update",
                    "Restoration work for " + job.getDisposalRequest().getTrackingNumber() + " is now " + dto.getStatus() + ".",
                    "RESTORATION_STATUS_UPDATE"
            );
        }

        return mapToJobDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<RestorationJobResponseDTO> getRestorationJobs(User technician, RestorationStatus status) {
        List<RestorationJob> jobs;
        if (technician.getRole() == UserRole.ADMIN) {
            jobs = status != null
                    ? restorationJobRepository.findByStatusOrderByCreatedAtDesc(status)
                    : restorationJobRepository.findAll();
        } else {
            Recycler recycler = recyclerRepository.findByUserId(technician.getId()).orElse(null);
            if (recycler != null && recycler.getCenter() != null) {
                jobs = restorationJobRepository.findByDisposalRequestCenterIdOrderByCreatedAtDesc(recycler.getCenter().getId());
            } else {
                jobs = restorationJobRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(technician.getId());
            }
            if (status != null) {
                jobs = jobs.stream().filter(j -> j.getStatus() == status).collect(Collectors.toList());
            }
        }
        return jobs.stream().map(this::mapToJobDTO).collect(Collectors.toList());
    }

    // =========================================================================
    // 3. QUALITY CHECK & MARKETPLACE CANDIDATE LOGIC
    // =========================================================================

    @Transactional
    public QualityCheckResponseDTO submitQualityCheck(Long jobId, SubmitQualityCheckDTO dto, User technician) {
        RestorationJob job = restorationJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Restoration job not found: " + jobId));

        validateCenterAuthority(job.getDisposalRequest(), technician);

        if (job.getStatus() != RestorationStatus.COMPLETED) {
            throw new IllegalStateException("Cannot perform quality check on restoration that is not COMPLETED (Current status: " + job.getStatus() + ")");
        }

        if (qualityCheckRepository.existsByRestorationJobId(jobId)) {
            throw new IllegalStateException("Quality check has already been performed on restoration job: " + jobId);
        }

        DisposalRequest request = job.getDisposalRequest();
        DeviceAssessment assessment = job.getAssessment();

        EWasteCategory category = request.getItems() != null && !request.getItems().isEmpty()
                ? request.getItems().get(0).getCategory()
                : EWasteCategory.OTHER;

        // Category-aware validation
        Boolean displayPass = dto.getDisplayTestPassed();
        if (SCREEN_CATEGORIES.contains(category) && displayPass == null) {
            throw new IllegalArgumentException("Display test result is required for screen device category: " + category);
        }
        Boolean batteryPass = dto.getBatteryTestPassed();
        if (BATTERY_CATEGORIES.contains(category) && batteryPass == null) {
            throw new IllegalArgumentException("Battery test result is required for battery device category: " + category);
        }

        QualityCheck qc = new QualityCheck();
        qc.setRestorationJob(job);
        qc.setCheckedBy(technician);
        qc.setFunctionalTestPassed(Boolean.TRUE.equals(dto.getFunctionalTestPassed()));
        qc.setPowerTestPassed(Boolean.TRUE.equals(dto.getPowerTestPassed()));
        qc.setDisplayTestPassed(displayPass);
        qc.setBatteryTestPassed(batteryPass);
        qc.setSafetyTestPassed(Boolean.TRUE.equals(dto.getSafetyTestPassed()));
        qc.setCosmeticGrade(dto.getCosmeticGrade());
        qc.setOverallResult(dto.getOverallResult());
        qc.setQualityNotes(dto.getQualityNotes());
        qc.setCheckedAt(LocalDateTime.now());

        // Marketplace Candidate Rule:
        // safety hazard == false AND quality == PASS AND safetyTestPassed == true
        // AND technician recommendedForMarketplace == true
        boolean isMarketplaceCandidate = Boolean.TRUE.equals(dto.getSafetyTestPassed())
                && dto.getOverallResult() == QualityCheckResult.PASS
                && Boolean.TRUE.equals(assessment.getRecommendedForMarketplace())
                && !Boolean.TRUE.equals(assessment.getSafetyHazardFound());

        qc.setMarketplaceCandidate(isMarketplaceCandidate);
        QualityCheck savedQC = qualityCheckRepository.save(qc);

        if (isMarketplaceCandidate) {
            request.setMarketplaceEligibility("TECHNICIAN_REVIEW_REQUIRED");
        } else {
            request.setMarketplaceEligibility("NOT_ASSESSED");
        }

        DisposalStatusHistory history = new DisposalStatusHistory();
        history.setFromStatus(request.getStatus());
        history.setToStatus(request.getStatus());
        history.setChangedBy(technician);
        history.setComment("Quality Check " + dto.getOverallResult() + " (Grade: " + dto.getCosmeticGrade() + ", MarketplaceCandidate: " + isMarketplaceCandidate + ")");
        history.setTimestamp(LocalDateTime.now());
        request.addStatusHistory(history);

        disposalRequestRepository.save(request);

        if (request.getUser() != null) {
            notificationService.sendNotification(
                    request.getUser(),
                    "Quality Check Completed",
                    "Quality inspection for " + request.getTrackingNumber() + " concluded with result: " + dto.getOverallResult() + ".",
                    "QUALITY_CHECK_CONCLUDED"
            );
        }

        return mapToQualityCheckDTO(savedQC);
    }

    // =========================================================================
    // MAPPERS
    // =========================================================================

    private AssessmentResponseDTO mapToAssessmentDTO(DeviceAssessment assessment) {
        AssessmentResponseDTO dto = new AssessmentResponseDTO();
        dto.setId(assessment.getId());
        dto.setRequestId(assessment.getDisposalRequest().getId());
        dto.setTrackingNumber(assessment.getDisposalRequest().getTrackingNumber());
        dto.setAssessedById(assessment.getAssessedBy().getId());
        dto.setAssessedByName(assessment.getAssessedBy().getFullName());
        dto.setPowerStatus(assessment.getPowerStatus());
        dto.setScreenAssessment(assessment.getScreenAssessment());
        dto.setBatteryAssessment(assessment.getBatteryAssessment());
        dto.setPhysicalCondition(assessment.getPhysicalCondition());
        dto.setFunctionalAssessment(assessment.getFunctionalAssessment());
        dto.setDiagnosedIssues(assessment.getDiagnosedIssues());
        dto.setRepairabilityStatus(assessment.getRepairabilityStatus());
        dto.setTechnicianDecision(assessment.getTechnicianDecision());
        dto.setSafetyHazardFound(assessment.getSafetyHazardFound());
        dto.setSafetyNotes(assessment.getSafetyNotes());
        dto.setRecommendedForMarketplace(assessment.getRecommendedForMarketplace());
        dto.setAssessmentNotes(assessment.getAssessmentNotes());
        dto.setAssessedAt(assessment.getAssessedAt());

        DisposalRequest req = assessment.getDisposalRequest();
        dto.setMlDisplayRecommendation(req.getMlDisplayRecommendation());
        dto.setMlRawPathway(req.getMlRawPathway());
        dto.setMlConfidenceLevel(req.getMlConfidenceLevel());
        dto.setMlRecoveryStatus(req.getMlRecoveryStatus());
        dto.setMlRecoveryProbability(req.getMlRecoveryProbability());
        dto.setMlTechnicianReviewRequired(req.getTechnicianReviewRequired());
        dto.setMlExplanation(req.getMlExplanation());

        return dto;
    }

    private RestorationJobResponseDTO mapToJobDTO(RestorationJob job) {
        RestorationJobResponseDTO dto = new RestorationJobResponseDTO();
        dto.setId(job.getId());
        dto.setRequestId(job.getDisposalRequest().getId());
        dto.setTrackingNumber(job.getDisposalRequest().getTrackingNumber());
        dto.setAssessmentId(job.getAssessment().getId());
        dto.setAssignedTechnicianId(job.getAssignedTechnician().getId());
        dto.setAssignedTechnicianName(job.getAssignedTechnician().getFullName());
        dto.setJobType(job.getJobType());
        dto.setStatus(job.getStatus());
        dto.setWorkStartedAt(job.getWorkStartedAt());
        dto.setWorkCompletedAt(job.getWorkCompletedAt());
        dto.setWorkPerformed(job.getWorkPerformed());
        dto.setPartsReplaced(job.getPartsReplaced());
        dto.setTechnicianNotes(job.getTechnicianNotes());
        dto.setPartsCost(job.getPartsCost());
        dto.setLaborCost(job.getLaborCost());
        dto.setTotalCost(job.getTotalCost());
        dto.setCreatedAt(job.getCreatedAt());

        QualityCheck qc = job.getQualityCheck();
        dto.setQualityCheckCompleted(qc != null);
        dto.setMarketplaceCandidate(qc != null && Boolean.TRUE.equals(qc.getMarketplaceCandidate()));

        return dto;
    }

    private QualityCheckResponseDTO mapToQualityCheckDTO(QualityCheck qc) {
        QualityCheckResponseDTO dto = new QualityCheckResponseDTO();
        dto.setId(qc.getId());
        dto.setJobId(qc.getRestorationJob().getId());
        dto.setRequestId(qc.getRestorationJob().getDisposalRequest().getId());
        dto.setTrackingNumber(qc.getRestorationJob().getDisposalRequest().getTrackingNumber());
        dto.setCheckedById(qc.getCheckedBy().getId());
        dto.setCheckedByName(qc.getCheckedBy().getFullName());
        dto.setFunctionalTestPassed(qc.getFunctionalTestPassed());
        dto.setPowerTestPassed(qc.getPowerTestPassed());
        dto.setDisplayTestPassed(qc.getDisplayTestPassed());
        dto.setBatteryTestPassed(qc.getBatteryTestPassed());
        dto.setSafetyTestPassed(qc.getSafetyTestPassed());
        dto.setCosmeticGrade(qc.getCosmeticGrade());
        dto.setOverallResult(qc.getOverallResult());
        dto.setQualityNotes(qc.getQualityNotes());
        dto.setMarketplaceCandidate(qc.getMarketplaceCandidate());
        dto.setCheckedAt(qc.getCheckedAt());
        return dto;
    }

    private DisposalRequestDTO mapToRequestDTO(DisposalRequest req) {
        DisposalRequestDTO dto = new DisposalRequestDTO();
        dto.setId(req.getId());
        dto.setTrackingNumber(req.getTrackingNumber());
        if (req.getUser() != null) {
            dto.setUserId(req.getUser().getId());
            dto.setUserEmail(req.getUser().getEmail());
            dto.setUserName(req.getUser().getFullName());
        }
        dto.setStatus(req.getStatus());
        dto.setRecommendedAction(req.getRecommendedAction());
        dto.setUserIntention(req.getUserIntention());
        dto.setRecommendationExplanation(req.getRecommendationExplanation());
        dto.setHandlingAdvice(req.getHandlingAdvice());
        dto.setPickupRequired(req.getPickupRequired());
        dto.setPickupAddress(req.getPickupAddress());
        dto.setPickupCity(req.getPickupCity());
        dto.setPickupState(req.getPickupState());
        dto.setPickupPostalCode(req.getPickupPostalCode());
        dto.setPreferredPickupDate(req.getPreferredPickupDate());
        dto.setNotes(req.getNotes());
        if (req.getCenter() != null) {
            dto.setCenterId(req.getCenter().getId());
            dto.setCenterName(req.getCenter().getName());
        }
        dto.setCreatedAt(req.getCreatedAt());
        dto.setUpdatedAt(req.getUpdatedAt());
        dto.setMlRawPathway(req.getMlRawPathway());
        dto.setMlDisplayRecommendation(req.getMlDisplayRecommendation());
        dto.setMlConfidenceLevel(req.getMlConfidenceLevel());
        dto.setMlRecoveryStatus(req.getMlRecoveryStatus());
        dto.setMlRecoveryProbability(req.getMlRecoveryProbability());
        dto.setTechnicianReviewRequired(req.getTechnicianReviewRequired());
        dto.setMarketplaceEligibility(req.getMarketplaceEligibility());
        return dto;
    }
}
