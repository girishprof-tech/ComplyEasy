package com.venture.ai;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

/**
 * Demo AI mode: clearly-labelled placeholder output used when no Gemini key is
 * configured, and as the fallback if a real call fails. Never throws.
 */
final class MockCertificateAnalyzer {

    private record Hint(Pattern pattern, String documentType, String category, String authority) {}

    private static Hint hint(String regex, String documentType, String category, String authority) {
        return new Hint(Pattern.compile(regex, Pattern.CASE_INSENSITIVE), documentType, category, authority);
    }

    private static final List<Hint> HINTS = List.of(
            hint("gst", "GST Registration Certificate", "Tax", "Government of India — GST Department"),
            hint("fire|noc", "Fire NOC", "Safety", "State Fire Department"),
            hint("pollution|consent", "Pollution Control Consent", "Environmental", "State Pollution Control Board"),
            hint("trade.?licen[cs]e", "Trade License", "Municipal", "Municipal Corporation"),
            hint("msme|udyam", "MSME/Udyam Registration", "Business Registration", "Ministry of MSME"),
            hint("factory", "Factory License", "Labour & Safety", "State Factories Department"),
            hint("shop|establishment", "Shops & Establishment License", "Municipal", "Labour Department"),
            hint(
                    "fssai|food",
                    "FSSAI License",
                    "Food Safety",
                    "Food Safety and Standards Authority of India"));

    private static final Hint FALLBACK =
            new Hint(null, "Compliance Certificate", "General", "Issuing Authority");

    private MockCertificateAnalyzer() {}

    static CertificateExtraction analyze(String fileName, String businessNameHint) {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        Hint hint = guess(fileName);

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate issued = today.minusDays(180 + rnd.nextInt(400)); // 6 months – 2 years ago

        // Skew toward "expiring soon" and "active" more often than "expired", so a demo
        // run mostly shows encouraging results with the occasional urgent one.
        double roll = rnd.nextDouble();
        int expiryOffsetDays;
        if (roll < 0.15) expiryOffsetDays = -(5 + rnd.nextInt(60));
        else if (roll < 0.4) expiryOffsetDays = 5 + rnd.nextInt(25);
        else expiryOffsetDays = 60 + rnd.nextInt(500);
        LocalDate expiry = today.plusDays(expiryOffsetDays);

        int confidence = 70 + rnd.nextInt(26); // 70–95: the mock never claims full certainty
        String expiryText = "expiry: " + expiry + (expiryOffsetDays >= 0 ? "" : " (already past)");
        String shownName = fileName == null || fileName.isEmpty() ? "the uploaded file" : fileName;

        return new CertificateExtraction(
                hint.documentType(),
                randomCertificateNumber(rnd),
                businessNameHint == null || businessNameHint.isEmpty() ? null : businessNameHint,
                hint.authority(),
                issued.toString(),
                expiry.toString(),
                hint.category(),
                confidence,
                "Demo extraction, not a real reading of \"" + shownName + "\" — no AI is configured. "
                        + "These are placeholder values only (document type: " + hint.documentType() + ", "
                        + expiryText + "); verify and replace every field before saving.",
                true,
                "demo",
                null);
    }

    private static Hint guess(String fileName) {
        String name = fileName == null ? "" : fileName;
        for (Hint h : HINTS) {
            if (h.pattern().matcher(name).find()) return h;
        }
        return FALLBACK;
    }

    /** A GSTIN-shaped placeholder such as {@code 27ABCDE1234F1Z5}. */
    private static String randomCertificateNumber(ThreadLocalRandom rnd) {
        StringBuilder sb = new StringBuilder();
        sb.append(digits(rnd, 2));
        for (int i = 0; i < 5; i++) sb.append(letter(rnd));
        sb.append(digits(rnd, 4));
        sb.append(letter(rnd)).append(digits(rnd, 1)).append(letter(rnd)).append(digits(rnd, 1));
        return sb.toString();
    }

    private static char letter(ThreadLocalRandom rnd) {
        return (char) ('A' + rnd.nextInt(26));
    }

    private static String digits(ThreadLocalRandom rnd, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(rnd.nextInt(10));
        return sb.toString();
    }
}
