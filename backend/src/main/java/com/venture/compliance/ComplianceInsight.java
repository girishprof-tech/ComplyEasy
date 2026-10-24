package com.venture.compliance;

/** A rule-based, per-item note shown next to a compliance item. {@code level} is ok, warn or risk. */
public record ComplianceInsight(String headline, String body, String level) {}
