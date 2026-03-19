"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketRegimeEngine = marketRegimeEngine;
function marketRegimeEngine(input) {
    var _a, _b, _c, _d;
    const { macro, crossAsset, geopolitics, technical } = input;
    let riskScore = 0;
    if (((_a = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _a === void 0 ? void 0 : _a.regime) === "RISK_ON")
        riskScore += 2;
    if (((_b = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _b === void 0 ? void 0 : _b.regime) === "RISK_OFF")
        riskScore -= 2;
    if ((crossAsset === null || crossAsset === void 0 ? void 0 : crossAsset.alignment) === "RISK_ON")
        riskScore += 1;
    if ((crossAsset === null || crossAsset === void 0 ? void 0 : crossAsset.alignment) === "RISK_OFF")
        riskScore -= 1;
    if ((geopolitics === null || geopolitics === void 0 ? void 0 : geopolitics.impactChain) && geopolitics.impactChain.length > 0) {
        riskScore -= 2;
    }
    let regime = "NEUTRAL";
    if (riskScore >= 2)
        regime = "RISK_ON";
    if (riskScore <= -2)
        regime = "RISK_OFF";
    let volatility = "NORMAL";
    if ((geopolitics === null || geopolitics === void 0 ? void 0 : geopolitics.impactChain) && geopolitics.impactChain.length > 0) {
        volatility = "HIGH";
    }
    let liquidity = "NEUTRAL";
    if (((_c = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _c === void 0 ? void 0 : _c.regime) === "RISK_OFF") {
        liquidity = "TIGHT";
    }
    if (((_d = macro === null || macro === void 0 ? void 0 : macro.summary) === null || _d === void 0 ? void 0 : _d.regime) === "RISK_ON") {
        liquidity = "LOOSE";
    }
    let riskEnvironment = "CAUTIOUS";
    if (regime === "RISK_ON")
        riskEnvironment = "FAVORABLE";
    if (regime === "RISK_OFF")
        riskEnvironment = "DEFENSIVE";
    const summary = `
Market regime detected as ${regime}.
Volatility environment is ${volatility}.
Liquidity conditions appear ${liquidity}.
Overall trading environment is ${riskEnvironment}.
`.trim();
    return {
        regime,
        volatility,
        liquidity,
        riskEnvironment,
        summary
    };
}
