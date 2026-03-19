import axios from "axios"

export interface LiquidationSignal {
  shortLiquidationLevel: number | null
  longLiquidationLevel: number | null
  squeezeBias: "SHORT_SQUEEZE" | "LONG_SQUEEZE" | "NONE"
}

export async function runLiquidationEngine(symbol: string): Promise<LiquidationSignal> {

  try {

    // Example Binance futures open interest endpoint (placeholder for liquidation data source)
    const url = `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`

    const res = await axios.get(url)

    const oi = parseFloat(res.data.openInterest)

    // Placeholder logic (will upgrade later)
    let squeezeBias: "SHORT_SQUEEZE" | "LONG_SQUEEZE" | "NONE" = "NONE"

    if (oi > 0) {
      squeezeBias = "NONE"
    }

    return {
      shortLiquidationLevel: null,
      longLiquidationLevel: null,
      squeezeBias
    }

  } catch (err) {

    return {
      shortLiquidationLevel: null,
      longLiquidationLevel: null,
      squeezeBias: "NONE"
    }

  }

}