package com.venture.business;

import com.venture.security.SessionUser;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Accountant: manage the businesses (clients) they own. */
@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final BusinessService service;
    private final InviteService invites;

    public ClientController(BusinessService service, InviteService invites) {
        this.service = service;
        this.invites = invites;
    }

    @GetMapping
    public List<BusinessDto> list(SessionUser user) {
        return service.listClients(user.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessDto create(SessionUser user, @RequestBody BusinessRequest request) {
        return service.createClient(user.userId(), request);
    }

    @GetMapping("/{clientId}")
    public BusinessDto get(SessionUser user, @PathVariable long clientId) {
        return service.getClient(user.userId(), clientId);
    }

    @PutMapping("/{clientId}")
    public BusinessDto update(SessionUser user, @PathVariable long clientId, @RequestBody BusinessRequest request) {
        return service.updateClient(user.userId(), clientId, request);
    }

    @DeleteMapping("/{clientId}")
    public Map<String, Boolean> remove(SessionUser user, @PathVariable long clientId) {
        service.removeClient(user.userId(), clientId);
        return Map.of("ok", true);
    }

    @PostMapping("/{clientId}/invite")
    public InviteService.InviteResult invite(SessionUser user, @PathVariable long clientId) {
        return invites.invite(user.userId(), clientId);
    }
}
