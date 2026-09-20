package com.ewaste.management.repository;

import com.ewaste.management.entity.MarketplaceListing;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, Long>, JpaSpecificationExecutor<MarketplaceListing> {

    Optional<MarketplaceListing> findByQualityCheckId(Long qualityCheckId);

    boolean existsByQualityCheckId(Long qualityCheckId);

    List<MarketplaceListing> findByListingStatus(MarketplaceListingStatus listingStatus);

    List<MarketplaceListing> findByRecyclingCenterId(Long centerId);

    List<MarketplaceListing> findByRecyclingCenterIdAndListingStatus(Long centerId, MarketplaceListingStatus listingStatus);

    Page<MarketplaceListing> findByListingStatusAndStockStatus(MarketplaceListingStatus listingStatus, MarketplaceStockStatus stockStatus, Pageable pageable);

    Optional<MarketplaceListing> findByIdAndListingStatusAndStockStatus(Long id, MarketplaceListingStatus listingStatus, MarketplaceStockStatus stockStatus);

    long countByListingStatus(MarketplaceListingStatus listingStatus);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MarketplaceListing m WHERE m.id = :id")
    Optional<MarketplaceListing> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MarketplaceListing m WHERE m.id IN :ids")
    List<MarketplaceListing> findAllByIdInForUpdate(@Param("ids") Collection<Long> ids);
}
