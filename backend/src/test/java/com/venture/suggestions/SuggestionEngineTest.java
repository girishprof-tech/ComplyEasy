package com.venture.suggestions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.venture.business.Business;
import com.venture.compliance.ComplianceItem;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class SuggestionEngineTest {

    private static Business business(String type, String industry, String location) {
        return new Business(1, 1L, "Acme", type, industry, location, null, null, null, null, null, null, null, "");
    }

    private static ComplianceItem item(long id, String name, String expiry) {
        return new ComplianceItem(id, 1, name, null, expiry, null, null, null, null, null, null, null, null, null, "");
    }

    @Test
    void generalRulesAlwaysApplyAndTradeLicenseNeedsALocation() {
        List<Suggestion> none = SuggestionEngine.generate(business(null, null, null), List.of());
        assertEquals(List.of("udyam-msme", "gst-registration", "shops-establishment"),
                none.stream().map(Suggestion::id).toList());

        List<Suggestion> withLocation = SuggestionEngine.generate(business(null, null, "Pune"), List.of());
        assertTrue(withLocation.stream().anyMatch(s -> s.id().equals("trade-license")));
    }

    @Test
    void manufacturingAddsFactoryFirePollution() {
        List<String> ids = SuggestionEngine.generate(business("Private Limited", "Manufacturing", null), List.of())
                .stream().map(Suggestion::id).toList();
        assertTrue(ids.containsAll(List.of("factory-labour", "fire-noc", "pollution-consent")));
    }

    @Test
    void documentedItemsAreLinkedInsteadOfShownAsMissing() {
        String farFuture = LocalDate.now().plusDays(400).toString();
        List<Suggestion> s = SuggestionEngine.generate(
                business(null, null, null), List.of(item(7, "GST Registration", farFuture)));
        Suggestion gst = s.stream().filter(x -> x.id().equals("gst-registration")).findFirst().orElseThrow();
        assertEquals("documented", gst.status());
        assertEquals(7L, gst.matchedItemId());
        assertEquals(2, SuggestionEngine.countNeedingReview(s));
    }
}
