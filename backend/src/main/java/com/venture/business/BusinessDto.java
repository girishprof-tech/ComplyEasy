package com.venture.business;

/** API representation of a business. */
public record BusinessDto(
        long id,
        String businessName,
        String businessType,
        String industry,
        String location,
        String registrationId,
        String contactPerson,
        String contactEmail,
        String contactPhone,
        boolean hasAccountant,
        String loginStatus,
        String createdAt) {

    public static BusinessDto from(Business b) {
        return new BusinessDto(
                b.id(),
                b.businessName(),
                b.businessType(),
                b.industry(),
                b.location(),
                b.registrationId(),
                b.contactPerson(),
                b.contactEmail(),
                b.contactPhone(),
                b.accountantId() != null,
                loginStatus(b),
                b.createdAt());
    }

    /** active = the owner has a login; invited = an invite is outstanding; otherwise not_invited. */
    static String loginStatus(Business b) {
        if (b.linkedUserId() != null) return "active";
        if (b.inviteTokenHash() != null) return "invited";
        return "not_invited";
    }
}
