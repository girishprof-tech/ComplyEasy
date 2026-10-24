package com.venture.compliance;

import com.venture.business.BusinessResolver;
import com.venture.security.SessionUser;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Compliance items and their certificates. The same handlers serve an
 * accountant working on one client ({@code /api/clients/{clientId}/...}) and
 * an owner working on their own business ({@code /api/business/...}); which
 * business is meant is decided by {@link BusinessResolver}, never by trusting
 * the URL alone.
 */
@RestController
public class ComplianceController {

    private final BusinessResolver resolver;
    private final ComplianceService service;

    public ComplianceController(BusinessResolver resolver, ComplianceService service) {
        this.resolver = resolver;
        this.service = service;
    }

    @GetMapping({"/api/clients/{clientId}/items", "/api/business/items"})
    public List<ComplianceItemDto> list(SessionUser user, @PathVariable(required = false) Long clientId) {
        return service.list(resolver.require(user, clientId));
    }

    @PostMapping({"/api/clients/{clientId}/items", "/api/business/items"})
    @ResponseStatus(HttpStatus.CREATED)
    public ComplianceItemDto create(
            SessionUser user, @PathVariable(required = false) Long clientId, @RequestBody ComplianceItemRequest request) {
        return service.create(resolver.require(user, clientId), user.userId(), request);
    }

    @PutMapping({"/api/clients/{clientId}/items/{itemId}", "/api/business/items/{itemId}"})
    public ComplianceItemDto update(
            SessionUser user,
            @PathVariable(required = false) Long clientId,
            @PathVariable long itemId,
            @RequestBody ComplianceItemRequest request) {
        return service.update(resolver.require(user, clientId), user.userId(), itemId, request);
    }

    @DeleteMapping({"/api/clients/{clientId}/items/{itemId}", "/api/business/items/{itemId}"})
    public Map<String, Boolean> remove(
            SessionUser user, @PathVariable(required = false) Long clientId, @PathVariable long itemId) {
        service.remove(resolver.require(user, clientId), user.userId(), itemId);
        return Map.of("ok", true);
    }

    @GetMapping({"/api/clients/{clientId}/items/{itemId}/certificate", "/api/business/items/{itemId}/certificate"})
    public ResponseEntity<Resource> certificate(
            SessionUser user,
            @PathVariable(required = false) Long clientId,
            @PathVariable long itemId,
            @RequestParam(name = "download", required = false) String download) {
        ComplianceService.CertificateFile file = service.certificate(resolver.require(user, clientId), itemId);

        String disposition = "1".equals(download) ? "attachment" : "inline";
        String name = file.originalName() == null ? "certificate" : file.originalName();
        String safeName = name.replaceAll("[\"\\\\]", "_");
        MediaType type = file.mimeType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(file.mimeType());

        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + safeName + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=0, no-cache")
                .body(new FileSystemResource(file.path()));
    }
}
