package com.ewaste.management.repository;

import com.ewaste.management.entity.Recycler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecyclerRepository extends JpaRepository<Recycler, Long> {
    Optional<Recycler> findByUserId(Long userId);
    Optional<Recycler> findByLicenseNumber(String licenseNumber);
}
