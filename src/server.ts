import "dotenv/config";
import fs from "fs";
import { closeTrades } from "./intelligence/trade-closer";
import { CryptoFlowEngine } from "./intelligence/crypto-flow-engine";
import express from "express";
import cors from "cors";
import { LiquidityEngine } from "./intelligence/liquidity-engine";
import { CrossAssetEngine } from "./intelligence/cross-asset-engine";
import { TechnicalEngine } from "./technical/technical-engine";
import { DecisionEngine } from "./decision/decision-engine";
import { SymbolResolver } from "./utils/symbol-resolver";
import { MarketRouter } from "./ingestion/market-router";
import { candlesRouter } from "./ingestion/candles-router";
import { NewsFeed } from "./ingestion/news-feed";
import { EventParser } from "./intelligence/event-parser";
import { MacroEngine } from "./intelligence/macro-engine";
import { GeopoliticsEngine } from "./intelligence/geopolitics-engine";
import { economicCalendarEngine } from "./engines/economic-calendar-engine";
import { ThesisEngine } from "./intelligence/thesis-engine";
import { aiReviewEngine } from "./ai/ai-review-engine";
import { vixEngine } from "./intelligence/vix-engine";
import { bondYieldEngine } from "./intelligence/bond-yield-engine";
import { runBacktest } from "./backtesting/backtest-engine";
import { aiDecisionEngine } from "./ai/ai-decision-engine";
import { getPositioning } from "./ingestion/positioning-router";
import { runLiquidationEngine } from "./intelligence/liquidation-engine";
import { runOptionsIntelligence } from "./intelligence/options-intelligence-engine";
import { analyzeWeatherShock } from "./intelligence/weather-shock-engine";
const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", async (req, res) => {
console.log("STEP 1: start analyze");
  try {
  const rawInput = req.body.asset;

  const asset = SymbolResolver.resolve(rawInput);
  const timeframe = "1h";

  const router = new MarketRouter();
  const price = await router.getPrice(asset);
console.log("STEP 2: price loaded", price);
  await closeTrades();

  const technicalEngine = new TechnicalEngine(asset, timeframe);
  const technical = await technicalEngine.run();

  const newsFeed = new NewsFeed();
const news = await newsFeed.fetchMarketNews(asset);
  const parser = new EventParser();
  const events = parser.parse(news);
const weatherData = events.filter(e =>
  e.title?.toLowerCase().includes("storm") ||
  e.title?.toLowerCase().includes("hurricane") ||
  e.title?.toLowerCase().includes("flood") ||
  e.title?.toLowerCase().includes("earthquake") ||
  e.title?.toLowerCase().includes("wildfire")
)

  const macroEngine = new MacroEngine();
const macro = await macroEngine.analyze(events);
const economic = await economicCalendarEngine();
  const geoEngine = new GeopoliticsEngine();
  const geopolitics = geoEngine.analyze(events);

const crossAssetEngine = new CrossAssetEngine();
const crossAsset = await crossAssetEngine.analyze();

const liquidityEngine = new LiquidityEngine();
const liquidity = await liquidityEngine.analyze();
const cryptoFlowEngine = new CryptoFlowEngine();
const cryptoFlows = await cryptoFlowEngine.analyze();

const { analyzePositioning } = await import("./intelligence/positioning-engine");

const rawPositioning = await getPositioning(asset);
const positioning = rawPositioning ? analyzePositioning(rawPositioning) : null;
const liquidation = await runLiquidationEngine(asset);
const options = await runOptionsIntelligence(asset);
const vix = await vixEngine();
const bonds = await bondYieldEngine();
const weatherShock = await analyzeWeatherShock(events);
const aiDecision = await aiDecisionEngine({
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

const decisionEngine = new DecisionEngine();

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

  const review = await aiReviewEngine({
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

  const openTrades = JSON.parse(
    fs.readFileSync("open-trades.json", "utf-8")
  );

  openTrades.push({
    asset,
    direction: finalDirection,
    entry,
    stop,
    target,
    timestamp: Date.now()
  });

  fs.writeFileSync(
    "open-trades.json",
    JSON.stringify(openTrades, null, 2)
  );
}
  const finalConfidence = Math.min(
    decision.confidence,
    review.finalConfidence
  );

  const thesisEngine = new ThesisEngine();

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
    entry: decision.entry?.low,
    entryHigh: decision.entry?.high,
    stopLoss: decision.stopLoss,
    targets: decision.takeProfits
  });

res.json({
  asset,
  direction: finalDirection,
  confidence: finalConfidence,
  confidence_breakdown: decision.confidenceBreakdown,
  entry: decision.entry?.low,
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
    ...technical.indicators.filter(i =>
      i.startsWith("Volatility") || i.startsWith("Vol Percentile")
    )
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

  events: [...new Set(events.map(e => e.title))].slice(0,3)
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

  } catch (error: any) {
    console.error("ANALYZE ERROR:", error);

    res.status(500).json({
      error: "Internal error",
      message: error?.message || "unknown"
    });
  }
}); // CLOSE /analyze ROUTE
app.get("/candles", async (req, res) => {

  try {

    const symbol = String(req.query.symbol || "").toUpperCase();
    const assetClass = String(req.query.assetClass || "crypto") as any;
    const interval = String(req.query.interval || "1h") as any;

    const data = await candlesRouter.getCandles({
      symbol,
      assetClass,
      interval,
      limit: 200
    });

    res.json(data.candles);

  } catch {

    res.status(500).json({ error: "candle_fetch_failed" });

  }

});
app.post("/backtest", async (req, res) => {

  const rawInput = req.body.asset;
  const asset = SymbolResolver.resolve(rawInput);

  console.log("BACKTEST: fetching candles...");

  const response = await candlesRouter.getCandles({
    symbol: asset,
    assetClass: "crypto",
    interval: "1h",
    limit: 200
  });

  console.log("BACKTEST: candles fetched");

  const candles = response.candles.map((c: any) => ({
    time: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close
  }));

  const results = await runBacktest(asset, candles);

  res.json(results);

});
app.get("/track-record", (req, res) => {
  try {
    const data = require("fs")
      .readFileSync("track-record.json", "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((l: string) => JSON.parse(l))

    const wins = data.filter((t: any) => t.profit > 0).length
    const losses = data.filter((t: any) => t.profit <= 0).length
    const total = data.length

    const winRate = total ? (wins / total) * 100 : 0
    const totalProfit = data.reduce((s: number, t: any) => s + t.profit, 0)

    res.json({ trades: total, wins, losses, winRate, totalProfit })
  } catch {
    res.json({ trades: 0, wins: 0, losses: 0, winRate: 0, totalProfit: 0 })
  }
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Atlas API running on port ${PORT}`);
});
