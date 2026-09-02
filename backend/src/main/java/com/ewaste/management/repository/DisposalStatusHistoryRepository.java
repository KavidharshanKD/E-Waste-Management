package com.ewaste.management.repository;

import com.ewaste.management.entity.DisposalStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisposalStatusHistoryRepository extends JpaRepository<DisposalStatusHistory, Long> {
    List<DisposalStatusHistory> findByDisposalRequestIdOrderByTimestampDesc(Long requestId);
}
