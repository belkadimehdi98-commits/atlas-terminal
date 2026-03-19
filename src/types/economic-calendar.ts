export type EconomicEvent = {
  event: string
  country: string
  actual: number | null
  forecast: number | null
  previous: number | null
  importance: number
  timestamp: string
}

export type EconomicSignal = {
  event: string
  surprise: number
  bias: "RISK_ON" | "RISK_OFF" | "NEUTRAL"
  weight: number
}

export type EconomicEngineOutput = {
  regime: "RISK_ON" | "RISK_OFF" | "NEUTRAL"
  score: number
  signals: EconomicSignal[]
}