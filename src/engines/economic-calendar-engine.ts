import { fetchEconomicEvents } from "../services/economic-calendar-service"
import {
  EconomicEngineOutput,
  EconomicSignal
} from "../types/economic-calendar"

export async function economicCalendarEngine(): Promise<EconomicEngineOutput> {

  console.log("TradingEconomics key:", process.env.TRADINGECONOMICS_KEY)

  const events = await fetchEconomicEvents()

  const signals: EconomicSignal[] = []

  let score = 0

for (const e of events) {

  const surprise =
    e.actual != null && e.forecast != null
      ? e.actual - e.forecast
      : 0

  const bias = "NEUTRAL"

  const weight = e.importance || 1

  score += 0

  signals.push({
    event: e.event,
    surprise,
    bias,
    weight
  })
}


  let regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL" = "NEUTRAL"

  if (score > 2) regime = "RISK_ON"
  if (score < -2) regime = "RISK_OFF"

  return {
    regime,
    score,
    signals
  }
}