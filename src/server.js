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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const trade_closer_1 = require("./intelligence/trade-closer");
const crypto_flow_engine_1 = require("./intelligence/crypto-flow-engine");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const liquidity_engine_1 = require("./intelligence/liquidity-engine");
const cross_asset_engine_1 = require("./intelligence/cross-asset-engine");
const technical_engine_1 = require("./technical/technical-engine");
const decision_engine_1 = require("./decision/decision-engine");
const symbol_resolver_1 = require("./utils/symbol-resolver");
const market_router_1 = require("./ingestion/market-router");
const candles_router_1 = require("./ingestion/candles-router");
const news_feed_1 = require("./ingestion/news-feed");
const event_parser_1 = require("./intelligence/event-parser");
const macro_engine_1 = require("./intelligence/macro-engine");
const geopolitics_engine_1 = require("./intelligence/geopolitics-engine");
const economic_calendar_engine_1 = require("./engines/economic-calendar-engine");
const thesis_engine_1 = require("./intelligence/thesis-engine");
const ai_review_engine_1 = require("./ai/ai-review-engine");
const vix_engine_1 = require("./intelligence/vix-engine");
const bond_yield_engine_1 = require("./intelligence/bond-yield-engine");
const backtest_engine_1 = require("./backtesting/backtest-engine");
const ai_decision_engine_1 = require("./ai/ai-decision-engine");
const positioning_router_1 = require("./ingestion/positioning-router");
const liquidation_engine_1 = require("./intelligence/liquidation-engine");
const options_intelligence_engine_1 = require("./intelligence/options-intelligence-engine");
const weather_shock_engine_1 = require("./intelligence/weather-shock-engine");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/analyze", async (req, res) => {
    var _a, _b, _c;
    const rawInput = req.body.asset;
    const asset = symbol_resolver_1.SymbolResolver.resolve(rawInput);
    const timeframe = "1h";
    const router = new market_router_1.MarketRouter();
    const price = await router.getPrice(asset);
    await (0, trade_closer_1.closeTrades)();
    const technicalEngine = new technical_engine_1.TechnicalEngine(asset, timeframe);
    const technical = await technicalEngine.run();
    const newsFeed = new news_feed_1.NewsFeed();
    const news = await newsFeed.fetchMarketNews(asset);
    const parser = new event_parser_1.EventParser();
    const events = parser.parse(news);
    const weatherData = events.filter(e => {
        var _a, _b, _c, _d, _e;
        return ((_a = e.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes("storm")) ||
            ((_b = e.title) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("hurricane")) ||
            ((_c = e.title) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes("flood")) ||
            ((_d = e.title) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes("earthquake")) ||
            ((_e = e.title) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes("wildfire"));
    });
    const macroEngine = new macro_engine_1.MacroEngine();
    const macro = await macroEngine.analyze(events);
    const economic = await (0, economic_calendar_engine_1.economicCalendarEngine)();
    const geoEngine = new geopolitics_engine_1.GeopoliticsEngine();
    const geopolitics = geoEngine.analyze(events);
    const crossAssetEngine = new cross_asset_engine_1.CrossAssetEngine();
    const crossAsset = await crossAssetEngine.analyze();
    const liquidityEngine = new liquidity_engine_1.LiquidityEngine();
    const liquidity = await liquidityEngine.analyze();
    const cryptoFlowEngine = new crypto_flow_engine_1.CryptoFlowEngine();
    const cryptoFlows = await cryptoFlowEngine.analyze();
    const { analyzePositioning } = await Promise.resolve().then(() => __importStar(require("./intelligence/positioning-engine")));
    const rawPositioning = await (0, positioning_router_1.getPositioning)(asset);
    const positioning = rawPositioning ? analyzePositioning(rawPositioning) : null;
    const liquidation = await (0, liquidation_engine_1.runLiquidationEngine)(asset);
    const options = await (0, options_intelligence_engine_1.runOptionsIntelligence)(asset);
    const vix = await (0, vix_engine_1.vixEngine)();
    const bonds = await (0, bond_yield_engine_1.bondYieldEngine)();
    const weatherShock = await (0, weather_shock_engine_1.analyzeWeatherShock)(events);
    const aiDecision = await (0, ai_decision_engine_1.aiDecisionEngine)({
        asset,
        price,
        technical,
        macro,
        crossAsset,
        geopolitics,
        liquidity,
        cryptoFlows,
        vix,
        bonds,
        weather: weatherShock
    });
    const decisionEngine = new decision_engine_1.DecisionEngine();
    const decision = decisionEngine.run({
        asset,
        price,
        technical,
        macro,
        crossAsset,
        geopolitics: {
            impactChain: geopolitics.impactChain ? [geopolitics.impactChain] : []
        },
        aiDirection: aiDecision.direction
    });
    const review = await (0, ai_review_engine_1.aiReviewEngine)({
        asset,
        price,
        technical,
        macro,
        geopolitics,
        crossAsset,
        preliminaryDecision: decision
    });
    const finalDirection = review.finalDirection;
    if (finalDirection !== "NO_TRADE" && price) {
        const entry = price;
        const stop = entry * 0.99;
        const target = entry * 1.02;
        const openTrades = JSON.parse(fs_1.default.readFileSync("open-trades.json", "utf-8"));
        openTrades.push({
            asset,
            direction: finalDirection,
            entry,
            stop,
            target,
            timestamp: Date.now()
        });
        fs_1.default.writeFileSync("open-trades.json", JSON.stringify(openTrades, null, 2));
    }
    const finalConfidence = Math.min(decision.confidence, review.finalConfidence);
    const thesisEngine = new thesis_engine_1.ThesisEngine();
    const thesis = await thesisEngine.buildThesis({
        asset,
        direction: finalDirection,
        confidence: finalConfidence,
        technical: {
            trend: technical.trend,
            momentum: technical.momentum,
            structure: technical.structure
        },
        macroRegime: macro.summary.regime,
        events: events.map(e => e.title),
        entry: (_a = decision.entry) === null || _a === void 0 ? void 0 : _a.low,
        entryHigh: (_b = decision.entry) === null || _b === void 0 ? void 0 : _b.high,
        stopLoss: decision.stopLoss,
        targets: decision.takeProfits
    });
    res.json({
        asset,
        direction: finalDirection,
        confidence: finalConfidence,
        confidence_breakdown: decision.confidenceBreakdown,
        entry: (_c = decision.entry) === null || _c === void 0 ? void 0 : _c.low,
        stop_loss: decision.stopLoss,
        targets: decision.takeProfits,
        crypto_flows: cryptoFlows,
        positioning: positioning,
        liquidation: liquidation,
        options_flow: options,
        weather: weatherData,
        vix_level: vix.value,
        bond: bonds,
        economic_data: economic.signals,
        regime: macro.summary.regime,
        structure: technical.structure,
        execution: "AI Confirmed",
        signal_quality: decision.confidence > 70
            ? "Strong"
            : decision.confidence > 50
                ? "Developing"
                : "Weak",
        drivers: {
            weather: weatherShock,
            technical: [
                technical.trend,
                technical.momentum,
                technical.structure,
                ...technical.indicators.filter(i => i.startsWith("Volatility") || i.startsWith("Vol Percentile"))
            ],
            macro: [
                macro.summary.regime
            ],
            liquidity: liquidity.summary,
            cross_asset: [
                "Cross-asset flows detected"
            ],
            geopolitics: geopolitics.impactChain
                ? [geopolitics.impactChain]
                : [],
            events: [...new Set(events.map(e => e.title))].slice(0, 3)
        },
        explanation: thesis.narrative,
        risk: thesis.risk,
        data_sources: {
            market: router.source,
            macro: "TradingEconomics",
            rates: "US Treasury / FRED",
            volatility: "CBOE VIX",
            news: "Global News Monitoring"
        },
        data_status: "LIVE",
        last_update: new Date().toISOString()
    });
}); // CLOSE /analyze ROUTE
app.get("/candles", async (req, res) => {
    try {
        const symbol = String(req.query.symbol || "").toUpperCase();
        const assetClass = String(req.query.assetClass || "crypto");
        const interval = String(req.query.interval || "1h");
        const data = await candles_router_1.candlesRouter.getCandles({
            symbol,
            assetClass,
            interval,
            limit: 200
        });
        res.json(data.candles);
    }
    catch (_a) {
        res.status(500).json({ error: "candle_fetch_failed" });
    }
});
app.post("/backtest", async (req, res) => {
    const rawInput = req.body.asset;
    const asset = symbol_resolver_1.SymbolResolver.resolve(rawInput);
    console.log("BACKTEST: fetching candles...");
    const response = await candles_router_1.candlesRouter.getCandles({
        symbol: asset,
        assetClass: "crypto",
        interval: "1h",
        limit: 200
    });
    console.log("BACKTEST: candles fetched");
    const candles = response.candles.map((c) => ({
        time: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
    }));
    const results = await (0, backtest_engine_1.runBacktest)(asset, candles);
    res.json(results);
});
app.get("/track-record", (req, res) => {
    try {
        const data = require("fs")
            .readFileSync("track-record.json", "utf-8")
            .split("\n")
            .filter(Boolean)
            .map((l) => JSON.parse(l));
        const wins = data.filter((t) => t.profit > 0).length;
        const losses = data.filter((t) => t.profit <= 0).length;
        const total = data.length;
        const winRate = total ? (wins / total) * 100 : 0;
        const totalProfit = data.reduce((s, t) => s + t.profit, 0);
        res.json({ trades: total, wins, losses, winRate, totalProfit });
    }
    catch (_a) {
        res.json({ trades: 0, wins: 0, losses: 0, winRate: 0, totalProfit: 0 });
    }
});
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Atlas API running on port ${PORT}`);
});
