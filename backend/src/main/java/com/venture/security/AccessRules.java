package com.venture.security;

import java.util.List;
import org.springframework.util.AntPathMatcher;

/**
 * Who may call what. Rules are evaluated top to bottom; the first matching
 * path decides. Paths that match no rule are public (and, if no handler
 * exists, simply 404). Keeping the whole policy in one table makes it easy
 * to audit — controllers contain no role checks of their own.
 */
public final class AccessRules {

    public enum Access { PUBLIC, AUTHENTICATED, ACCOUNTANT, OWNER }

    private record Rule(String pattern, Access access) {}

    private static final List<Rule> RULES = List.of(
            // Auth: login/signup/logout/activate are public; /me needs a session.
            new Rule("/api/auth/me", Access.AUTHENTICATED),
            new Rule("/api/auth/**", Access.PUBLIC),

            // Accountant: their clients (incl. each client's items, invites, insights) and portfolio dashboard.
            new Rule("/api/clients/**", Access.ACCOUNTANT),
            new Rule("/api/dashboard/**", Access.ACCOUNTANT),

            // Owner: their one business, plus the legacy /api/portal routes.
            new Rule("/api/business/**", Access.OWNER),
            new Rule("/api/portal/**", Access.OWNER),

            // Either role.
            new Rule("/api/ai/**", Access.AUTHENTICATED),
            new Rule("/api/account/**", Access.AUTHENTICATED),
            new Rule("/api/notifications/**", Access.AUTHENTICATED));

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    private AccessRules() {}

    public static Access forPath(String path) {
        for (Rule rule : RULES) {
            if (MATCHER.match(rule.pattern(), path)) return rule.access();
        }
        return Access.PUBLIC;
    }
}
