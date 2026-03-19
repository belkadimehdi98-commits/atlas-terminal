import { fetchOptionsData } from "../ingestion/options-data"

export interface OptionsSignal {
  putCallRatio: number
  skew: number
  gammaExposure: number
  openInterest: number
  bias: "BULLISH" | "BEARISH" | "NEUTRAL"
}

export async function runOptionsIntelligence(asset: string): Promise<OptionsSignal | null> {

  try {

    const data = await fetchOptionsData(asset)

if (!data) {
  return {
    putCallRatio: 1,
    skew: 0,
    gammaExposure: 0,
    openInterest: 0,
    bias: "NEUTRAL"
  }
}
    const putCallRatio = data.putCallRatio ?? 1
    const skew = data.skew ?? 0
    const gammaExposure = data.gammaExposure ?? 0
    const openInterest = data.openInterest ?? 0

    let bias: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL"

    if (putCallRatio < 0.8 && skew <= 0) bias = "BULLISH"
    if (putCallRatio > 1.2 && skew >= 0) bias = "BEARISH"

    return {
      putCallRatio,
      skew,
      gammaExposure,
      openInterest,
      bias
    }

  } catch {

    return null

  }

}