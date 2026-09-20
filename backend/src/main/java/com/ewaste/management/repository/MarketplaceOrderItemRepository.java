package com.ewaste.management.repository;

import com.ewaste.management.entity.MarketplaceOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceOrderItemRepository extends JpaRepository<MarketplaceOrderItem, Long> {
    List<MarketplaceOrderItem> findByOrderId(Long orderId);
    List<MarketplaceOrderItem> findByListingId(Long listingId);
}
