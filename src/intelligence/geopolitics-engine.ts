import { DetectedEvent, GeopoliticalSummary } from "../types/signal";

export interface GeopoliticalImpact {
  summary: GeopoliticalSummary;
  impactChain: string;
}

export class GeopoliticsEngine {

  analyze(events: DetectedEvent[]): GeopoliticalImpact {

    const tensions: string[] = [];
    const sanctions: string[] = [];
    const conflicts: string[] = [];
    const politicalEvents: string[] = [];

    for (const e of events) {

      if (e.type === "WAR") {
        conflicts.push(e.title);
      }

      if (e.type === "SANCTIONS") {
        sanctions.push(e.title);
      }

      if (e.type === "GEOPOLITICS") {
        politicalEvents.push(e.title);
      }

      if (e.type === "CENTRAL_BANK") {
        tensions.push(e.title);
      }
    }

    const summary: GeopoliticalSummary = {
      tensions,
      sanctions,
      conflicts,
      politicalEvents
    };

    const impactChain = this.buildImpactChain(summary);

    return {
      summary,
      impactChain
    };
  }

  private buildImpactChain(summary: GeopoliticalSummary): string {

    if (summary.conflicts.length > 0) {
      return "Military conflict detected → potential energy supply disruption → inflation risk → risk-off sentiment in global markets";
    }

    if (summary.sanctions.length > 0) {
      return "Economic sanctions detected → trade disruption → global supply chain pressure → volatility in commodities and currencies";
    }

    if (summary.tensions.length > 0) {
      return "Central bank tension detected → monetary tightening expectations → liquidity contraction → pressure on risk assets";
    }

    if (summary.politicalEvents.length > 0) {
      return "Political developments detected → policy uncertainty → investor caution → potential market volatility";
    }

    return "No significant geopolitical risks detected";
  }
}