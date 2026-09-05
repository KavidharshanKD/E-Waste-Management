package com.ewaste.management.repository;

import com.ewaste.management.entity.EnvironmentalFactor;
import com.ewaste.management.model.enums.EWasteCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnvironmentalFactorRepository extends JpaRepository<EnvironmentalFactor, Long> {
    Optional<EnvironmentalFactor> findByCategory(EWasteCategory category);
    List<EnvironmentalFactor> findByValidFactorTrue();
}
