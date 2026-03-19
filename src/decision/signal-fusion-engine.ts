import { fetchPositioningData } from "../ingestion/positioning"
import { analyzePositioning } from "../intelligence/positioning-engine"
import { runLiquidationEngine } from "../intelligence/liquidation-engine"
import { runOptionsIntelligence } from "../intelligence/options-intelligence-engine"
import { analyzeWeatherShock } from "../intelligence/weather-shock-engine"


export interface FusedSignalState {
  trend: string
  momentum: string
  structure: string
  macroRegime: string
  crossAssetPressure: string
  geopoliticalRisk: string
  volatilityRegime: string
  vixLevel: number
  signalStrength: number
  positioning?: any
  liquidation?: any
  options?: any
}

export async function signalFusionEngine(input: any): Promise<FusedSignalState> {

  const { signals } = input

  const technical = signals.technical
  const macro = signals.macro
  const cross = signals.crossAsset
  const geo = signals.geopolitics
  const vix = signals.vix
const asset = input.asset || "BTC"

const positioningRaw = await fetchPositioningData(asset)
const positioning = positioningRaw ? analyzePositioning(positioningRaw) : null
const liquidation = await runLiquidationEngine(asset)
const options = await runOptionsIntelligence(asset)
const weather = analyzeWeatherShock(input.weatherEvents || [])
  let strength = 0
// LIQUIDATION SIGNAL

if (liquidation?.squeezeBias === "SHORT_SQUEEZE") {
  strength += 0.1
}

if (liquidation?.squeezeBias === "LONG_SQUEEZE") {
  strength -= 0.1
}
// POSITIONING

if (positioning?.positioningBias === "LONG_CROWDED") {
  strength -= 0.15
}

if (positioning?.positioningBias === "SHORT_CROWDED") {
  strength += 0.15
}

if (positioning?.liquidationRisk === "HIGH") {
  strength -= 0.05
}

// OPTIONS FLOW

if (options?.bias === "BULLISH") {
  strength += 0.1
}

if (options?.bias === "BEARISH") {
  strength -= 0.1
}

// WEATHER SHOCK

if (weather.impact === "RISK_OFF") {
  strength -= 0.1
}

if (weather.impact === "RISK_ON") {
  strength += 0.1
}

  // TECHNICAL

  if (technical?.trend === "BULLISH") strength += 0.3
  if (technical?.trend === "BEARISH") strength -= 0.3

  if (technical?.momentum?.includes("Bullish")) strength += 0.2
  if (technical?.momentum?.includes("Bearish")) strength -= 0.2

  // MACRO

  if (macro?.summary?.regime === "RISK_ON") strength += 0.2
  if (macro?.summary?.regime === "RISK_OFF") strength -= 0.2

  // CROSS ASSET

  if (cross?.alignment === "RISK_ON") strength += 0.15
  if (cross?.alignment === "RISK_OFF") strength -= 0.15

  // GEOPOLITICS

  if (geo?.impactChain?.length > 0) strength -= 0.15

  // VIX VOLATILITY REGIME

  if (vix?.regime === "LOW_VOL") strength += 0.1
  if (vix?.regime === "HIGH_VOL") strength -= 0.1
  if (vix?.regime === "CRISIS_VOL") strength -= 0.2

  const signalStrength = Math.max(Math.min(strength, 1), -1)

return {
  trend: technical?.trend || "UNKNOWN",
  momentum: technical?.momentum || "UNKNOWN",
  structure: technical?.structure || "UNKNOWN",
  macroRegime: macro?.summary?.regime || "NEUTRAL",
  crossAssetPressure: cross?.alignment || "NEUTRAL",
  geopoliticalRisk: geo?.impactChain?.length ? "ELEVATED" : "LOW",
  volatilityRegime: vix?.regime || "NORMAL_VOL",
  vixLevel: vix?.value || 0,
signalStrength,
positioning,
liquidation,
options,
weather
}
}