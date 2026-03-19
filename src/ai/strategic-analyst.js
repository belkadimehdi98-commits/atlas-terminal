"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategicAnalyst = strategicAnalyst;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
async function strategicAnalyst(input) {
    var _a;
    const systemPrompt = `
You are the Strategic Analyst of an institutional macro trading system.

Your job is to interpret the global market environment.

You receive:
• fused signal state
• macro regime
• cross-asset pressure
• geopolitical risk
• technical structure
• derivatives positioning
• liquidation squeeze signals

You DO NOT generate trades.

You only analyze the environment and determine the strategic context.

Return JSON only.

Format:

{
 "marketRegime": "risk_on | risk_off | mixed",
 "dominantDriver": "main force moving markets",
 "technicalState": "trend | range | breakout | compression",
 "riskEnvironment": "low | moderate | high",
 "strategicBias": "bullish | bearish | neutral",
 "summary": "short institutional explanation"
}
`;
    const completion = await client.chat.completions.create({
        model: "gpt-4.1",
        temperature: 0.2,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(input, null, 2) }
        ]
    });
    const text = ((_a = completion.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || "{}";
    try {
        return JSON.parse(text);
    }
    catch (_b) {
        return {
            marketRegime: "unknown",
            dominantDriver: "unknown",
            technicalState: "unknown",
            riskEnvironment: "unknown",
            strategicBias: "neutral",
            summary: "analysis failed"
        };
    }
}
