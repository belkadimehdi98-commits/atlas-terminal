import { TechnicalSummary, TradeDirection } from "../types/signal";

export interface DecisionInput {
  asset: string;
  price: number;
  technical: TechnicalSummary;

  macro: {
    summary: {
      regime: string;
    };
  };

  crossAsset: {
    alignment: string;
  };

  geopolitics: {
    impactChain?: string[];
  };

  aiDirection: TradeDirection;
}

export interface DecisionResult {
  direction: TradeDirection;
  confidence: number;
  confidenceBreakdown: {
    technical: number;
    macro: number;
    crossAsset: number;
    geopolitics: number;
  };
  entry: { low: number; high: number } | null;
  stopLoss: number | null;
  takeProfits: number[];
}

export class DecisionEngine {

  run(input: DecisionInput): DecisionResult {

    const { technical, macro, crossAsset, geopolitics, price } = input;

    let score = 0;
let technicalScore = 0;
let macroScore = 0;
let crossAssetScore = 0;
let geopoliticsScore = 0;
    /* ===============================
       TECHNICAL SIGNALS
    =============================== */

if (technical.trend === "BULLISH") {
  score += 40;
  technicalScore += 40;
}
if (technical.trend === "BEARISH") {
  score -= 40;
  technicalScore -= 40;
}

if (technical.momentum.includes("Bullish")) {
  score += 15;
  technicalScore += 15;
}
if (technical.momentum.includes("Bearish")) {
  score -= 15;
  technicalScore -= 15;
}

if (technical.structure.includes("support")) {
  score += 10;
  technicalScore += 10;
}
if (technical.structure.includes("resistance")) {
  score -= 10;
  technicalScore -= 10;
}

    /* ===============================
       MACRO REGIME
    =============================== */

if (macro.summary.regime === "RISK_ON") {
  score += 20;
  macroScore += 20;
}
if (macro.summary.regime === "RISK_OFF") {
  score -= 20;
  macroScore -= 20;
}

    /* ===============================
       CROSS ASSET ALIGNMENT
    =============================== */

if (crossAsset.alignment === "RISK_ON") {
  score += 15;
  crossAssetScore += 15;
}
if (crossAsset.alignment === "RISK_OFF") {
  score -= 15;
  crossAssetScore -= 15;
}

    /* ===============================
       GEOPOLITICAL RISK
    =============================== */

if (geopolitics.impactChain && geopolitics.impactChain.length > 0) {
  score -= 10;
  geopoliticsScore -= 10;
}

/* ===============================
   VOLATILITY EXTRACTION
=============================== */

let atr = 0;
let volatility = "NORMAL";

for (const ind of technical.indicators) {

  if (ind.startsWith("ATR:")) {
    atr = parseFloat(ind.split(":")[1]);
  }

  if (ind.startsWith("Volatility:")) {
    volatility = ind.split(":")[1].trim();
  }

}
    /* ===============================
       DECISION LOGIC
    =============================== */

let direction: TradeDirection = input.aiDirection;
    if (score >= 40) direction = "BUY";
    if (score <= -40) direction = "SELL";

let confidence = Math.min(Math.abs(score), 90);

if (direction === "NO_TRADE") {
  confidence = 60 + Math.min(Math.abs(score), 30);
}
    /* ===============================
       NO TRADE CASE
    =============================== */

    if (direction === "NO_TRADE") {
return {
  direction,
  confidence,
  confidenceBreakdown: {
    technical: technicalScore,
    macro: macroScore,
    crossAsset: crossAssetScore,
    geopolitics: geopoliticsScore
  },
  entry: null,
  stopLoss: null,
  takeProfits: []
};
    }

/* ===============================
   VOLATILITY RISK MODEL
=============================== */

let risk = atr * 1.5;

if (volatility === "HIGH VOLATILITY") {
  risk = atr * 2.5;
}

if (volatility === "LOW VOLATILITY") {
  risk = atr * 1.0;
}

    /* ===============================
       BUY SETUP
    =============================== */

if (direction === "BUY") {
  return {
    direction,
    confidence,
    confidenceBreakdown: {
      technical: technicalScore,
      macro: macroScore,
      crossAsset: crossAssetScore,
      geopolitics: geopoliticsScore
    },
    entry: {
      low: price * 0.995,
      high: price * 1.002
    },
    stopLoss: price - risk,
    takeProfits: [
      price + risk * 2,
      price + risk * 4
    ]
  };
}

    /* ===============================
       SELL SETUP
    =============================== */

return {
  direction,
  confidence,
  confidenceBreakdown: {
    technical: technicalScore,
    macro: macroScore,
    crossAsset: crossAssetScore,
    geopolitics: geopoliticsScore
  },
  entry: {
    low: price * 0.998,
    high: price * 1.005
  },
  stopLoss: price + risk,
  takeProfits: [
    price - risk * 2,
    price - risk * 4
  ]
};

  }

}