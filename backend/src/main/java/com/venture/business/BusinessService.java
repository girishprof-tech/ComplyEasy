package com.venture.business;

import static com.venture.common.Strings.coalesce;
import static com.venture.common.Strings.emptyToNull;

import com.venture.account.AccountSummary;
import com.venture.account.PlanService;
import com.venture.activity.ActivityService;
import com.venture.common.ApiException;
import com.venture.compliance.CertificateStorage;
import com.venture.compliance.ComplianceItem;
import com.venture.compliance.ComplianceItemRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Business profile management for both roles. */
@Service
public class BusinessService {

    private final BusinessRepository businesses;
    private final ComplianceItemRepository items;
    private final CertificateStorage certificates;
    private final PlanService plans;
    private final ActivityService activity;

    public BusinessService(
            BusinessRepository businesses,
            ComplianceItemRepository items,
            CertificateStorage certificates,
            PlanService plans,
            ActivityService activity) {
        this.businesses = businesses;
        this.items = items;
        this.certificates = certificates;
        this.plans = plans;
        this.activity = activity;
    }

    // ---- accountant: manage clients ----------------------------------------------

    public List<BusinessDto> listClients(long accountantId) {
        return businesses.listForAccountant(accountantId).stream().map(BusinessDto::from).toList();
    }

    public BusinessDto getClient(long accountantId, long clientId) {
        return BusinessDto.from(requireClient(accountantId, clientId));
    }

    @Transactional
    public BusinessDto createClient(long accountantId, BusinessRequest req) {
        if (!plans.canAddClient(accountantId)) {
            AccountSummary account = plans.accountSummary(accountantId);
            throw ApiException.paymentRequired(
                    "Free plan is limited to " + account.limits().maxClients() + " clients. Upgrade to Pro to add more.",
                    Map.of("account", account));
        }
        requireName(req);
        long id = businesses.insertForAccountant(accountantId, newDetails(req));
        activity.log(id, accountantId, "business_created", "Client added: " + req.businessName());
        return BusinessDto.from(businesses.findById(id).orElseThrow());
    }

    @Transactional
    public BusinessDto updateClient(long accountantId, long clientId, BusinessRequest req) {
        Business existing = requireClient(accountantId, clientId);
        businesses.updateDetails(existing.id(), merged(existing, req));
        return BusinessDto.from(businesses.findById(clientId).orElseThrow());
    }

    @Transactional
    public void removeClient(long accountantId, long clientId) {
        Business existing = requireClient(accountantId, clientId);
        // Also drop the stored certificate files so nothing is orphaned on disk.
        for (ComplianceItem item : items.listByClient(existing.id())) {
            certificates.delete(item.certificateFilename());
        }
        businesses.deleteCascade(existing.id());
    }

    // ---- owner: manage their own business ----------------------------------------

    public BusinessDto getMine(long ownerUserId) {
        return BusinessDto.from(requireMine(ownerUserId));
    }

    @Transactional
    public BusinessDto createMine(long ownerUserId, BusinessRequest req) {
        if (businesses.findByLinkedUser(ownerUserId).isPresent()) {
            throw ApiException.conflict("Your business is already set up");
        }
        requireName(req);
        long id = businesses.insertForOwner(ownerUserId, newDetails(req));
        activity.log(id, ownerUserId, "business_created", "Business created: " + req.businessName());
        return BusinessDto.from(businesses.findById(id).orElseThrow());
    }

    @Transactional
    public BusinessDto updateMine(long ownerUserId, BusinessRequest req) {
        Business existing = requireMine(ownerUserId);
        businesses.updateDetails(existing.id(), merged(existing, req));
        return BusinessDto.from(businesses.findById(existing.id()).orElseThrow());
    }

    // ---- helpers -----------------------------------------------------------------

    private Business requireClient(long accountantId, long clientId) {
        return businesses
                .findByIdForAccountant(clientId, accountantId)
                .orElseThrow(() -> ApiException.notFound("Client not found"));
    }

    private Business requireMine(long ownerUserId) {
        return businesses.findByLinkedUser(ownerUserId).orElseThrow(() -> ApiException.notFound("not_set_up"));
    }

    private static void requireName(BusinessRequest req) {
        if (req.businessName() == null || req.businessName().isEmpty()) {
            throw ApiException.badRequest("businessName is required");
        }
    }

    /** Create: empty strings are stored as NULL. */
    private static BusinessDetails newDetails(BusinessRequest r) {
        return new BusinessDetails(
                r.businessName(),
                emptyToNull(r.businessType()),
                emptyToNull(r.industry()),
                emptyToNull(r.location()),
                emptyToNull(r.registrationId()),
                emptyToNull(r.contactPerson()),
                emptyToNull(r.contactEmail()),
                emptyToNull(r.contactPhone()));
    }

    /** Update: a field that is absent (or null) keeps its current value. */
    private static BusinessDetails merged(Business e, BusinessRequest r) {
        return new BusinessDetails(
                coalesce(r.businessName(), e.businessName()),
                coalesce(r.businessType(), e.businessType()),
                coalesce(r.industry(), e.industry()),
                coalesce(r.location(), e.location()),
                coalesce(r.registrationId(), e.registrationId()),
                coalesce(r.contactPerson(), e.contactPerson()),
                coalesce(r.contactEmail(), e.contactEmail()),
                coalesce(r.contactPhone(), e.contactPhone()));
    }
}
