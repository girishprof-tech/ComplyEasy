package com.venture.account;

import com.venture.business.BusinessRepository;
import com.venture.common.ApiException;
import com.venture.user.UserAccount;
import com.venture.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class PlanService {

    private final UserRepository users;
    private final BusinessRepository businesses;

    public PlanService(UserRepository users, BusinessRepository businesses) {
        this.users = users;
        this.businesses = businesses;
    }

    public AccountSummary accountSummary(long userId) {
        UserAccount user = requireUser(userId);
        Plan plan = Plan.fromTier(user.subscriptionTier());
        Integer remaining =
                plan.maxAiAnalyses() == null ? null : Math.max(0, plan.maxAiAnalyses() - user.aiAnalysesUsed());
        return new AccountSummary(
                user.subscriptionTier() == null ? "free" : user.subscriptionTier(),
                plan.label(),
                new AccountSummary.Limits(plan.maxClients(), plan.maxAiAnalyses(), plan.csvExport()),
                user.aiAnalysesUsed(),
                remaining);
    }

    public boolean canUseAiAnalysis(long userId) {
        UserAccount user = requireUser(userId);
        Integer max = Plan.fromTier(user.subscriptionTier()).maxAiAnalyses();
        return max == null || user.aiAnalysesUsed() < max;
    }

    public void recordAiAnalysisUsed(long userId) {
        users.incrementAiAnalysesUsed(userId);
    }

    public boolean canAddClient(long accountantId) {
        Integer max = Plan.fromTier(requireUser(accountantId).subscriptionTier()).maxClients();
        return max == null || businesses.countForAccountant(accountantId) < max;
    }

    public boolean hasCsvExport(long userId) {
        return Plan.fromTier(requireUser(userId).subscriptionTier()).csvExport();
    }

    /** Demo-only: no payment is collected, the tier flag is simply flipped. */
    public AccountSummary setTier(long userId, String tier) {
        if (!Plan.isValidTier(tier)) throw ApiException.badRequest("tier must be \"free\" or \"pro\"");
        users.updateSubscriptionTier(userId, tier);
        return accountSummary(userId);
    }

    private UserAccount requireUser(long userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Not authenticated"));
    }
}
