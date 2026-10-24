package com.venture.suggestions;

import com.venture.business.Business;
import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItem;
import java.util.List;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * Compliance Intelligence / "Areas to Review".
 *
 * <p><b>Product boundary — read before changing anything here:</b> Venture
 * does not provide legal advice and never claims a requirement definitely
 * applies to a business. Every suggestion is a <i>possibility worth
 * checking</i>, phrased that way on purpose. This class is the one place
 * allowed to generate that language; new rules must follow the existing
 * phrasing rather than inventing new wording.
 *
 * <p>Approved vocabulary: "Review recommended", "Potentially relevant", "Area
 * to review", "No document recorded", "Verify applicability with your CA".
 * Never use: "you are legally required", "you must have", "you are
 * non-compliant" — or anything that reads as a determination.
 *
 * <p>This is a deterministic, keyword-based rules engine: no LLM decides
 * applicability. It reuses existing profile fields (type, industry, location).
 */
public final class SuggestionEngine {

    public static final String DISCLAIMER =
            "Venture helps organize compliance information and identify potential areas for review. It does not provide legal or professional advice or determine whether a requirement legally applies to your business. Verify applicability with your CA or another qualified professional.";

    /** The profile text the rules look at. */
    private record Profile(String businessType, String industry, String location) {
        String industryAndType() {
            return industry + " " + businessType;
        }
    }

    private record Rule(
            String id,
            String name,
            String category,
            String reason,
            Predicate<Profile> appliesIf,
            Pattern matchKeywords) {}

    private static Pattern ci(String regex) {
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
    }

    private static Predicate<Profile> industryMatches(String regex) {
        Pattern p = ci(regex);
        return profile -> p.matcher(profile.industryAndType()).find();
    }

    private static final List<Rule> RULES = List.of(
            new Rule(
                    "udyam-msme",
                    "MSME / Udyam Registration",
                    "Business Registration",
                    "Many small and medium businesses register under the MSME/Udyam framework for access to government schemes and benefits. Consider reviewing whether this applies to your business.",
                    profile -> true, // broad enough to be worth surfacing for every business
                    ci("msme|udyam")),
            new Rule(
                    "gst-registration",
                    "GST Registration",
                    "Tax",
                    "Businesses above certain turnover thresholds, or in certain categories, are typically expected to register for GST. Consider reviewing your GST registration status with your CA.",
                    profile -> true,
                    ci("gst")),
            new Rule(
                    "shops-establishment",
                    "Shops & Establishment Registration",
                    "Municipal",
                    "Most commercial establishments register under their state\u2019s Shops & Establishment Act. Consider reviewing this area with your CA or another qualified professional.",
                    profile -> true,
                    ci("shop|establishment")),
            new Rule(
                    "factory-labour",
                    "Factory / Labour",
                    "Labour & Safety",
                    "Manufacturing activities may involve additional registrations, licences or permissions depending on the nature and scale of operations. Consider reviewing this area with your CA or another qualified professional.",
                    industryMatches("manufactur|factory|production|industrial"),
                    ci("factory|labour|labor")),
            new Rule(
                    "fire-noc",
                    "Fire Safety NOC",
                    "Safety",
                    "Certain premises \u2014 particularly manufacturing, hospitality, and larger commercial spaces \u2014 may need fire safety clearance. Consider reviewing whether this applies to your premises.",
                    industryMatches("manufactur|factory|hotel|hospitality|restaurant|warehouse|industrial"),
                    ci("fire|noc")),
            new Rule(
                    "pollution-consent",
                    "Pollution Control Consent",
                    "Environmental",
                    "Manufacturing and industrial activities may fall under state pollution control board consent requirements depending on the process involved. Consider reviewing this area with your CA or an environmental consultant.",
                    industryMatches("manufactur|factory|chemical|industrial|production"),
                    ci("pollution|consent|environment")),
            new Rule(
                    "fssai-license",
                    "FSSAI License",
                    "Food Safety",
                    "Businesses involved in manufacturing, processing, storing, or selling food may need an FSSAI license depending on scale. Consider reviewing this area with your CA.",
                    industryMatches("food|restaurant|catering|beverage|f&b"),
                    ci("fssai|food")),
            new Rule(
                    "trade-license",
                    "Trade License",
                    "Municipal",
                    "Many local bodies require a trade license for businesses operating from commercial premises. Consider reviewing this with your municipal corporation or your CA.",
                    profile -> !profile.location().isEmpty(), // only if we know roughly where they operate
                    ci("trade.?licen[cs]e")));

    private SuggestionEngine() {}

    /**
     * @param items the business's items in creation order; the first item matching a rule is the one linked to it
     */
    public static List<Suggestion> generate(Business business, List<ComplianceItem> items) {
        Profile profile = new Profile(
                nullToEmpty(business.businessType()), nullToEmpty(business.industry()), nullToEmpty(business.location()));

        return RULES.stream()
                .filter(rule -> rule.appliesIf().test(profile))
                .map(rule -> toSuggestion(rule, items))
                .toList();
    }

    public static int countNeedingReview(List<Suggestion> suggestions) {
        return (int) suggestions.stream().filter(s -> "review_recommended".equals(s.status())).count();
    }

    private static Suggestion toSuggestion(Rule rule, List<ComplianceItem> items) {
        ComplianceItem matched = items.stream()
                .filter(item -> rule.matchKeywords().matcher(item.name()).find()
                        || (item.category() != null
                                && !item.category().isEmpty()
                                && rule.matchKeywords().matcher(item.category()).find()))
                .findFirst()
                .orElse(null);

        if (matched == null) {
            return new Suggestion(
                    rule.id(), rule.name(), rule.category(), rule.reason(),
                    "review_recommended", "Review Recommended", null, null, null, "system_suggestion");
        }

        long days = ItemStatus.daysUntil(matched.expiryDate());
        ItemStatus status = ItemStatus.fromDays(days);
        String suggestionStatus;
        String label;
        switch (status) {
            case ACTIVE:
                suggestionStatus = "documented";
                label = "Documented";
                break;
            case EXPIRING_SOON:
                suggestionStatus = "expiring_soon";
                label = "Expiring Soon";
                break;
            default:
                suggestionStatus = "expired_document";
                label = "Expired Document";
                break;
        }
        return new Suggestion(
                rule.id(), rule.name(), rule.category(), rule.reason(),
                suggestionStatus, label, matched.id(), matched.name(), days, "system_suggestion");
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
