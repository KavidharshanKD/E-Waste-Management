package com.ewaste.management.repository;

import com.ewaste.management.entity.DeviceAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceAssessmentRepository extends JpaRepository<DeviceAssessment, Long> {
    Optional<DeviceAssessment> findByDisposalRequestId(Long requestId);
    boolean existsByDisposalRequestId(Long requestId);
}
