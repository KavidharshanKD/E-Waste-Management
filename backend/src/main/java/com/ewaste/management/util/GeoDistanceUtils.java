package com.ewaste.management.util;

public class GeoDistanceUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates approximate geographic distance between two lat/lng points using the Haversine formula.
     * @param lat1 User latitude
     * @param lon1 User longitude
     * @param lat2 Facility latitude
     * @param lon2 Facility longitude
     * @return Distance in kilometers rounded to 2 decimal places, or null if coordinates are invalid.
     */
    public static Double calculateHaversineDistanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rLat1) * Math.cos(rLat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        return Math.round(distance * 100.0) / 100.0;
    }
}
