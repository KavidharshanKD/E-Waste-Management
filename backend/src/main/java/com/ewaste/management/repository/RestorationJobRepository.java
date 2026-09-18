package com.ewaste.management.repository;

import com.ewaste.management.entity.RestorationJob;
import com.ewaste.management.model.enums.RestorationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestorationJobRepository extends JpaRepository<RestorationJob, Long> {
    List<RestorationJob> findByDisposalRequestId(Long requestId);
    Optional<RestorationJob> findByDisposalRequestIdAndStatusIn(Long requestId, List<RestorationStatus> statuses);
    List<RestorationJob> findByAssignedTechnicianIdOrderByCreatedAtDesc(Long technicianId);
    List<RestorationJob> findByStatusOrderByCreatedAtDesc(RestorationStatus status);
    List<RestorationJob> findByDisposalRequestCenterIdOrderByCreatedAtDesc(Long centerId);
}
