package com.ewaste.management.dto.marketplace;

import java.math.BigDecimal;

public class PaymentOrderResponseDTO {
    private Long orderId;
    private String orderNumber;
    private String razorpayOrderId;
    private Long amountPaise;
    private BigDecimal amountRupees;
    private String currency;
    private String keyId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private boolean sandboxMode;

    public PaymentOrderResponseDTO() {
    }

    public PaymentOrderResponseDTO(Long orderId, String orderNumber, String razorpayOrderId,
                                   Long amountPaise, BigDecimal amountRupees, String currency,
                                   String keyId, String customerName, String customerEmail,
                                   String customerPhone, boolean sandboxMode) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.razorpayOrderId = razorpayOrderId;
        this.amountPaise = amountPaise;
        this.amountRupees = amountRupees;
        this.currency = currency;
        this.keyId = keyId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.sandboxMode = sandboxMode;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public Long getAmountPaise() {
        return amountPaise;
    }

    public void setAmountPaise(Long amountPaise) {
        this.amountPaise = amountPaise;
    }

    public BigDecimal getAmountRupees() {
        return amountRupees;
    }

    public void setAmountRupees(BigDecimal amountRupees) {
        this.amountRupees = amountRupees;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getKeyId() {
        return keyId;
    }

    public void setKeyId(String keyId) {
        this.keyId = keyId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public boolean isSandboxMode() {
        return sandboxMode;
    }

    public void setSandboxMode(boolean sandboxMode) {
        this.sandboxMode = sandboxMode;
    }
}
