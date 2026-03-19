export type TradeDirection = "BUY" | "SELL" | "NO_TRADE";

export interface PriceZone {
  low: number;
  high: number;
}

export interface TechnicalSummary {
  trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
  structure: string;
  momentum: string;
  indicators: string[];
}

export interface MacroSummary {
  regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL";
  keyDrivers: string[];
}

export interface GeopoliticalSummary {
  tensions: string[];
  sanctions: string[];
  conflicts: string[];
  politicalEvents: string[];
}

export interface DetectedEvent {
  type:
    | "MACRO"
    | "CENTRAL_BANK"
    | "GEOPOLITICS"
    | "SANCTIONS"
    | "WAR"
    | "WEATHER"
    | "ECONOMIC_EVENT"
    | "NEWS";
  title: string;
  source?: string;
  timestamp?: number;
  impact: "LOW" | "MEDIUM" | "HIGH";
}

export interface TradeLevels {
  entry: PriceZone | null;
  stopLoss: number | null;
  takeProfits: number[];
}

export interface ImpactChains {
  macroImpactChain: string;
  geopoliticalImpactChain: string;
}

export interface TradeReasoning {
  whyEventsMatter: string;
  technicalConfirmation: string;
  finalConclusion: string;
  invalidationConditions: string;
}

export interface TradeSignal {
  asset: string;
  timeframe: string;

  direction: TradeDirection;
  confidence: number;

  levels: TradeLevels;

  detectedEvents: DetectedEvent[];

  technical: TechnicalSummary;
  macro: MacroSummary;
  geopolitics: GeopoliticalSummary;

  impact: ImpactChains;
  reasoning: TradeReasoning;

  generatedAt: number;
}