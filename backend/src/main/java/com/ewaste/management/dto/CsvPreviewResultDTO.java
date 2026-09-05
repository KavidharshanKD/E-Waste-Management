package com.ewaste.management.dto;

import java.util.ArrayList;
import java.util.List;

public class CsvPreviewResultDTO {
    private int totalRows;
    private int validRowsCount;
    private int invalidRowsCount;
    private List<BulkEWasteItemInput> parsedItems = new ArrayList<>();
    private List<String> validationErrors = new ArrayList<>();

    public CsvPreviewResultDTO() {}

    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }

    public int getValidRowsCount() { return validRowsCount; }
    public void setValidRowsCount(int validRowsCount) { this.validRowsCount = validRowsCount; }

    public int getInvalidRowsCount() { return invalidRowsCount; }
    public void setInvalidRowsCount(int invalidRowsCount) { this.invalidRowsCount = invalidRowsCount; }

    public List<BulkEWasteItemInput> getParsedItems() { return parsedItems; }
    public void setParsedItems(List<BulkEWasteItemInput> parsedItems) { this.parsedItems = parsedItems; }

    public List<String> getValidationErrors() { return validationErrors; }
    public void setValidationErrors(List<String> validationErrors) { this.validationErrors = validationErrors; }
}
