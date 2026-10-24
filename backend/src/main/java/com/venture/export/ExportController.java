package com.venture.export;

import com.venture.account.PlanService;
import com.venture.business.Business;
import com.venture.business.BusinessRepository;
import com.venture.common.ApiException;
import com.venture.compliance.ComplianceItem;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.compliance.ComplianceItemRepository.ItemWithBusiness;
import com.venture.security.SessionUser;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * One-click compliance register export (Pro): a clean, dated CSV of every
 * item with its current status, for handing to an auditor, bank or regulator.
 */
@RestController
public class ExportController {

    private final PlanService plans;
    private final ComplianceItemRepository items;
    private final BusinessRepository businesses;

    public ExportController(PlanService plans, ComplianceItemRepository items, BusinessRepository businesses) {
        this.plans = plans;
        this.items = items;
        this.businesses = businesses;
    }

    /** Accountant: every item across every client they manage. */
    @GetMapping("/api/dashboard/export.csv")
    public ResponseEntity<byte[]> accountantExport(SessionUser user) {
        requireCsvExport(user);

        StringBuilder out = new StringBuilder(CsvRegister.row(CsvRegister.ACCOUNTANT_HEADER));
        for (ItemWithBusiness row : items.listForAccountantOrdered(user.userId())) {
            ComplianceItem item = row.item();
            List<String> columns = new ArrayList<>();
            columns.add(row.businessName());
            columns.add(row.registrationId());
            columns.addAll(CsvRegister.itemColumns(item));
            out.append(CsvRegister.row(columns));
        }
        return csv("venture-compliance-register-" + today() + ".csv", out.toString());
    }

    /** Owner: every item on their one business. */
    @GetMapping("/api/business/export.csv")
    public ResponseEntity<byte[]> ownerExport(SessionUser user) {
        requireCsvExport(user);
        Business business =
                businesses.findByLinkedUser(user.userId()).orElseThrow(() -> ApiException.notFound("not_set_up"));

        StringBuilder out = new StringBuilder(CsvRegister.row(CsvRegister.OWNER_HEADER));
        for (ComplianceItem item : items.listByClient(business.id())) {
            out.append(CsvRegister.row(CsvRegister.itemColumns(item)));
        }
        String slug = business.businessName().replaceAll("(?i)[^a-z0-9]+", "-").toLowerCase();
        return csv(slug + "-compliance-register-" + today() + ".csv", out.toString());
    }

    private void requireCsvExport(SessionUser user) {
        if (!plans.hasCsvExport(user.userId())) {
            throw ApiException.paymentRequired(
                    "CSV export is a Pro feature. Upgrade to Pro to export your compliance register.",
                    Map.of("account", plans.accountSummary(user.userId())));
        }
    }

    private static String today() {
        return LocalDate.now(ZoneOffset.UTC).toString();
    }

    private static ResponseEntity<byte[]> csv(String filename, String body) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=0, no-cache")
                .body(body.getBytes(StandardCharsets.UTF_8));
    }
}
