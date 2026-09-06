package com.ewaste.management.repository;

import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.model.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisposalRequestRepository extends JpaRepository<DisposalRequest, Long> {
    Optional<DisposalRequest> findByTrackingNumber(String trackingNumber);
    List<DisposalRequest> findByUserId(Long userId);
    List<DisposalRequest> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<DisposalRequest> findByIdAndUserId(Long id, Long userId);
    List<DisposalRequest> findByStatus(RequestStatus status);
    List<DisposalRequest> findByCenterId(Long centerId);

    long countByUserId(Long userId);
    long countByUserIdAndStatusIn(Long userId, Collection<RequestStatus> statuses);
    List<DisposalRequest> findAllByOrderByCreatedAtDesc();
}

