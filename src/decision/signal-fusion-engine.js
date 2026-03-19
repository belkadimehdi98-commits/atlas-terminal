"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signalFusionEngine = signalFusionEngine;
const positioning_1 = require("../ingestion/positioning");
const positioning_engine_1 = require("../intelligence/positioning-engine");
const liquidation_engine_1 = require("../intelligence/liquidation-engine");
const options_intelligence_engine_1 = require("../intelligence/options-intelligence-engine");
const weather_shock_engine_1 = require("../intelligence/weather-shock-engine");
async function signalFusionEngine(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { signals } = input;
    const technical = signals.technical;
    const macro = signals.macro;
    const cross = signals.crossAsset;
    const geo = signals.geopolitics;
    const vix = signals.vix;
    const asset = input.asset || "BTC";
    const positioningRaw = await (0, positioning_1.fetchPositioningData)(asset);
    const positioning = positioningRaw ? (0, positioning_engine_1.analyzePositioning)(positioningRaw) : null;
    const liquidation = await (0, liquidation_engine_1.runLiquidationEngine)(asset);
    const options = await (0, options_intelligence_engine_1.runOptionsIntelligence)(asset);
    const weather = (0, weather_shock_engine_1.analyzeWeatherShock)(input.weatherEvents || []);
    let strength = 0;
    // LIQUIDATION SIGNAL
    if ((liquidation === null || liquidation === void 0 ? void 0 : liquidation.squeezeBias) === "SHORT_SQUEEZE") {
        strength += 0.1;
    }
    if ((liquidation === null || liquidation === void 0 ? void 0 : liquidation.squeezeBias) === "LONG_SQUEEZE") {
        strength -= 0.1;
    }
    // POSITIONING
    if ((positioning === null || positioning === void 0 ? void 0 : positioning.positioningBias) === "LONG_CROWDED") {
        strength -= 0.15;
    }
    if ((positioning === null || positioning === void 0 ? void 0 : positioning.positioningBias) === "SHORT_CROWDED") {
        strength += 0.15;
    }
    if ((positioning === null || positioning === void 0 ? void 0 : positioning.liquidationRisk) === "HIGH") {
        strength -= 0.05;
    }
    // OPTIONS FLOW
    if ((options === null || options === void 0 ? void 0 : options.bias) === "BULLISH") {
        strength += 0.1;
    }
    if ((options === null || options === void 0 ? void 0 : options.bias) === "BEARISH") {
        strength -= 0.1;
    }
    // WEATHER SHOCK
    if (weather.impact === "RISK_OFF") {
        strength -= 0.1;
    }
    if (weather.impact === "RISK_ON") {
        strength += 0.1;
    }
    // TECHNICAL
    if ((technical === null || technical === void 0 ? void 0 : technical.trend) === "BULLISH")
        strength += 0.3;
    if ((technical === null || technical === void 0 ? void 0 : technical.trend) === "BEARISH")
        strength -= 0.3;
    if ((_a = technical === null || technical === void 0 ? void 0 : technical.momentum) === null || _a === void 0 ? void 0 : _a.includes("Bullish"))
        strength += 0.2;
    if ((_b = technical === null || technical === void 0 ? void 0 : technical.momentum) === null || _b === void 0 ? void 0 : _b.includes("Bearish"))
        strength -= 0.2;
    // MACRO
    if (((_c = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _c === void 0 ? void 0 : _c.regime) === "RISK_ON")
        strength += 0.2;
    if (((_d = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _d === void 0 ? void 0 : _d.regime) === "RISK_OFF")
        strength -= 0.2;
    // CROSS ASSET
    if ((cross === null || cross === void 0 ? void 0 : cross.alignment) === "RISK_ON")
        strength += 0.15;
    if ((cross === null || cross === void 0 ? void 0 : cross.alignment) === "RISK_OFF")
        strength -= 0.15;
    // GEOPOLITICS
    if (((_e = geo === null || geo === void 0 ? void 0 : geo.impactChain) === null || _e === void 0 ? void 0 : _e.length) > 0)
        strength -= 0.15;
    // VIX VOLATILITY REGIME
    if ((vix === null || vix === void 0 ? void 0 : vix.regime) === "LOW_VOL")
        strength += 0.1;
    if ((vix === null || vix === void 0 ? void 0 : vix.regime) === "HIGH_VOL")
        strength -= 0.1;
    if ((vix === null || vix === void 0 ? void 0 : vix.regime) === "CRISIS_VOL")
        strength -= 0.2;
    const signalStrength = Math.max(Math.min(strength, 1), -1);
    return {
        trend: (technical === null || technical === void 0 ? void 0 : technical.trend) || "UNKNOWN",
        momentum: (technical === null || technical === void 0 ? void 0 : technical.momentum) || "UNKNOWN",
        structure: (technical === null || technical === void 0 ? void 0 : technical.structure) || "UNKNOWN",
        macroRegime: ((_f = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _f === void 0 ? void 0 : _f.regime) || "NEUTRAL",
        crossAssetPressure: (cross === null || cross === void 0 ? void 0 : cross.alignment) || "NEUTRAL",
        geopoliticalRisk: ((_g = geo === null || geo === void 0 ? void 0 : geo.impactChain) === null || _g === void 0 ? void 0 : _g.length) ? "ELEVATED" : "LOW",
        volatilityRegime: (vix === null || vix === void 0 ? void 0 : vix.regime) || "NORMAL_VOL",
        vixLevel: (vix === null || vix === void 0 ? void 0 : vix.value) || 0,
        signalStrength,
        positioning,
        liquidation,
        options,
        weather
    };
}
