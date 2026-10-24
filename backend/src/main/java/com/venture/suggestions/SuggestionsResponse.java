package com.venture.suggestions;

import java.util.List;

public record SuggestionsResponse(List<Suggestion> suggestions, int needingReviewCount, String disclaimer) {}
