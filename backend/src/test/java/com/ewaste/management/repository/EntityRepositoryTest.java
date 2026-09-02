package com.ewaste.management.repository;

import com.ewaste.management.entity.DisposalRequest;
import com.ewaste.management.entity.EWasteItem;
import com.ewaste.management.entity.User;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import com.ewaste.management.model.enums.RequestStatus;
import com.ewaste.management.model.enums.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EntityRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DisposalRequestRepository disposalRequestRepository;

    @Autowired
    private EWasteItemRepository eWasteItemRepository;

    @Test
    void testUserRepositorySeedData() {
        Optional<User> admin = userRepository.findByEmail("admin@ewaste.com");
        assertTrue(admin.isPresent(), "Admin user should exist from dev seed script");
        assertEquals(UserRole.ADMIN, admin.get().getRole());
    }

    @Test
    void testCreateDisposalRequestAndEWasteItem() {
        User resident = userRepository.findByEmail("resident@ewaste.com")
                .orElseGet(() -> userRepository.save(new User("testres@ewaste.com", "pass", UserRole.USER)));

        DisposalRequest request = new DisposalRequest();
        request.setTrackingNumber("EWR-2026-9999");
        request.setUser(resident);
        request.setStatus(RequestStatus.SUBMITTED);
        request.setPickupAddress("123 Test Street");
        request.setPickupCity("Bengaluru");
        request.setPickupState("Karnataka");
        request.setPickupPostalCode("560001");

        EWasteItem item = new EWasteItem();
        item.setCategory(EWasteCategory.LAPTOP);
        item.setBrand("Dell");
        item.setModelName("XPS 15");
        item.setCondition(DeviceCondition.WORKING);
        item.setWeightKg(new BigDecimal("2.50"));
        item.setEstimatedRewardPoints(100);

        request.addItem(item);

        DisposalRequest savedRequest = disposalRequestRepository.save(request);

        assertNotNull(savedRequest.getId());
        assertNotNull(savedRequest.getCreatedAt());
        assertEquals("EWR-2026-9999", savedRequest.getTrackingNumber());
        assertEquals(1, savedRequest.getItems().size());
        assertEquals(EWasteCategory.LAPTOP, savedRequest.getItems().get(0).getCategory());
    }
}
