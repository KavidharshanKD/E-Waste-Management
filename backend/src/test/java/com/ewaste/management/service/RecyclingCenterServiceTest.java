package com.ewaste.management.service;

import com.ewaste.management.dto.RecyclingCenterDTO;
import com.ewaste.management.entity.RecyclingCenter;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.util.GeoDistanceUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecyclingCenterServiceTest {

    @Mock
    private RecyclingCenterRepository recyclingCenterRepository;

    @InjectMocks
    private RecyclingCenterService recyclingCenterService;

    private RecyclingCenter chennaiCenter;
    private RecyclingCenter blrCenter;

    @BeforeEach
    void setUp() {
        chennaiCenter = new RecyclingCenter();
        chennaiCenter.setName("GreenTech Chennai (Demo Facility)");
        chennaiCenter.setCity("Chennai");
        chennaiCenter.setState("Tamil Nadu");
        chennaiCenter.setPostalCode("600032");
        chennaiCenter.setLatitude(13.0067);
        chennaiCenter.setLongitude(80.2020);
        chennaiCenter.setAcceptedWasteCategories("MOBILE_PHONE, LAPTOP, BATTERY");
        chennaiCenter.setOperatingHours("Mon - Sat: 9:00 AM - 6:30 PM");
        chennaiCenter.setActive(true);
        chennaiCenter.setDemoFacility(true);

        blrCenter = new RecyclingCenter();
        blrCenter.setName("EcoMatrix Bengaluru (Demo Facility)");
        blrCenter.setCity("Bengaluru");
        blrCenter.setState("Karnataka");
        blrCenter.setPostalCode("560066");
        blrCenter.setLatitude(12.9698);
        blrCenter.setLongitude(77.7500);
        blrCenter.setAcceptedWasteCategories("LAPTOP, DESKTOP, TELEVISION");
        blrCenter.setActive(true);
        blrCenter.setDemoFacility(true);
    }

    @Test
    @DisplayName("Haversine formula calculates accurate geographic distance in km")
    void testHaversineDistanceCalculation() {
        // Distance between Chennai (13.0827, 80.2707) and Bengaluru (12.9716, 77.5946)
        Double distanceKm = GeoDistanceUtils.calculateHaversineDistanceKm(13.0827, 80.2707, 12.9716, 77.5946);

        assertNotNull(distanceKm);
        assertTrue(distanceKm > 280 && distanceKm < 300, "Distance between Chennai and Bengaluru should be approx ~290km");
    }

    @Test
    @DisplayName("Search recycling centers by City filter")
    void testSearchCentersByCity() {
        when(recyclingCenterRepository.findByActiveTrue()).thenReturn(Arrays.asList(chennaiCenter, blrCenter));

        List<RecyclingCenterDTO> results = recyclingCenterService.searchCenters("Chennai", null, null, null, null, null, null);

        assertEquals(1, results.size());
        assertEquals("Chennai", results.get(0).getCity());
        assertTrue(results.get(0).isDemoFacility());
    }

    @Test
    @DisplayName("Search recycling centers by Accepted Category filter")
    void testSearchCentersByCategory() {
        when(recyclingCenterRepository.findByActiveTrue()).thenReturn(Arrays.asList(chennaiCenter, blrCenter));

        List<RecyclingCenterDTO> results = recyclingCenterService.searchCenters(null, null, null, "MOBILE_PHONE", null, null, null);

        assertEquals(1, results.size());
        assertEquals("GreenTech Chennai (Demo Facility)", results.get(0).getName());
    }

    @Test
    @DisplayName("Nearby centers calculated with Haversine distance and sorted ascending")
    void testGetNearbyCentersSortedByDistance() {
        when(recyclingCenterRepository.findByActiveTrue()).thenReturn(Arrays.asList(chennaiCenter, blrCenter));

        // User location in Chennai (13.0400, 80.2300)
        List<RecyclingCenterDTO> nearby = recyclingCenterService.getNearbyCenters(13.0400, 80.2300, 500.0, null);

        assertEquals(2, nearby.size());
        assertEquals("Chennai", nearby.get(0).getCity());
        assertTrue(nearby.get(0).getDistanceKm() < nearby.get(1).getDistanceKm(), "Nearest center (Chennai) should come first");
    }
}
