package com.venture.health;

import com.venture.ai.AiMode;
import com.venture.business.Business;
import com.venture.business.BusinessResolver;
import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItem;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.security.SessionUser;
import com.venture.suggestions.SuggestionEngine;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Compliance Health for the owner's single business. */
@RestController
public class HealthController {

    private final BusinessResolver resolver;
    private final ComplianceItemRepository items;
    private final AiMode aiMode;

    public HealthController(BusinessResolver resolver, ComplianceItemRepository items, AiMode aiMode) {
        this.resolver = resolver;
        this.items = items;
        this.aiMode = aiMode;
    }

    @GetMapping("/api/business/health")
    public HealthSummary myHealth(SessionUser user) {
        Business business = resolver.require(user, null);
        List<ComplianceItem> rows = items.listByClientInCreationOrder(business.id());
        List<HealthItem> healthItems = rows.stream()
                .map(r -> {
                    long days = ItemStatus.daysUntil(r.expiryDate());
                    return new HealthItem(ItemStatus.fromDays(days), days, r.name(), r.clientId());
                })
                .toList();

        // Same rules engine as the "Areas to Review" list, so this count can never disagree with it.
        int reviewCount = SuggestionEngine.countNeedingReview(SuggestionEngine.generate(business, rows));
        return HealthSummaryCalculator.forBusiness(healthItems, reviewCount, aiMode.isDemo());
    }
}
