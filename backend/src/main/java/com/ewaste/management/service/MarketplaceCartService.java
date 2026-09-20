package com.ewaste.management.service;

import com.ewaste.management.dto.marketplace.CartDTO;
import com.ewaste.management.dto.marketplace.CartItemDTO;
import com.ewaste.management.entity.Cart;
import com.ewaste.management.entity.CartItem;
import com.ewaste.management.entity.MarketplaceListing;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.MarketplaceListingStatus;
import com.ewaste.management.model.enums.MarketplaceStockStatus;
import com.ewaste.management.repository.CartItemRepository;
import com.ewaste.management.repository.CartRepository;
import com.ewaste.management.repository.MarketplaceListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class MarketplaceCartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final MarketplaceListingRepository marketplaceListingRepository;

    public MarketplaceCartService(CartRepository cartRepository,
                                  CartItemRepository cartItemRepository,
                                  MarketplaceListingRepository marketplaceListingRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.marketplaceListingRepository = marketplaceListingRepository;
    }

    @Transactional
    public CartDTO getCart(User buyer) {
        Cart cart = getOrCreateCart(buyer);
        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(User buyer, Long listingId) {
        MarketplaceListing listing = marketplaceListingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Marketplace listing not found with ID: " + listingId));

        if (listing.getListingStatus() != MarketplaceListingStatus.PUBLISHED) {
            throw new IllegalStateException("Item is not listed for sale");
        }

        if (listing.getStockStatus() != MarketplaceStockStatus.AVAILABLE) {
            throw new IllegalStateException("Item is currently " + listing.getStockStatus() + " and cannot be added to cart");
        }

        Cart cart = getOrCreateCart(buyer);

        if (cartItemRepository.existsByCartIdAndListingId(cart.getId(), listingId)) {
            // Unique physical unit: already in cart, max quantity is 1
            return mapToCartDTO(cart);
        }

        CartItem item = new CartItem(cart, listing);
        cartItemRepository.save(item);
        cart.addItem(item);

        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO removeFromCart(User buyer, Long listingId) {
        Cart cart = getOrCreateCart(buyer);
        cartItemRepository.deleteByCartIdAndListingId(cart.getId(), listingId);
        // Refresh cart items
        cart.getItems().removeIf(item -> item.getListing().getId().equals(listingId));
        return mapToCartDTO(cart);
    }

    @Transactional
    public void clearCart(User buyer) {
        Cart cart = getOrCreateCart(buyer);
        cartItemRepository.deleteByCartId(cart.getId());
        cart.getItems().clear();
    }

    private Cart getOrCreateCart(User buyer) {
        return cartRepository.findByUserId(buyer.getId())
                .orElseGet(() -> cartRepository.save(new Cart(buyer)));
    }

    public CartDTO mapToCartDTO(Cart cart) {
        CartDTO dto = new CartDTO();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUser().getId());

        List<CartItemDTO> itemDtos = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        for (CartItem item : items) {
            MarketplaceListing listing = item.getListing();
            boolean available = listing.getListingStatus() == MarketplaceListingStatus.PUBLISHED
                    && listing.getStockStatus() == MarketplaceStockStatus.AVAILABLE;

            CartItemDTO itemDto = new CartItemDTO();
            itemDto.setId(item.getId());
            itemDto.setListingId(listing.getId());
            itemDto.setTitle(listing.getTitle());
            itemDto.setCategory(listing.getCategory());
            itemDto.setBrand(listing.getBrand());
            itemDto.setModel(listing.getModel());
            itemDto.setCosmeticGrade(listing.getCosmeticGrade());
            itemDto.setPrice(listing.getSellingPrice());
            itemDto.setStockStatus(listing.getStockStatus());
            itemDto.setAvailable(available);
            itemDto.setAddedAt(item.getAddedAt());

            if (listing.getImages() != null && !listing.getImages().isEmpty()) {
                itemDto.setImageUrl(listing.getImages().get(0).getImageUrl());
            }

            if (available) {
                subtotal = subtotal.add(listing.getSellingPrice());
            }

            itemDtos.add(itemDto);
        }

        dto.setItems(itemDtos);
        dto.setItemCount(itemDtos.size());
        dto.setSubtotal(subtotal);
        return dto;
    }
}
