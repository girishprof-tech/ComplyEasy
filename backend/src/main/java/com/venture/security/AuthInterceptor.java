package com.venture.security;

import com.venture.common.ApiException;
import com.venture.security.AccessRules.Access;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Resolves the session cookie into a {@link SessionUser} and enforces {@link AccessRules}. */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ATTRIBUTE = "venture.sessionUser";

    private final SessionTokenService tokens;
    private final SessionCookies cookies;

    public AuthInterceptor(SessionTokenService tokens, SessionCookies cookies) {
        this.tokens = tokens;
        this.cookies = cookies;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        SessionUser user = tokens.verify(cookies.read(request));
        if (user != null) request.setAttribute(USER_ATTRIBUTE, user);

        Access access = AccessRules.forPath(request.getRequestURI());
        if (access == Access.PUBLIC) return true;

        if (user == null) throw ApiException.unauthorized("Not authenticated");
        if (access == Access.ACCOUNTANT && user.role() != Role.ACCOUNTANT
                || access == Access.OWNER && user.role() != Role.OWNER) {
            throw ApiException.forbidden("Not authorized for this resource");
        }
        return true;
    }
}
