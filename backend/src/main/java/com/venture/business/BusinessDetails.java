package com.venture.business;

/** The editable profile fields of a business. */
public record BusinessDetails(
        String businessName,
        String businessType,
        String industry,
        String location,
        String registrationId,
        String contactPerson,
        String contactEmail,
        String contactPhone) {}
