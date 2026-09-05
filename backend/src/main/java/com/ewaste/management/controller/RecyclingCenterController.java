package com.ewaste.management.controller;

import com.ewaste.management.dto.RecyclingCenterDTO;
import com.ewaste.management.service.RecyclingCenterService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recycling-centers")
public class RecyclingCenterController {

    private final RecyclingCenterService recyclingCenterService;

    public RecyclingCenterController(RecyclingCenterService recyclingCenterService) {
        this.recyclingCenterService = recyclingCenterService;
    }

    @GetMapping
    public ResponseEntity<List<RecyclingCenterDTO>> getRecyclingCenters(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pincode,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        List<RecyclingCenterDTO> centers = recyclingCenterService.searchCenters(city, state, pincode, category, search, lat, lng);
        return ResponseEntity.ok(centers);
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyRecyclingCenters(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false, defaultValue = "50.0") Double radiusKm,
            @RequestParam(required = false) String category) {

        try {
            List<RecyclingCenterDTO> nearby = recyclingCenterService.getNearbyCenters(lat, lng, radiusKm, category);
            return ResponseEntity.ok(nearby);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRecyclingCenterById(
            @PathVariable Long id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {

        try {
            RecyclingCenterDTO center = recyclingCenterService.getCenterById(id, lat, lng);
            return ResponseEntity.ok(center);
        } catch (IllegalArgumentException ex) {
            Map<String, String> err = new HashMap<>();
            err.put("error", ex.getMessage());
            return ResponseEntity.status(404).body(err);
        }
    }
}
