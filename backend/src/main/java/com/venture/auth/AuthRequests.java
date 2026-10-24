package com.venture.auth;

/** Request bodies for the auth endpoints. */
public final class AuthRequests {

    private AuthRequests() {}

    public record SignupAccountant(String email, String password, String firmName) {}

    public record SignupOwner(String email, String password) {}

    public record Login(String email, String password) {}

    public record Activate(String token, String email, String password) {}
}
