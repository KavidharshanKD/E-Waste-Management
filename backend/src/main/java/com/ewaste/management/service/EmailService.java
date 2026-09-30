package com.ewaste.management.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Dispatches password reset OTP email.
     * Always logs the code to console so local dev / testing works immediately
     * even before the administrator configures production SMTP credentials.
     */
    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        log.info("=================================================================");
        log.info("[PASSWORD RESET OTP] Target: {} | Code: {} | Valid: 15 mins", toEmail, resetCode);
        log.info("=================================================================");

        if (mailSender == null || fromEmail == null || fromEmail.isBlank()) {
            log.info("SMTP username not yet configured. Verification code is logged above for testing.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("E-Waste Management System - Password Reset Code");
            message.setText("Hello,\n\n"
                    + "You requested a password reset for your E-Waste Management System account.\n\n"
                    + "Your 6-digit verification code is: " + resetCode + "\n\n"
                    + "This code is valid for 15 minutes. If you did not request this, please ignore this email.\n\n"
                    + "Best regards,\n"
                    + "Smart E-Waste Management Team");

            mailSender.send(message);
            log.info("Password reset email successfully dispatched via SMTP to {}", toEmail);
        } catch (Exception ex) {
            log.warn("SMTP email dispatch failed for {}: {}. The verification code is logged above.", toEmail, ex.getMessage());
        }
    }
}
