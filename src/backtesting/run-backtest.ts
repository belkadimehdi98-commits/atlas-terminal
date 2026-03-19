import { runBacktest } from "./backtest-engine"
import { candlesRouter } from "../ingestion/candles-router"

type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

async function startBacktest() {

  const asset = "BTCUSDT"

console.log("Starting backtest:", asset)
console.log("Fetching candles...")

const response = await candlesRouter.getCandles({
  symbol: asset,
  assetClass: "crypto",
  interval: "1h",
limit: 2000
})

console.log("Candles received:", response.candles.length)

  const candles: Candle[] = response.candles.map((c: any) => ({
    time: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close
  }))

  const results = await runBacktest(asset, candles)

  console.log("\n===== BACKTEST RESULTS =====")
  console.log("Trades:", results.trades)
  console.log("Win Rate:", results.winRate.toFixed(2) + "%")
  console.log("Total Profit:", results.totalProfit)
  console.log("Wins:", results.wins)
  console.log("Losses:", results.losses)

}

startBacktest()