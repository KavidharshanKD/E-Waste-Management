package com.ewaste.management.service.ml;

public class MLClientException extends RuntimeException {

    private final String reasonCategory;
    private final Integer statusCode;

    public MLClientException(String message, String reasonCategory) {
        super(message);
        this.reasonCategory = reasonCategory;
        this.statusCode = null;
    }

    public MLClientException(String message, String reasonCategory, Throwable cause) {
        super(message, cause);
        this.reasonCategory = reasonCategory;
        this.statusCode = null;
    }

    public MLClientException(String message, String reasonCategory, int statusCode) {
        super(message);
        this.reasonCategory = reasonCategory;
        this.statusCode = statusCode;
    }

    public String getReasonCategory() {
        return reasonCategory;
    }

    public Integer getStatusCode() {
        return statusCode;
    }
}
