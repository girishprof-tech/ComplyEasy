package com.venture.notifications;

import com.venture.security.SessionUser;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public NotificationsResponse list(SessionUser user) {
        return service.listFor(user);
    }

    @PostMapping("/{notificationId}/read")
    public Map<String, Boolean> markRead(SessionUser user, @PathVariable long notificationId) {
        service.markRead(user, notificationId);
        return Map.of("ok", true);
    }
}
