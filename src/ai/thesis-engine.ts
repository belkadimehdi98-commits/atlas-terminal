import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function thesisEngine(input: any) {

  const systemPrompt = `
You are an institutional macro strategist.

Explain the final trading recommendation using:
- technical structure
- macro regime
- geopolitics
- cross-asset confirmation

Write like a professional desk at Goldman Sachs or JP Morgan.

Do NOT invent price levels.
Use the provided trade levels only.

Write a clear institutional thesis explaining why the trade exists or why NO_TRADE was chosen.
`;

  const userPrompt = JSON.stringify(input, null, 2);

  const completion = await client.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return completion.choices[0].message?.content || "";
}