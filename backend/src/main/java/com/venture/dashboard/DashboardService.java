package com.venture.dashboard;

import com.venture.ai.AiMode;
import com.venture.business.Business;
import com.venture.business.BusinessRepository;
import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItem;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.compliance.ComplianceItemRepository.ItemWithBusiness;
import com.venture.health.HealthItem;
import com.venture.health.HealthSummary;
import com.venture.health.HealthSummaryCalculator;
import com.venture.suggestions.SuggestionEngine;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/**
 * The accountant's cross-client dashboard. Every query joins through
 * {@code clients.accountant_id}, so an accountant only ever sees their own clients' rows.
 */
@Service
public class DashboardService {

    private final BusinessRepository businesses;
    private final ComplianceItemRepository items;
    private final AiMode aiMode;

    public DashboardService(BusinessRepository businesses, ComplianceItemRepository items, AiMode aiMode) {
        this.businesses = businesses;
        this.items = items;
        this.aiMode = aiMode;
    }

    public DashboardSummary summary(long accountantId) {
        List<Business> clients = businesses.listForAccountant(accountantId);
        List<ItemWithBusiness> rows = items.listForAccountant(accountantId);

        int active = 0;
        int expiringSoon = 0;
        int expired = 0;
        List<UrgentItem> urgent = new ArrayList<>();
        List<HealthItem> healthItems = new ArrayList<>();

        for (ItemWithBusiness row : rows) {
            ComplianceItem item = row.item();
            long days = ItemStatus.daysUntil(item.expiryDate());
            ItemStatus status = ItemStatus.fromDays(days);
            switch (status) {
                case ACTIVE -> active++;
                case EXPIRING_SOON -> expiringSoon++;
                case EXPIRED -> expired++;
            }
            healthItems.add(new HealthItem(status, days, item.name(), item.clientId()));
            if (status != ItemStatus.ACTIVE) {
                urgent.add(new UrgentItem(
                        item.id(), item.clientId(), row.businessName(), item.name(), item.expiryDate(), status, days));
            }
        }
        urgent.sort(Comparator.comparingLong(UrgentItem::daysUntilExpiry));

        // "Areas to review" is the same rules engine a single client page uses, run once
        // per client and summed, so the two can never disagree.
        Map<Long, List<ComplianceItem>> itemsByClient =
                rows.stream().map(ItemWithBusiness::item).collect(Collectors.groupingBy(ComplianceItem::clientId));
        int reviewCount = 0;
        for (Business client : clients) {
            List<ComplianceItem> clientItems = itemsByClient.getOrDefault(client.id(), List.of());
            reviewCount += SuggestionEngine.countNeedingReview(SuggestionEngine.generate(client, clientItems));
        }

        HealthSummary portfolioHealth =
                HealthSummaryCalculator.forPortfolio(healthItems, clients.size(), reviewCount, aiMode.isDemo());

        return new DashboardSummary(
                clients.size(), rows.size(), active, expiringSoon, expired, reviewCount, urgent, portfolioHealth);
    }
}
