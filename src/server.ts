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
import { vixEngine } from "./intelligence/vix-engine";
import { bondYieldEngine } from "./intelligence/bond-yield-engine";
import { runBacktest } from "./backtesting/backtest-engine";
import { aiDecisionEngine } from "./ai/ai-decision-engine";
import { getPositioning } from "./ingestion/positioning-router";
import { runLiquidationEngine } from "./intelligence/liquidation-engine";
import { runOptionsIntelligence } from "./intelligence/options-intelligence-engine";
import { analyzeWeatherShock } from "./intelligence/weather-shock-engine";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover"
});
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const app = express();
async function fetchFCSPrice(symbol: string) {
  const key = process.env.FCS_KEY;

  try {
    const res = await fetch(
      `https://fcsapi.com/api-v3/forex/latest?symbol=${symbol}&access_key=${key}`
    );

    const data = await res.json();

    if (!data.response || !data.response[0]) return null;

    return {
      price: parseFloat(data.response[0].c),
      source: "FCS"
    };

  } catch {
    return null;
  }
}
app.use(cors({
  origin: [
    "https://atlasterminal.pro",
    "https://www.atlasterminal.pro",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
 allowedHeaders: ["Content-Type", "Authorization", "x-device-id"],
  credentials: true
}));
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
// STRIPE WEBHOOK (RAW BODY REQUIRED)
app.post("/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature failed");
      return res.sendStatus(400);
    }

    try {

      // PAYMENT SUCCESS
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        const email = session.customer_details?.email;

        if (email) {
          await supabase
            .from("users")
            .update({
              is_pro: true
            })
            .eq("email", email);
        }
      }

      // SUBSCRIPTION CANCELED / FAILED
      if (
        event.type === "customer.subscription.deleted" ||
        event.type === "invoice.payment_failed"
      ) {
        const sub = event.data.object as any;

        const customerId = sub.customer;

        const customer = await stripe.customers.retrieve(customerId);

        if ("email" in customer && customer.email) {
          await supabase
            .from("users")
            .update({
              is_pro: false
            })
            .eq("email", customer.email);
        }
      }

      res.json({ received: true });

    } catch (err) {
      console.error("Webhook error:", err);
      res.sendStatus(500);
    }
  }
);

app.post("/api/analyze", async (req, res) => {
console.log("STEP 1: start analyze");
// === TRIAL GATE (TEMP) ===
const deviceId =
  req.headers["x-device-id"] ||
  req.body.device_id ||
  req.ip ||
  "unknown";

// simple memory store
(global as any).usageStore = (global as any).usageStore || {};

const store = (global as any).usageStore;

if (!store[deviceId]) {
  store[deviceId] = { count: 0 };
}

const authHeader = req.headers.authorization;

let userId = null;
let userEmail = null;
if (authHeader) {
  const token = authHeader.replace("Bearer ", "");

  const { data, error } = await supabase.auth.getUser(token);

if (!error && data?.user) {
  userId = data.user.id;
  userEmail = data.user.email;
}
}
// ===== ENSURE USER EXISTS IN public.users =====
if (userId) {
  await supabase
    .from("users")
    .upsert({
      id: userId,
      email: userEmail
    }, { onConflict: "id" });
}
let isPro = false;
console.log("USER CHECK:", {
  userId,
  userEmail,
  isPro
});

if (userId) {
  const { data } = await supabase
    .from("users")
    .select("is_pro")
    .eq("id", userId)
    .single();

  if (data?.is_pro) {
    isPro = true;
  }
}
// ✅ ADMIN BYPASS (FINAL OVERRIDE)
const ADMIN_EMAIL = "mehdibelkadi2024@gmail.com";

const isAdmin = userEmail === ADMIN_EMAIL;

if (isAdmin) {
  console.log("ADMIN BYPASS ACTIVE");
}
const maxFree = 3;
const maxWithAccount = 5;

const currentCount = store[deviceId].count;

if (!userId && currentCount >= maxFree) {
  return res.status(403).json({
    error: "SIGNUP_REQUIRED",
    message: "Create account to continue"
  });
}

if (userId && !isPro && currentCount >= maxWithAccount) {
  return res.status(403).json({
    error: "SUBSCRIPTION_REQUIRED",
    message: "Subscribe to continue"
  });
}

// ===== PRO DAILY LIMIT =====
if (userId && isPro && !isAdmin) {

  const { data } = await supabase
    .from("users")
    .select("daily_usage, last_usage_reset")
    .eq("id", userId)
    .single();

  const now = Date.now();

  const lastReset = data?.last_usage_reset
    ? new Date(data.last_usage_reset).getTime()
    : 0;

  let usage = data?.daily_usage || 0;

// 🔥 rolling reset (24h)
if (now - lastReset > 24 * 60 * 60 * 1000) {
  usage = 0;

  await supabase
    .from("users")
    .update({
      daily_usage: 0,
      last_usage_reset: new Date().toISOString()
    })
    .eq("id", userId);
}

if (usage >= 10) {
  return res.status(403).json({
    error: "DAILY_LIMIT_REACHED",
    message: "Daily limit reached (10 in 24h)"
  });
}

// increment usage
await supabase
  .from("users")
  .update({
    daily_usage: usage + 1,
    last_usage_reset: new Date().toISOString()
  })
  .eq("id", userId);
}
store[deviceId].count += 1;

console.log("USAGE:", deviceId, store[deviceId].count);
  try {
  const rawInput = req.body.asset;

  const asset = SymbolResolver.resolve(rawInput);
  const timeframe = "1h";

  const router = new MarketRouter();
let price;

try {
  price = await router.getPrice(asset);
} catch {
  return res.status(500).json({
    error: "MARKET_DATA_UNAVAILABLE",
    message: "No real price data available"
  });
}console.log("STEP 2: price loaded", price);
try {
  await closeTrades();
} catch (e) {
  console.error("closeTrades failed", e);
}
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

  technical: {
    trend: technical.trend,
    momentum: technical.momentum,
    structure: technical.structure
  },

  macro: macro.summary.regime,

  geopolitics: geopolitics.impactChain,

  liquidity: liquidity.summary,

  crossAsset: crossAsset.alignment,

  cryptoFlows: cryptoFlows?.signal || null,

  vix: vix.value,

  bonds: bonds,

  weather: weatherShock || null
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


const finalDirection = aiDecision.direction;

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
const finalConfidence = decision.confidence;

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
app.post("/api/backtest", async (req, res) => {

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
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1
        }
      ],
success_url: "https://atlasterminal.pro?success=true",
cancel_url: "https://atlasterminal.pro?canceled=true"
    });

    res.json({ id: session.id });

  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "stripe_failed" });
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Atlas API running on port ${PORT}`);
});
