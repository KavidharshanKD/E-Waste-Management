package com.ewaste.management.service;

import com.ewaste.management.dto.RecyclingCertificateDTO;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class CertificatePdfGeneratorService {

    private final QRCodeGeneratorService qrCodeGeneratorService;

    public CertificatePdfGeneratorService(QRCodeGeneratorService qrCodeGeneratorService) {
        this.qrCodeGeneratorService = qrCodeGeneratorService;
    }

    public byte[] generateCertificatePdf(RecyclingCertificateDTO cert) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryColor = new Color(5, 150, 105); // Emerald green
            Color darkColor = new Color(30, 41, 59);     // Slate 800
            Color grayColor = new Color(71, 85, 105);    // Slate 600
            Color bgLight = new Color(248, 250, 252);     // Slate 50

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, primaryColor);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkColor);
            Font certIdFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, primaryColor);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkColor);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkColor);
            Font disclaimerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, grayColor);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, grayColor);

            // Header Title
            Paragraph title = new Paragraph("DIGITAL RECYCLING CERTIFICATE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subTitle = new Paragraph("Smart E-Waste Management & Environmental Protection System", subtitleFont);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(12);
            document.add(subTitle);

            // Certificate Number
            Paragraph certIdPara = new Paragraph("Certificate ID: " + cert.getCertificateNumber(), certIdFont);
            certIdPara.setAlignment(Element.ALIGN_CENTER);
            certIdPara.setSpacingAfter(18);
            document.add(certIdPara);

            // Table with details
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35f, 65f});
            table.setSpacingAfter(16);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, HH:mm");
            String formattedDate = cert.getIssueDate() != null ? cert.getIssueDate().format(formatter) : "N/A";

            addTableRow(table, "Certificate ID", cert.getCertificateNumber(), labelFont, valueFont, bgLight);
            addTableRow(table, "Tracking ID", cert.getTrackingNumber() != null ? cert.getTrackingNumber() : "N/A", labelFont, valueFont, Color.WHITE);
            addTableRow(table, "User Name", cert.getUserName() != null ? cert.getUserName() : "N/A", labelFont, valueFont, bgLight);
            addTableRow(table, "Category", cert.getCategory() != null ? cert.getCategory() : "N/A", labelFont, valueFont, Color.WHITE);
            addTableRow(table, "Quantity", cert.getQuantity() != null ? String.valueOf(cert.getQuantity()) + " unit(s)" : "1 unit", labelFont, valueFont, bgLight);
            addTableRow(table, "Disposal Method", cert.getFinalDisposalMethod() != null ? cert.getFinalDisposalMethod() : "RECYCLE", labelFont, valueFont, Color.WHITE);
            addTableRow(table, "Processing Date", formattedDate, labelFont, valueFont, bgLight);
            addTableRow(table, "Recycling Center", cert.getRecyclingCenter() != null ? cert.getRecyclingCenter() : "Central E-Waste Processing Hub", labelFont, valueFont, Color.WHITE);
            addTableRow(table, "Status", cert.getStatus() != null ? cert.getStatus() : "COMPLETED", labelFont, valueFont, bgLight);

            document.add(table);

            // Verification Section (QR code + Link)
            PdfPTable qrTable = new PdfPTable(2);
            qrTable.setWidthPercentage(100);
            qrTable.setWidths(new float[]{70f, 30f});

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(PdfPCell.NO_BORDER);
            Paragraph verifyHeading = new Paragraph("Verification & Authenticity", labelFont);
            verifyHeading.setSpacingAfter(4);
            leftCell.addElement(verifyHeading);

            String verifyUrl = cert.getVerificationUrl() != null ? cert.getVerificationUrl() : "";
            Paragraph verifyLink = new Paragraph("Scan QR or visit verification link:\n" + verifyUrl, valueFont);
            leftCell.addElement(verifyLink);

            qrTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(PdfPCell.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);

            if (verifyUrl != null && !verifyUrl.isEmpty()) {
                byte[] qrBytes = qrCodeGeneratorService.generateQRCodeBytes(verifyUrl, 100, 100);
                Image qrImage = Image.getInstance(qrBytes);
                qrImage.setAlignment(Element.ALIGN_RIGHT);
                qrImage.scaleToFit(90, 90);
                rightCell.addElement(qrImage);
            }
            qrTable.addCell(rightCell);

            document.add(qrTable);

            // Spacer
            Paragraph spacer = new Paragraph(" ");
            spacer.setSpacingAfter(12);
            document.add(spacer);

            // Disclaimer Box
            PdfPTable disclaimerTable = new PdfPTable(1);
            disclaimerTable.setWidthPercentage(100);
            PdfPCell discCell = new PdfPCell();
            discCell.setBackgroundColor(new Color(241, 245, 249));
            discCell.setPadding(8);
            discCell.setBorderColor(new Color(203, 213, 225));

            Paragraph discText = new Paragraph("DISCLAIMER:\n" + cert.getDisclaimer(), disclaimerFont);
            discCell.addElement(discText);
            disclaimerTable.addCell(discCell);
            document.add(disclaimerTable);

            // Footer
            Paragraph footer = new Paragraph("Smart E-Waste Management System • Official Application Verification Certificate", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(16);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF certificate", e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, Color bgColor) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(bgColor);
        c1.setPadding(6);
        c1.setBorderColor(new Color(226, 232, 240));

        PdfPCell c2 = new PdfPCell(new Phrase(value, valueFont));
        c2.setBackgroundColor(bgColor);
        c2.setPadding(6);
        c2.setBorderColor(new Color(226, 232, 240));

        table.addCell(c1);
        table.addCell(c2);
    }
}
