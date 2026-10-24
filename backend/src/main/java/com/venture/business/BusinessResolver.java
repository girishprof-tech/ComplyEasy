package com.venture.business;

import com.venture.common.ApiException;
import com.venture.security.Role;
import com.venture.security.SessionUser;
import org.springframework.stereotype.Component;

/**
 * The single authorisation point for everything scoped to "a business"
 * (compliance items, certificates, insights, assistant, ...).
 *
 * <p>Accountants must own the business via {@code accountant_id} and pass an
 * explicit id in the URL. Owners are resolved through their own linked
 * business and never take a business id from the request, so there is no code
 * path where an owner's request can name someone else's business.
 */
@Component
public class BusinessResolver {

    private final BusinessRepository businesses;

    public BusinessResolver(BusinessRepository businesses) {
        this.businesses = businesses;
    }

    /** @throws ApiException 404 "Business not found" if the caller has no such business */
    public Business require(SessionUser user, Long explicitId) {
        return find(user, explicitId).orElseThrow(() -> ApiException.notFound("Business not found"));
    }

    public java.util.Optional<Business> find(SessionUser user, Long explicitId) {
        if (user.role() == Role.ACCOUNTANT) {
            if (explicitId == null) return java.util.Optional.empty();
            return businesses.findByIdForAccountant(explicitId, user.userId());
        }
        if (user.role() == Role.OWNER) {
            return businesses.findByLinkedUser(user.userId());
        }
        return java.util.Optional.empty();
    }
}
