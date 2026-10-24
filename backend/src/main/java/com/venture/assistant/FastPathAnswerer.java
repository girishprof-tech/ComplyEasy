package com.venture.assistant;

import com.venture.compliance.ComplianceItemDto;
import com.venture.common.ItemStatus;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Answers simple, direct questions straight from the database without ever
 * calling Gemini. Returns empty when the message isn't one of the recognised
 * shapes (or a name can't be cleanly matched), so the caller falls through.
 */
final class FastPathAnswerer {

    private enum Kind { NEXT_EXPIRY_BY_NAME, NEXT_DEADLINES, EXPIRING_SUMMARY }

    private record Rule(Pattern pattern, Kind kind) {}

    private static final List<Rule> RULES = List.of(
            new Rule(
                    Pattern.compile(
                            "when (does|is|will).*(gst|registration|license|licence|certificate|noc|item).*(expire|due)",
                            Pattern.CASE_INSENSITIVE),
                    Kind.NEXT_EXPIRY_BY_NAME),
            new Rule(Pattern.compile("next (\\d+ )?(compliance )?deadlines?", Pattern.CASE_INSENSITIVE), Kind.NEXT_DEADLINES),
            new Rule(
                    Pattern.compile("(what'?s|what is|how many).*(expir(ing|ed)|overdue)", Pattern.CASE_INSENSITIVE),
                    Kind.EXPIRING_SUMMARY));

    private FastPathAnswerer() {}

    /** True if the message looks like a fast-path question (the caller then loads the items). */
    static boolean matches(String message) {
        return RULES.stream().anyMatch(r -> r.pattern().matcher(message).find());
    }

    static Optional<String> answer(String message, List<ComplianceItemDto> items) {
        Rule rule = RULES.stream().filter(r -> r.pattern().matcher(message).find()).findFirst().orElse(null);
        if (rule == null) return Optional.empty();

        switch (rule.kind()) {
            case NEXT_DEADLINES: {
                List<ComplianceItemDto> sorted = items.stream()
                        .sorted(Comparator.comparingLong(ComplianceItemDto::daysUntilExpiry))
                        .limit(3)
                        .toList();
                if (sorted.isEmpty()) return Optional.of("You don't have any compliance items on file yet.");
                StringBuilder sb = new StringBuilder("Your next deadlines: ");
                for (int i = 0; i < sorted.size(); i++) {
                    if (i > 0) sb.append("; ");
                    sb.append(sorted.get(i).name()).append(" (").append(sorted.get(i).daysLabel()).append(")");
                }
                return Optional.of(sb.append(".").toString());
            }
            case EXPIRING_SUMMARY: {
                long expiring = items.stream().filter(i -> i.status() == ItemStatus.EXPIRING_SOON).count();
                long expired = items.stream().filter(i -> i.status() == ItemStatus.EXPIRED).count();
                return Optional.of("You have " + expiring + " item" + (expiring == 1 ? "" : "s")
                        + " expiring soon and " + expired + " expired item" + (expired == 1 ? "" : "s")
                        + ", based on your records.");
            }
            case NEXT_EXPIRY_BY_NAME: {
                String[] words = message.toLowerCase().split("\\W+");
                for (ComplianceItemDto item : items) {
                    String name = item.name().toLowerCase();
                    for (String w : words) {
                        if (w.length() > 3 && name.contains(w)) {
                            String status = item.status() == ItemStatus.ACTIVE
                                    ? "active"
                                    : item.status().value().replace("_", " ");
                            return Optional.of("Your records show " + item.name() + " is " + status + " — "
                                    + item.daysLabel() + ".");
                        }
                    }
                }
                return Optional.empty(); // name wasn't a clean match: fall through to Gemini
            }
            default:
                return Optional.empty();
        }
    }
}
