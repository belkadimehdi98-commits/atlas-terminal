import axios from "axios"

export interface VixSignal {
  value: number
  regime: "LOW_VOL" | "NORMAL_VOL" | "HIGH_VOL" | "CRISIS_VOL"
  signal: "RISK_ON" | "NEUTRAL" | "RISK_OFF"
}

export async function vixEngine(): Promise<VixSignal> {

  try {

    const res = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX")

    const value =
      res.data.chart.result[0].meta.regularMarketPrice

    let regime: VixSignal["regime"] = "NORMAL_VOL"
    let signal: VixSignal["signal"] = "NEUTRAL"

    if (value < 15) {
      regime = "LOW_VOL"
      signal = "RISK_ON"
    }

    else if (value >= 15 && value < 25) {
      regime = "NORMAL_VOL"
      signal = "NEUTRAL"
    }

    else if (value >= 25 && value < 35) {
      regime = "HIGH_VOL"
      signal = "RISK_OFF"
    }

    else {
      regime = "CRISIS_VOL"
      signal = "RISK_OFF"
    }

    return {
      value,
      regime,
      signal
    }

  } catch (error) {

    return {
      value: 0,
      regime: "NORMAL_VOL",
      signal: "NEUTRAL"
    }

  }
}