package com.venture.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Reads a certificate with Gemini when configured, otherwise (or if the call
 * fails for any reason) falls back to clearly-labelled demo output, so the
 * feature degrades gracefully instead of breaking.
 */
@Service
public class CertificateAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(CertificateAnalysisService.class);

    private static final String PROMPT = "You are analyzing a compliance certificate/license document for an Indian MSME. "
            + "Extract the following as strict JSON with exactly these keys: documentType, certificateNumber, "
            + "businessName, issuingAuthority, issueDate (YYYY-MM-DD), expiryDate (YYYY-MM-DD), complianceCategory, "
            + "confidence (integer 0-100), summary (one sentence). Use null for any field you cannot determine. "
            + "This is for organizing records only, not a legal determination.";

    private final GeminiClient gemini;
    private final ObjectMapper mapper;

    public CertificateAnalysisService(GeminiClient gemini, ObjectMapper mapper) {
        this.gemini = gemini;
        this.mapper = mapper;
    }

    public CertificateExtraction analyze(String fileName, String mimeType, String dataBase64, String businessNameHint) {
        if (!gemini.isConfigured()) return MockCertificateAnalyzer.analyze(fileName, businessNameHint);
        try {
            return callGemini(mimeType, dataBase64);
        } catch (Exception e) {
            log.error("[ai] real provider call failed, falling back to demo mode: {}", e.getMessage());
            return MockCertificateAnalyzer.analyze(fileName, businessNameHint).withProviderError(e.getMessage());
        }
    }

    private CertificateExtraction callGemini(String mimeType, String dataBase64) throws Exception {
        ArrayNode contents = mapper.createArrayNode();
        ObjectNode turn = contents.addObject();
        turn.put("role", "user");
        ArrayNode parts = turn.putArray("parts");
        parts.addObject().put("text", PROMPT);
        ObjectNode inline = parts.addObject().putObject("inlineData");
        inline.put("mimeType", mimeType);
        inline.put("data", dataBase64);

        GeminiClient.GenerateResult result = gemini.generateContent(contents, null, null, responseSchema());
        if (result.text().isEmpty()) throw new IllegalStateException("Empty response from Gemini");

        JsonNode parsed;
        try {
            parsed = mapper.readTree(result.text());
        } catch (Exception e) {
            throw new IllegalStateException("Gemini returned malformed JSON for certificate analysis");
        }
        // Structural validation before the result is trusted anywhere else.
        if (!parsed.isObject() || !parsed.path("summary").isTextual()) {
            throw new IllegalStateException("Gemini response failed structural validation");
        }
        ((ObjectNode) parsed).put("demoMode", false);
        ((ObjectNode) parsed).put("provider", "gemini");
        return mapper.treeToValue(parsed, CertificateExtraction.class);
    }

    private ObjectNode responseSchema() {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        for (String key : new String[] {
            "documentType", "certificateNumber", "businessName", "issuingAuthority", "issueDate", "expiryDate",
            "complianceCategory"
        }) {
            ObjectNode field = props.putObject(key);
            field.put("type", "string");
            field.put("nullable", true);
        }
        props.putObject("confidence").put("type", "integer");
        props.putObject("summary").put("type", "string");
        schema.putArray("required").add("confidence").add("summary");
        return schema;
    }
}
