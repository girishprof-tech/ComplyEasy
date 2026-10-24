package com.venture.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.venture.config.VentureProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Low-level Gemini API client — the only class that knows the Gemini HTTP
 * request/response shape. Everything else calls the methods below.
 *
 * <p>The API key comes from configuration only; it is never logged, returned
 * from any method, or sent to the browser. Every failure surfaces as a
 * {@link GeminiException} so callers can fall back to deterministic behaviour.
 *
 * <p>Resilience: if the configured model name does not exist (404) the client
 * asks the API which models this key can use, switches to the best current
 * Flash model and carries on; transient 500/503 responses are retried once.
 */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String API_ROOT = "https://generativelanguage.googleapis.com/v1beta";
    private static final Pattern STABLE_FLASH = Pattern.compile("^models/gemini-(\\d+(?:\\.\\d+)?)-flash$");
    private static final Pattern UNSUITABLE =
            Pattern.compile(".*(image|tts|live|embedding|audio|robotics|computer|lite|learnlm|gemma).*");

    /** Plain text, any function calls ({@code {name, args}}), and the model's raw parts to echo back. */
    public record GenerateResult(String text, List<JsonNode> functionCalls, List<JsonNode> modelParts) {}

    /** Text from a search-grounded answer plus its normalised citations. */
    public record GroundedResult(String text, List<WebSource> sources) {}

    /** Result of {@link #diagnose()}: safe to show to a signed-in user (never contains the key). */
    public record Status(
            boolean configured,
            boolean keyAccepted,
            String configuredModel,
            String activeModel,
            boolean configuredModelAvailable,
            String problem) {}

    private final VentureProperties.Gemini config;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    /** The model actually in use; differs from the configured one only after auto-recovery. */
    private volatile String activeModel;

    public GeminiClient(VentureProperties props, ObjectMapper mapper) {
        this.config = props.gemini();
        this.mapper = mapper;
        this.activeModel = props.gemini().model();
    }

    public boolean isConfigured() {
        return config.isConfigured();
    }

    public String activeModel() {
        return activeModel;
    }

    /**
     * @param contents Gemini "contents" array (role/parts turns)
     * @param tools function declarations, or null
     * @param systemInstruction system prompt, or null
     * @param responseSchema JSON schema to force structured output, or null
     */
    public GenerateResult generateContent(
            JsonNode contents, JsonNode tools, String systemInstruction, JsonNode responseSchema) {
        ObjectNode body = mapper.createObjectNode();
        body.set("contents", contents);
        addSystemInstruction(body, systemInstruction);
        if (tools != null) body.set("tools", tools);
        if (responseSchema != null) {
            ObjectNode generationConfig = body.putObject("generationConfig");
            generationConfig.put("responseMimeType", "application/json");
            generationConfig.set("responseSchema", responseSchema);
        }

        JsonNode parts = firstCandidate(post(body)).path("content").path("parts");
        List<JsonNode> functionCalls = new ArrayList<>();
        List<JsonNode> modelParts = new ArrayList<>();
        StringBuilder text = new StringBuilder();
        for (JsonNode part : parts) {
            modelParts.add(part);
            if (part.has("functionCall")) functionCalls.add(part.get("functionCall"));
            if (part.path("text").isTextual() && !part.path("thought").asBoolean(false)) {
                text.append(part.get("text").asText());
            }
        }
        return new GenerateResult(text.toString(), functionCalls, modelParts);
    }

    /**
     * A dedicated search-grounded call, kept separate from the function-calling
     * path rather than combining both tool types in one request.
     */
    public GroundedResult generateGrounded(JsonNode contents, String systemInstruction) {
        ObjectNode body = mapper.createObjectNode();
        body.set("contents", contents);
        ArrayNode tools = body.putArray("tools");
        tools.addObject().putObject("googleSearch");
        addSystemInstruction(body, systemInstruction);

        JsonNode candidate = firstCandidate(post(body));
        StringBuilder text = new StringBuilder();
        for (JsonNode part : candidate.path("content").path("parts")) {
            if (part.path("text").isTextual() && !part.path("thought").asBoolean(false)) {
                text.append(part.get("text").asText());
            }
        }

        // groundingChunks[].web.{uri,title} carries the citations.
        List<WebSource> sources = new ArrayList<>();
        for (JsonNode chunk : candidate.path("groundingMetadata").path("groundingChunks")) {
            JsonNode web = chunk.path("web");
            String uri = web.path("uri").asText("");
            if (uri.isEmpty()) continue;
            String title = web.path("title").asText("");
            sources.add(new WebSource(title.isEmpty() ? uri : title, uri));
        }
        return new GroundedResult(text.toString(), sources);
    }

    /**
     * Checks the key and model without spending any generation quota (the
     * model list endpoint is free). Never throws.
     */
    public Status diagnose() {
        String configured = config.model();
        if (!config.isConfigured()) {
            return new Status(false, false, configured, activeModel, false, "GEMINI_API_KEY is not set (Demo AI Mode).");
        }
        try {
            HttpResponse<String> res = get(API_ROOT + "/models?pageSize=1000");
            int status = res.statusCode();
            if (status == 400 || status == 401 || status == 403) {
                return new Status(true, false, configured, activeModel, false, "The Gemini API key was rejected.");
            }
            if (status == 429) {
                return new Status(true, true, configured, activeModel, true, "Rate limit or quota exceeded.");
            }
            if (status < 200 || status >= 300) {
                return new Status(true, true, configured, activeModel, false, "Gemini answered with HTTP " + status + ".");
            }
            JsonNode models = mapper.readTree(res.body()).path("models");
            boolean available = false;
            for (JsonNode m : models) {
                if (("models/" + configured).equals(m.path("name").asText())
                        && supportsGenerate(m)) {
                    available = true;
                }
            }
            String problem = available
                    ? null
                    : "Model \"" + configured + "\" is not available to this key; will use \""
                            + (pickModel(models) == null ? "none found" : pickModel(models)) + "\" instead.";
            return new Status(true, true, configured, activeModel, available, problem);
        } catch (Exception e) {
            return new Status(true, false, configured, activeModel, false, "Could not reach Gemini: " + e.getMessage());
        }
    }

    // ---- internals ---------------------------------------------------------------

    private void addSystemInstruction(ObjectNode body, String systemInstruction) {
        if (systemInstruction == null || systemInstruction.isEmpty()) return;
        body.putObject("systemInstruction").putArray("parts").addObject().put("text", systemInstruction);
    }

    private JsonNode firstCandidate(JsonNode data) {
        JsonNode candidates = data.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            String block = data.path("promptFeedback").path("blockReason").asText("");
            throw new GeminiException(
                    block.isEmpty() ? "Gemini returned no candidates" : "Gemini blocked the request (" + block + ")",
                    "malformed");
        }
        return candidates.get(0);
    }

    private JsonNode post(ObjectNode body) {
        if (!config.isConfigured()) throw new GeminiException("GEMINI_API_KEY is not set", "not_configured");

        boolean triedDiscovery = false;
        boolean retriedServerError = false;
        HttpResponse<String> res;
        String model;
        while (true) {
            model = activeModel;
            res = generate(model, body);
            int status = res.statusCode();
            if (status == 404 && !triedDiscovery) {
                triedDiscovery = true;
                String found = discoverModel();
                if (found != null && !found.equals(model)) {
                    log.warn("[gemini] model \"{}\" was not found; switching to \"{}\". Set GEMINI_MODEL={} to silence this.",
                            model, found, found);
                    activeModel = found;
                    continue;
                }
            } else if ((status == 500 || status == 503) && !retriedServerError) {
                retriedServerError = true;
                sleep(1500);
                continue;
            }
            break;
        }

        int status = res.statusCode();
        if (status == 401 || status == 403) throw new GeminiException("Gemini API key was rejected", "invalid_key");
        if (status == 404) throw new GeminiException("Gemini model \"" + model + "\" was not found", "not_found");
        if (status == 429) throw new GeminiException("Gemini rate limit or quota exceeded", "rate_limited");
        if (status < 200 || status >= 300) {
            // Real response body goes to the server log only — never to the browser.
            log.error("[gemini] request to model \"{}\" failed with {}: {}", model, status, res.body());
            throw new GeminiException("Gemini request failed (" + status + ")", "unknown");
        }
        try {
            return mapper.readTree(res.body());
        } catch (IOException e) {
            throw new GeminiException("Gemini returned a malformed (non-JSON) response", "malformed");
        }
    }

    private HttpResponse<String> generate(String model, ObjectNode body) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(API_ROOT + "/models/" + model + ":generateContent"))
                    .timeout(Duration.ofSeconds(120))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", config.apiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .build();
            return http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GeminiException("Network error contacting Gemini: interrupted", "network");
        } catch (IOException | RuntimeException e) {
            throw new GeminiException("Network error contacting Gemini: " + e.getMessage(), "network");
        }
    }

    private HttpResponse<String> get(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("x-goog-api-key", config.apiKey())
                .GET()
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    /** Asks the API which models this key can call and returns the best Flash model, or null. */
    private String discoverModel() {
        try {
            HttpResponse<String> res = get(API_ROOT + "/models?pageSize=1000");
            if (res.statusCode() < 200 || res.statusCode() >= 300) return null;
            return pickModel(mapper.readTree(res.body()).path("models"));
        } catch (Exception e) {
            return null;
        }
    }

    /** Prefers the newest stable "gemini-N-flash"; otherwise any usable Flash/Gemini text model. */
    private String pickModel(JsonNode models) {
        String best = null;
        double bestVersion = -1;
        for (JsonNode m : models) {
            if (!supportsGenerate(m)) continue;
            Matcher matcher = STABLE_FLASH.matcher(m.path("name").asText());
            if (matcher.matches()) {
                double version = Double.parseDouble(matcher.group(1));
                if (version > bestVersion) {
                    bestVersion = version;
                    best = m.path("name").asText();
                }
            }
        }
        if (best == null) {
            for (JsonNode m : models) {
                String name = m.path("name").asText();
                if (supportsGenerate(m) && name.startsWith("models/gemini-") && name.contains("flash")
                        && !UNSUITABLE.matcher(name).matches()) {
                    best = name;
                    break;
                }
            }
        }
        if (best == null) {
            for (JsonNode m : models) {
                String name = m.path("name").asText();
                if (supportsGenerate(m) && name.startsWith("models/gemini-") && !UNSUITABLE.matcher(name).matches()) {
                    best = name;
                    break;
                }
            }
        }
        return best == null ? null : best.substring("models/".length());
    }

    private static boolean supportsGenerate(JsonNode model) {
        for (JsonNode method : model.path("supportedGenerationMethods")) {
            if ("generateContent".equals(method.asText())) return true;
        }
        return false;
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
