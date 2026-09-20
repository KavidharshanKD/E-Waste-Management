package com.ewaste.management.repository;

import com.ewaste.management.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartId(Long cartId);
    Optional<CartItem> findByCartIdAndListingId(Long cartId, Long listingId);
    boolean existsByCartIdAndListingId(Long cartId, Long listingId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM CartItem ci WHERE ci.cart.id = :cartId AND ci.listing.id = :listingId")
    void deleteByCartIdAndListingId(@org.springframework.data.repository.query.Param("cartId") Long cartId, @org.springframework.data.repository.query.Param("listingId") Long listingId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM CartItem ci WHERE ci.cart.id = :cartId")
    void deleteByCartId(@org.springframework.data.repository.query.Param("cartId") Long cartId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM CartItem ci WHERE ci.listing.id = :listingId")
    void deleteByListingId(@org.springframework.data.repository.query.Param("listingId") Long listingId);
}
