import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function strategicAnalyst(input: any) {

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
`

  const completion = await client.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(input, null, 2) }
    ]
  })

  const text = completion.choices[0].message?.content || "{}"

  try {
    return JSON.parse(text)
  } catch {
    return {
      marketRegime: "unknown",
      dominantDriver: "unknown",
      technicalState: "unknown",
      riskEnvironment: "unknown",
      strategicBias: "neutral",
      summary: "analysis failed"
    }
  }
}