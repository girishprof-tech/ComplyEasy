package com.venture.suggestions;

import com.venture.business.BusinessResolver;
import com.venture.security.SessionUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SuggestionController {

    private final BusinessResolver resolver;
    private final SuggestionService suggestions;

    public SuggestionController(BusinessResolver resolver, SuggestionService suggestions) {
        this.resolver = resolver;
        this.suggestions = suggestions;
    }

    @GetMapping({"/api/clients/{clientId}/suggestions", "/api/business/suggestions"})
    public SuggestionsResponse get(SessionUser user, @PathVariable(required = false) Long clientId) {
        return suggestions.responseFor(resolver.require(user, clientId));
    }
}
