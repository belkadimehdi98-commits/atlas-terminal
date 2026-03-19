"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTradeRecommendation = buildTradeRecommendation;
const signal_fusion_engine_1 = require("../decision/signal-fusion-engine");
const ai_decision_engine_1 = require("../ai/ai-decision-engine");
const thesis_engine_1 = require("../ai/thesis-engine");
const vix_engine_1 = require("../intelligence/vix-engine");
const crypto_flow_engine_1 = require("../intelligence/crypto-flow-engine");
async function buildTradeRecommendation(asset, signals, backtest = false) {
    var _a, _b;
    const cryptoFlowEngine = new crypto_flow_engine_1.CryptoFlowEngine();
    if (!backtest) {
        const vix = await (0, vix_engine_1.vixEngine)();
        signals.vix = vix;
        const cryptoFlows = await cryptoFlowEngine.analyze();
        signals.cryptoFlows = cryptoFlows;
    }
    // 1 — fuse raw engine signals into institutional market state
    const fusedSignals = await (0, signal_fusion_engine_1.signalFusionEngine)({
        asset,
        signals
    });
    // 2 — AI becomes final decision authority
    const finalTrade = await (0, ai_decision_engine_1.aiDecisionEngine)({
        asset,
        signals,
        fusedSignals
    });
    // 3 — institutional thesis built from AI final decision
    const thesis = await (0, thesis_engine_1.thesisEngine)({
        asset,
        signals,
        fusedSignals,
        finalTrade
    });
    return {
        direction: finalTrade.direction,
        confidence: finalTrade.confidence,
        entry: finalTrade.entry,
        stop_loss: finalTrade.stopLoss,
        targets: finalTrade.targets,
        crypto_flows: signals.cryptoFlows,
        liquidation: fusedSignals.liquidation,
        explanation: typeof thesis === "string"
            ? thesis
            : (_a = thesis === null || thesis === void 0 ? void 0 : thesis.explanation) !== null && _a !== void 0 ? _a : "",
        risk: typeof thesis === "string"
            ? ""
            : (_b = thesis === null || thesis === void 0 ? void 0 : thesis.risk) !== null && _b !== void 0 ? _b : "",
        regime: fusedSignals.regime,
        macro: fusedSignals.macro,
        cross_asset: fusedSignals.crossAsset,
        signal_quality: fusedSignals.signalQuality,
        drivers: fusedSignals.drivers
    };
}
