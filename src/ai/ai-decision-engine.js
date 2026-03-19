"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiDecisionEngine = aiDecisionEngine;
const openai_1 = __importDefault(require("openai"));
const client = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
async function aiDecisionEngine(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const systemPrompt = `
You are the Strategic Decision Engine of an institutional macro trading system.

You receive:
• raw market signals
• a fused institutional market state

Your job is to produce the FINAL trade decision.

Guidelines:
- Be conservative.
- If signals conflict → NO_TRADE.
- If structure is weak → NO_TRADE.
- Only produce trades when probability is clear.
- Confidence must be an integer between 0 and 100.
- Do NOT return decimal confidence values.

Return ONLY JSON.

Format:

{
 "direction": "BUY | SELL | NO_TRADE",
 "confidence": number between 0 and 100,
 "regime": "short description",
 "structure": "short description",
 "execution": "short execution plan",
 "explanation": "brief institutional reasoning"
}

Confidence scale:
90-100 = exceptional conviction
75-89 = strong trade
60-74 = moderate trade
40-59 = weak trade
0-39 = no trade
`;
    input.positioning = ((_a = input.fusedSignals) === null || _a === void 0 ? void 0 : _a.positioning) || null;
    const userPrompt = JSON.stringify(input, null, 2);
    const completion = await client.chat.completions.create({
        model: "gpt-4.1",
        temperature: 0.2,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]
    });
    const text = ((_b = completion.choices[0].message) === null || _b === void 0 ? void 0 : _b.content) || "{}";
    try {
        const parsed = JSON.parse(text);
        return {
            direction: (_c = parsed.direction) !== null && _c !== void 0 ? _c : "NO_TRADE",
            confidence: (_d = parsed.confidence) !== null && _d !== void 0 ? _d : 0,
            regime: (_e = parsed.regime) !== null && _e !== void 0 ? _e : "",
            structure: (_f = parsed.structure) !== null && _f !== void 0 ? _f : "",
            execution: (_g = parsed.execution) !== null && _g !== void 0 ? _g : "",
            explanation: (_h = parsed.explanation) !== null && _h !== void 0 ? _h : ""
        };
    }
    catch (_j) {
        return {
            direction: "NO_TRADE",
            confidence: 0,
            entry: null,
            stopLoss: null,
            targets: [],
            regime: "unknown",
            structure: "unknown",
            execution: "none",
            explanation: "AI parsing failed"
        };
    }
}
