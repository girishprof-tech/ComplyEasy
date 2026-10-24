package com.venture.dashboard;

import com.venture.health.HealthSummary;
import java.util.List;

public record DashboardSummary(
        int totalClients,
        int totalItems,
        int active,
        int expiringSoon,
        int expired,
        int reviewSuggestionsCount,
        List<UrgentItem> urgentItems,
        HealthSummary portfolioHealth) {}
