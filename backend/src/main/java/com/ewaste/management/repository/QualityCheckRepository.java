package com.ewaste.management.repository;

import com.ewaste.management.entity.QualityCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QualityCheckRepository extends JpaRepository<QualityCheck, Long> {
    Optional<QualityCheck> findByRestorationJobId(Long jobId);
    boolean existsByRestorationJobId(Long jobId);
}
