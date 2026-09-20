package com.ewaste.management.repository;

import com.ewaste.management.entity.MarketplaceListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceListingImageRepository extends JpaRepository<MarketplaceListingImage, Long> {
    List<MarketplaceListingImage> findByListingIdOrderBySortOrderAsc(Long listingId);
    void deleteByListingId(Long listingId);
}
