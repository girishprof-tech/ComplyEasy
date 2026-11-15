package com.venture.business;

import com.venture.security.SessionUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Owner: manage the single business linked to their login. */
@RestController
@RequestMapping("/api/business")
public class MyBusinessController {

    public record LogoRequest(String logoData) {}

    private final BusinessService service;

    public MyBusinessController(BusinessService service) {
        this.service = service;
    }

    @GetMapping
    public BusinessDto get(SessionUser user) {
        return service.getMine(user.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BusinessDto create(SessionUser user, @RequestBody BusinessRequest request) {
        return service.createMine(user.userId(), request);
    }

    @PutMapping
    public BusinessDto update(SessionUser user, @RequestBody BusinessRequest request) {
        return service.updateMine(user.userId(), request);
    }

    @PostMapping("/logo")
    public BusinessDto updateLogo(SessionUser user, @RequestBody LogoRequest request) {
        return service.updateMyLogo(user.userId(), request.logoData());
    }

    @DeleteMapping("/logo")
    public BusinessDto removeLogo(SessionUser user) {
        return service.updateMyLogo(user.userId(), null);
    }
}
