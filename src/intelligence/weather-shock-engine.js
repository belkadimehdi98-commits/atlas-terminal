"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeWeatherShock = analyzeWeatherShock;
function analyzeWeatherShock(events) {
    if (!events || events.length === 0) {
        return {
            risk: "LOW",
            impact: "NEUTRAL",
            assets: [],
            regions: [],
            severity: 0,
            directionalBias: [],
            summary: "No significant weather disruptions detected"
        };
    }
    let affectedAssets = [];
    let regions = [];
    let directionalBias = [];
    let severity = 0;
    for (const e of events) {
        const text = (e.title || "").toLowerCase();
        // REGION
        if (text.includes("us") || text.includes("america"))
            regions.push("US");
        if (text.includes("china"))
            regions.push("CHINA");
        if (text.includes("europe") || text.includes("eu"))
            regions.push("EUROPE");
        if (text.includes("gulf"))
            regions.push("US_GULF");
        if (text.includes("asia"))
            regions.push("ASIA");
        // DISASTER
        if (text.includes("hurricane") ||
            text.includes("earthquake") ||
            text.includes("flood") ||
            text.includes("wildfire")) {
            severity += 40;
            affectedAssets.push("commodities", "indices");
            directionalBias.push("RISK_OFF_INDICES");
        }
        // INTENSITY
        if (text.includes("extreme") || text.includes("severe")) {
            severity += 20;
        }
        if (text.includes("disruption") || text.includes("shutdown")) {
            severity += 20;
            directionalBias.push("SUPPLY_SHOCK");
        }
        // ENERGY IMPACT
        if (text.includes("oil") || text.includes("gas") || text.includes("gulf")) {
            affectedAssets.push("oil", "energy");
            directionalBias.push("BULLISH_ENERGY");
        }
        // AGRICULTURE
        if (text.includes("crop") || text.includes("agriculture")) {
            affectedAssets.push("agriculture");
            directionalBias.push("AGRI_DISRUPTION");
        }
    }
    severity = Math.min(severity, 100);
    const uniqueAssets = [...new Set(affectedAssets)];
    const uniqueRegions = [...new Set(regions)];
    const uniqueBias = [...new Set(directionalBias)];
    let impact = "NEUTRAL";
    if (severity >= 60)
        impact = "RISK_OFF";
    else if (severity >= 20)
        impact = "NEUTRAL";
    if (severity >= 60) {
        return {
            risk: "HIGH",
            impact,
            assets: uniqueAssets,
            regions: uniqueRegions,
            severity,
            directionalBias: uniqueBias,
            summary: `High-impact weather disruption in ${uniqueRegions.join(", ") || "multiple regions"} affecting markets`
        };
    }
    if (severity >= 20) {
        return {
            risk: "MEDIUM",
            impact,
            assets: uniqueAssets,
            regions: uniqueRegions,
            severity,
            directionalBias: uniqueBias,
            summary: `Moderate weather disruptions in ${uniqueRegions.join(", ") || "multiple regions"}`
        };
    }
    return {
        risk: "LOW",
        impact: "NEUTRAL",
        assets: [],
        regions: [],
        severity: 0,
        directionalBias: [],
        summary: "Minor or no weather-related market impact"
    };
}
