package com.ewaste.management.repository;

import com.ewaste.management.entity.MarketplaceOrder;
import com.ewaste.management.model.enums.MarketplaceOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceOrderRepository extends JpaRepository<MarketplaceOrder, Long> {
    Optional<MarketplaceOrder> findByOrderNumber(String orderNumber);
    List<MarketplaceOrder> findByBuyerIdOrderByPlacedAtDesc(Long buyerId);
    Optional<MarketplaceOrder> findByIdAndBuyerId(Long id, Long buyerId);
    Optional<MarketplaceOrder> findByOrderNumberAndBuyerId(String orderNumber, Long buyerId);
    List<MarketplaceOrder> findByStatusOrderByPlacedAtDesc(MarketplaceOrderStatus status);
    long countByStatus(MarketplaceOrderStatus status);
}
