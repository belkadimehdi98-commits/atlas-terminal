import axios from "axios"
import { EconomicEvent } from "../types/economic-calendar"

const API_KEY = process.env.TRADINGECONOMICS_KEY

let cache: EconomicEvent[] = []
let lastFetch = 0

export async function fetchEconomicEvents(): Promise<EconomicEvent[]> {

  const now = Date.now()

  // 60s cache
  if (now - lastFetch < 60000 && cache.length) {
    return cache
  }

  try {

const url = `https://api.tradingeconomics.com/calendar?c=guest:guest&f=json`

    const res = await axios.get(url, {
      headers: { Accept: "application/json" }
    })

    const events = res.data || []

    cache = events.map((e: any) => ({
      event: e.Event,
      country: e.Country,
      actual: e.Actual ? parseFloat(String(e.Actual).replace("%","")) : null,
      forecast: e.Forecast ? parseFloat(String(e.Forecast).replace("%","")) : null,
      previous: e.Previous ? parseFloat(String(e.Previous).replace("%","")) : null,
      importance: e.Importance || 1,
      timestamp: e.Date
    }))

    lastFetch = now

    return cache

  } catch (err: any) {

    console.log("Economic calendar error:", err.response?.data || err.message)

    return cache
  }

}
