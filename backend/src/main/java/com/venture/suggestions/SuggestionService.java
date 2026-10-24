package com.venture.suggestions;

import com.venture.business.Business;
import com.venture.compliance.ComplianceItemRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SuggestionService {

    private final ComplianceItemRepository items;

    public SuggestionService(ComplianceItemRepository items) {
        this.items = items;
    }

    public List<Suggestion> suggestionsFor(Business business) {
        return SuggestionEngine.generate(business, items.listByClientInCreationOrder(business.id()));
    }

    public SuggestionsResponse responseFor(Business business) {
        List<Suggestion> suggestions = suggestionsFor(business);
        return new SuggestionsResponse(
                suggestions, SuggestionEngine.countNeedingReview(suggestions), SuggestionEngine.DISCLAIMER);
    }
}
