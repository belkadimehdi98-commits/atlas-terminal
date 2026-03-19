"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const readline = __importStar(require("readline"));
const cross_asset_engine_1 = require("./intelligence/cross-asset-engine");
const technical_engine_1 = require("./technical/technical-engine");
const symbol_resolver_1 = require("./utils/symbol-resolver");
const market_router_1 = require("./ingestion/market-router");
const vix_engine_1 = require("./intelligence/vix-engine");
const news_feed_1 = require("./ingestion/news-feed");
const event_parser_1 = require("./intelligence/event-parser");
const macro_engine_1 = require("./intelligence/macro-engine");
const geopolitics_engine_1 = require("./intelligence/geopolitics-engine");
const explanation_engine_1 = require("./explanation/explanation-engine");
const thesis_engine_1 = require("./intelligence/thesis-engine");
const signal_fusion_engine_1 = require("./decision/signal-fusion-engine");
const market_regime_engine_1 = require("./decision/market-regime-engine");
const ai_decision_engine_1 = require("./ai/ai-decision-engine");
const strategic_analyst_1 = require("./ai/strategic-analyst");
/* ===============================
USER INPUT
=============================== */
function askAsset() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question("Enter asset (btc, gold, eurusd, oil): ", (answer) => {
            rl.close();
            resolve(answer.trim().toUpperCase());
        });
    });
}
/* ===============================
MAIN PIPELINE
=============================== */
async function run() {
    var _a, _b, _c, _d, _e;
    console.log("\n===================================");
    console.log("ATLAS TERMINAL TRADE INTELLIGENCE");
    console.log("===================================\n");
    const rawInput = await askAsset();
    const asset = symbol_resolver_1.SymbolResolver.resolve(rawInput);
    const timeframe = "1h";
    const router = new market_router_1.MarketRouter();
    const price = await router.getPrice(asset);
    const technicalEngine = new technical_engine_1.TechnicalEngine(asset, timeframe);
    const technical = await technicalEngine.run();
    const volatility = technical.indicators.find(i => i.startsWith("Volatility:"));
    const newsFeed = new news_feed_1.NewsFeed();
    const news = await newsFeed.fetchMarketNews(asset);
    const parser = new event_parser_1.EventParser();
    const events = parser.parse(news);
    const macroEngine = new macro_engine_1.MacroEngine();
    const macro = await macroEngine.analyze(events);
    const geoEngine = new geopolitics_engine_1.GeopoliticsEngine();
    const geopolitics = geoEngine.analyze(events);
    const crossAssetEngine = new cross_asset_engine_1.CrossAssetEngine();
    const crossAsset = await crossAssetEngine.analyze();
    const vix = await (0, vix_engine_1.vixEngine)();
    /* ===============================
       RAW SIGNAL PACKET
    =============================== */
    const signals = {
        technical,
        macro,
        geopolitics,
        crossAsset,
        vix,
        price,
        volatility
    };
    const regime = (0, market_regime_engine_1.marketRegimeEngine)({
        technical,
        macro,
        geopolitics,
        crossAsset
    });
    /* ===============================
       SIGNAL FUSION
    =============================== */
    const fusedSignals = await (0, signal_fusion_engine_1.signalFusionEngine)({
        asset,
        signals
    });
    const strategy = await (0, strategic_analyst_1.strategicAnalyst)({
        asset,
        signals,
        fusedSignals
    });
    /* ===============================
       AI FINAL DECISION
    =============================== */
    const finalTrade = await (0, ai_decision_engine_1.aiDecisionEngine)({
        asset,
        signals,
        fusedSignals,
        strategy
    });
    /* ===============================
       AI THESIS ENGINE
    =============================== */
    const thesisEngine = new thesis_engine_1.ThesisEngine();
    const thesis = await thesisEngine.buildThesis({
        asset,
        direction: finalTrade.direction,
        confidence: finalTrade.confidence,
        technical: {
            trend: technical.trend,
            momentum: technical.momentum,
            structure: technical.structure
        },
        macroRegime: macro.summary.regime,
        events: events.map((e) => e.title),
        entry: (_a = finalTrade.entry) === null || _a === void 0 ? void 0 : _a.low,
        entryHigh: (_b = finalTrade.entry) === null || _b === void 0 ? void 0 : _b.high,
        stopLoss: finalTrade.stopLoss,
        targets: finalTrade.targets || []
    });
    /* SYSTEM EXPLANATION */
    const explanationEngine = new explanation_engine_1.ExplanationEngine();
    const explanation = explanationEngine.build({
        asset,
        direction: finalTrade.direction,
        technical,
        macroChain: macro.impactChain,
        geopoliticalChain: geopolitics.impactChain,
        events
    });
    /* ===============================
       FINAL TERMINAL OUTPUT
    =============================== */
    console.log(`Asset: ${asset}`);
    console.log(`Price: ${price}`);
    console.log("\n--- Technical ---");
    console.log(`Trend: ${technical.trend}`);
    console.log(`Momentum: ${technical.momentum}`);
    console.log(`Structure: ${technical.structure}`);
    console.log("\n--- Macro Regime ---");
    console.log(macro.summary.regime);
    console.log("\n--- Cross Asset ---");
    console.log("Alignment:", crossAsset.alignment);
    console.log(crossAsset.summary);
    console.log("\n--- Fused Signal State ---");
    console.log(`Trend Bias: ${fusedSignals.trend}`);
    console.log(`Momentum State: ${fusedSignals.momentum}`);
    console.log(`Structure State: ${fusedSignals.structure}`);
    console.log(`Macro Regime: ${fusedSignals.macroRegime}`);
    console.log(`Cross Asset Pressure: ${fusedSignals.crossAssetPressure}`);
    console.log(`Geopolitical Risk: ${fusedSignals.geopoliticalRisk}`);
    console.log(`Signal Strength: ${fusedSignals.signalStrength}`);
    console.log("\n===================================");
    console.log("AI FINAL TRADE RECOMMENDATION");
    console.log("===================================\n");
    console.log(`Recommendation: ${finalTrade.direction}`);
    console.log(`Confidence: ${finalTrade.confidence}%`);
    if (finalTrade.direction !== "NO_TRADE") {
        console.log(`Entry: ${(_c = finalTrade.entry) === null || _c === void 0 ? void 0 : _c.low} - ${(_d = finalTrade.entry) === null || _d === void 0 ? void 0 : _d.high}`);
        console.log(`Stop Loss: ${finalTrade.stopLoss}`);
        if ((_e = finalTrade.targets) === null || _e === void 0 ? void 0 : _e.length) {
            console.log(`Targets: ${finalTrade.targets.join(" / ")}`);
        }
    }
    console.log("\n--- AI Market Regime ---\n");
    console.log(finalTrade.regime);
    console.log("\n--- AI Structure ---\n");
    console.log(finalTrade.structure);
    console.log("\n--- AI Execution Plan ---\n");
    console.log(finalTrade.execution);
    console.log("\n--- AI Strategic Explanation ---\n");
    console.log(finalTrade.explanation);
    console.log("\n--- AI Trade Thesis ---\n");
    console.log(thesis.narrative);
    console.log("\nTrade Plan:");
    console.log("Entry:", thesis.tradePlan.entry);
    console.log("Stop:", thesis.tradePlan.stopLoss);
    console.log("Targets:", thesis.tradePlan.targets.join(" / "));
    console.log("\n--- System Explanation ---\n");
    console.log(explanation);
    console.log("\n===================================\n");
}
run();
