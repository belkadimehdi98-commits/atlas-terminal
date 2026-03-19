import { TechnicalSummary, DetectedEvent } from "../types/signal";

export interface ExplanationInput {
  asset: string;
  direction: string;
  technical: TechnicalSummary;
  macroChain: string;
  geopoliticalChain: string;
  events: DetectedEvent[];
}

export class ExplanationEngine {

  build(input: ExplanationInput): string {

    const eventSummary = this.eventsSummary(input.events);

    const explanation = `
Detected Events:
${eventSummary}

Macro Impact Chain:
${input.macroChain}

Geopolitical Impact Chain:
${input.geopoliticalChain}

Technical Confirmation:
Trend: ${input.technical.trend}
Momentum: ${input.technical.momentum}
Structure: ${input.technical.structure}

Final Assessment:
Given the macro regime, geopolitical developments, and current technical structure, the system concludes a ${input.direction} bias on ${input.asset}.

Invalidation Conditions:
A major macro shift, central bank surprise, or a technical structure break could invalidate this signal.
`;

    return explanation.trim();
  }

  private eventsSummary(events: DetectedEvent[]): string {

    if (!events.length) {
      return "No major macro or geopolitical events detected.";
    }

    return events
      .slice(0, 10)
      .map(e => `- [${e.type}] ${e.title}`)
      .join("\n");
  }
}