package com.venture.business;

/** Request body for creating or updating a business; every field is optional on update. */
public record BusinessRequest(
        String businessName,
        String businessType,
        String industry,
        String location,
        String registrationId,
        String contactPerson,
        String contactEmail,
        String contactPhone) {}
