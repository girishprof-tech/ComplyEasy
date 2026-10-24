package com.venture.sustainability;

import java.util.List;

public final class SustainabilityModels {

    private SustainabilityModels() {}

    public record Recommendation(String id, String category, String text) {}

    /** Optional free-text context the user may add; every field is nullable. */
    public record Inputs(
            String electricityNotes, String transportNotes, String wasteNotes, String waterNotes, String updatedAt) {}

    public record InputsRequest(
            String electricityNotes, String transportNotes, String wasteNotes, String waterNotes) {}

    public record Response(List<Recommendation> recommendations, Inputs userProvidedContext) {}
}
