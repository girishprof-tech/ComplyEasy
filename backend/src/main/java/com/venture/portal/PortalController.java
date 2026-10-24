package com.venture.portal;

import com.venture.business.Business;
import com.venture.business.BusinessRepository;
import com.venture.common.ApiException;
import com.venture.common.ItemStatus;
import com.venture.common.Strings;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.security.PasswordHasher;
import com.venture.security.SessionUser;
import com.venture.user.UserAccount;
import com.venture.user.UserRepository;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Legacy owner endpoints, still used for changing a password. Like all owner
 * routes they resolve the business from the caller's own login — no business
 * id ever comes from the request.
 */
@RestController
@RequestMapping("/api/portal")
public class PortalController {

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    private final BusinessRepository businesses;
    private final ComplianceItemRepository items;
    private final UserRepository users;
    private final PasswordHasher hasher;

    public PortalController(
            BusinessRepository businesses, ComplianceItemRepository items, UserRepository users, PasswordHasher hasher) {
        this.businesses = businesses;
        this.items = items;
        this.users = users;
        this.hasher = hasher;
    }

    @GetMapping("/overview")
    public PortalOverview overview(SessionUser user) {
        Business business = businesses
                .findByLinkedUser(user.userId())
                .orElseThrow(() -> ApiException.notFound("No client record is linked to this login"));

        List<PortalOverview.Item> rows = items.listByClient(business.id()).stream()
                .map(i -> {
                    long days = ItemStatus.daysUntil(i.expiryDate());
                    return new PortalOverview.Item(
                            i.id(), i.name(), i.issueDate(), i.expiryDate(), i.notes(), ItemStatus.fromDays(days), days);
                })
                .toList();
        return new PortalOverview(
                business.businessName(),
                business.registrationId(),
                business.contactPerson(),
                business.contactEmail(),
                business.contactPhone(),
                rows);
    }

    @PostMapping("/change-password")
    public Map<String, Boolean> changePassword(SessionUser user, @RequestBody ChangePasswordRequest request) {
        if (Strings.isEmpty(request.currentPassword()) || Strings.isEmpty(request.newPassword())) {
            throw ApiException.badRequest("currentPassword and newPassword are required");
        }
        UserAccount account = users.findById(user.userId()).orElseThrow(() -> ApiException.unauthorized("Not authenticated"));
        if (!hasher.verify(request.currentPassword(), account.passwordHash())) {
            throw ApiException.unauthorized("Current password is incorrect");
        }
        users.updatePasswordHash(account.id(), hasher.hash(request.newPassword()));
        return Map.of("ok", true);
    }
}
