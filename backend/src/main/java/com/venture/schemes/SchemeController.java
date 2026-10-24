package com.venture.schemes;

import com.venture.ai.GeminiException;
import com.venture.business.Business;
import com.venture.business.BusinessResolver;
import com.venture.security.SessionUser;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SchemeController {

    public record MatchesResponse(List<SchemeMatchDto> matches) {}

    private final BusinessResolver resolver;
    private final SchemeService schemes;

    public SchemeController(BusinessResolver resolver, SchemeService schemes) {
        this.resolver = resolver;
        this.schemes = schemes;
    }

    @GetMapping({"/api/clients/{clientId}/schemes", "/api/business/schemes"})
    public MatchesResponse matches(SessionUser user, @PathVariable(required = false) Long clientId) {
        return new MatchesResponse(schemes.match(resolver.require(user, clientId)));
    }

    /**
     * A real, separate Gemini call with search grounding: slower and
     * non-deterministic on purpose, so the UI gates it behind an explicit
     * "Search for more" action. Failures are reported in the body (HTTP 200),
     * never as an error status.
     */
    @PostMapping({"/api/clients/{clientId}/schemes/discover", "/api/business/schemes/discover"})
    public SchemeDiscoveryResult discover(SessionUser user, @PathVariable(required = false) Long clientId) {
        Business business = resolver.require(user, clientId);
        try {
            return schemes.discover(business);
        } catch (GeminiException e) {
            return SchemeDiscoveryResult.unavailable(
                    "not_configured".equals(e.code())
                            ? "Search discovery requires a configured Gemini API key."
                            : "Search discovery is unavailable right now (" + e.code() + ").");
        } catch (RuntimeException e) {
            return SchemeDiscoveryResult.unavailable("Search discovery is unavailable right now (unknown error).");
        }
    }
}
