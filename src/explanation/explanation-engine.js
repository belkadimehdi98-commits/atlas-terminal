"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationEngine = void 0;
class ExplanationEngine {
    build(input) {
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
    eventsSummary(events) {
        if (!events.length) {
            return "No major macro or geopolitical events detected.";
        }
        return events
            .slice(0, 10)
            .map(e => `- [${e.type}] ${e.title}`)
            .join("\n");
    }
}
exports.ExplanationEngine = ExplanationEngine;
