package com.venture.schemes;

import java.util.List;

/**
 * A small, hand-curated set of well-known Indian MSME schemes, stored in the
 * same shape a future ingestion job would write to the {@code schemes} table.
 * There is deliberately no live scraper here; swapping one in later means
 * writing rows in this shape, with nothing downstream needing to change.
 */
final class SchemeSeedData {

    record Seed(
            String id,
            String name,
            String category,
            String description,
            String benefitSummary,
            String eligibilityJson,
            String sourceName,
            String sourceUrl) {}

    static final List<Seed> SCHEMES = List.of(
            new Seed(
                    "cgtmse",
                    "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
                    "Credit / Collateral-free Loans",
                    "Provides collateral-free credit guarantee cover to banks and financial institutions lending to eligible micro and small enterprises.",
                    "Guarantee cover on collateral-free loans, typically up to ₹2 crore depending on the lending institution and scheme terms.",
                    "{\"businessTypes\":null,\"maxEmployees\":null,\"industries\":null,\"requiresUdyam\":true}",
                    "CGTMSE (Government of India)",
                    "https://www.cgtmse.in/"),
            new Seed(
                    "pmegp",
                    "Prime Minister\u2019s Employment Generation Programme (PMEGP)",
                    "Setup / Capital Subsidy",
                    "A credit-linked subsidy scheme for setting up new micro-enterprises in the non-farm sector, administered by KVIC.",
                    "Capital subsidy on a bank loan for a new project, with the subsidy percentage varying by category and location (rural/urban).",
                    "{\"businessTypes\":[\"Proprietorship\",\"Partnership\"],\"maxEmployees\":null,\"industries\":null,\"newBusinessOnly\":true}",
                    "Khadi and Village Industries Commission (KVIC)",
                    "https://www.kviconline.gov.in/pmegpeportal/"),
            new Seed(
                    "udyam-benefits",
                    "Udyam Registration Benefits",
                    "Business Registration",
                    "Registered MSMEs (via Udyam) become eligible for a range of government benefits including priority sector lending, delayed payment protection under the MSMED Act, and tender preferences.",
                    "Access to priority-sector lending, protection against delayed payments, and preference in government tenders.",
                    "{\"businessTypes\":null,\"maxEmployees\":null,\"industries\":null,\"requiresUdyam\":true}",
                    "Ministry of Micro, Small and Medium Enterprises",
                    "https://udyamregistration.gov.in/"),
            new Seed(
                    "zed-certification",
                    "Zero Defect Zero Effect (ZED) Certification Scheme",
                    "Quality / Sustainability",
                    "Subsidized certification scheme encouraging manufacturing MSMEs to adopt quality and environmentally sustainable practices.",
                    "Subsidized certification cost (rate varies by enterprise category) plus handholding support for quality/sustainability upgrades.",
                    "{\"businessTypes\":null,\"maxEmployees\":null,\"industries\":[\"Manufacturing\",\"manufacturing\",\"Industrial\",\"Production\"],\"requiresUdyam\":true}",
                    "Ministry of Micro, Small and Medium Enterprises",
                    "https://zed.msme.gov.in/"),
            new Seed(
                    "stand-up-india",
                    "Stand-Up India",
                    "Credit / Setup",
                    "Bank loans between ₹10 lakh and ₹1 crore for setting up a greenfield enterprise, aimed at specific underrepresented categories of entrepreneurs.",
                    "Bank loan of ₹10 lakh to ₹1 crore for a new enterprise, subject to eligibility criteria set by the scheme.",
                    "{\"businessTypes\":null,\"maxEmployees\":null,\"industries\":null,\"newBusinessOnly\":true}",
                    "Small Industries Development Bank of India (SIDBI) / Stand-Up India",
                    "https://www.standupmitra.in/"),
            new Seed(
                    "fssai-subsidy-food-processing",
                    "PM Formalisation of Micro Food Processing Enterprises (PM FME)",
                    "Food Processing",
                    "Credit-linked subsidy for upgrading existing micro food processing enterprises and supporting formalisation.",
                    "Credit-linked capital subsidy (commonly cited around 35% of eligible project cost, subject to a ceiling) for micro food processing units.",
                    "{\"businessTypes\":null,\"maxEmployees\":null,\"industries\":[\"Food\",\"food\",\"Beverage\",\"F&B\",\"Catering\"]}",
                    "Ministry of Food Processing Industries",
                    "https://pmfme.mofpi.gov.in/"));

    private SchemeSeedData() {}
}
