package com.venture.user;

import com.venture.security.Role;

public record UserAccount(
        long id,
        String email,
        String passwordHash,
        Role role,
        String subscriptionTier,
        int aiAnalysesUsed,
        String createdAt) {}
