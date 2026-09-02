package com.ewaste.management.repository;

import com.ewaste.management.entity.RewardTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {
    List<RewardTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);
}
