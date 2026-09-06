package com.ewaste.management.service;

import com.ewaste.management.dto.RecyclingCenterDTO;
import com.ewaste.management.entity.RecyclingCenter;
import com.ewaste.management.repository.RecyclingCenterRepository;
import com.ewaste.management.util.GeoDistanceUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecyclingCenterService {

    private final RecyclingCenterRepository recyclingCenterRepository;

    public RecyclingCenterService(RecyclingCenterRepository recyclingCenterRepository) {
        this.recyclingCenterRepository = recyclingCenterRepository;
    }

    @Transactional(readOnly = true)
    public List<RecyclingCenterDTO> searchCenters(String city, String state, String pincode, String category, String search, Double userLat, Double userLng) {
        List<RecyclingCenter> centers = recyclingCenterRepository.findByActiveTrue();

        return centers.stream()
                .filter(center -> city == null || city.isBlank() || center.getCity().equalsIgnoreCase(city.trim()))
                .filter(center -> state == null || state.isBlank() || center.getState().equalsIgnoreCase(state.trim()))
                .filter(center -> pincode == null || pincode.isBlank() || center.getPostalCode().equals(pincode.trim()))
                .filter(center -> category == null || category.isBlank() || 
                        (center.getAcceptedWasteCategories() != null && center.getAcceptedWasteCategories().toUpperCase().contains(category.trim().toUpperCase())))
                .filter(center -> search == null || search.isBlank() || matchesSearchQuery(center, search.trim()))
                .map(center -> mapToDTO(center, userLat, userLng))
                .sorted((c1, c2) -> {
                    if (c1.getDistanceKm() != null && c2.getDistanceKm() != null) {
                        return Double.compare(c1.getDistanceKm(), c2.getDistanceKm());
                    }
                    if (c1.getDistanceKm() != null) return -1;
                    if (c2.getDistanceKm() != null) return 1;
                    return c1.getName().compareToIgnoreCase(c2.getName());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecyclingCenterDTO> getNearbyCenters(Double userLat, Double userLng, Double radiusKm, String category) {
        if (userLat == null || userLng == null) {
            throw new IllegalArgumentException("User latitude and longitude parameters are required for nearby discovery.");
        }

        double maxRadius = (radiusKm != null && radiusKm > 0) ? radiusKm : 50.0;
        List<RecyclingCenter> centers = recyclingCenterRepository.findByActiveTrue();

        return centers.stream()
                .map(center -> mapToDTO(center, userLat, userLng))
                .filter(dto -> dto.getDistanceKm() != null && dto.getDistanceKm() <= maxRadius)
                .filter(dto -> category == null || category.isBlank() ||
                        (dto.getAcceptedWasteCategories() != null && dto.getAcceptedWasteCategories().toUpperCase().contains(category.trim().toUpperCase())))
                .sorted(Comparator.comparingDouble(RecyclingCenterDTO::getDistanceKm))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RecyclingCenterDTO getCenterById(Long id, Double userLat, Double userLng) {
        RecyclingCenter center = recyclingCenterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recycling center not found with ID: " + id));

        return mapToDTO(center, userLat, userLng);
    }

    private boolean matchesSearchQuery(RecyclingCenter center, String query) {
        String q = query.toLowerCase();
        return (center.getName() != null && center.getName().toLowerCase().contains(q)) ||
               (center.getAddress() != null && center.getAddress().toLowerCase().contains(q)) ||
               (center.getCity() != null && center.getCity().toLowerCase().contains(q)) ||
               (center.getDistrict() != null && center.getDistrict().toLowerCase().contains(q)) ||
               (center.getRegistrationNumber() != null && center.getRegistrationNumber().toLowerCase().contains(q));
    }

    private RecyclingCenterDTO mapToDTO(RecyclingCenter center, Double userLat, Double userLng) {
        RecyclingCenterDTO dto = new RecyclingCenterDTO();
        dto.setId(center.getId());
        dto.setName(center.getName());
        dto.setRegistrationNumber(center.getRegistrationNumber());
        dto.setAddress(center.getAddress());
        dto.setCity(center.getCity());
        dto.setDistrict(center.getDistrict());
        dto.setState(center.getState());
        dto.setPostalCode(center.getPostalCode());
        dto.setLatitude(center.getLatitude());
        dto.setLongitude(center.getLongitude());
        dto.setContactPhone(center.getContactPhone());
        dto.setContactEmail(center.getContactEmail());
        dto.setAcceptedWasteCategories(center.getAcceptedWasteCategories());
        dto.setOperatingHours(center.getOperatingHours());
        dto.setProcessingCapacityKgPerDay(center.getProcessingCapacityKgPerDay());
        dto.setActive(center.isActive());
        dto.setDemoFacility(center.isDemoFacility());
        dto.setCpcbRegistrationRef(center.getCpcbRegistrationRef());
        dto.setRegistrationValidityDate(center.getRegistrationValidityDate());
        dto.setAuthorizedCapacityTonsPerAnnum(center.getAuthorizedCapacityTonsPerAnnum());
        dto.setVerificationAuthority(center.getVerificationAuthority());

        if (userLat != null && userLng != null && center.getLatitude() != null && center.getLongitude() != null) {
            Double distance = GeoDistanceUtils.calculateHaversineDistanceKm(userLat, userLng, center.getLatitude(), center.getLongitude());
            dto.setDistanceKm(distance);
        }

        return dto;
    }

    @Transactional
    public RecyclingCenterDTO saveCenter(RecyclingCenterDTO dto) {
        RecyclingCenter center = (dto.getId() != null)
                ? recyclingCenterRepository.findById(dto.getId()).orElse(new RecyclingCenter())
                : new RecyclingCenter();

        center.setName(dto.getName());
        center.setRegistrationNumber(dto.getRegistrationNumber());
        center.setAddress(dto.getAddress());
        center.setCity(dto.getCity());
        center.setDistrict(dto.getDistrict());
        center.setState(dto.getState());
        center.setPostalCode(dto.getPostalCode());
        center.setLatitude(dto.getLatitude());
        center.setLongitude(dto.getLongitude());
        center.setContactPhone(dto.getContactPhone());
        center.setContactEmail(dto.getContactEmail());
        center.setAcceptedWasteCategories(dto.getAcceptedWasteCategories());
        center.setOperatingHours(dto.getOperatingHours());
        center.setProcessingCapacityKgPerDay(dto.getProcessingCapacityKgPerDay());
        center.setActive(dto.isActive());
        center.setDemoFacility(dto.isDemoFacility());

        center.setCpcbRegistrationRef(dto.getCpcbRegistrationRef());
        center.setRegistrationValidityDate(dto.getRegistrationValidityDate());
        center.setAuthorizedCapacityTonsPerAnnum(dto.getAuthorizedCapacityTonsPerAnnum());
        center.setVerificationAuthority(dto.getVerificationAuthority());

        RecyclingCenter saved = recyclingCenterRepository.save(center);
        return mapToDTO(saved, null, null);
    }
}
