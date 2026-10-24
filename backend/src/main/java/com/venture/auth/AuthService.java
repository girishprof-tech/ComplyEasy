package com.venture.auth;

import com.venture.business.Business;
import com.venture.business.BusinessRepository;
import com.venture.common.ApiException;
import com.venture.common.Strings;
import com.venture.security.InviteTokenService;
import com.venture.security.PasswordHasher;
import com.venture.security.Role;
import com.venture.security.SessionUser;
import com.venture.user.AccountantProfileRepository;
import com.venture.user.UserAccount;
import com.venture.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String EMAIL_TAKEN = "An account with that email already exists";

    private final UserRepository users;
    private final AccountantProfileRepository accountantProfiles;
    private final BusinessRepository businesses;
    private final PasswordHasher hasher;
    private final InviteTokenService invites;

    public AuthService(
            UserRepository users,
            AccountantProfileRepository accountantProfiles,
            BusinessRepository businesses,
            PasswordHasher hasher,
            InviteTokenService invites) {
        this.users = users;
        this.accountantProfiles = accountantProfiles;
        this.businesses = businesses;
        this.hasher = hasher;
        this.invites = invites;
    }

    @Transactional
    public UserProfile signupAccountant(AuthRequests.SignupAccountant req) {
        if (Strings.isEmpty(req.email()) || Strings.isEmpty(req.password()) || Strings.isEmpty(req.firmName())) {
            throw ApiException.badRequest("email, password, and firmName are required");
        }
        if (users.emailExists(req.email())) throw ApiException.conflict(EMAIL_TAKEN);

        long userId = users.insert(req.email(), hasher.hash(req.password()), Role.ACCOUNTANT);
        accountantProfiles.insert(userId, req.firmName());
        return new UserProfile.Accountant(userId, Role.ACCOUNTANT, req.email(), req.firmName());
    }

    /**
     * Creates only the user; the business is created in a separate step so the
     * account can exist briefly with no business, just like an invited owner
     * exists as a user before being linked to a client record.
     */
    @Transactional
    public UserProfile signupOwner(AuthRequests.SignupOwner req) {
        if (Strings.isEmpty(req.email()) || Strings.isEmpty(req.password())) {
            throw ApiException.badRequest("email and password are required");
        }
        if (users.emailExists(req.email())) throw ApiException.conflict(EMAIL_TAKEN);

        long userId = users.insert(req.email(), hasher.hash(req.password()), Role.OWNER);
        return new UserProfile.Owner(userId, Role.OWNER, req.email(), null, null);
    }

    public UserAccount authenticate(AuthRequests.Login req) {
        if (Strings.isEmpty(req.email()) || Strings.isEmpty(req.password())) {
            throw ApiException.badRequest("email and password are required");
        }
        UserAccount user = users.findByEmail(req.email()).orElse(null);
        if (user == null || !hasher.verify(req.password(), user.passwordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return user;
    }

    public UserProfile profileFor(long userId) {
        UserAccount user = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("Not authenticated"));
        return buildProfile(user);
    }

    public UserProfile buildProfile(UserAccount user) {
        if (user.role() == Role.ACCOUNTANT) {
            String firm = accountantProfiles.findFirmName(user.id()).orElse(null);
            return new UserProfile.Accountant(user.id(), user.role(), user.email(), firm);
        }
        Business business = businesses.findByLinkedUser(user.id()).orElse(null);
        return new UserProfile.Owner(
                user.id(),
                user.role(),
                user.email(),
                business == null ? null : business.id(),
                business == null ? null : business.businessName());
    }

    /**
     * An owner claims their business with the one-time invite token. The token
     * alone decides which business is claimed; nothing is trusted from the
     * request body beyond the credentials being created.
     */
    @Transactional
    public UserProfile activateInvite(AuthRequests.Activate req) {
        if (Strings.isEmpty(req.token()) || Strings.isEmpty(req.email()) || Strings.isEmpty(req.password())) {
            throw ApiException.badRequest("token, email, and password are required");
        }
        Business client = businesses
                .findByInviteTokenHash(invites.hash(req.token()))
                .orElseThrow(() -> ApiException.badRequest("Invalid or already-used invite link"));
        if (invites.isExpired(client.inviteExpiresAt())) {
            throw ApiException.badRequest("This invite link has expired. Ask your accountant to resend it.");
        }
        if (users.emailExists(req.email())) throw ApiException.conflict(EMAIL_TAKEN);

        long userId = users.insert(req.email(), hasher.hash(req.password()), Role.OWNER);
        businesses.linkUser(client.id(), userId);
        return new UserProfile.Owner(userId, Role.OWNER, req.email(), client.id(), client.businessName());
    }

    public SessionUser sessionFor(UserProfile profile) {
        if (profile instanceof UserProfile.Accountant a) return new SessionUser(a.userId(), a.role());
        UserProfile.Owner o = (UserProfile.Owner) profile;
        return new SessionUser(o.userId(), o.role());
    }
}
