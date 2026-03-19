import "dotenv/config";
import * as readline from "readline";

import { CrossAssetEngine } from "./intelligence/cross-asset-engine";
import { TechnicalEngine } from "./technical/technical-engine";
import { SymbolResolver } from "./utils/symbol-resolver";
import { MarketRouter } from "./ingestion/market-router";
import { vixEngine } from "./intelligence/vix-engine";

import { NewsFeed } from "./ingestion/news-feed";
import { EventParser } from "./intelligence/event-parser";
import { MacroEngine } from "./intelligence/macro-engine";
import { GeopoliticsEngine } from "./intelligence/geopolitics-engine";

import { ExplanationEngine } from "./explanation/explanation-engine";
import { ThesisEngine } from "./intelligence/thesis-engine";

import { signalFusionEngine } from "./decision/signal-fusion-engine";
import { marketRegimeEngine } from "./decision/market-regime-engine";
import { aiDecisionEngine } from "./ai/ai-decision-engine";
import { strategicAnalyst } from "./ai/strategic-analyst";
/* ===============================
USER INPUT
=============================== */

function askAsset(): Promise<string> {
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
  console.log("\n===================================");
  console.log("ATLAS TERMINAL TRADE INTELLIGENCE");
  console.log("===================================\n");

  const rawInput = await askAsset();
  const asset = SymbolResolver.resolve(rawInput);
  const timeframe = "1h";

  const router = new MarketRouter();
  const price = await router.getPrice(asset);

  const technicalEngine = new TechnicalEngine(asset, timeframe);
  const technical = await technicalEngine.run();
const volatility = technical.indicators.find(i => i.startsWith("Volatility:"));
  const newsFeed = new NewsFeed();
const news = await newsFeed.fetchMarketNews(asset);
  const parser = new EventParser();
  const events = parser.parse(news);

  const macroEngine = new MacroEngine();
const macro = await macroEngine.analyze(events);
  const geoEngine = new GeopoliticsEngine();
  const geopolitics = geoEngine.analyze(events);

  const crossAssetEngine = new CrossAssetEngine();
  const crossAsset = await crossAssetEngine.analyze();
const vix = await vixEngine();
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
const regime = marketRegimeEngine({
  technical,
  macro,
  geopolitics,
  crossAsset
});
  /* ===============================
     SIGNAL FUSION
  =============================== */

const fusedSignals = await signalFusionEngine({
  asset,
  signals
});
const strategy = await strategicAnalyst({
  asset,
  signals,
  fusedSignals
});
  /* ===============================
     AI FINAL DECISION
  =============================== */

const finalTrade = await aiDecisionEngine({
  asset,
  signals,
  fusedSignals,
  strategy
});

  /* ===============================
     AI THESIS ENGINE
  =============================== */

  const thesisEngine = new ThesisEngine();

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
    events: events.map((e: any) => e.title),

    entry: finalTrade.entry?.low,
    entryHigh: finalTrade.entry?.high,
    stopLoss: finalTrade.stopLoss,
    targets: finalTrade.targets || []
  });

  /* SYSTEM EXPLANATION */

  const explanationEngine = new ExplanationEngine();

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
    console.log(`Entry: ${finalTrade.entry?.low} - ${finalTrade.entry?.high}`);
    console.log(`Stop Loss: ${finalTrade.stopLoss}`);

    if (finalTrade.targets?.length) {
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