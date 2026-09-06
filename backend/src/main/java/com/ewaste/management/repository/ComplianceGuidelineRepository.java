package com.ewaste.management.repository;

import com.ewaste.management.entity.ComplianceGuideline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceGuidelineRepository extends JpaRepository<ComplianceGuideline, Long> {
    Optional<ComplianceGuideline> findBySectionKey(String sectionKey);
}
