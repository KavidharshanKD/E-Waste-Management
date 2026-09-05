package com.ewaste.management.repository;

import com.ewaste.management.entity.Pickup;
import com.ewaste.management.model.enums.PickupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, Long> {
    Optional<Pickup> findByDisposalRequestId(Long requestId);
    List<Pickup> findByCollectorId(Long collectorId);
    List<Pickup> findByCollectorIdOrderByScheduledDateDesc(Long collectorId);
    List<Pickup> findByCollectorIdAndStatus(Long collectorId, PickupStatus status);
    List<Pickup> findByCollectorIdAndStatusIn(Long collectorId, List<PickupStatus> statuses);
    List<Pickup> findByStatus(PickupStatus status);
    List<Pickup> findByStatusIn(List<PickupStatus> statuses);
    List<Pickup> findByDisposalRequestUserIdOrderByCreatedAtDesc(Long userId);
    List<Pickup> findAllByOrderByCreatedAtDesc();
}
