package com.venture.sustainability;

import com.venture.business.BusinessResolver;
import com.venture.security.SessionUser;
import com.venture.sustainability.SustainabilityModels.Inputs;
import com.venture.sustainability.SustainabilityModels.InputsRequest;
import com.venture.sustainability.SustainabilityModels.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SustainabilityController {

    private final BusinessResolver resolver;
    private final SustainabilityService sustainability;

    public SustainabilityController(BusinessResolver resolver, SustainabilityService sustainability) {
        this.resolver = resolver;
        this.sustainability = sustainability;
    }

    @GetMapping({"/api/clients/{clientId}/sustainability", "/api/business/sustainability"})
    public Response get(SessionUser user, @PathVariable(required = false) Long clientId) {
        return sustainability.overview(resolver.require(user, clientId));
    }

    @PostMapping({"/api/clients/{clientId}/sustainability", "/api/business/sustainability"})
    public Inputs save(
            SessionUser user, @PathVariable(required = false) Long clientId, @RequestBody InputsRequest request) {
        return sustainability.saveInputs(resolver.require(user, clientId).id(), request);
    }
}
