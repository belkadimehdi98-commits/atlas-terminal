type Trade = {
  direction: "BUY" | "SELL"
  entry: number
  stop: number
  target: number
}

type Candle = {
  high: number
  low: number
}

export function simulateTrade(trade: Trade, candles: Candle[]) {

  for (const candle of candles) {

    if (trade.direction === "BUY") {

      if (candle.low <= trade.stop) {
        return {
          result: "LOSS",
          exit: trade.stop,
          profit: trade.stop - trade.entry
        }
      }

      if (candle.high >= trade.target) {
        return {
          result: "WIN",
          exit: trade.target,
          profit: trade.target - trade.entry
        }
      }

    }

    if (trade.direction === "SELL") {

      if (candle.high >= trade.stop) {
        return {
          result: "LOSS",
          exit: trade.stop,
          profit: trade.entry - trade.stop
        }
      }

      if (candle.low <= trade.target) {
        return {
          result: "WIN",
          exit: trade.target,
          profit: trade.entry - trade.target
        }
      }

    }

  }

  return {
    result: "OPEN",
    exit: null,
    profit: 0
  }
}