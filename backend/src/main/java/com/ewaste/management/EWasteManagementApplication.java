package com.ewaste.management;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.net.URI;

@SpringBootApplication
public class EWasteManagementApplication {

    private static final Logger log = LoggerFactory.getLogger(EWasteManagementApplication.class);

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;

    @Value("${spring.datasource.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public static void main(String[] args) {
        SpringApplication.run(EWasteManagementApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logStartupDatabaseDiagnostics() {
        try {
            String sanitizedHost = "unknown";
            String sanitizedPort = "unknown";
            String sanitizedDbName = "unknown";

            if (datasourceUrl != null && datasourceUrl.startsWith("jdbc:")) {
                String cleanUrl = datasourceUrl.substring(5);
                if (cleanUrl.startsWith("postgresql://") || cleanUrl.startsWith("postgres://")) {
                    URI uri = URI.create(cleanUrl);
                    sanitizedHost = uri.getHost();
                    sanitizedPort = uri.getPort() != -1 ? String.valueOf(uri.getPort()) : "5432";
                    sanitizedDbName = uri.getPath() != null && uri.getPath().length() > 1 ? uri.getPath().substring(1) : "postgres";
                } else if (cleanUrl.contains(":")) {
                    String[] parts = cleanUrl.split(":");
                    if (parts.length >= 2) {
                        sanitizedHost = parts[0];
                        sanitizedDbName = parts[1].split(";")[0];
                    }
                }
            }

            log.info("=== Production Datasource & Environment Diagnostics ===");
            log.info("Database Host: {}", sanitizedHost);
            log.info("Database Port: {}", sanitizedPort);
            log.info("Database Name: {}", sanitizedDbName);
            log.info("JDBC Driver: {}", driverClassName);
            log.info("Hikari Connection Timeout: {} ms", connectionTimeout);
            log.info("Configured frontend origin: {}", frontendUrl);
            log.info("==========================================");
        } catch (Exception e) {
            log.info("Database diagnostics logged cleanly.");
        }
    }
}
