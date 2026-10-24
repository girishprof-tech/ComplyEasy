package com.venture.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.venture.account.AccountSummary;
import com.venture.account.PlanService;
import com.venture.common.ApiException;
import com.venture.compliance.CertificateStorage;
import com.venture.security.SessionUser;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    public record AnalyzeRequest(String fileName, String mimeType, String dataBase64, String businessNameHint) {}

    private final PlanService plans;
    private final CertificateAnalysisService analysis;
    private final ObjectMapper mapper;
    private final GeminiClient gemini;

    public AiController(
            PlanService plans, CertificateAnalysisService analysis, ObjectMapper mapper, GeminiClient gemini) {
        this.gemini = gemini;
        this.plans = plans;
        this.analysis = analysis;
        this.mapper = mapper;
    }

    /** Is the AI wired up correctly? Safe to call from the browser; never includes the key. */
    @GetMapping("/status")
    public GeminiClient.Status status() {
        return gemini.diagnose();
    }

    /**
     * Analysis is transient: nothing is written to disk or the database here.
     * The item is only persisted when the user saves the compliance form. The
     * one side effect is incrementing the caller's AI-analysis counter.
     */
    @PostMapping("/analyze-certificate")
    public ObjectNode analyzeCertificate(SessionUser user, @RequestBody AnalyzeRequest req) {
        if (!plans.canUseAiAnalysis(user.userId())) {
            AccountSummary account = plans.accountSummary(user.userId());
            throw ApiException.paymentRequired(
                    "You've used all " + account.limits().maxAiAnalyses()
                            + " AI analyses on the Free plan. Upgrade to Pro for unlimited certificate analysis.",
                    Map.of("account", account));
        }
        if (req.mimeType() == null || !CertificateStorage.ALLOWED_MIME_TYPES.containsKey(req.mimeType())) {
            throw ApiException.badRequest("Unsupported file type. Use JPG, PNG, WEBP, or PDF.");
        }
        if (req.dataBase64() == null || req.dataBase64().isEmpty()) {
            throw ApiException.badRequest("Missing file data");
        }
        long approxBytes = (long) Math.floor(req.dataBase64().length() * 3.0 / 4.0);
        if (approxBytes > CertificateStorage.MAX_BYTES) {
            throw ApiException.badRequest("File is too large. Maximum size is "
                    + CertificateStorage.MAX_BYTES / (1024 * 1024) + "MB.");
        }

        CertificateExtraction result =
                analysis.analyze(req.fileName(), req.mimeType(), req.dataBase64(), req.businessNameHint());
        plans.recordAiAnalysisUsed(user.userId());

        ObjectNode response = mapper.valueToTree(result);
        response.set("account", mapper.valueToTree(plans.accountSummary(user.userId())));
        return response;
    }
}
