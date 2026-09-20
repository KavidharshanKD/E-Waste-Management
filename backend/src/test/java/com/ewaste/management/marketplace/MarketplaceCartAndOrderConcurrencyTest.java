package com.ewaste.management.marketplace;

import com.ewaste.management.dto.marketplace.CreateOrderDTO;
import com.ewaste.management.entity.*;
import com.ewaste.management.model.enums.*;
import com.ewaste.management.repository.*;
import com.ewaste.management.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class MarketplaceCartAndOrderConcurrencyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RecyclingCenterRepository recyclingCenterRepository;

    @Autowired
    private RecyclerRepository recyclerRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private DeviceAssessmentRepository deviceAssessmentRepository;

    @Autowired
    private RestorationJobRepository restorationJobRepository;

    @Autowired
    private QualityCheckRepository qualityCheckRepository;

    @Autowired
    private MarketplaceListingRepository marketplaceListingRepository;

    @Autowired
    private MarketplaceOrderRepository marketplaceOrderRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User buyerA;
    private User buyerB;
    private User recyclerUser;
    private String tokenBuyerA;
    private String tokenBuyerB;
    private String tokenRecycler;

    private MarketplaceListing listing;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        buyerA = userRepository.save(new User("buyerA_" + suffix + "@gmail.com", "pass", UserRole.USER));
        buyerB = userRepository.save(new User("buyerB_" + suffix + "@gmail.com", "pass", UserRole.USER));
        recyclerUser = userRepository.save(new User("recycler_" + suffix + "@facility.com", "pass", UserRole.RECYCLER));

        tokenBuyerA = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                buyerA.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        tokenBuyerB = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                buyerB.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        tokenRecycler = jwtTokenProvider.generateToken(new UsernamePasswordAuthenticationToken(
                recyclerUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_RECYCLER"))));

        RecyclingCenter center = new RecyclingCenter();
        center.setName("Fulfillment Center " + suffix);
        center.setAddress("400 Eco Blvd");
        center.setCity("Hyderabad");
        center.setState("Telangana");
        center.setPostalCode("500001");
        center.setContactPhone("9876543210");
        center.setActive(true);
        center = recyclingCenterRepository.save(center);

        Recycler recycler = new Recycler();
        recycler.setUser(recyclerUser);
        recycler.setCenter(center);
        recycler.setCompanyName("Eco Fulfillment Hub");
        recycler.setLicenseNumber("FULFILL-" + suffix);
        recycler.setVerificationStatus("VERIFIED");
        recyclerRepository.save(recycler);

        // Setup 1 complete refurbished device
        DisposalRequest req = new DisposalRequest();
        req.setTrackingNumber("TRK-" + suffix);
        req.setUser(buyerA);
        req.setStatus(RequestStatus.PROCESSING);
        req.setCenter(center);
        req.setRecommendedAction(DisposalAction.REFURBISH);
        req.setPickupAddress("400 Eco Blvd");
        req.setPickupCity("Hyderabad");
        req.setPickupState("Telangana");
        req.setPickupPostalCode("500001");

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.DESKTOP);
        item.setDeviceName("Mac Mini M1");
        item.setBrand("Apple");
        item.setModelName("Mac Mini (2020)");
        item.setCondition(DeviceCondition.WORKING);
        req.addItem(item);
        req = disposalRequestRepository.save(req);

        DeviceAssessment da = new DeviceAssessment();
        da.setDisposalRequest(req);
        da.setAssessedBy(recyclerUser);
        da.setPowerStatus("POWERS_ON");
        da.setPhysicalCondition("EXCELLENT");
        da.setRepairabilityStatus(RepairabilityStatus.REFURBISHABLE);
        da.setTechnicianDecision(TechnicianDecision.REFURBISH);
        da = deviceAssessmentRepository.save(da);

        RestorationJob job = new RestorationJob();
        job.setDisposalRequest(req);
        job.setAssessment(da);
        job.setAssignedTechnician(recyclerUser);
        job.setJobType(RestorationJobType.REFURBISH);
        job.setStatus(RestorationStatus.COMPLETED);
        job = restorationJobRepository.save(job);

        QualityCheck qc = new QualityCheck();
        qc.setRestorationJob(job);
        qc.setCheckedBy(recyclerUser);
        qc.setFunctionalTestPassed(true);
        qc.setPowerTestPassed(true);
        qc.setDisplayTestPassed(true);
        qc.setBatteryTestPassed(true);
        qc.setSafetyTestPassed(true);
        qc.setCosmeticGrade(CosmeticGrade.GRADE_A);
        qc.setOverallResult(QualityCheckResult.PASS);
        qc.setMarketplaceCandidate(true);
        qc = qualityCheckRepository.save(qc);

        listing = new MarketplaceListing();
        listing.setDisposalRequest(req);
        listing.setEwasteItem(item);
        listing.setQualityCheck(qc);
        listing.setRestorationJob(job);
        listing.setRecyclingCenter(center);
        listing.setTitle("Refurbished Apple Mac Mini M1 (8GB, 256GB SSD)");
        listing.setCategory(EWasteCategory.DESKTOP);
        listing.setBrand("Apple");
        listing.setModel("Mac Mini (2020)");
        listing.setCosmeticGrade(CosmeticGrade.GRADE_A);
        listing.setSellingPrice(new BigDecimal("38000.00"));
        listing.setOriginalReferencePrice(new BigDecimal("64000.00"));
        listing.setWarrantyDays(90);
        listing.setStockStatus(MarketplaceStockStatus.AVAILABLE);
        listing.setListingStatus(MarketplaceListingStatus.PUBLISHED);
        listing.setPublishedAt(LocalDateTime.now());
        listing = marketplaceListingRepository.save(listing);
    }

    @Test
    @DisplayName("Cart maintains unique physical unit: max quantity is 1")
    void testCartMaxQuantityOne() throws Exception {
        // 1. Add to cart first time
        mockMvc.perform(post("/api/marketplace/cart/items?listingId=" + listing.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(1))
                .andExpect(jsonPath("$.items[0].listingId").value(listing.getId()))
                .andExpect(jsonPath("$.subtotal").value(38000.00));

        // 2. Add same listing again: count remains 1
        mockMvc.perform(post("/api/marketplace/cart/items?listingId=" + listing.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(1))
                .andExpect(jsonPath("$.subtotal").value(38000.00));

        // 3. View cart
        mockMvc.perform(get("/api/marketplace/cart")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(1))
                .andExpect(jsonPath("$.items[0].available").value(true));
    }

    @Test
    @DisplayName("Atomic checkout locks listing to RESERVED; concurrent double-booking is prevented")
    void testCheckoutAndDoubleBookingPrevention() throws Exception {
        // Buyer A adds to cart
        mockMvc.perform(post("/api/marketplace/cart/items?listingId=" + listing.getId())
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk());

        // Buyer A checks out
        CreateOrderDTO orderDTO = new CreateOrderDTO();
        orderDTO.setRecipientName("Alice Buyer");
        orderDTO.setPhoneNumber("9876543210");
        orderDTO.setAddressLine("Flat 101, Green Meadows");
        orderDTO.setCity("Hyderabad");
        orderDTO.setState("Telangana");
        orderDTO.setPostalCode("500001");
        orderDTO.setListingIds(List.of(listing.getId()));

        String orderRes = mockMvc.perform(post("/api/marketplace/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").exists())
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
                .andExpect(jsonPath("$.totalAmount").value(38000.00))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andReturn().getResponse().getContentAsString();

        // Verify listing stock status in DB is now RESERVED
        MarketplaceListing updatedListing = marketplaceListingRepository.findById(listing.getId()).orElseThrow();
        assertEquals(MarketplaceStockStatus.RESERVED, updatedListing.getStockStatus());

        // Buyer A's cart is now empty
        mockMvc.perform(get("/api/marketplace/cart")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(0));

        // Buyer B attempts to checkout the same listing -> MUST FAIL with 400 Bad Request
        CreateOrderDTO buyerBDTO = new CreateOrderDTO();
        buyerBDTO.setRecipientName("Bob Buyer");
        buyerBDTO.setPhoneNumber("9123456780");
        buyerBDTO.setAddressLine("House 22, Sunshine Valley");
        buyerBDTO.setCity("Hyderabad");
        buyerBDTO.setState("Telangana");
        buyerBDTO.setPostalCode("500002");
        buyerBDTO.setListingIds(List.of(listing.getId()));

        mockMvc.perform(post("/api/marketplace/orders")
                        .header("Authorization", "Bearer " + tokenBuyerB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buyerBDTO)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("unavailable for purchase")));
    }

    @Test
    @DisplayName("Order cancellation rolls back listing stockStatus to AVAILABLE")
    void testOrderCancellationInventoryRollback() throws Exception {
        // Place order
        CreateOrderDTO orderDTO = new CreateOrderDTO();
        orderDTO.setRecipientName("Alice Buyer");
        orderDTO.setPhoneNumber("9876543210");
        orderDTO.setAddressLine("Flat 101, Green Meadows");
        orderDTO.setCity("Hyderabad");
        orderDTO.setState("Telangana");
        orderDTO.setPostalCode("500001");
        orderDTO.setListingIds(List.of(listing.getId()));

        String orderRes = mockMvc.perform(post("/api/marketplace/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderDTO)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(orderRes).get("id").asLong();

        // Cancel order
        mockMvc.perform(post("/api/marketplace/orders/" + orderId + "/cancel?reason=Changed mind")
                        .header("Authorization", "Bearer " + tokenBuyerA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Verify listing stock status rolled back to AVAILABLE
        MarketplaceListing rolledBackListing = marketplaceListingRepository.findById(listing.getId()).orElseThrow();
        assertEquals(MarketplaceStockStatus.AVAILABLE, rolledBackListing.getStockStatus());
    }

    @Test
    @DisplayName("Order fulfillment to DELIVERED transitions listing stockStatus to SOLD while paymentStatus remains honestly PENDING (SOLD != PAID)")
    void testOrderFulfillmentTransitionsToSoldWithoutFakingPaid() throws Exception {
        // 1. Place order -> initial payment state is PENDING
        CreateOrderDTO orderDTO = new CreateOrderDTO();
        orderDTO.setRecipientName("Alice Buyer");
        orderDTO.setPhoneNumber("9876543210");
        orderDTO.setAddressLine("Flat 101, Green Meadows");
        orderDTO.setCity("Hyderabad");
        orderDTO.setState("Telangana");
        orderDTO.setPostalCode("500001");
        orderDTO.setListingIds(List.of(listing.getId()));

        String orderRes = mockMvc.perform(post("/api/marketplace/orders")
                        .header("Authorization", "Bearer " + tokenBuyerA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Long orderId = objectMapper.readTree(orderRes).get("id").asLong();

        // 2. Fulfill to CONFIRMED -> paymentStatus remains PENDING
        mockMvc.perform(post("/api/recycler/marketplace/orders/" + orderId + "/fulfill?status=CONFIRMED")
                        .header("Authorization", "Bearer " + tokenRecycler))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));

        // 3. Fulfill to SHIPPED -> paymentStatus remains PENDING
        mockMvc.perform(post("/api/recycler/marketplace/orders/" + orderId + "/fulfill?status=SHIPPED")
                        .header("Authorization", "Bearer " + tokenRecycler))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));

        // 4. Fulfill to DELIVERED -> paymentStatus remains PENDING (SOLD != PAID, no fake payment success)
        mockMvc.perform(post("/api/recycler/marketplace/orders/" + orderId + "/fulfill?status=DELIVERED")
                        .header("Authorization", "Bearer " + tokenRecycler))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));

        // 5. Verify listing stock status in DB is now permanently SOLD
        MarketplaceListing soldListing = marketplaceListingRepository.findById(listing.getId()).orElseThrow();
        assertEquals(MarketplaceStockStatus.SOLD, soldListing.getStockStatus());
        assertNotNull(soldListing.getSoldAt());

        // 6. Verify order payment status in DB is strictly PENDING (not PAID)
        MarketplaceOrder dbOrder = marketplaceOrderRepository.findById(orderId).orElseThrow();
        assertEquals(MarketplacePaymentStatus.PENDING, dbOrder.getPaymentStatus());
        assertEquals(MarketplaceOrderStatus.DELIVERED, dbOrder.getStatus());
    }
}
