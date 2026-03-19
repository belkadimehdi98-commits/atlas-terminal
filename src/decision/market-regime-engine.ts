export interface MarketRegime {
  regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL"
  volatility: "LOW" | "NORMAL" | "HIGH"
  liquidity: "LOOSE" | "NEUTRAL" | "TIGHT"
  riskEnvironment: "FAVORABLE" | "CAUTIOUS" | "DEFENSIVE"
  summary: string
}

export function marketRegimeEngine(input: any): MarketRegime {

  const { macro, crossAsset, geopolitics, technical } = input

  let riskScore = 0

  if (macro?.summary?.regime === "RISK_ON") riskScore += 2
  if (macro?.summary?.regime === "RISK_OFF") riskScore -= 2

  if (crossAsset?.alignment === "RISK_ON") riskScore += 1
  if (crossAsset?.alignment === "RISK_OFF") riskScore -= 1

  if (geopolitics?.impactChain && geopolitics.impactChain.length > 0) {
    riskScore -= 2
  }

  let regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL" = "NEUTRAL"

  if (riskScore >= 2) regime = "RISK_ON"
  if (riskScore <= -2) regime = "RISK_OFF"

  let volatility: "LOW" | "NORMAL" | "HIGH" = "NORMAL"

  if (geopolitics?.impactChain && geopolitics.impactChain.length > 0) {
    volatility = "HIGH"
  }

  let liquidity: "LOOSE" | "NEUTRAL" | "TIGHT" = "NEUTRAL"

  if (macro?.summary?.regime === "RISK_OFF") {
    liquidity = "TIGHT"
  }

  if (macro?.summary?.regime === "RISK_ON") {
    liquidity = "LOOSE"
  }

  let riskEnvironment: "FAVORABLE" | "CAUTIOUS" | "DEFENSIVE" = "CAUTIOUS"

  if (regime === "RISK_ON") riskEnvironment = "FAVORABLE"
  if (regime === "RISK_OFF") riskEnvironment = "DEFENSIVE"

  const summary = `
Market regime detected as ${regime}.
Volatility environment is ${volatility}.
Liquidity conditions appear ${liquidity}.
Overall trading environment is ${riskEnvironment}.
`.trim()

  return {
    regime,
    volatility,
    liquidity,
    riskEnvironment,
    summary
  }

}