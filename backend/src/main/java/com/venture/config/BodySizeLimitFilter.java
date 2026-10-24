package com.venture.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Request body caps: 1 MB for ordinary JSON; 8 MB for the endpoints that
 * carry a base64 certificate (a 5 MB file is roughly 6.7 MB once encoded).
 */
@Component
public class BodySizeLimitFilter extends OncePerRequestFilter {

    private static final long DEFAULT_MAX_BYTES = 1_000_000;
    private static final long UPLOAD_MAX_BYTES = 8_000_000;

    private static final Pattern ITEM_WRITE = Pattern.compile("^/api/(business|clients/\\d+)/items(/\\d+)?$");
    private static final String ANALYZE_PATH = "/api/ai/analyze-certificate";

    private final ObjectMapper mapper;

    public BodySizeLimitFilter(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean itemWrite = ITEM_WRITE.matcher(path).matches();
        boolean analyze = ANALYZE_PATH.equals(path);
        long max = itemWrite || analyze ? UPLOAD_MAX_BYTES : DEFAULT_MAX_BYTES;

        if (request.getContentLengthLong() > max) {
            String message = itemWrite ? "Upload is too large." : analyze ? "File is too large." : "Request body too large.";
            response.setStatus(413);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(mapper.writeValueAsString(Map.of("error", message)));
            return;
        }
        chain.doFilter(request, response);
    }
}
