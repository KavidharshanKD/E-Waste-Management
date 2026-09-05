package com.ewaste.management.repository;

import com.ewaste.management.entity.RecyclingCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecyclingCenterRepository extends JpaRepository<RecyclingCenter, Long> {
    List<RecyclingCenter> findByActiveTrue();
    List<RecyclingCenter> findByCityIgnoreCaseAndActiveTrue(String city);
    List<RecyclingCenter> findByStateIgnoreCaseAndActiveTrue(String state);
    List<RecyclingCenter> findByPostalCodeAndActiveTrue(String postalCode);
}
