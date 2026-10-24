package com.venture.sustainability;

import static com.venture.common.Strings.emptyToNull;

import com.venture.business.Business;
import com.venture.sustainability.SustainabilityModels.Inputs;
import com.venture.sustainability.SustainabilityModels.InputsRequest;
import com.venture.sustainability.SustainabilityModels.Recommendation;
import com.venture.sustainability.SustainabilityModels.Response;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Sustainability ideas: practical suggestions only, never mandatory legal
 * requirements, and no invented numbers (nothing claims a specific
 * carbon-reduction percentage, because that would need real measurement data).
 * Base recommendations are deterministic and industry-aware.
 */
@Service
public class SustainabilityService {

    private static final List<Recommendation> BASE = List.of(
            new Recommendation("led-lighting", "Electricity",
                    "Switching remaining lighting to LED can reduce electricity use for lighting significantly with a short payback period."),
            new Recommendation("energy-monitoring", "Electricity",
                    "A basic energy monitor on major equipment can help identify which machines or processes use the most power, making efficiency efforts easier to target."),
            new Recommendation("waste-segregation", "Waste",
                    "Segregating waste at source (recyclable, organic, hazardous) is often a low-cost first step and may also simplify compliance with local waste rules."),
            new Recommendation("water-efficiency", "Water",
                    "Low-flow fixtures and routine leak checks are practical, low-cost ways to reduce water use in most commercial premises."));

    private record IndustryGroup(Pattern match, List<Recommendation> items) {}

    private static final List<IndustryGroup> INDUSTRY = List.of(
            new IndustryGroup(
                    Pattern.compile("manufactur|factory|production|industrial", Pattern.CASE_INSENSITIVE),
                    List.of(
                            new Recommendation("renewable-energy", "Electricity",
                                    "Rooftop solar or a renewable energy PPA is worth evaluating for manufacturing sites with significant daytime power draw."),
                            new Recommendation("packaging-reduction", "Packaging",
                                    "Reviewing packaging material and size for finished goods can reduce material cost and waste together."),
                            new Recommendation("transport-logistics", "Transport",
                                    "Consolidating outbound shipments or reviewing delivery routes can reduce fuel use and logistics cost together."))),
            new IndustryGroup(
                    Pattern.compile("food|restaurant|catering|beverage", Pattern.CASE_INSENSITIVE),
                    List.of(new Recommendation("organic-waste", "Waste",
                            "Food-processing or food-service businesses often generate significant organic waste — composting or biogas partnerships are worth reviewing locally."))),
            new IndustryGroup(
                    Pattern.compile("textile|garment|fabrication", Pattern.CASE_INSENSITIVE),
                    List.of(new Recommendation("water-recycling-textile", "Water",
                            "Textile and dyeing processes are often water-intensive — water recycling/treatment options are commonly reviewed in this industry."))));

    private final JdbcTemplate jdbc;

    public SustainabilityService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Recommendation> recommendationsFor(Business business) {
        String industry = business.industry() == null ? "" : business.industry();
        List<Recommendation> recs = new ArrayList<>(BASE);
        for (IndustryGroup group : INDUSTRY) {
            if (group.match().matcher(industry).find()) recs.addAll(group.items());
        }
        return recs;
    }

    public Response overview(Business business) {
        return new Response(recommendationsFor(business), getInputs(business.id()).orElse(null));
    }

    public Optional<Inputs> getInputs(long clientId) {
        List<Inputs> rows = jdbc.query(
                "SELECT * FROM sustainability_inputs WHERE client_id = ?",
                (rs, i) -> new Inputs(
                        rs.getString("electricity_notes"),
                        rs.getString("transport_notes"),
                        rs.getString("waste_notes"),
                        rs.getString("water_notes"),
                        rs.getString("updated_at")),
                clientId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Inputs saveInputs(long clientId, InputsRequest req) {
        if (getInputs(clientId).isPresent()) {
            jdbc.update(
                    """
                    UPDATE sustainability_inputs
                    SET electricity_notes = ?, transport_notes = ?, waste_notes = ?, water_notes = ?,
                        updated_at = datetime('now')
                    WHERE client_id = ?""",
                    emptyToNull(req.electricityNotes()),
                    emptyToNull(req.transportNotes()),
                    emptyToNull(req.wasteNotes()),
                    emptyToNull(req.waterNotes()),
                    clientId);
        } else {
            jdbc.update(
                    """
                    INSERT INTO sustainability_inputs (client_id, electricity_notes, transport_notes, waste_notes, water_notes)
                    VALUES (?, ?, ?, ?, ?)""",
                    clientId,
                    emptyToNull(req.electricityNotes()),
                    emptyToNull(req.transportNotes()),
                    emptyToNull(req.wasteNotes()),
                    emptyToNull(req.waterNotes()));
        }
        return getInputs(clientId).orElseThrow();
    }
}
