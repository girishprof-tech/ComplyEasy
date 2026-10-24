package com.venture.business;

import com.venture.activity.ActivityService;
import com.venture.common.ApiException;
import com.venture.security.InviteTokenService;
import org.springframework.stereotype.Service;

/** An accountant inviting one of their clients to get their own login. */
@Service
public class InviteService {

    public record InviteResult(String inviteUrl, String expiresAt) {}

    private final BusinessRepository businesses;
    private final InviteTokenService tokens;
    private final ActivityService activity;

    public InviteService(BusinessRepository businesses, InviteTokenService tokens, ActivityService activity) {
        this.businesses = businesses;
        this.tokens = tokens;
        this.activity = activity;
    }

    /**
     * Only the owning accountant can invite (the lookup is scoped by
     * accountant_id). In a real deploy the link would be emailed; for now the
     * raw link is returned so the accountant can share it manually.
     */
    public InviteResult invite(long accountantId, long clientId) {
        Business client = businesses
                .findByIdForAccountant(clientId, accountantId)
                .orElseThrow(() -> ApiException.notFound("Client not found"));
        if (client.linkedUserId() != null) {
            throw ApiException.conflict("This client already has an active login");
        }

        InviteTokenService.Invite invite = tokens.create();
        businesses.setInvite(client.id(), invite.hash(), invite.expiresAt());
        activity.log(client.id(), accountantId, "owner_invited", "Invite sent for " + client.businessName());
        return new InviteResult("/activate?token=" + invite.raw() + "&client=" + client.id(), invite.expiresAt());
    }
}
