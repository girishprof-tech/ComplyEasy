package com.venture.account;

import com.venture.security.SessionUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    public record PlanRequest(String tier) {}

    private final PlanService plans;

    public AccountController(PlanService plans) {
        this.plans = plans;
    }

    @GetMapping
    public AccountSummary get(SessionUser user) {
        return plans.accountSummary(user.userId());
    }

    @PostMapping("/plan")
    public AccountSummary setPlan(SessionUser user, @RequestBody PlanRequest request) {
        return plans.setTier(user.userId(), request.tier());
    }
}
