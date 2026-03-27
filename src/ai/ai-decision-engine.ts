import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function aiDecisionEngine(input: any) {

  const systemPrompt = `
You are the Strategic Decision Engine of an institutional macro trading system.

You receive:
• raw market signals
• a fused institutional market state

Your job is to produce the FINAL trade decision.

Guidelines:
- You are allowed to take calculated risk.
- You MUST produce BUY or SELL when there is a dominant driver (Technical, Liquidity, or Cross-Asset).
- You MUST resolve conflicts and choose a direction. Do NOT stay neutral when a directional bias exists.
- Conflicting signals do NOT automatically mean NO_TRADE.
- Weigh signals and choose the most probable direction.
- NO_TRADE is ONLY allowed when:
  • all signals are weak
  • OR no clear directional bias exists

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
`
  input.positioning = input.fusedSignals?.positioning || null
  const userPrompt = JSON.stringify(input, null, 2)

  const completion = await client.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  })

  const text = completion.choices[0].message?.content || "{}"

  try {
const parsed = JSON.parse(text)

return {
  direction: parsed.direction ?? "NO_TRADE",
  confidence: parsed.confidence ?? 0,
  regime: parsed.regime ?? "",
  structure: parsed.structure ?? "",
  execution: parsed.execution ?? "",
  explanation: parsed.explanation ?? ""
}  } catch {
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
    }
  }
}