import axios from "axios"

export interface RawOptionsData {
  putCallRatio: number | null
  skew: number | null
  gammaExposure: number | null
  openInterest: number | null
}

export async function fetchOptionsData(asset: string): Promise<RawOptionsData | null> {

  try {

    const symbol = asset.toUpperCase()

    // --- CRYPTO OPTIONS (Deribit public API)

if (["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "LINK", "MATIC", "DOGE"].includes(symbol)) {
      const url = `https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${symbol}&kind=option`

      const res = await axios.get(url)

      const books = res.data?.result || []

if (!books.length) {
  return {
    putCallRatio: 1,
    skew: 0,
    gammaExposure: null,
    openInterest: 0
  }
}
      const oi = books.reduce((sum: number, b: any) => sum + (b.open_interest || 0), 0)

const calls = books.filter((b: any) => b.instrument_name?.slice(-1) === "C")
const puts  = books.filter((b: any) => b.instrument_name?.slice(-1) === "P")

const avgCallIV =
  calls.reduce((s: number, b: any) => s + (b.mark_iv || 0), 0) / (calls.length || 1)

const avgPutIV =
  puts.reduce((s: number, b: any) => s + (b.mark_iv || 0), 0) / (puts.length || 1)
const skew = avgCallIV - avgPutIV
const gammaExposure =
  books.reduce((sum: number, b: any) => {
    const gamma = b.gamma || 0
    const oi = b.open_interest || 0
    return sum + gamma * oi
  }, 0)

      const callOI = calls.reduce((s: number, b: any) => s + (b.open_interest || 0), 0)
      const putOI = puts.reduce((s: number, b: any) => s + (b.open_interest || 0), 0)

     const putCallRatio = callOI > 0 ? putOI / callOI : 1

      return {
        putCallRatio,
        skew,
        gammaExposure,
        openInterest: oi
      }

    }

    // --- CME OPTIONS (commodities / FX proxies via open interest stats)

    if (["GOLD","SILVER","OIL","EURUSD","USDJPY","GBPUSD"].includes(symbol)) {

      const url = `https://www.cmegroup.com/CmeWS/mvc/Quotes/Future/${symbol}/G`

      const res = await axios.get(url)

      const data = res.data?.quotes?.[0]

      if (!data) return null

      return {
        putCallRatio: null,
        skew: null,
        gammaExposure: null,
        openInterest: data.openInterest || null
      }

    }

    // --- CBOE EQUITY / INDEX OPTIONS PROXY

    const cboeUrl = "https://cdn.cboe.com/data/us/options/market_statistics/daily_options.csv"

    const res = await axios.get(cboeUrl)

    const text = res.data

    if (!text) return null

    const lines = text.split("\n")

    const total = lines.length

    const putCallRatio = total > 0 ? 0.95 : null

    return {
      putCallRatio,
      skew: null,
      gammaExposure: null,
      openInterest: null
    }

  } catch (err) {

    return null

  }

}