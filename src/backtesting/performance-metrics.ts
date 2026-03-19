type Trade = {
  profit: number
}

export function calculateMetrics(trades: Trade[]) {

  const totalTrades = trades.length

  const wins = trades.filter(t => t.profit > 0).length
  const losses = trades.filter(t => t.profit <= 0).length

  const winRate = totalTrades ? (wins / totalTrades) * 100 : 0

  const grossProfit =
    trades.filter(t => t.profit > 0).reduce((s, t) => s + t.profit, 0)

  const grossLoss =
    Math.abs(trades.filter(t => t.profit <= 0).reduce((s, t) => s + t.profit, 0))

  const profitFactor = grossLoss ? grossProfit / grossLoss : 0

  const totalProfit = trades.reduce((s, t) => s + t.profit, 0)

  return {
    trades: totalTrades,
    wins,
    losses,
    winRate,
    profitFactor,
    totalProfit
  }
}