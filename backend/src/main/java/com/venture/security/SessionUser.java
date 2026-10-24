package com.venture.security;

/** The authenticated caller, as carried in the signed session cookie. */
public record SessionUser(long userId, Role role) {}
