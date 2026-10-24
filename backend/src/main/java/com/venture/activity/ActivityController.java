package com.venture.activity;

import com.venture.business.BusinessResolver;
import com.venture.security.SessionUser;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ActivityController {

    private final BusinessResolver resolver;
    private final ActivityService activity;

    public ActivityController(BusinessResolver resolver, ActivityService activity) {
        this.resolver = resolver;
        this.activity = activity;
    }

    @GetMapping({"/api/clients/{clientId}/activity", "/api/business/activity"})
    public List<ActivityEntryDto> list(SessionUser user, @PathVariable(required = false) Long clientId) {
        return activity.listForClient(resolver.require(user, clientId).id());
    }
}
