import { DetectedEvent, MacroSummary } from "../types/signal";
import { economicCalendarEngine } from "../engines/economic-calendar-engine"
export interface MacroImpact {
  summary: MacroSummary;
  impactChain: string;
}

export class MacroEngine {

async analyze(events: DetectedEvent[]): Promise<MacroImpact> {

  const economic = await economicCalendarEngine();

  const keyDrivers: string[] = [];

  let riskOnScore = 0;
  let riskOffScore = 0;

  if (economic.regime === "RISK_OFF") riskOffScore += 2;
  if (economic.regime === "RISK_ON") riskOnScore += 2;

  keyDrivers.push("Economic calendar signals influencing macro regime");

  for (const e of events) {

      if (e.type === "MACRO") {
        keyDrivers.push(e.title);

        const title = e.title.toLowerCase();

        if (title.includes("inflation")) riskOffScore += 2;
        if (title.includes("recession")) riskOffScore += 2;
        if (title.includes("rate hike")) riskOffScore += 2;

        if (title.includes("growth")) riskOnScore += 1;
        if (title.includes("stimulus")) riskOnScore += 2;
      }

      if (e.type === "CENTRAL_BANK") {
        keyDrivers.push(e.title);
        riskOffScore += 1;
      }

      if (e.type === "WAR") {
        riskOffScore += 2;
      }

      if (e.type === "SANCTIONS") {
        riskOffScore += 1;
      }
    }

    let regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL" = "NEUTRAL";

    if (riskOffScore > riskOnScore) regime = "RISK_OFF";
    if (riskOnScore > riskOffScore) regime = "RISK_ON";

    const summary: MacroSummary = {
      regime,
      keyDrivers
    };

    const impactChain = this.buildImpact(regime);

    return {
      summary,
      impactChain
    };
  }

  private buildImpact(regime: string): string {

    if (regime === "RISK_OFF") {
      return "Macro signals point to tightening liquidity or economic stress → capital shifts to safe assets → pressure on equities and risk assets";
    }

    if (regime === "RISK_ON") {
      return "Macro signals indicate growth or liquidity support → investors increase exposure to risk assets → bullish environment for equities and crypto";
    }

    return "Macro signals mixed → markets likely to remain range-bound awaiting clearer economic direction";
  }
}