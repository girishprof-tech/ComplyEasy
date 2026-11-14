package com.venture.user;

import com.venture.business.Business;
import com.venture.business.BusinessDetails;
import com.venture.business.BusinessRepository;
import com.venture.common.ApiException;
import com.venture.security.Role;
import com.venture.security.SessionUser;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/profile")
public class ProfileController {

    public record ProfileResponse(
            long userId,
            String email,
            String role,
            String firmName,
            Business business,
            String subscriptionTier,
            int aiAnalysesUsed,
            String createdAt) {}

    public record UpdateProfileRequest(
            String firmName,
            BusinessDetails businessDetails) {}

    private final UserRepository users;
    private final AccountantProfileRepository accountants;
    private final BusinessRepository businesses;

    public ProfileController(
            UserRepository users, AccountantProfileRepository accountants, BusinessRepository businesses) {
        this.users = users;
        this.accountants = accountants;
        this.businesses = businesses;
    }

    @GetMapping
    public ProfileResponse getProfile(SessionUser session) {
        UserAccount user = users.findById(session.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        String firmName = user.role() == Role.ACCOUNTANT
                ? accountants.findFirmName(user.id()).orElse("")
                : null;
        Business business = user.role() == Role.OWNER
                ? businesses.findByLinkedUser(user.id()).orElse(null)
                : null;
        return new ProfileResponse(
                user.id(),
                user.email(),
                user.role().value(),
                firmName,
                business,
                user.subscriptionTier(),
                user.aiAnalysesUsed(),
                user.createdAt());
    }

    @PostMapping
    public ProfileResponse updateProfile(SessionUser session, @RequestBody UpdateProfileRequest req) {
        UserAccount user = users.findById(session.userId())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (user.role() == Role.ACCOUNTANT && req.firmName() != null && !req.firmName().isBlank()) {
            accountants.updateFirmName(user.id(), req.firmName().trim());
        } else if (user.role() == Role.OWNER && req.businessDetails() != null) {
            Optional<Business> biz = businesses.findByLinkedUser(user.id());
            biz.ifPresent(b -> businesses.updateDetails(b.id(), req.businessDetails()));
        }
        return getProfile(session);
    }
}

