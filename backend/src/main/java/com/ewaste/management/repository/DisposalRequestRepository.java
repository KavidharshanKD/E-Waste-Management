package com.ewaste.management.repository;

import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.model.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisposalRequestRepository extends JpaRepository<DisposalRequest, Long> {
    Optional<DisposalRequest> findByTrackingNumber(String trackingNumber);
    List<DisposalRequest> findByUserId(Long userId);
    List<DisposalRequest> findByStatus(RequestStatus status);
    List<DisposalRequest> findByCenterId(Long centerId);
}
