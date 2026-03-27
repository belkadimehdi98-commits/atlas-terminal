import { TechnicalSummary } from "../types/signal";
import { candlesRouter } from "../ingestion/candles-router";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export class TechnicalEngine {
  private symbol: string;
  private timeframe: string;

  constructor(symbol: string, timeframe: string = "1h") {
    this.symbol = symbol;
    this.timeframe = timeframe;
  }

  async run(): Promise<TechnicalSummary> {

    // Normalize symbols (fix OIL provider issue)
    const normalizedSymbol =
      this.symbol.toUpperCase() === "OIL"
        ? "WTI"
        : this.symbol;

    const candleData = await candlesRouter.getCandles({
      symbol: normalizedSymbol,
      assetClass: this.detectAssetClass(),
      interval: this.timeframe as any,
      limit: 300
    });

    const candles: Candle[] = candleData.candles;

    const closes = candles.map(c => c.close);

    const sma50 = this.sma(closes, 50);
    const sma200 = this.sma(closes, 200);
    const rsi = this.rsi(closes, 14);
    const atr = this.atr(candles, 14);
const volPercentile = this.volatilityPercentile(candles);
const volRegime = this.volatilityRegime(volPercentile);
    const trend = this.detectTrend(sma50, sma200);
    const momentum = this.detectMomentum(rsi);
    const structure = this.marketStructure(closes);

    return {
      trend,
      momentum,
      structure,
indicators: [
  `SMA50: ${sma50.toFixed(2)}`,
  `SMA200: ${sma200.toFixed(2)}`,
  `RSI: ${rsi.toFixed(2)}`,
  `ATR: ${atr.toFixed(4)}`,
  `Volatility: ${volRegime}`,
  `Vol Percentile: ${volPercentile}%`
]
    };
  }

  private detectAssetClass():
    | "crypto"
    | "forex"
    | "metal"
    | "energy"
    | "index" {

    const s = this.symbol.toUpperCase();

    if (s.endsWith("USDT")) return "crypto";

    if (s === "XAUUSD" || s === "XAGUSD") return "metal";

    if (s === "OIL" || s === "WTI" || s === "BRENT") return "energy";

    if (
      s === "EURUSD" ||
      s === "GBPUSD" ||
      s === "USDJPY"
    ) return "forex";

    return "index";
  }

  private sma(data: number[], period: number): number {
    const slice = data.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private rsi(data: number[], period: number): number {
    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    const rs = gains / (losses || 1);

    return 100 - 100 / (1 + rs);
  }
  private atr(candles: Candle[], period: number): number {

    const trs: number[] = [];

    for (let i = 1; i < candles.length; i++) {

      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );

      trs.push(tr);
    }

    const slice = trs.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);

    return sum / period;
  }
private volatilityRegime(percentile: number): string {

  if (percentile > 80) return "EXTREME";
  if (percentile > 60) return "EXPANDING";
  if (percentile > 30) return "NORMAL";

  return "COMPRESSED";
}
  private detectTrend(
    sma50: number,
    sma200: number
  ): "BULLISH" | "BEARISH" | "SIDEWAYS" {

    if (sma50 > sma200) return "BULLISH";
    if (sma50 < sma200) return "BEARISH";

    return "SIDEWAYS";
  }

  private detectMomentum(rsi: number): string {

    if (rsi > 70) return "Overbought momentum";
    if (rsi < 30) return "Oversold momentum";
    if (rsi > 55) return "Bullish momentum";
    if (rsi < 45) return "Bearish momentum";

    return "Neutral momentum";
  }

private marketStructure(data: number[]): string {

  const recent = data.slice(-20);

  const highs = Math.max(...recent);
  const lows = Math.min(...recent);
  const last = data[data.length - 1];

if (last > highs * 0.995) return "Price pressing resistance";

if (last < lows * 1.005) return "Price testing support";

  return "Range structure";
}

private volatilityPercentile(candles: Candle[]): number {

  const ranges = candles.map(c => c.high - c.low);

  const current = ranges[ranges.length - 1];

  const sorted = [...ranges].sort((a,b)=>a-b);

  const rank = sorted.findIndex(v => v >= current);

  const percentile = (rank / sorted.length) * 100;

  return Math.round(percentile);

}
}