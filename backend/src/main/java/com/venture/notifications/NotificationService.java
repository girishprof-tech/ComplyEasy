package com.venture.notifications;

import com.venture.business.Business;
import com.venture.business.BusinessRepository;
import com.venture.common.ItemStatus;
import com.venture.compliance.ComplianceItem;
import com.venture.compliance.ComplianceItemRepository;
import com.venture.security.Role;
import com.venture.security.SessionUser;
import java.util.ArrayList;
import java.util.List;
import java.util.function.LongPredicate;
import org.springframework.stereotype.Service;

/**
 * In-app reminders, generated lazily: there is no scheduler, so notifications
 * are re-synced every time they are listed. Missing a day between visits is
 * harmless — thresholds are "days until expiry &lt;= N", so a notification that
 * should have appeared earlier simply appears at the next visit.
 */
@Service
public class NotificationService {

    private record Threshold(String type, LongPredicate test) {}

    // Evaluated independently (not "most urgent only"), so an owner who ignores the 30-day
    // notice still gets fresh, more urgent ones at 15 and 7 days and at expiry.
    private static final List<Threshold> THRESHOLDS = List.of(
            new Threshold("expiring_30", d -> d <= 30 && d > 15),
            new Threshold("expiring_15", d -> d <= 15 && d > 7),
            new Threshold("expiring_7", d -> d <= 7 && d >= 1),
            new Threshold("expired_today", d -> d == 0),
            new Threshold("overdue", d -> d < 0));

    private final NotificationRepository notifications;
    private final BusinessRepository businesses;
    private final ComplianceItemRepository items;

    public NotificationService(
            NotificationRepository notifications, BusinessRepository businesses, ComplianceItemRepository items) {
        this.notifications = notifications;
        this.businesses = businesses;
        this.items = items;
    }

    public NotificationsResponse listFor(SessionUser user) {
        syncForUser(user);
        List<NotificationDto> rows =
                notifications.listForUser(user.userId()).stream().map(r -> toDto(r, user.role())).toList();
        int unread = (int) rows.stream().filter(r -> !r.isRead()).count();
        return new NotificationsResponse(rows, unread);
    }

    public void markRead(SessionUser user, long notificationId) {
        notifications.markRead(user.userId(), notificationId);
    }

    /** Syncs only the businesses this user can see, so nothing is generated for anyone else's. */
    private void syncForUser(SessionUser user) {
        List<Business> visible = new ArrayList<>();
        if (user.role() == Role.ACCOUNTANT) {
            visible.addAll(businesses.listForAccountant(user.userId()));
        } else if (user.role() == Role.OWNER) {
            businesses.findByLinkedUser(user.userId()).ifPresent(visible::add);
        }
        for (Business business : visible) syncForBusiness(business);
    }

    /** A business may have an accountant, an owner login, or both; each gets their own copy. */
    private void syncForBusiness(Business business) {
        List<Long> recipients = new ArrayList<>();
        if (business.accountantId() != null) recipients.add(business.accountantId());
        if (business.linkedUserId() != null) recipients.add(business.linkedUserId());
        if (recipients.isEmpty()) return;

        for (ComplianceItem item : items.listByClient(business.id())) {
            long days = ItemStatus.daysUntil(item.expiryDate());
            for (Threshold t : THRESHOLDS) {
                if (!t.test().test(days)) continue;
                for (long userId : recipients) {
                    notifications.insertIfAbsent(userId, business.id(), item.id(), t.type());
                }
            }
        }
    }

    /**
     * The message is built at read time from live data, so it never goes stale
     * the way text frozen at generation time would. Accountants see the business
     * name; an owner only ever sees their own business so it is omitted.
     */
    private NotificationDto toDto(NotificationRow row, Role role) {
        long days = ItemStatus.daysUntil(row.expiryDate());
        String prefix = role == Role.ACCOUNTANT ? row.businessName() + " — " : "";
        String tail = switch (row.type()) {
            case "expiring_30", "expiring_15", "expiring_7" -> "expires in " + days + " days.";
            case "expired_today" -> "expires today.";
            case "overdue" -> "expired " + Math.abs(days) + " days ago.";
            default -> "needs attention.";
        };
        return new NotificationDto(
                row.id(),
                row.type(),
                row.clientId(),
                row.businessName(),
                row.itemName(),
                prefix + row.itemName() + " " + tail,
                row.readAt() != null,
                row.createdAt(),
                ItemStatus.fromDays(days));
    }
}
