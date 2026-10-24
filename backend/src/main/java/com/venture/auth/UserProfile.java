package com.venture.auth;

import com.venture.security.Role;

/** What the client learns about the signed-in user; the shape depends on their role. */
public sealed interface UserProfile permits UserProfile.Accountant, UserProfile.Owner {

    record Accountant(long userId, Role role, String email, String firmName) implements UserProfile {}

    record Owner(long userId, Role role, String email, Long businessId, String businessName) implements UserProfile {}
}
