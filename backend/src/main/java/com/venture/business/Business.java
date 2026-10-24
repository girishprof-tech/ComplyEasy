package com.venture.business;

/**
 * A business record (stored in the historically named {@code clients} table).
 * {@code accountantId} is null for a self-registered owner's business.
 */
public record Business(
        long id,
        Long accountantId,
        String businessName,
        String businessType,
        String industry,
        String location,
        String registrationId,
        String contactPerson,
        String contactEmail,
        String contactPhone,
        Long linkedUserId,
        String inviteTokenHash,
        String inviteExpiresAt,
        String createdAt) {}
