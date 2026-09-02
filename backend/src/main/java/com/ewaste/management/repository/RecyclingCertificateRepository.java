package com.ewaste.management.repository;

import com.ewaste.management.entity.RecyclingCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecyclingCertificateRepository extends JpaRepository<RecyclingCertificate, Long> {
    Optional<RecyclingCertificate> findByCertificateNumber(String certificateNumber);
    Optional<RecyclingCertificate> findByDisposalRequestId(Long requestId);
    List<RecyclingCertificate> findByRecyclerId(Long recyclerId);
}
