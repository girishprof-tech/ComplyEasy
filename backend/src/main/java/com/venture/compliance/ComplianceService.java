package com.venture.compliance;

import static com.venture.common.Strings.coalesce;
import static com.venture.common.Strings.emptyToNull;

import com.venture.activity.ActivityService;
import com.venture.business.Business;
import com.venture.common.ApiException;
import com.venture.compliance.CertificateStorage.StoredCertificate;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComplianceService {

    /** A certificate on disk, ready to stream back to an authorised caller. */
    public record CertificateFile(Path path, String mimeType, String originalName) {}

    private final ComplianceItemRepository items;
    private final CertificateStorage storage;
    private final ActivityService activity;

    public ComplianceService(ComplianceItemRepository items, CertificateStorage storage, ActivityService activity) {
        this.items = items;
        this.storage = storage;
        this.activity = activity;
    }

    public List<ComplianceItemDto> list(Business business) {
        return items.listByClient(business.id()).stream().map(ComplianceItemDto::from).toList();
    }

    @Transactional
    public ComplianceItemDto create(Business business, long actorUserId, ComplianceItemRequest req) {
        if (isEmpty(req.getName()) || isEmpty(req.getExpiryDate())) {
            throw ApiException.badRequest("name and expiryDate are required");
        }

        StoredCertificate cert = req.getCertificate() != null ? storage.save(req.getCertificate()) : null;
        long id = items.insert(
                business.id(),
                new ItemValues(
                        req.getName(),
                        emptyToNull(req.getIssueDate()),
                        req.getExpiryDate(),
                        emptyToNull(req.getNotes()),
                        cert == null ? null : cert.filename(),
                        cert == null ? null : cert.originalName(),
                        cert == null ? null : cert.mimeType(),
                        cert == null ? null : cert.size(),
                        // Only ever written because the user reviewed and saved them; analysis alone persists nothing.
                        emptyToNull(req.getExtractedDocumentType()),
                        emptyToNull(req.getExtractedCertificateNumber()),
                        emptyToNull(req.getExtractedIssuingAuthority()),
                        emptyToNull(req.getCategory())));

        activity.log(business.id(), actorUserId, "item_added", "Compliance item added: " + req.getName());
        if (cert != null) {
            activity.log(business.id(), actorUserId, "certificate_uploaded", "Certificate uploaded for " + req.getName());
        }
        return ComplianceItemDto.from(items.getById(id));
    }

    @Transactional
    public ComplianceItemDto update(Business business, long actorUserId, long itemId, ComplianceItemRequest req) {
        ComplianceItem existing = requireItem(business, itemId);

        String certFilename = existing.certificateFilename();
        String certOriginalName = existing.certificateOriginalName();
        String certMimeType = existing.certificateMimeType();
        Long certSize = existing.certificateSize();

        boolean removed = req.isCertificateProvided() && req.getCertificate() == null;
        boolean replaced = req.getCertificate() != null;
        if (removed) {
            storage.delete(existing.certificateFilename());
            certFilename = null;
            certOriginalName = null;
            certMimeType = null;
            certSize = null;
        } else if (replaced) {
            StoredCertificate cert = storage.save(req.getCertificate());
            storage.delete(existing.certificateFilename()); // replacing: drop the old file
            certFilename = cert.filename();
            certOriginalName = cert.originalName();
            certMimeType = cert.mimeType();
            certSize = cert.size();
        }

        // A field that is absent (or null) keeps its current value.
        String name = coalesce(req.getName(), existing.name());
        items.update(
                itemId,
                new ItemValues(
                        name,
                        coalesce(req.getIssueDate(), existing.issueDate()),
                        coalesce(req.getExpiryDate(), existing.expiryDate()),
                        coalesce(req.getNotes(), existing.notes()),
                        certFilename,
                        certOriginalName,
                        certMimeType,
                        certSize,
                        coalesce(req.getExtractedDocumentType(), existing.extractedDocumentType()),
                        coalesce(req.getExtractedCertificateNumber(), existing.extractedCertificateNumber()),
                        coalesce(req.getExtractedIssuingAuthority(), existing.extractedIssuingAuthority()),
                        coalesce(req.getCategory(), existing.category())));

        // At most one certificate event plus the general update — never a field-by-field diff.
        if (removed) {
            activity.log(business.id(), actorUserId, "certificate_removed", "Certificate removed from " + name);
        } else if (replaced) {
            activity.log(business.id(), actorUserId, "certificate_uploaded", "Certificate uploaded for " + name);
        }
        activity.log(business.id(), actorUserId, "item_updated", name + " updated");

        return ComplianceItemDto.from(items.getById(itemId));
    }

    @Transactional
    public void remove(Business business, long actorUserId, long itemId) {
        ComplianceItem existing = requireItem(business, itemId);
        storage.delete(existing.certificateFilename());
        items.deleteWithNotifications(itemId);
        activity.log(business.id(), actorUserId, "item_removed", "Compliance item removed: " + existing.name());
    }

    /**
     * The stored filename never comes from the request: it is read from the
     * database row after confirming the caller's business owns the item, so
     * guessing a URL or filename gets nothing without an authorised session.
     */
    public CertificateFile certificate(Business business, long itemId) {
        ComplianceItem item = requireItem(business, itemId);
        if (item.certificateFilename() == null || item.certificateFilename().isEmpty()) {
            throw ApiException.notFound("No certificate uploaded for this item");
        }
        Path path = storage.pathOf(item.certificateFilename());
        if (!Files.exists(path)) throw ApiException.notFound("The certificate file is missing from storage");
        return new CertificateFile(path, item.certificateMimeType(), item.certificateOriginalName());
    }

    private ComplianceItem requireItem(Business business, long itemId) {
        return items.findByIdAndClient(itemId, business.id())
                .orElseThrow(() -> ApiException.notFound("Compliance item not found"));
    }

    private static boolean isEmpty(String s) {
        return s == null || s.isEmpty();
    }
}
