package com.venture.auth;

import com.venture.security.SessionCookies;
import com.venture.security.SessionTokenService;
import com.venture.security.SessionUser;
import com.venture.user.UserAccount;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final SessionTokenService tokens;
    private final SessionCookies cookies;

    public AuthController(AuthService auth, SessionTokenService tokens, SessionCookies cookies) {
        this.auth = auth;
        this.tokens = tokens;
        this.cookies = cookies;
    }

    @PostMapping("/signup-accountant")
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfile signupAccountant(@RequestBody AuthRequests.SignupAccountant request, HttpServletResponse response) {
        return startSession(auth.signupAccountant(request), response);
    }

    @PostMapping("/signup-owner")
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfile signupOwner(@RequestBody AuthRequests.SignupOwner request, HttpServletResponse response) {
        return startSession(auth.signupOwner(request), response);
    }

    @PostMapping("/login")
    public UserProfile login(@RequestBody AuthRequests.Login request, HttpServletResponse response) {
        UserAccount user = auth.authenticate(request);
        cookies.write(response, tokens.sign(new SessionUser(user.id(), user.role())));
        return auth.buildProfile(user);
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout(HttpServletResponse response) {
        cookies.clear(response);
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public UserProfile me(SessionUser user) {
        return auth.profileFor(user.userId());
    }

    @PostMapping("/activate")
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfile activate(@RequestBody AuthRequests.Activate request, HttpServletResponse response) {
        return startSession(auth.activateInvite(request), response);
    }

    private UserProfile startSession(UserProfile profile, HttpServletResponse response) {
        cookies.write(response, tokens.sign(auth.sessionFor(profile)));
        return profile;
    }
}
