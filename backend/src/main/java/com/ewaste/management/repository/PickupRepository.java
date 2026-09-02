package com.ewaste.management.repository;

import com.ewaste.management.entity.Pickup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends JpaRepository<Pickup, Long> {
    Optional<Pickup> findByDisposalRequestId(Long requestId);
    List<Pickup> findByCollectorId(Long collectorId);
    List<Pickup> findByStatus(String status);
}
