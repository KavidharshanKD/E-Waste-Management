package com.ewaste.management.service;

import com.ewaste.management.dto.BulkEWasteItemInput;
import com.ewaste.management.dto.CsvPreviewResultDTO;
import com.ewaste.management.model.enums.DeviceCondition;
import com.ewaste.management.model.enums.EWasteCategory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class CsvParserService {

    public CsvPreviewResultDTO parseAndValidateCsv(MultipartFile file) {
        CsvPreviewResultDTO result = new CsvPreviewResultDTO();
        List<BulkEWasteItemInput> parsedItems = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        if (file == null || file.isEmpty()) {
            errors.add("File is empty or missing.");
            result.setValidationErrors(errors);
            return result;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                String trimmedLine = line.trim();
                if (trimmedLine.isEmpty()) continue;

                // Skip header line if present
                if (lineNumber == 1 && isHeaderLine(trimmedLine)) {
                    continue;
                }

                String[] tokens = parseCsvLine(trimmedLine);
                if (tokens.length < 2) {
                    errors.add("Line " + lineNumber + ": Insufficient columns. Minimum required: Category, Quantity.");
                    continue;
                }

                String categoryStr = tokens[0].trim();
                String deviceNameStr = tokens.length > 1 ? tokens[1].trim() : "";
                String brandStr = tokens.length > 2 ? tokens[2].trim() : "";
                String quantityStr = tokens.length > 3 ? tokens[3].trim() : "1";
                String conditionStr = tokens.length > 4 ? tokens[4].trim() : "WORKING";
                String workingStatusStr = tokens.length > 5 ? tokens[5].trim() : "Working";
                String descriptionStr = tokens.length > 6 ? tokens[6].trim() : "";

                // If quantity was passed in position 2 (e.g. Category, Quantity, Description format)
                if (!quantityStr.matches("\\d+") && deviceNameStr.matches("\\d+")) {
                    descriptionStr = brandStr;
                    brandStr = "";
                    quantityStr = deviceNameStr;
                    deviceNameStr = "";
                }

                EWasteCategory category = parseCategory(categoryStr);
                if (category == null) {
                    errors.add("Line " + lineNumber + ": Invalid e-waste category '" + categoryStr + "'.");
                }

                int quantity = 1;
                try {
                    quantity = Integer.parseInt(quantityStr);
                    if (quantity <= 0) {
                        errors.add("Line " + lineNumber + ": Quantity must be greater than 0 (found " + quantity + ").");
                    }
                } catch (NumberFormatException e) {
                    errors.add("Line " + lineNumber + ": Invalid quantity format '" + quantityStr + "'.");
                }

                DeviceCondition condition = parseCondition(conditionStr);

                if (category != null && quantity > 0) {
                    BulkEWasteItemInput itemInput = new BulkEWasteItemInput();
                    itemInput.setCategory(category);
                    itemInput.setDeviceName(deviceNameStr.isEmpty() ? category.name() : deviceNameStr);
                    itemInput.setBrand(brandStr.isEmpty() ? "Generic" : brandStr);
                    itemInput.setQuantity(quantity);
                    itemInput.setCondition(condition);
                    itemInput.setWorkingStatus(workingStatusStr.isEmpty() ? "Working" : workingStatusStr);
                    itemInput.setDescription(descriptionStr);
                    parsedItems.add(itemInput);
                }
            }

            result.setTotalRows(lineNumber);
            result.setParsedItems(parsedItems);
            result.setValidRowsCount(parsedItems.size());
            result.setInvalidRowsCount(errors.size());
            result.setValidationErrors(errors);

            return result;
        } catch (Exception e) {
            errors.add("Failed to parse CSV file: " + e.getMessage());
            result.setValidationErrors(errors);
            return result;
        }
    }

    private boolean isHeaderLine(String line) {
        String lower = line.toLowerCase();
        return lower.contains("category") || lower.contains("quantity") || lower.contains("device") || lower.contains("brand");
    }

    private String[] parseCsvLine(String line) {
        return line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
    }

    private EWasteCategory parseCategory(String input) {
        if (input == null || input.isBlank()) return null;
        String normalized = input.trim().toUpperCase().replace(" ", "_");
        
        // Exact match
        try {
            return EWasteCategory.valueOf(normalized);
        } catch (Exception ignored) {}

        // Alias matching
        if (normalized.contains("PHONE") || normalized.contains("MOBILE")) return EWasteCategory.MOBILE_PHONE;
        if (normalized.contains("LAPTOP") || normalized.contains("NOTEBOOK")) return EWasteCategory.LAPTOP;
        if (normalized.contains("DESKTOP") || normalized.contains("CPU") || normalized.contains("PC")) return EWasteCategory.DESKTOP;
        if (normalized.contains("MONITOR") || normalized.contains("SCREEN")) return EWasteCategory.MONITOR;
        if (normalized.contains("TV") || normalized.contains("TELEVISION")) return EWasteCategory.TELEVISION;
        if (normalized.contains("PRINTER") || normalized.contains("SCANNER")) return EWasteCategory.PRINTER;
        if (normalized.contains("KEYBOARD")) return EWasteCategory.KEYBOARD;
        if (normalized.contains("MOUSE")) return EWasteCategory.MOUSE;
        if (normalized.contains("BATTERY") || normalized.contains("BATTERIES")) return EWasteCategory.BATTERY;
        if (normalized.contains("CHARGER") || normalized.contains("ADAPTER")) return EWasteCategory.CHARGER;
        if (normalized.contains("CABLE") || normalized.contains("WIRE")) return EWasteCategory.CABLE;
        if (normalized.contains("FRIDGE") || normalized.contains("REFRIGERATOR")) return EWasteCategory.REFRIGERATOR;
        if (normalized.contains("WASHING")) return EWasteCategory.WASHING_MACHINE;
        if (normalized.contains("AIR") || normalized.contains("AC")) return EWasteCategory.AIR_CONDITIONER;
        
        return EWasteCategory.OTHER;
    }

    private DeviceCondition parseCondition(String input) {
        if (input == null || input.isBlank()) return DeviceCondition.WORKING;
        String normalized = input.trim().toUpperCase().replace(" ", "_");
        try {
            return DeviceCondition.valueOf(normalized);
        } catch (Exception ignored) {}
        if (normalized.contains("DAMAGED")) return DeviceCondition.DAMAGED;
        if (normalized.contains("PARTIAL")) return DeviceCondition.PARTIALLY_WORKING;
        if (normalized.contains("NOT_WORKING") || normalized.contains("NON_WORKING")) return DeviceCondition.NOT_WORKING;
        if (normalized.contains("HAZARDOUS")) return DeviceCondition.HAZARDOUS;
        return DeviceCondition.WORKING;
    }
}
